'use client';

import { IntakeFormData } from '@/types';
import { getTierByCategory, getPriceForCategory } from '@/lib/pricing';
import { formatCurrency, formatDate, formatPhone } from '@/lib/utils';

interface ReviewStepProps {
  data: IntakeFormData;
  onChange: (data: Partial<IntakeFormData>) => void;
  errors: Record<string, string>;
}

export function ReviewStep({ data, onChange, errors }: ReviewStepProps) {
  const tier = data.offenseCategory ? getTierByCategory(data.offenseCategory) : null;
  const price = data.offenseCategory ? getPriceForCategory(data.offenseCategory) : 0;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Review &amp; Confirm</h2>
        <p className="text-[#4A4A4A]">
          Please review your information and acknowledge the terms below.
        </p>
      </div>

      {/* Summary */}
      <div className="bg-[#F8F8F8] rounded-xl p-6 space-y-5">
        <h3 className="font-bold text-[#1A1A1A]">Summary</h3>

        <div className="grid md:grid-cols-2 gap-5 text-sm">
          <div>
            <span className="text-[#4A4A4A]">Name</span>
            <p className="font-semibold text-[#1A1A1A]">
              {data.firstName} {data.lastName}
            </p>
          </div>
          <div>
            <span className="text-[#4A4A4A]">Email</span>
            <p className="font-semibold text-[#1A1A1A]">{data.email}</p>
          </div>
          <div>
            <span className="text-[#4A4A4A]">Phone</span>
            <p className="font-semibold text-[#1A1A1A]">{formatPhone(data.phone)}</p>
          </div>
          <div>
            <span className="text-[#4A4A4A]">Court Date</span>
            <p className="font-semibold text-[#1A1A1A]">
              {data.courtDate ? formatDate(new Date(data.courtDate)) : 'Not set'}
            </p>
          </div>
          <div className="md:col-span-2">
            <span className="text-[#4A4A4A]">Offense Type</span>
            <p className="font-semibold text-[#1A1A1A]">{tier?.label || 'Not selected'}</p>
          </div>
        </div>

        <div className="border-t border-[#E5E5E5] pt-5">
          <div className="flex justify-between items-center">
            <span className="text-[#4A4A4A]">Documents Uploaded</span>
            <span className="font-semibold text-[#1A1A1A]">
              {[data.ticketImage, data.driversLicense, data.supportingDocument].filter(Boolean).length} of 3
            </span>
          </div>
        </div>

        {tier?.dismissible && (
          <div className="border-t border-[#E5E5E5] pt-5">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#1A1A1A]">Total Due</span>
              <span className="text-2xl font-extrabold text-[#1A1A1A] bg-[#FFD100] px-4 py-2 rounded-lg">
                {formatCurrency(price)}
              </span>
            </div>
            <p className="text-xs text-[#4A4A4A] mt-2">
              *Court costs and fines are not included
            </p>
          </div>
        )}
      </div>

      {/* Legal Acknowledgments */}
      <div className="space-y-4">
        <h3 className="font-bold text-[#1A1A1A]">Required Acknowledgments</h3>

        <label className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
          errors.understoodNotClient ? 'border-[#CF2A27] bg-[#CF2A27]/5' : 'border-[#E5E5E5]'
        }`}>
          <input
            type="checkbox"
            checked={data.understoodNotClient}
            onChange={(e) => onChange({ understoodNotClient: e.target.checked })}
            className="mt-0.5 accent-[#FFD100] w-5 h-5"
          />
          <span className="text-sm text-[#4A4A4A]">
            <strong className="text-[#1A1A1A]">I understand</strong> that submitting this form and paying the fee does{' '}
            <strong className="text-[#1A1A1A]">NOT</strong> establish an attorney-client relationship. The relationship
            begins <strong className="text-[#1A1A1A]">only</strong> when I receive an &quot;accepted&quot; email confirmation.
          </span>
        </label>

        <label className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
          errors.understoodCourtCosts ? 'border-[#CF2A27] bg-[#CF2A27]/5' : 'border-[#E5E5E5]'
        }`}>
          <input
            type="checkbox"
            checked={data.understoodCourtCosts}
            onChange={(e) => onChange({ understoodCourtCosts: e.target.checked })}
            className="mt-0.5 accent-[#FFD100] w-5 h-5"
          />
          <span className="text-sm text-[#4A4A4A]">
            <strong className="text-[#1A1A1A]">I understand</strong> that court costs and any fines imposed by the court are{' '}
            <strong className="text-[#1A1A1A]">NOT</strong> included in the service fee and are my responsibility.
          </span>
        </label>

        <label className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
          errors.understoodDeadline ? 'border-[#CF2A27] bg-[#CF2A27]/5' : 'border-[#E5E5E5]'
        }`}>
          <input
            type="checkbox"
            checked={data.understoodDeadline}
            onChange={(e) => onChange({ understoodDeadline: e.target.checked })}
            className="mt-0.5 accent-[#FFD100] w-5 h-5"
          />
          <span className="text-sm text-[#4A4A4A]">
            <strong className="text-[#1A1A1A]">I understand</strong> that submissions must be made at least 3 business days
            before the court date (e.g., Thursday for a Monday court date).
          </span>
        </label>

        <label className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-colors ${
          errors.agreedToTerms ? 'border-[#CF2A27] bg-[#CF2A27]/5' : 'border-[#E5E5E5]'
        }`}>
          <input
            type="checkbox"
            checked={data.agreedToTerms}
            onChange={(e) => onChange({ agreedToTerms: e.target.checked })}
            className="mt-0.5 accent-[#FFD100] w-5 h-5"
          />
          <span className="text-sm text-[#4A4A4A]">
            I have read and agree to the{' '}
            <a href="/terms" className="text-[#1A1A1A] underline font-medium" target="_blank">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-[#1A1A1A] underline font-medium" target="_blank">
              Privacy Policy
            </a>
            .
          </span>
        </label>
      </div>

      {/* Money-back guarantee reminder */}
      <div className="p-5 bg-[#FFD100]/10 rounded-xl border border-[#FFD100]/30">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h4 className="font-bold text-[#1A1A1A]">Money-Back Guarantee</h4>
            <p className="text-sm text-[#4A4A4A] mt-1">
              If we cannot get your ticket dismissed, you will receive a full refund of our
              service fee. No questions asked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
