'use client';

import Link from 'next/link';

interface ManualReviewNoticeProps {
  caseId?: string;
  reason?: string;
  warnings?: string[];
}

export function ManualReviewNotice({ caseId, reason, warnings }: ManualReviewNoticeProps) {
  return (
    <div className="min-h-screen bg-[#F8F8F8] py-16 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-brand p-10">
          {/* Icon */}
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-extrabold text-[#1A1A1A] text-center mb-4">
            Your Submission Requires Review
          </h1>

          {/* Reason */}
          {reason && (
            <p className="text-[#4A4A4A] text-center mb-6">
              {reason}
            </p>
          )}

          {/* What happens next */}
          <div className="bg-[#F8F8F8] rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">What happens next:</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  A member of our team will review your submission
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  We&apos;ll contact you within <strong className="text-[#1A1A1A]">2 business days</strong>
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-[#1A1A1A]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  If eligible, we&apos;ll send you a payment link to proceed
                </span>
              </li>
            </ul>
          </div>

          {/* Warnings if any */}
          {warnings && warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <h4 className="font-medium text-amber-800 mb-2">Notes from document review:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span>-</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reference Number */}
          {caseId && (
            <div className="bg-[#1A1A1A] text-white rounded-xl p-4 text-center mb-8">
              <p className="text-sm text-gray-300 mb-1">Reference Number</p>
              <p className="text-xl font-bold tracking-wider">{caseId.slice(0, 8).toUpperCase()}</p>
            </div>
          )}

          {/* Important Notice */}
          <div className="p-5 bg-[#FFD100]/10 rounded-xl border border-[#FFD100]/30 mb-8">
            <p className="text-sm text-[#4A4A4A]">
              <strong className="text-[#1A1A1A]">Important:</strong> You are NOT yet a client.
              An attorney-client relationship will only be established when you receive an
              &quot;accepted&quot; email confirmation from our team.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-4">
            <Link
              href="/"
              className="w-full py-4 bg-[#1A1A1A] text-white rounded-xl font-semibold text-center hover:bg-[#2A2A2A] transition-colors"
            >
              Return Home
            </Link>
            <p className="text-center text-sm text-[#4A4A4A]">
              Questions? Contact us at{' '}
              <a href="mailto:info@taskforcetickets.com" className="text-[#1A1A1A] font-medium underline">
                info@taskforcetickets.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
