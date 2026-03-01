'use client';

import { IntakeFormData, OffenseCategory, COURT_OPTIONS, CourtJurisdiction } from '@/types';
import { PRICING_TIERS } from '@/lib/pricing';
import { formatCurrency, getSubmissionDeadline, formatDate, isBeforeDeadline } from '@/lib/utils';

interface TicketStepProps {
  data: IntakeFormData;
  onChange: (data: Partial<IntakeFormData>) => void;
  errors: Record<string, string>;
}

export function TicketStep({ data, onChange, errors }: TicketStepProps) {
  const selectedTier = PRICING_TIERS.find((t) => t.category === data.offenseCategory);
  const courtDate = data.courtDate ? new Date(data.courtDate) : null;
  const deadline = courtDate ? getSubmissionDeadline(courtDate) : null;
  const isPastDeadline = courtDate ? !isBeforeDeadline(courtDate) : false;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Ticket Details</h2>
        <p className="text-[#4A4A4A]">
          Tell us about your citation so we can determine how best to help you.
        </p>
      </div>

      <div>
        <label htmlFor="courtDate" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Court Date <span className="text-[#CF2A27]">*</span>
        </label>
        <input
          type="date"
          id="courtDate"
          value={data.courtDate}
          onChange={(e) => onChange({ courtDate: e.target.value })}
          min={new Date().toISOString().split('T')[0]}
          className={`w-full px-4 py-4 rounded-xl border ${
            errors.courtDate ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
          } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
        />
        {errors.courtDate && (
          <p className="mt-2 text-sm text-[#CF2A27]">{errors.courtDate}</p>
        )}
        {deadline && !isPastDeadline && (
          <p className="mt-3 text-sm text-[#4A4A4A]">
            Submission deadline: <span className="font-semibold text-[#1A1A1A]">{formatDate(deadline)}</span>
          </p>
        )}
        {isPastDeadline && (
          <div className="mt-3 p-4 bg-[#CF2A27]/10 rounded-xl border border-[#CF2A27]/30">
            <p className="text-sm text-[#CF2A27]">
              <strong>Important:</strong> Your court date is too soon. We require submissions at
              least 3 business days before the court date.
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="courtJurisdiction" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Court/Jurisdiction <span className="text-[#CF2A27]">*</span>
        </label>
        <select
          id="courtJurisdiction"
          value={data.courtJurisdiction}
          onChange={(e) => onChange({ courtJurisdiction: e.target.value as CourtJurisdiction })}
          className={`w-full px-4 py-4 rounded-xl border ${
            errors.courtJurisdiction ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
          } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors bg-white`}
        >
          <option value="">Select where your ticket is from...</option>
          {COURT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.courtJurisdiction && (
          <p className="mt-2 text-sm text-[#CF2A27]">{errors.courtJurisdiction}</p>
        )}
        <p className="mt-2 text-sm text-[#4A4A4A]">
          Check your ticket for the court name or issuing agency
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-[#1A1A1A] mb-4">
          Offense Type <span className="text-[#CF2A27]">*</span>
        </label>
        <div className="space-y-3">
          {PRICING_TIERS.map((tier) => (
            <label
              key={tier.category}
              className={`flex items-start gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all ${
                data.offenseCategory === tier.category
                  ? 'border-[#FFD100] bg-[#FFD100]/5'
                  : 'border-[#E5E5E5] hover:border-[#1A1A1A]/20'
              }`}
            >
              <input
                type="radio"
                name="offenseCategory"
                value={tier.category}
                checked={data.offenseCategory === tier.category}
                onChange={(e) =>
                  onChange({ offenseCategory: e.target.value as OffenseCategory })
                }
                className="mt-1 accent-[#FFD100]"
              />
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-[#1A1A1A]">{tier.label}</span>
                  {tier.dismissible ? (
                    <span className="font-bold text-[#1A1A1A] bg-[#FFD100] px-3 py-1 rounded-full text-sm">
                      {formatCurrency(tier.price)}
                    </span>
                  ) : (
                    <span className="text-sm text-[#4A4A4A] bg-[#F8F8F8] px-3 py-1 rounded-full">Contact Required</span>
                  )}
                </div>
                <p className="text-sm text-[#4A4A4A] mt-2">{tier.description}</p>
              </div>
            </label>
          ))}
        </div>
        {errors.offenseCategory && (
          <p className="mt-2 text-sm text-[#CF2A27]">{errors.offenseCategory}</p>
        )}
      </div>

      {selectedTier && !selectedTier.dismissible && (
        <div className="p-5 bg-[#FFD100]/10 rounded-xl border border-[#FFD100]/30">
          <p className="text-[#1A1A1A]">
            <strong>Note:</strong> This type of offense requires a personal consultation. After
            submitting your documents, our team will contact you within 1 business day.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="ticketNumber" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            Ticket/Citation Number
          </label>
          <input
            type="text"
            id="ticketNumber"
            value={data.ticketNumber || ''}
            onChange={(e) => onChange({ ticketNumber: e.target.value })}
            className="w-full px-4 py-4 rounded-xl border border-[#E5E5E5] focus:border-[#FFD100] focus:ring-0 outline-none transition-colors"
            placeholder="Optional"
          />
        </div>

        <div>
          <label htmlFor="citationLocation" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            Location of Citation
          </label>
          <input
            type="text"
            id="citationLocation"
            value={data.citationLocation || ''}
            onChange={(e) => onChange({ citationLocation: e.target.value })}
            className="w-full px-4 py-4 rounded-xl border border-[#E5E5E5] focus:border-[#FFD100] focus:ring-0 outline-none transition-colors"
            placeholder="e.g., I-240 near Getwell Rd"
          />
        </div>
      </div>
    </div>
  );
}
