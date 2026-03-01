'use client';

import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

interface EligibilityRejectionProps {
  reason: string;
  rejectionCode?: 'PARKING_TICKET' | 'CDL_VEHICLE' | 'SPEED_OVER_LIMIT' | 'MANUAL_REVIEW_REQUIRED' | 'LOW_CONFIDENCE' | 'CAMERA_TICKET';
  speedOver?: number | null;
  onGoBack?: () => void;
}

export function EligibilityRejection({ reason, rejectionCode, speedOver, onGoBack }: EligibilityRejectionProps) {
  const getIcon = () => {
    switch (rejectionCode) {
      case 'PARKING_TICKET':
        return (
          <svg className="w-12 h-12 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'CDL_VEHICLE':
        return (
          <svg className="w-12 h-12 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'SPEED_OVER_LIMIT':
        return (
          <svg className="w-12 h-12 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'CAMERA_TICKET':
        return (
          <svg className="w-12 h-12 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'LOW_CONFIDENCE':
      case 'MANUAL_REVIEW_REQUIRED':
        return (
          <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        );
      default:
        return (
          <svg className="w-12 h-12 text-[#CF2A27]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
    }
  };

  const getAdditionalInfo = () => {
    switch (rejectionCode) {
      case 'PARKING_TICKET':
        return (
          <p className="text-[#4A4A4A]">
            TaskForce Tickets specializes in moving violations like speeding tickets.
            Parking tickets have different legal procedures and we recommend contacting
            the issuing agency directly.
          </p>
        );
      case 'CDL_VEHICLE':
        return (
          <p className="text-[#4A4A4A]">
            Commercial Driver&apos;s License (CDL) tickets can have serious consequences
            including loss of your commercial driving privileges. These cases require
            personalized attention from our attorneys.
          </p>
        );
      case 'SPEED_OVER_LIMIT':
        return (
          <p className="text-[#4A4A4A]">
            Tickets {speedOver && speedOver > 15 ? `showing ${speedOver} MPH over the limit` : 'of this severity'} typically
            require a more strategic approach. Our attorneys can still help, but we&apos;ll
            need to discuss your case directly.
          </p>
        );
      case 'CAMERA_TICKET':
        return (
          <p className="text-[#4A4A4A]">
            Camera tickets (red light cameras, speed cameras) are civil violations, not criminal citations.
            They are issued to the registered vehicle owner rather than the driver, and follow a different
            legal process. We specialize in criminal traffic citations issued by law enforcement officers.
          </p>
        );
      case 'LOW_CONFIDENCE':
      case 'MANUAL_REVIEW_REQUIRED':
        return (
          <p className="text-[#4A4A4A]">
            We couldn&apos;t read all the required information from your documents automatically.
            Our team will review your submission and contact you within 2 business days to
            verify the details and determine eligibility.
          </p>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] py-5 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors text-sm font-medium">
            Return Home
          </Link>
        </div>
      </header>

      <main className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-brand overflow-hidden">
            {/* Red header banner */}
            <div className="bg-[#CF2A27] px-8 py-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  {getIcon()}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Ticket Not Eligible</h1>
                  <p className="text-white/80 text-sm mt-1">For Online Service</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {/* Main rejection reason */}
              <div className="bg-[#CF2A27]/5 border border-[#CF2A27]/20 rounded-xl p-5">
                <p className="text-[#1A1A1A] font-medium">{reason}</p>
              </div>

              {/* Additional context */}
              {getAdditionalInfo() && (
                <div className="space-y-2">
                  <h2 className="font-semibold text-[#1A1A1A]">Why is this?</h2>
                  {getAdditionalInfo()}
                </div>
              )}

              {/* Contact info */}
              <div className="bg-[#F8F8F8] rounded-xl p-6">
                <h2 className="font-semibold text-[#1A1A1A] mb-4">We May Still Be Able to Help</h2>
                <p className="text-[#4A4A4A] mb-5">
                  Please contact us directly to discuss your case. Our team can review
                  your specific situation and advise on the best course of action.
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[#4A4A4A]">Phone</p>
                      <p className="font-semibold text-[#1A1A1A]">(901) 555-0123</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm text-[#4A4A4A]">Email</p>
                      <p className="font-semibold text-[#1A1A1A]">info@taskforcetickets.com</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {onGoBack && (
                  <button
                    type="button"
                    onClick={onGoBack}
                    className="flex-1 px-6 py-4 border-2 border-[#E5E5E5] text-[#1A1A1A] rounded-xl font-semibold hover:bg-[#F8F8F8] transition-colors"
                  >
                    Go Back
                  </button>
                )}
                <Link
                  href="/"
                  className="flex-1 px-6 py-4 bg-[#1A1A1A] text-white rounded-xl font-semibold hover:bg-[#2A2A2A] transition-colors text-center"
                >
                  Return Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
