'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatCurrency } from '@/lib/utils';

interface PaymentFormProps {
  caseId: string;
  amount: number; // in dollars
  customerEmail: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

interface HostedFieldsInstance {
  getPaymentToken: (params: {
    exp_month: string;
    exp_year: string;
    postal_code?: string;
  }) => Promise<{ id: string }>;
}

interface HostedFieldState {
  isReady: boolean;
  fields: Record<string, { isValid: boolean; isEmpty: boolean }>;
}

declare global {
  interface Window {
    AffiniPay?: {
      HostedFields: {
        initializeFields: (
          config: {
            publicKey: string;
            fields: Array<{
              selector: string;
              input: {
                type: string;
                css?: Record<string, string>;
              };
            }>;
          },
          callback: (state: HostedFieldState) => void
        ) => HostedFieldsInstance;
      };
    };
  }
}

export function PaymentForm({
  caseId,
  amount,
  customerEmail,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pay_later'>('card');
  const [loading, setLoading] = useState(false);
  const [hostedFieldsReady, setHostedFieldsReady] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [expMonth, setExpMonth] = useState('');
  const [expYear, setExpYear] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const hostedFieldsRef = useRef<HostedFieldsInstance | null>(null);

  const initializeHostedFields = useCallback(() => {
    if (!window.AffiniPay) {
      console.warn('AffiniPay not loaded yet');
      return;
    }

    const publicKey = process.env.NEXT_PUBLIC_LAWPAY_PUBLIC_KEY;
    if (!publicKey) {
      console.error('LawPay public key not configured');
      onError('Payment system not configured');
      return;
    }

    try {
      const fieldStyles = {
        'font-size': '16px',
        'font-family': 'Inter, system-ui, sans-serif',
        'color': '#1A1A1A',
      };

      hostedFieldsRef.current = window.AffiniPay.HostedFields.initializeFields(
        {
          publicKey,
          fields: [
            {
              selector: '#card-number',
              input: {
                type: 'credit_card_number',
                css: fieldStyles,
              },
            },
            {
              selector: '#card-cvv',
              input: {
                type: 'cvv',
                css: fieldStyles,
              },
            },
          ],
        },
        (state: HostedFieldState) => {
          if (state.isReady) {
            setHostedFieldsReady(true);
          }
        }
      );
    } catch (err) {
      console.error('Failed to initialize hosted fields:', err);
      onError('Failed to initialize payment form');
    }
  }, [onError]);

  useEffect(() => {
    // Check if script is already loaded
    if (window.AffiniPay) {
      setScriptLoaded(true);
      initializeHostedFields();
      return;
    }

    // Load AffiniPay hosted fields script
    const script = document.createElement('script');
    script.src = 'https://cdn.affinipay.com/hostedfields/1.5.3/fieldGen_1.5.3.js';
    script.async = true;
    script.onload = () => {
      setScriptLoaded(true);
      // Small delay to ensure AffiniPay is fully initialized
      setTimeout(() => {
        initializeHostedFields();
      }, 100);
    };
    script.onerror = () => {
      console.error('Failed to load AffiniPay script');
      onError('Failed to load payment form');
    };
    document.body.appendChild(script);

    return () => {
      hostedFieldsRef.current = null;
    };
  }, [initializeHostedFields, onError]);

  const handlePayNow = async () => {
    if (!hostedFieldsRef.current) {
      onError('Payment form not ready');
      return;
    }

    if (!expMonth || !expYear) {
      onError('Please enter card expiration date');
      return;
    }

    setLoading(true);

    try {
      // Get payment token from hosted fields
      const token = await hostedFieldsRef.current.getPaymentToken({
        exp_month: expMonth.padStart(2, '0'),
        exp_year: expYear.length === 2 ? `20${expYear}` : expYear,
        postal_code: postalCode || undefined,
      });

      if (!token?.id) {
        onError('Failed to get payment token');
        setLoading(false);
        return;
      }

      // Process charge
      const response = await fetch('/api/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseId,
          tokenId: token.id,
          amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
      } else {
        onError(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      onError(errorMessage);
    }

    setLoading(false);
  };

  const handlePayLater = async () => {
    setLoading(true);

    try {
      // Create payment request - LawPay sends email and text
      const response = await fetch('/api/payments/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseId }),
      });

      const result = await response.json();

      if (result.success && result.paymentUrl) {
        // Redirect to LawPay hosted payment page
        window.location.href = result.paymentUrl;
      } else {
        onError(result.error || 'Failed to create payment request');
      }
    } catch (error) {
      console.error('Payment request error:', error);
      onError('An unexpected error occurred');
    }

    setLoading(false);
  };

  const isPayLaterAvailable = amount >= 150;
  const monthlyPayment = Math.ceil(amount / 4);

  return (
    <div className="space-y-6">
      {/* Styles for hosted fields iframes */}
      <style jsx global>{`
        #card-number iframe,
        #card-cvv iframe {
          width: 100% !important;
          height: 48px !important;
          border: none !important;
        }
      `}</style>

      <h3 className="text-xl font-bold text-[#1A1A1A]">Payment</h3>

      {/* Payment Method Selection */}
      <div className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setPaymentMethod('card')}
          className={`p-4 border-2 rounded-xl text-left transition-all ${
            paymentMethod === 'card'
              ? 'border-[#FFD100] bg-[#FFD100]/10'
              : 'border-[#E5E5E5] hover:border-[#1A1A1A]/20'
          }`}
        >
          <div className="font-semibold text-[#1A1A1A]">Pay Now</div>
          <div className="text-sm text-[#4A4A4A]">Credit/Debit Card</div>
          <div className="text-2xl font-bold text-[#1A1A1A] mt-2">
            {formatCurrency(amount)}
          </div>
        </button>

        <button
          type="button"
          onClick={() => isPayLaterAvailable && setPaymentMethod('pay_later')}
          disabled={!isPayLaterAvailable}
          className={`p-4 border-2 rounded-xl text-left transition-all ${
            paymentMethod === 'pay_later'
              ? 'border-[#FFD100] bg-[#FFD100]/10'
              : isPayLaterAvailable
                ? 'border-[#E5E5E5] hover:border-[#1A1A1A]/20'
                : 'border-[#E5E5E5] opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="font-semibold text-[#1A1A1A] flex items-center gap-2">
            Pay Over Time
            {isPayLaterAvailable && (
              <span className="text-xs bg-[#FFD100] text-[#1A1A1A] px-2 py-0.5 rounded font-medium">
                FLEXIBLE
              </span>
            )}
          </div>
          <div className="text-sm text-[#4A4A4A]">Split into payments</div>
          {isPayLaterAvailable ? (
            <div className="text-sm mt-2">
              As low as{' '}
              <span className="font-bold text-[#1A1A1A]">
                {formatCurrency(monthlyPayment)}/mo
              </span>
            </div>
          ) : (
            <div className="text-xs text-[#4A4A4A] mt-2">
              Available for amounts $150+
            </div>
          )}
        </button>
      </div>

      {/* Pay Now - Card Form */}
      {paymentMethod === 'card' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
              Card Number
            </label>
            <div
              id="card-number"
              className="border border-[#E5E5E5] rounded-lg bg-white overflow-hidden"
              style={{ height: '48px' }}
            />
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                MM
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="MM"
                value={expMonth}
                onChange={(e) => setExpMonth(e.target.value.replace(/\D/g, ''))}
                className="h-12 w-full px-4 border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A] text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                YY
              </label>
              <input
                type="text"
                maxLength={2}
                placeholder="YY"
                value={expYear}
                onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ''))}
                className="h-12 w-full px-4 border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A] text-center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                CVV
              </label>
              <div
                id="card-cvv"
                className="border border-[#E5E5E5] rounded-lg bg-white overflow-hidden"
                style={{ height: '48px' }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#4A4A4A] mb-2">
                ZIP
              </label>
              <input
                type="text"
                maxLength={5}
                placeholder="ZIP"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                className="h-12 w-full px-4 border border-[#E5E5E5] rounded-lg bg-white text-[#1A1A1A] text-center"
              />
            </div>
          </div>

          <button
            onClick={handlePayNow}
            disabled={loading || !hostedFieldsReady}
            className="w-full py-4 bg-[#FFD100] hover:bg-[#FFD100]/90 text-[#1A1A1A] font-bold text-lg rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              `Pay ${formatCurrency(amount)} Now`
            )}
          </button>

          {!scriptLoaded && (
            <p className="text-sm text-[#4A4A4A] text-center">
              Loading payment form...
            </p>
          )}
        </div>
      )}

      {/* Pay Later - Redirect to LawPay */}
      {paymentMethod === 'pay_later' && (
        <div className="space-y-4">
          <div className="bg-[#F8F8F8] rounded-xl p-4">
            <h4 className="font-semibold text-[#1A1A1A] mb-3">
              How Pay Over Time Works
            </h4>
            <ul className="text-sm text-[#4A4A4A] space-y-2">
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Choose a payment plan that fits your budget
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Quick application - won&apos;t affect your credit score
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Get approved in seconds
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                We receive payment immediately, you pay over time
              </li>
            </ul>
          </div>

          <p className="text-sm text-[#4A4A4A]">
            You&apos;ll receive a payment link via{' '}
            <strong>email and text message</strong> to complete your payment
            with flexible options.
          </p>

          <button
            onClick={handlePayLater}
            disabled={loading}
            className="w-full py-4 bg-[#FFD100] hover:bg-[#FFD100]/90 text-[#1A1A1A] font-bold text-lg rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Setting up...
              </span>
            ) : (
              'Continue with Pay Over Time'
            )}
          </button>
        </div>
      )}

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-[#4A4A4A]">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Secure payment powered by LawPay
      </div>
    </div>
  );
}
