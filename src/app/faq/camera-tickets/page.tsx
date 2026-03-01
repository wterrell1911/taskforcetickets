import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export const metadata = {
  title: 'Red Light Camera Tickets in Memphis | TaskForce Tickets',
  description:
    'Learn about red light camera tickets in Tennessee - why they cannot affect your license, insurance, or credit score.',
};

export default function CameraTicketFAQ() {
  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] py-5 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors text-sm font-medium"
          >
            Back to Home
          </Link>
        </div>
      </header>

      <main className="py-12 px-6">
        <article className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-brand p-8 md:p-12">
            <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4">
              Red Light Camera Tickets in Memphis
            </h1>

            <p className="text-xl text-[#4A4A4A] mb-8">
              Good news: You probably don&apos;t need us for this one.
            </p>

            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mt-8 mb-4">
                The Short Answer
              </h2>
              <p className="text-[#4A4A4A] mb-4">
                Camera tickets in Tennessee are{' '}
                <strong className="text-[#1A1A1A]">
                  non-moving violations
                </strong>{' '}
                under state law (TCA 55-8-198). They cannot:
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[#4A4A4A]">
                    Add points to your license
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[#4A4A4A]">
                    Increase your insurance rates
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[#4A4A4A]">
                    Affect your credit score
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-[#10B981] flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-[#4A4A4A]">
                    Result in license suspension
                  </span>
                </li>
              </ul>

              <h2 className="text-2xl font-bold text-[#1A1A1A] mt-8 mb-4">
                What the Law Says
              </h2>
              <blockquote className="bg-[#F8F8F8] p-6 border-l-4 border-[#FFD100] rounded-r-xl my-6">
                <p className="text-[#1A1A1A] font-medium italic">
                  &quot;NON-PAYMENT OF THIS VIOLATION CANNOT HAVE A NEGATIVE
                  IMPACT ON YOUR DRIVERS LICENSE, CAR INSURANCE RATES, OR CREDIT
                  REPORT.&quot;
                </p>
                <footer className="text-sm text-[#4A4A4A] mt-3">
                  — Required disclaimer on all Tennessee camera citations
                </footer>
              </blockquote>

              <h2 className="text-2xl font-bold text-[#1A1A1A] mt-8 mb-4">
                Should You Pay It?
              </h2>
              <p className="text-[#4A4A4A] mb-4">
                That&apos;s your call. The $50 fine is technically owed, but the
                city has limited enforcement options. Many Memphis residents
                simply don&apos;t pay them without consequence.
              </p>
              <p className="text-[#4A4A4A] mb-6">
                The city cannot report it to collections, issue a warrant, or
                take any action that affects your driving record.
              </p>

              <h2 className="text-2xl font-bold text-[#1A1A1A] mt-8 mb-4">
                When You DO Need Us
              </h2>
              <p className="text-[#4A4A4A] mb-4">
                If you received a{' '}
                <strong className="text-[#1A1A1A]">
                  regular traffic ticket
                </strong>{' '}
                (issued by a police officer, not a camera), that&apos;s
                different. Those go on your record and affect your insurance.
              </p>

              <div className="bg-[#FFD100]/20 border border-[#FFD100]/50 rounded-xl p-6 mt-8">
                <h3 className="font-bold text-[#1A1A1A] mb-2">
                  Got a Real Traffic Ticket?
                </h3>
                <p className="text-[#4A4A4A] mb-4">
                  We handle speeding tickets, moving violations, and other
                  citations issued by law enforcement. No court appearance
                  required - we handle everything.
                </p>
                <Link
                  href="/intake"
                  className="inline-flex items-center gap-2 bg-[#FFD100] hover:bg-[#FFD100]/90 text-[#1A1A1A] font-bold px-6 py-3 rounded-xl transition-colors"
                >
                  Submit Your Ticket
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>

              <h2 className="text-2xl font-bold text-[#1A1A1A] mt-8 mb-4">
                How to Tell the Difference
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-5">
                  <h4 className="font-bold text-[#10B981] mb-2">
                    Camera Ticket (Civil)
                  </h4>
                  <ul className="text-sm text-[#4A4A4A] space-y-1">
                    <li>• Mailed to you</li>
                    <li>• Shows camera photo</li>
                    <li>• No officer signature</li>
                    <li>• Usually $50 fine</li>
                    <li>• Says &quot;civil violation&quot;</li>
                  </ul>
                </div>
                <div className="bg-[#CF2A27]/10 border border-[#CF2A27]/30 rounded-xl p-5">
                  <h4 className="font-bold text-[#CF2A27] mb-2">
                    Officer Ticket (Criminal)
                  </h4>
                  <ul className="text-sm text-[#4A4A4A] space-y-1">
                    <li>• Given at traffic stop</li>
                    <li>• Officer&apos;s signature</li>
                    <li>• Court date listed</li>
                    <li>• Variable fines</li>
                    <li>• Goes on your record</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>
    </div>
  );
}
