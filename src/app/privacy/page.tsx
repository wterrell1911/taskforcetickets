import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | TaskForce Tickets',
  description: 'Privacy Policy for TaskForce Tickets - how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Privacy Policy</h1>
        <p className="text-[#4A4A4A] mb-8">Effective Date: January 1, 2025 | Last Updated: January 1, 2025</p>

        <div className="prose prose-lg max-w-none text-[#1A1A1A]">
          {/* Introduction */}
          <section className="mb-10">
            <p className="text-[#4A4A4A] mb-4">
              TaskForce Tickets (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy
              and maintaining the confidentiality of your personal information. This Privacy Policy explains
              how we collect, use, disclose, and safeguard your information when you use our website and services.
            </p>
            <p className="text-[#4A4A4A]">
              As a legal services provider, we are also bound by the Tennessee Rules of Professional Conduct
              regarding client confidentiality, which provide additional protections beyond those described in
              this policy.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              1. INFORMATION WE COLLECT
            </h2>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Personal Identifiers</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Full legal name</li>
              <li>Mailing address</li>
              <li>Phone number</li>
              <li>Email address</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Driver&apos;s License Information</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Driver&apos;s license number (stored encrypted, displayed masked)</li>
              <li>License expiration date</li>
              <li>License class and endorsements</li>
              <li>Date of birth</li>
              <li>Address as shown on license</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Traffic Citation Information</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Citation number</li>
              <li>Court date and location</li>
              <li>Violation type and statute numbers</li>
              <li>Officer name and badge number</li>
              <li>Location and date of violation</li>
              <li>Fine amount</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Vehicle Information</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Vehicle make, model, and year</li>
              <li>License plate number</li>
              <li>VIN (if provided on supporting documents)</li>
              <li>Insurance policy information</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Payment Information</h3>
            <p className="text-[#4A4A4A] mb-4">
              Payment information (credit card numbers, billing addresses) is collected and processed
              directly by our payment processor, Stripe. We do not store complete payment card information
              on our servers. We receive only a confirmation of payment and the last four digits of your
              card for reference.
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Technical Information</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>IP address</li>
              <li>Browser type and version</li>
              <li>Device type and operating system</li>
              <li>Pages visited and time spent on site</li>
              <li>Referring website</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              2. HOW WE USE YOUR INFORMATION
            </h2>
            <p className="text-[#4A4A4A] mb-4">We use the information we collect for the following purposes:</p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Case Evaluation and Processing</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Review your traffic citation and determine eligibility for our services</li>
              <li>Verify your identity and driver&apos;s license status</li>
              <li>Prepare for court appearances on your behalf</li>
              <li>Communicate with courts and prosecutors regarding your case</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Client Communication</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Send confirmation of your submission</li>
              <li>Notify you of case acceptance or rejection</li>
              <li>Request additional information or documents when needed</li>
              <li>Inform you of case outcomes and next steps</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Payment Processing</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Process payments for services rendered</li>
              <li>Issue refunds under our money-back guarantee</li>
              <li>Maintain financial records as required by law</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Service Improvement</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>Analyze case outcomes to improve our services</li>
              <li>Identify trends in traffic enforcement for client benefit</li>
              <li>Improve website functionality and user experience</li>
              <li>Internal analytics using aggregated, de-identified data</li>
            </ul>
          </section>

          {/* Document Processing and OCR */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              3. DOCUMENT PROCESSING AND OCR
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              When you upload documents to our Service, we use optical character recognition (OCR) technology
              to extract text and data from your images. This allows us to:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Automatically populate case information fields</li>
              <li>Verify consistency of information across documents</li>
              <li>Expedite case review and processing</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              <strong>OCR Processing:</strong> Document processing currently occurs client-side using
              Tesseract.js technology. This means initial text extraction happens in your browser before
              documents are uploaded. Extracted data is then stored in our secure database.
            </p>
            <p className="text-[#4A4A4A]">
              Original documents are retained only as long as necessary for case processing and quality
              assurance, as detailed in our Data Retention section below.
            </p>
          </section>

          {/* Data Security */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              4. DATA SECURITY
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              We implement comprehensive security measures to protect your personal information:
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Encryption</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>At Rest:</strong> All documents and sensitive data are encrypted using AES-256 encryption</li>
              <li><strong>In Transit:</strong> All data transmitted to and from our servers is protected using TLS 1.3 encryption</li>
              <li><strong>Sensitive Fields:</strong> Driver&apos;s license numbers and other PII are encrypted at the field level in our database</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Access Controls</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li>Access to personal information is limited to authorized personnel on a need-to-know basis</li>
              <li>All staff with data access undergo background checks and confidentiality training</li>
              <li>Multi-factor authentication required for administrative access</li>
              <li>Access logs maintained and regularly audited</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Infrastructure Security</h3>
            <ul className="list-disc pl-6 text-[#4A4A4A] space-y-2">
              <li>Data hosted on Supabase with SOC 2 Type II compliance</li>
              <li>Regular security audits and vulnerability assessments</li>
              <li>Automatic security patches and updates</li>
              <li>Geographic data residency in the United States</li>
            </ul>
          </section>

          {/* Data Retention and Deletion */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              5. DATA RETENTION AND DELETION
            </h2>

            <div className="bg-[#F8F8F8] rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-[#1A1A1A] mb-3">Document Retention Schedule</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    <th className="text-left py-2 text-[#1A1A1A]">Document Type</th>
                    <th className="text-left py-2 text-[#1A1A1A]">Retention Period</th>
                  </tr>
                </thead>
                <tbody className="text-[#4A4A4A]">
                  <tr className="border-b border-[#E5E5E5]">
                    <td className="py-2">Driver&apos;s license images</td>
                    <td className="py-2">7 days after case acceptance</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E5]">
                    <td className="py-2">Traffic citation images</td>
                    <td className="py-2">30 days after case disposition</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E5]">
                    <td className="py-2">Supporting documents</td>
                    <td className="py-2">30 days after case disposition</td>
                  </tr>
                  <tr className="border-b border-[#E5E5E5]">
                    <td className="py-2">Extracted case data (with PII)</td>
                    <td className="py-2">3 years (legal/tax requirements)</td>
                  </tr>
                  <tr>
                    <td className="py-2">Anonymized analytics data</td>
                    <td className="py-2">Indefinitely</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Automatic Deletion</h3>
            <p className="text-[#4A4A4A] mb-4">
              We run automated processes to permanently delete original uploaded documents according to
              the schedule above. Deletion is irreversible. Before deletion occurs, extracted data necessary
              for legal and accounting purposes is retained in accordance with professional responsibility
              requirements and tax law.
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Your Deletion Rights</h3>
            <p className="text-[#4A4A4A]">
              You may request deletion of your personal information at any time by contacting us. However,
              we may be required to retain certain information for legal compliance, professional responsibility
              obligations, or legitimate business purposes. We will inform you if we cannot fully comply with
              a deletion request and explain the reasons.
            </p>
          </section>

          {/* Information Sharing */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              6. INFORMATION SHARING
            </h2>

            <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 mb-4">
              <p className="text-[#1A1A1A] font-semibold">We do not sell your personal information.</p>
            </div>

            <p className="text-[#4A4A4A] mb-4">
              We may share your information only in the following circumstances:
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Court Systems and Legal Proceedings</h3>
            <p className="text-[#4A4A4A] mb-4">
              As your legal representative, we will communicate with courts, prosecutors, and other parties
              as necessary to represent you. This is inherent to the legal services we provide and is authorized
              by your retention of our services.
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Service Providers</h3>
            <p className="text-[#4A4A4A] mb-4">We work with the following service providers who may have access to your information:</p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>Stripe:</strong> Payment processing. Stripe&apos;s privacy policy applies to payment information.</li>
              <li><strong>Supabase:</strong> Secure data storage and hosting.</li>
              <li><strong>Resend:</strong> Email delivery services.</li>
            </ul>
            <p className="text-[#4A4A4A] mb-4">
              All service providers are bound by confidentiality agreements and are prohibited from using
              your information for any purpose other than providing services to us.
            </p>

            <h3 className="text-lg font-semibold text-[#1A1A1A] mt-6 mb-3">Legal Requirements</h3>
            <p className="text-[#4A4A4A]">
              We may disclose your information if required by law, court order, subpoena, or other legal
              process, or if we believe disclosure is necessary to protect our rights, your safety, or
              the safety of others, investigate fraud, or respond to a government request.
            </p>
          </section>

          {/* Your Rights */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              7. YOUR RIGHTS
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal retention requirements)</li>
              <li><strong>Portability:</strong> Request your data in a portable, machine-readable format</li>
              <li><strong>Opt-Out:</strong> Opt out of marketing communications at any time</li>
            </ul>
            <p className="text-[#4A4A4A]">
              To exercise these rights, please contact us using the information provided at the end of this policy.
              We will respond to verified requests within 45 days. We may request additional information to verify
              your identity before processing your request.
            </p>
          </section>

          {/* Third-Party Services */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              8. THIRD-PARTY SERVICES
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              Our Service integrates with or links to third-party services. Each has its own privacy practices:
            </p>
            <ul className="list-disc pl-6 text-[#4A4A4A] mb-4 space-y-2">
              <li><strong>Stripe:</strong> For payment processing. See <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FFD100] hover:underline">Stripe&apos;s Privacy Policy</a></li>
              <li><strong>Google:</strong> If you leave a review. See <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#FFD100] hover:underline">Google&apos;s Privacy Policy</a></li>
            </ul>
            <p className="text-[#4A4A4A]">
              We are not responsible for the privacy practices of third-party services. We encourage you to
              review their privacy policies before providing them with your information.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              9. CHILDREN&apos;S PRIVACY
            </h2>
            <p className="text-[#4A4A4A]">
              Our Service is not intended for individuals under 18 years of age. We do not knowingly collect
              personal information from children under 18. If we become aware that we have collected personal
              information from a child under 18, we will take steps to delete that information promptly.
              If you believe we have collected information from a child under 18, please contact us immediately.
            </p>
          </section>

          {/* Changes to Policy */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              10. CHANGES TO THIS PRIVACY POLICY
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              We may update this Privacy Policy from time to time. Changes will be posted to this page with
              an updated effective date. If we make material changes to how we treat your personal information,
              we will notify you by email (if we have your email address) and/or by posting a prominent notice
              on our website.
            </p>
            <p className="text-[#4A4A4A]">
              Your continued use of the Service after any changes to this Privacy Policy constitutes your
              acceptance of the updated policy.
            </p>
          </section>

          {/* Contact Information */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              11. CONTACT US
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              For questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <div className="bg-[#F8F8F8] rounded-lg p-6">
              <p className="font-semibold text-[#1A1A1A] mb-2">TaskForce Tickets - Privacy Inquiries</p>
              <p className="text-[#4A4A4A]">1661 International Drive, Suite 400</p>
              <p className="text-[#4A4A4A]">Memphis, TN 38120</p>
              <p className="text-[#4A4A4A] mt-4">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@taskforcetickets.com" className="text-[#FFD100] hover:underline">
                  privacy@taskforcetickets.com
                </a>
              </p>
              <p className="text-[#4A4A4A]">
                <strong>Phone:</strong> (901) 555-0199
              </p>
            </div>
          </section>

          {/* Tennessee Compliance */}
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-4 pb-2 border-b border-[#E5E5E5]">
              12. TENNESSEE-SPECIFIC DISCLOSURES
            </h2>
            <p className="text-[#4A4A4A] mb-4">
              This Privacy Policy is designed to comply with the Tennessee Consumer Protection Act and
              other applicable Tennessee privacy laws. Tennessee residents have specific rights regarding
              their personal information as outlined in Section 7 above.
            </p>
            <p className="text-[#4A4A4A]">
              Additionally, as a Tennessee legal services provider, we are bound by the attorney-client
              privilege and the Tennessee Rules of Professional Conduct regarding client confidentiality.
              These professional obligations provide protections that may exceed those required by general
              privacy laws.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-8 border-t border-[#E5E5E5] flex flex-wrap gap-6 text-sm">
          <Link href="/terms" className="text-[#FFD100] hover:underline">Terms of Service</Link>
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
