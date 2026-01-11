import Link from 'next/link';

export const metadata = {
  title: 'Legal Disclaimer | TaskForce Tickets',
  description: 'Legal Disclaimer and Attorney Advertising disclosures for TaskForce Tickets.',
};

export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#1A1A1A] text-white py-6">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD100] rounded-lg flex items-center justify-center">
              <span className="text-[#1A1A1A] font-bold text-lg">TF</span>
            </div>
            <span className="font-semibold text-lg">TaskForce Tickets</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Legal Disclaimer</h1>
        <p className="text-[#4A4A4A] mb-8">Effective Date: January 1, 2025</p>

        <div className="prose prose-lg max-w-none text-[#1A1A1A]">
          {/* Attorney Advertising */}
          <section className="mb-10">
            <div className="bg-[#FFD100]/10 border-2 border-[#FFD100] rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ATTORNEY ADVERTISING
              </h2>
              <p className="text-[#4A4A4A] mb-3">
                This website and all content contained herein constitute <strong>attorney advertising</strong> under
                the Tennessee Rules of Professional Conduct, specifically Tennessee Supreme Court Rule 8,
                Rules of Professional Conduct 7.1 through 7.5.
              </p>
              <p className="text-[#4A4A4A]">
                <strong>Principal Office Location:</strong><br />
                1661 International Drive, Suite 400<br />
                Memphis, Shelby County, Tennessee 38120
              </p>
            </div>
          </section>

          {/* Not Legal Advice */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              NOT LEGAL ADVICE
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              The information provided on this website is for general informational purposes only and
              does not constitute legal advice. Viewing this website, submitting an intake form, or
              contacting us does not create an attorney-client relationship.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>An attorney-client relationship is established only when:</strong>
            </p>
            <ol className="list-decimal pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>You submit a case through our intake form</li>
              <li>We review and accept your case</li>
              <li>You receive a written acceptance email from TaskForce Tickets</li>
              <li>Payment is successfully processed</li>
            </ol>
            <p className="text-[#4A4A4A]">
              Until you receive an acceptance email, you should not rely on any information from this
              website as legal advice, and you should take all necessary steps to protect your legal
              rights, including appearing at scheduled court dates if necessary.
            </p>
          </section>

          {/* No Guarantee of Results */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              NO GUARANTEE OF RESULTS
            </h2>
            <div className="bg-[#CF2A27]/10 border-l-4 border-[#CF2A27] p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold mb-2">IMPORTANT:</p>
              <p className="text-[#4A4A4A]">
                <strong>Past results do not guarantee future outcomes.</strong> Every traffic case is unique,
                and the outcome of your case depends on its specific facts and circumstances.
              </p>
            </div>
            <p className="text-[#4A4A4A] mb-4">
              While TaskForce Tickets offers a money-back guarantee on attorney fees if your ticket is
              not dismissed, this guarantee does not constitute a promise or guarantee that your ticket
              will be dismissed. Case outcomes depend on many factors beyond our control, including:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>The specific facts of your citation</li>
              <li>The discretion of the court and presiding judge</li>
              <li>Prosecutorial discretion</li>
              <li>Your driving record and history</li>
              <li>Applicable statutes and ordinances</li>
              <li>Evidence available in your case</li>
              <li>Court policies and procedures</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Money-Back Guarantee Limitations:</strong> Our money-back guarantee is limited to
              a refund of the attorney fee you paid to TaskForce Tickets. It does not include:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>Court costs or court fees</li>
              <li>Fines assessed by the court</li>
              <li>Any other amounts not paid directly to TaskForce Tickets</li>
              <li>Consequential damages of any kind</li>
            </ul>
          </section>

          {/* Eligibility Limitations */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              ELIGIBILITY LIMITATIONS
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              Our flat-fee traffic ticket defense services are subject to the following limitations:
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Geographic Limitations</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Services are available only for traffic citations issued in <strong>Shelby County, Tennessee</strong></li>
              <li>This includes Memphis City Court, Shelby County General Sessions Court, and municipal courts within Shelby County</li>
              <li>We cannot provide representation for citations issued in other Tennessee counties or other states</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Offense Limitations</h3>
            <p className="text-[#4A4A4A] mb-4">
              Not all traffic offenses are eligible for our flat-fee service. The following may require
              case-by-case evaluation or may not be eligible:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>DUI/DWI charges:</strong> Driving under the influence requires specialized representation</li>
              <li><strong>Accidents involving injuries:</strong> Citations arising from injury accidents may have additional complications</li>
              <li><strong>Commercial Driver&apos;s License (CDL) holders:</strong> CDL violations have enhanced consequences requiring specialized handling</li>
              <li><strong>Repeat offenders:</strong> Multiple recent violations may affect case strategy</li>
              <li><strong>Felony traffic offenses:</strong> Vehicular assault, vehicular homicide, or other felonies</li>
              <li><strong>Suspended or revoked license violations:</strong> May require different approach</li>
              <li><strong>Hit and run:</strong> Leaving the scene of an accident</li>
              <li><strong>Racing or exhibition driving:</strong> Street racing charges</li>
            </ul>
            <p className="text-[#4A4A4A]">
              If your citation involves any of the above, please contact us directly for a case-specific
              consultation and quote.
            </p>
          </section>

          {/* Jurisdiction */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              JURISDICTION AND LICENSING
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              The attorneys at TaskForce Tickets are licensed to practice law in the State of Tennessee.
              We are authorized to appear in Tennessee state courts, including Shelby County courts.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>We cannot provide legal advice regarding:</strong>
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Traffic citations issued in other states</li>
              <li>Federal traffic violations</li>
              <li>Military traffic violations</li>
              <li>Citations issued on tribal lands</li>
              <li>Out-of-state license implications (you should consult with an attorney in your home state)</li>
            </ul>
            <p className="text-[#4A4A4A]">
              If you received a traffic citation in Tennessee but hold an out-of-state driver&apos;s license,
              we can represent you in Tennessee courts, but you should consult with an attorney in your
              home state regarding any potential impact on your driving record there.
            </p>
          </section>

          {/* Testimonials and Reviews */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              TESTIMONIALS AND REVIEWS
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              Any testimonials or reviews displayed on this website or on third-party platforms
              (such as Google Reviews) represent the individual experiences of past clients. These
              testimonials are not a guarantee of future results.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              In accordance with FTC guidelines:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>Testimonials reflect the genuine experiences of the individuals who provided them</li>
              <li>We may offer a $5 incentive for honest reviews (positive or negative)</li>
              <li>We do not require positive reviews in exchange for any incentive</li>
              <li>Results described in testimonials are not typical and may not be achieved in every case</li>
            </ul>
          </section>

          {/* External Links */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              EXTERNAL LINKS
            </h2>
            <p className="text-[#4A4A4A]">
              This website may contain links to external websites or resources. We are not responsible
              for the content, accuracy, or privacy practices of any third-party websites. The inclusion
              of any link does not imply endorsement by TaskForce Tickets. We encourage you to review
              the terms and privacy policies of any external sites you visit.
            </p>
          </section>

          {/* Accuracy of Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              ACCURACY OF INFORMATION
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              We make reasonable efforts to ensure the accuracy of information on this website. However,
              laws, court procedures, and regulations change frequently. Information on this website may
              not reflect the most current legal developments.
            </p>
            <p className="text-[#4A4A4A]">
              You should not rely on the information on this website as a substitute for legal advice
              from a licensed attorney. If you have questions about your specific situation, please
              contact us or consult with a qualified attorney.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              LIMITATION OF LIABILITY
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              To the fullest extent permitted by law, TaskForce Tickets shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, including but not
              limited to:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Loss of profits or revenue</li>
              <li>Increased insurance premiums</li>
              <li>License suspension or points assessed</li>
              <li>Any damages arising from your reliance on information on this website before establishing an attorney-client relationship</li>
            </ul>
            <p className="text-[#4A4A4A]">
              Our maximum liability for any claim arising from our representation shall not exceed
              the attorney fees you paid to us for that specific case.
            </p>
          </section>

          {/* Contact and Questions */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              QUESTIONS ABOUT THIS DISCLAIMER
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              If you have questions about this Legal Disclaimer or would like clarification on any
              aspect of our services, please contact us:
            </p>
            <div className="bg-[#F8F8F8] rounded-lg p-6">
              <p className="font-semibold text-[#1A1A1A] mb-2">TaskForce Tickets</p>
              <p className="text-[#4A4A4A]">1661 International Drive, Suite 400</p>
              <p className="text-[#4A4A4A]">Memphis, TN 38120</p>
              <p className="text-[#4A4A4A] mt-4">
                <strong>Email:</strong>{' '}
                <a href="mailto:legal@taskforcetickets.com" className="text-[#FFD100] hover:underline">
                  legal@taskforcetickets.com
                </a>
              </p>
              <p className="text-[#4A4A4A]">
                <strong>Phone:</strong> (901) 555-0199
              </p>
              <p className="text-[#4A4A4A] mt-4 text-sm">
                Tennessee Attorney License #: [License Number]
              </p>
            </div>
          </section>

          {/* Tennessee Bar Notice */}
          <section className="mb-10">
            <div className="bg-[#1A1A1A] text-white rounded-lg p-6">
              <h3 className="font-bold mb-3">Tennessee Board of Professional Responsibility</h3>
              <p className="text-[#E5E5E5] text-sm mb-3">
                TaskForce Tickets attorneys are members in good standing of the Tennessee Bar and are
                subject to the jurisdiction of the Tennessee Board of Professional Responsibility.
              </p>
              <p className="text-[#E5E5E5] text-sm">
                For information about an attorney&apos;s standing or to file a complaint, contact:<br />
                Tennessee Board of Professional Responsibility<br />
                10 Cadillac Drive, Suite 220<br />
                Brentwood, TN 37027<br />
                (615) 361-7500 | <a href="https://www.tbpr.org" target="_blank" rel="noopener noreferrer" className="text-[#FFD100] hover:underline">www.tbpr.org</a>
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-[#E5E5E5] flex flex-wrap gap-6 text-sm">
          <Link href="/terms" className="text-[#FFD100] hover:underline">Terms of Service</Link>
          <Link href="/privacy" className="text-[#FFD100] hover:underline">Privacy Policy</Link>
          <Link href="/" className="text-[#FFD100] hover:underline">Return to Home</Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1A1A1A] text-white py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm text-[#4A4A4A]">
          <p>&copy; {new Date().getFullYear()} TaskForce Tickets. All rights reserved.</p>
          <p className="mt-2">Licensed to practice law in the State of Tennessee.</p>
        </div>
      </footer>
    </div>
  );
}
