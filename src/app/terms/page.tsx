import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service | TaskForce Tickets',
  description: 'Terms of Service for TaskForce Tickets traffic ticket defense services in Shelby County, Tennessee.',
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Terms of Service</h1>
        <p className="text-[#4A4A4A] mb-8">Effective Date: March 22, 2026 | Version 2026-03-22</p>

        <div className="prose prose-lg max-w-none text-[#1A1A1A]">
          {/* Agreement to Terms */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              1. AGREEMENT TO TERMS
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              By accessing or using the TaskForce Tickets website located at taskforcetickets.com (the &quot;Service&quot;),
              you agree to be bound by these Terms of Service (&quot;Terms&quot;). These Terms constitute a legally binding
              agreement between you and TaskForce Tickets, a Tennessee legal services provider.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              If you do not agree to these Terms, you must not access or use the Service. Your continued use of
              the Service following any modifications to these Terms constitutes your acceptance of those modifications.
            </p>
            <p className="text-[#4A4A4A]">
              By clicking &quot;I Agree&quot; or submitting your intake form, you acknowledge that you have read, understood,
              and agree to be bound by these Terms. This clickwrap acknowledgment creates a binding agreement
              enforceable under Tennessee law pursuant to the Uniform Electronic Transactions Act, T.C.A. § 47-10-101 et seq.
            </p>
          </section>

          {/* Service Description */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              2. SERVICE DESCRIPTION
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              TaskForce Tickets provides traffic ticket defense representation services in Shelby County, Tennessee.
              Our services include:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Review and evaluation of traffic citations</li>
              <li>Court appearances on behalf of clients for eligible traffic violations</li>
              <li>Pursuit of dismissal or reduction of traffic citations</li>
              <li>Communication regarding case status and outcomes</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Service Limitations:</strong> Our flat-fee services are limited to traffic citations that are
              eligible for dismissal or reduction through standard court procedures. We offer representation for
              the following offense categories:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>Paperwork Issues ($100):</strong> Failure to show proof of insurance, expired registration, no license on person. These don&apos;t affect your driving record but still require court appearances.</li>
              <li><strong>Minor Violations ($150):</strong> Speeding under 15 mph over limit, seatbelt violations, expired tags, equipment violations. First offense under 10 MPH = 0 points, but still on your record.</li>
              <li><strong>Standard Violations ($200):</strong> Speeding 15-29 mph over limit, no proof of insurance, expired license. 10+ MPH over adds points immediately.</li>
              <li><strong>Major Violations ($500):</strong> Speeding 30+ mph over limit, reckless driving, other serious moving violations. High-point violations can lead to license suspension.</li>
            </ul>
            <p className="text-[#4A4A4A]">
              Certain offenses may require case-by-case evaluation and may not be eligible for flat-fee representation,
              including but not limited to: DUI/DWI, citations involving accidents with injuries, commercial driver&apos;s
              license (CDL) violations, and repeat offender situations.
            </p>
          </section>

          {/* No Attorney-Client Relationship */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              3. NO ATTORNEY-CLIENT RELATIONSHIP UNTIL ACCEPTANCE
            </h2>
            <div className="bg-[#FFD100]/10 border-l-4 border-[#FFD100] p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold mb-2">IMPORTANT NOTICE:</p>
              <p className="text-[#4A4A4A]">
                Submission of an intake form through this website does NOT create an attorney-client relationship.
                You are NOT a client of TaskForce Tickets until you receive a written acceptance email from us.
              </p>
            </div>
            <p className="text-[#4A4A4A] mb-4">
              The attorney-client relationship begins ONLY upon:
            </p>
            <ol className="list-decimal pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Our review and approval of your submitted case</li>
              <li>Receipt by you of a written acceptance email from TaskForce Tickets expressly confirming representation</li>
              <li>Successful processing of your payment</li>
            </ol>
            <p className="text-[#4A4A4A] mb-4">
              Until you receive an acceptance email, you should take all necessary steps to protect your legal rights,
              including but not limited to appearing at any scheduled court dates. We are not responsible for any
              consequences arising from your failure to protect your interests prior to our acceptance of your case.
            </p>
            <p className="text-[#4A4A4A]">
              This limitation protects both parties: we cannot be held responsible for cases we have not accepted,
              and you retain the ability to seek other representation if we decline your case or do not respond
              within a reasonable time.
            </p>
          </section>

          {/* Submission Requirements */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              4. SUBMISSION REQUIREMENTS AND DEADLINES
            </h2>
            <div className="bg-[#CF2A27]/10 border-l-4 border-[#CF2A27] p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold mb-2">DEADLINE REQUIREMENTS:</p>
              <p className="text-[#4A4A4A]">
                All documents must be uploaded a minimum of <strong>three (3) business days</strong> before your
                scheduled court date. Late submissions will be automatically rejected.
              </p>
            </div>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Deadline Calculation:</strong>
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Business days are Monday through Friday, excluding Tennessee state holidays</li>
              <li>For Monday court dates, the submission deadline is the prior Thursday by 11:59 PM Central Time</li>
              <li>For Tuesday court dates, the submission deadline is the prior Friday by 11:59 PM Central Time</li>
              <li>The deadline is calculated from the court date shown on your citation</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Required Documents:</strong>
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Clear photograph or scan of your traffic citation (front and back if applicable)</li>
              <li>Valid Tennessee driver&apos;s license</li>
              <li>Supporting documentation (proof of insurance, vehicle registration, or other violation-satisfying documents as applicable)</li>
            </ul>
            <p className="text-[#4A4A4A]">
              You are solely responsible for verifying your court date and ensuring timely submission.
              Late submissions will be rejected and no attorney-client relationship will be formed.
              If your submission is rejected due to insufficient time, you must appear at your court date
              personally or seek alternative representation.
            </p>
          </section>

          {/* Pricing and Payment */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              5. PRICING AND PAYMENT
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              TaskForce Tickets offers flat-fee representation based on offense type:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>Paperwork Issues:</strong> $100</li>
              <li><strong>Minor Violations:</strong> $150</li>
              <li><strong>Standard Violations:</strong> $200</li>
              <li><strong>Major Violations:</strong> $500</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>What the Fee Covers:</strong> Your flat fee covers attorney review of your case,
              court appearance(s) on your behalf for the specific citation submitted, and communication
              regarding case status and outcome.
            </p>
            <div className="bg-[#FFD100]/10 border-l-4 border-[#FFD100] p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold mb-2">COURT COSTS AND FINES NOT INCLUDED:</p>
              <p className="text-[#4A4A4A]">
                Your attorney fee does NOT include court costs, court fees, fines, or any other amounts
                assessed by the court. These are separate from our representation fee and are your
                responsibility regardless of case outcome. Court costs in Shelby County typically range
                from $50-$150 depending on the court and citation type.
              </p>
            </div>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Payment Processing:</strong> Payments are processed securely through Stripe.
              We do not store your complete credit card information on our servers. By submitting payment,
              you authorize us to charge the applicable fee to your payment method.
            </p>
            <p className="text-[#4A4A4A]">
              <strong>Non-Refundable Fee:</strong> Attorney fees are generally non-refundable once case
              acceptance has been communicated, except as provided under our Money-Back Guarantee (Section 6).
            </p>
          </section>

          {/* Money-Back Guarantee */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              6. MONEY-BACK GUARANTEE
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              TaskForce Tickets offers a money-back guarantee on attorney fees:
            </p>
            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold mb-2">OUR GUARANTEE:</p>
              <p className="text-[#4A4A4A]">
                If your traffic ticket is not dismissed, you will receive a full refund of the attorney
                fee you paid. No questions asked.
              </p>
            </div>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Guarantee Terms:</strong>
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Refund applies only to the attorney fee paid to TaskForce Tickets</li>
              <li>Court costs, fines, or other court-assessed amounts are NOT refundable by us</li>
              <li>Refunds are processed within fourteen (14) business days of case disposition</li>
              <li>Refunds are issued to the original payment method</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Guarantee Exclusions:</strong> The money-back guarantee is void if:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>You provided false, incomplete, or misleading information in your submission</li>
              <li>You failed to provide requested documents or information in a timely manner</li>
              <li>You failed to appear when specifically instructed to do so by our office</li>
              <li>You took actions that prejudiced your case without our knowledge or consent</li>
              <li>The citation was for an offense not covered by our standard flat-fee service</li>
            </ul>
          </section>

          {/* Scope of Representation */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              7. SCOPE AND TERMINATION OF REPRESENTATION
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Limited Scope:</strong> The attorney-client relationship created by our acceptance
              of your case is LIMITED to the specific traffic citation you submitted. Our representation
              does not extend to:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Any other traffic citations or legal matters</li>
              <li>Appeals of adverse decisions (unless separately agreed in writing)</li>
              <li>Related civil matters (such as insurance claims or personal injury)</li>
              <li>Criminal charges arising from the same incident</li>
              <li>DMV or administrative license proceedings</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Termination:</strong> Our representation of you ends upon:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Final disposition of the traffic citation (dismissal, conviction, or other resolution)</li>
              <li>Your termination of our services (subject to court rules regarding withdrawal)</li>
              <li>Our withdrawal from representation (with proper notice and court approval if required)</li>
            </ul>
            <p className="text-[#4A4A4A]">
              Following termination of representation, you must retain separate counsel for any ongoing
              or future legal matters. We will provide you with your file upon request, subject to our
              document retention policies.
            </p>
          </section>

          {/* Document Handling */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              8. DOCUMENT HANDLING
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              Documents you upload through our Service are processed for case evaluation and representation.
              By submitting documents, you consent to:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Electronic storage and processing of your documents on secure servers</li>
              <li>Use of optical character recognition (OCR) technology to extract text from images</li>
              <li>Retention of documents in accordance with our Privacy Policy and professional obligations</li>
              <li>Secure transmission of documents to court systems as necessary for representation</li>
            </ul>
            <p className="text-[#4A4A4A]">
              Please refer to our <Link href="/privacy" className="text-[#FFD100] hover:underline">Privacy Policy</Link> for
              detailed information regarding data security, retention, and deletion practices.
            </p>
          </section>

          {/* Disputes and Governing Law */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              9. DISPUTES AND GOVERNING LAW
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Governing Law:</strong> These Terms and any disputes arising hereunder shall be
              governed by and construed in accordance with the laws of the State of Tennessee, without
              regard to its conflict of law provisions.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Jurisdiction and Venue:</strong> Any legal action or proceeding arising out of or
              relating to these Terms or the Service shall be brought exclusively in the state or federal
              courts located in Shelby County, Tennessee. You consent to the personal jurisdiction of such
              courts and waive any objection to venue in such courts.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Dispute Resolution:</strong> Before initiating any legal proceeding, you agree to
              contact us at the address below to attempt to resolve any dispute informally. We will
              endeavor to resolve disputes in good faith within thirty (30) days of receiving notice.
            </p>
            <p className="text-[#4A4A4A]">
              <strong>Severability:</strong> If any provision of these Terms is found to be unenforceable
              or invalid by a court of competent jurisdiction, that provision shall be limited or eliminated
              to the minimum extent necessary, and the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          {/* Professional Responsibility */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              10. TENNESSEE BOARD OF PROFESSIONAL RESPONSIBILITY COMPLIANCE
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              TaskForce Tickets and its attorneys are licensed to practice law in the State of Tennessee
              and are subject to the Tennessee Rules of Professional Conduct as adopted by the Tennessee
              Supreme Court.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Attorney Advertising:</strong> This website and the information contained herein
              constitute attorney advertising in accordance with Tennessee Supreme Court Rule 8,
              Rules of Professional Conduct 7.1 through 7.5. The information provided is intended
              for general informational purposes and should not be construed as legal advice.
            </p>
            <p className="text-[#4A4A4A] mb-4">
              <strong>Client Rights:</strong> As our client, you retain the right to:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Terminate our representation at any time, subject to court rules</li>
              <li>Receive communication about your case status</li>
              <li>Access your file and documents upon request</li>
              <li>File a complaint with the Tennessee Board of Professional Responsibility if you believe we have violated professional conduct rules</li>
            </ul>
            <p className="text-[#4A4A4A]">
              For information about the Tennessee Board of Professional Responsibility or to file a complaint,
              visit <a href="https://www.tbpr.org" target="_blank" rel="noopener noreferrer" className="text-[#FFD100] hover:underline">www.tbpr.org</a>.
            </p>
          </section>

          {/* Modifications */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              11. MODIFICATIONS TO TERMS
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately
              upon posting to this page with an updated effective date. Your continued use of the Service
              following any changes constitutes your acceptance of the modified Terms.
            </p>
            <p className="text-[#4A4A4A]">
              For existing clients with active cases, the Terms in effect at the time of your case acceptance
              will continue to govern our representation of you for that specific matter.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              12. CONTACT INFORMATION
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              For questions about these Terms or our services, please contact us at:
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
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-[#E5E5E5] flex flex-wrap gap-6 text-sm">
          <Link href="/privacy" className="text-[#FFD100] hover:underline">Privacy Policy</Link>
          <Link href="/disclaimer" className="text-[#FFD100] hover:underline">Legal Disclaimer</Link>
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
