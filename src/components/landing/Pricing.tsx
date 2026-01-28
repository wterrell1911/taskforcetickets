import Link from 'next/link';
import { PRICING_TIERS } from '@/lib/pricing';
import { formatCurrency } from '@/lib/utils';

export function Pricing() {
  const dismissibleTiers = PRICING_TIERS.filter((t) => t.dismissible);

  return (
    <section id="pricing" className="py-28 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-6 tracking-tight">
            Simple, Flat-Fee Pricing
          </h2>
          <p className="text-xl text-[#4A4A4A] max-w-2xl mx-auto">
            Three tiers. No surprises. Know your cost upfront.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {dismissibleTiers.map((tier, index) => (
            <div
              key={tier.category}
              className={`rounded-2xl p-10 border-2 transition-all ${
                index === 0
                  ? 'border-[#FFD100] bg-[#FFD100]/5 scale-105 shadow-brand-lg'
                  : 'border-[#E5E5E5] bg-white hover:border-[#1A1A1A]/20'
              }`}
            >
              {index === 0 && (
                <span className="inline-block bg-[#FFD100] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full mb-6">
                  Most Common
                </span>
              )}
              <div className="mb-6">
                <span className="text-5xl font-extrabold text-[#1A1A1A]">
                  {formatCurrency(tier.price)}
                </span>
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
                {tier.label}
              </h3>
              <p className="text-[#4A4A4A] leading-relaxed mb-4">
                {tier.description}
              </p>

              {/* Points info by tier */}
              {tier.category === 'minor' && (
                <p className="text-sm text-[#4A4A4A] bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  <span className="text-emerald-600 font-medium">First offense under 10 MPH = 0 points.</span> But it&apos;s still on your record — a second ticket means points add up.
                </p>
              )}
              {tier.category === 'standard' && (
                <p className="text-sm text-[#4A4A4A] bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <span className="text-amber-600 font-medium">10+ MPH over adds points immediately,</span> which triggers insurance increases.
                </p>
              )}
              {tier.category === 'major' && (
                <p className="text-sm text-[#4A4A4A] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  <span className="text-red-600 font-medium">High-point violations</span> can lead to license suspension and major insurance hikes.
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-[#F8F8F8] rounded-2xl p-10 text-center">
          <h3 className="text-xl font-bold text-[#1A1A1A] mb-3">
            Not sure which tier applies to you?
          </h3>
          <p className="text-[#4A4A4A] mb-6">
            Upload your ticket and we&apos;ll determine the right pricing for your situation.
          </p>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2 rounded-lg mb-6">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">
              Use code <span className="font-bold">FDO</span> for a discount!
            </span>
          </div>
          <div>
            <Link
              href="/intake"
              className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              Submit Your Ticket
            </Link>
          </div>
        </div>

        <p className="mt-10 text-center text-[#4A4A4A]/60 text-sm max-w-2xl mx-auto">
          *Court costs and any fines are not included and are your responsibility.
        </p>
      </div>
    </section>
  );
}
