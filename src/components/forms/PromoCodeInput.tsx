'use client';

import { useState } from 'react';
import { PromoCodeInfo, validatePromoCode, formatDiscountDescription } from '@/lib/promo-codes';

interface PromoCodeInputProps {
  orderAmountCents: number;
  onPromoApplied: (promo: PromoCodeInfo | null) => void;
  appliedPromo: PromoCodeInfo | null;
}

export function PromoCodeInput({ orderAmountCents, onPromoApplied, appliedPromo }: PromoCodeInputProps) {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPromo = async () => {
    if (!code.trim()) {
      setError('Please enter a promo code');
      return;
    }

    setIsValidating(true);
    setError(null);

    const result = await validatePromoCode(code.trim(), orderAmountCents);

    setIsValidating(false);

    if (result.valid && result.promo) {
      onPromoApplied(result.promo);
      setCode('');
    } else {
      setError(result.message || 'Invalid promo code');
    }
  };

  const handleRemovePromo = () => {
    onPromoApplied(null);
    setCode('');
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleApplyPromo();
    }
  };

  if (appliedPromo) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-emerald-800">{appliedPromo.code}</p>
            <p className="text-sm text-emerald-600">
              {appliedPromo.description || formatDiscountDescription(appliedPromo)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleRemovePromo}
          className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Enter promo code"
            className={`w-full px-4 py-3 border-2 rounded-xl text-[#1A1A1A] placeholder-[#A0A0A0] focus:outline-none focus:ring-2 focus:ring-[#FFD100] ${
              error ? 'border-[#CF2A27] bg-[#CF2A27]/5' : 'border-[#E5E5E5]'
            }`}
            disabled={isValidating}
          />
        </div>
        <button
          type="button"
          onClick={handleApplyPromo}
          disabled={isValidating || !code.trim()}
          className="px-6 py-3 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#2A2A2A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isValidating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Checking
            </>
          ) : (
            'Apply'
          )}
        </button>
      </div>

      {error && (
        <p className="text-sm text-[#CF2A27] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
