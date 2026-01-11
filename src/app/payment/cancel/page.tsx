import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface PageProps {
  searchParams: Promise<{ case?: string }>;
}

export default async function PaymentCancelPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const caseId = params.case;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Warning Icon */}
          <div className="w-20 h-20 bg-[#F59E0B]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#F59E0B]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Payment Cancelled
          </h1>

          <p className="text-[#4A4A4A] mb-6">
            Your payment was not completed. Don&apos;t worry - you can try
            again anytime.
          </p>

          {caseId && (
            <div className="bg-[#F8F8F8] rounded-xl p-4 mb-6">
              <p className="text-sm text-[#4A4A4A]">
                <span className="font-medium">Case Reference:</span>
              </p>
              <p className="text-lg font-bold text-[#1A1A1A] mt-1">
                {caseId.slice(0, 8).toUpperCase()}
              </p>
            </div>
          )}

          {/* Reminder */}
          <div className="text-left bg-[#F8F8F8] rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-2">
              Don&apos;t Forget!
            </h2>
            <p className="text-sm text-[#4A4A4A]">
              Your court date is approaching. Complete your payment to ensure
              we can represent you and work to get your ticket dismissed.
            </p>
          </div>

          <div className="space-y-3">
            {caseId ? (
              <Link
                href={`/intake?resume=${caseId}`}
                className="block w-full px-6 py-4 bg-[#FFD100] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#FFD100]/90 transition"
              >
                Try Again
              </Link>
            ) : (
              <Link
                href="/intake"
                className="block w-full px-6 py-4 bg-[#FFD100] text-[#1A1A1A] font-semibold rounded-xl hover:bg-[#FFD100]/90 transition"
              >
                Submit Your Ticket
              </Link>
            )}

            <Link
              href="/"
              className="block w-full px-6 py-4 border-2 border-[#E5E5E5] text-[#4A4A4A] font-semibold rounded-xl hover:border-[#1A1A1A]/20 transition"
            >
              Return Home
            </Link>
          </div>

          {/* Contact Info */}
          <p className="text-sm text-[#4A4A4A] mt-6">
            Questions? Contact us at{' '}
            <a
              href="mailto:support@taskforcetickets.com"
              className="text-[#1A1A1A] font-medium underline"
            >
              support@taskforcetickets.com
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
