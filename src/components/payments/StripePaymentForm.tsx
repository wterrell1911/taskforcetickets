'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { formatCurrency } from '@/lib/utils';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripePaymentFormProps {
  caseId: string;
  amount: number; // in cents
  customerEmail: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

function CheckoutForm({
  caseId,
  amount,
  onSuccess,
  onError,
}: {
  caseId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?case=${caseId}`,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setLoading(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm with our backend
      try {
        const response = await fetch('/api/payments/stripe/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            caseId,
            paymentIntentId: paymentIntent.id,
          }),
        });

        const result = await response.json();

        if (result.success) {
          onSuccess();
        } else {
          onError(result.error || 'Failed to confirm payment');
        }
      } catch {
        onError('Failed to confirm payment');
      }
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full py-4 bg-[#FFD100] hover:bg-[#FFD100]/90 text-[#1A1A1A] font-bold text-lg rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
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

      {/* Security Note */}
      <div className="flex items-center justify-center gap-2 text-sm text-[#4A4A4A]">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
            clipRule="evenodd"
          />
        </svg>
        Secure payment powered by Stripe
      </div>
    </form>
  );
}

export function StripePaymentForm({
  caseId,
  amount,
  customerEmail,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Create payment intent on mount
    fetch('/api/payments/stripe/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseId }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onError(data.error || 'Failed to initialize payment');
        }
        setLoading(false);
      })
      .catch(() => {
        onError('Failed to initialize payment');
        setLoading(false);
      });
  }, [caseId, onError]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#1A1A1A]">Payment</h3>
        <div className="flex items-center justify-center py-12">
          <svg className="animate-spin h-8 w-8 text-[#FFD100]" fill="none" viewBox="0 0 24 24">
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
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-[#1A1A1A]">Payment</h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          Failed to initialize payment. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-[#1A1A1A]">Payment</h3>

      {/* Amount Display */}
      <div className="bg-[#F8F8F8] rounded-xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-[#4A4A4A]">Total</span>
          <span className="text-2xl font-bold text-[#1A1A1A]">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>

      {/* Pay Over Time Badge */}
      <div className="flex items-center gap-3 p-4 bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-xl">
        <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-[#1A1A1A] flex items-center gap-2">
            Pay Over Time Available
            <span className="text-xs bg-[#FFD100] text-[#1A1A1A] px-2 py-0.5 rounded-full font-bold">
              0% APR
            </span>
          </p>
          <p className="text-sm text-[#4A4A4A]">
            Split into 4 interest-free payments with Klarna, Afterpay, or Zip
          </p>
        </div>
      </div>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: 'stripe',
            variables: {
              colorPrimary: '#FFD100',
              colorBackground: '#ffffff',
              colorText: '#1A1A1A',
              colorDanger: '#CF2A27',
              fontFamily: 'Inter, system-ui, sans-serif',
              borderRadius: '12px',
            },
          },
        }}
      >
        <CheckoutForm
          caseId={caseId}
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
