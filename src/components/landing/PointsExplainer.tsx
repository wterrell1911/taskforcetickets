'use client';

export function PointsExplainer() {
  return (
    <section className="bg-white py-16 border-t border-[#E5E5E5]">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[#1A1A1A] mb-4">
            It&apos;s Not Just About This Ticket — It&apos;s About Your Record
          </h2>
          <p className="text-lg text-[#4A4A4A] max-w-3xl mx-auto">
            Tennessee uses a points system. Points add up. Insurance companies watch your record closely.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* How Points Work */}
          <div className="bg-[#F8F8F8] rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
              An Example of How TN&apos;s Point System Could Work
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  <strong className="text-[#1A1A1A]">Under 10 MPH over:</strong> No points on first offense
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold">
                  !
                </span>
                <span className="text-[#4A4A4A]">
                  <strong className="text-[#1A1A1A]">Second &quot;minor&quot; ticket:</strong> Points start adding up
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  <strong className="text-[#1A1A1A]">10+ MPH over:</strong> Points added immediately
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-sm font-bold">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                <span className="text-[#4A4A4A]">
                  <strong className="text-[#1A1A1A]">12 points in 12 months:</strong> License suspension
                </span>
              </li>
            </ul>
          </div>

          {/* Why It Matters */}
          <div className="bg-[#FFD100]/10 border-2 border-[#FFD100]/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
              Why Getting It Dismissed Matters
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
                  <span className="text-[#1A1A1A] font-bold">1</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Zero Points</p>
                  <p className="text-[#4A4A4A] text-sm">Dismissed = no points on your record</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
                  <span className="text-[#1A1A1A] font-bold">2</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">No Insurance Spike</p>
                  <p className="text-[#4A4A4A] text-sm">Clean record = rates stay the same</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
                  <span className="text-[#1A1A1A] font-bold">3</span>
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A1A]">Future Protection</p>
                  <p className="text-[#4A4A4A] text-sm">One less ticket if you ever get another</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom callout */}
        <div className="bg-[#1A1A1A] text-white rounded-xl p-6 text-center">
          <p className="text-lg mb-2">
            <strong>Even a &quot;minor&quot; ticket today can cost you tomorrow.</strong>
          </p>
          <p className="text-[#A0A0A0]">
            Get a second one and those points stack up — along with your insurance rates.
          </p>
        </div>
      </div>
    </section>
  );
}
