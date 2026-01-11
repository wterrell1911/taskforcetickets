import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

interface PageProps {
  searchParams: Promise<{ case?: string }>;
}

export default async function PaymentSuccessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const caseId = params.case;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#F8F8F8] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-[#10B981]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-[#10B981]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-4">
            Payment Successful!
          </h1>

          <p className="text-[#4A4A4A] mb-6">
            Thank you for your payment. We&apos;ve received your submission and
            will review it shortly.
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

          {/* What Happens Next */}
          <div className="text-left bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-xl p-4 mb-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-3">
              What Happens Next?
            </h2>
            <ul className="text-sm text-[#4A4A4A] space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-[#1A1A1A]">
                  1
                </span>
                We&apos;ll review your ticket within 1-2 business days
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-[#1A1A1A]">
                  2
                </span>
                You&apos;ll receive an email confirming we&apos;ve accepted your case
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-[#1A1A1A]">
                  3
                </span>
                We&apos;ll appear in court on your behalf
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-[#FFD100] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-[#1A1A1A]">
                  4
                </span>
                You&apos;ll get updates via email as your case progresses
              </li>
            </ul>
          </div>

          <p className="text-sm text-[#4A4A4A] mb-8">
            A confirmation email has been sent to your email address.
          </p>

          <Link
            href="/"
            className="inline-block px-8 py-4 bg-[#1A1A1A] text-white font-semibold rounded-xl hover:bg-[#2A2A2A] transition"
          >
            Return Home
          </Link>

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
