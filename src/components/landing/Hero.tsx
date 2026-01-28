import Link from 'next/link';

export function Hero() {
  return (
    <section className="pt-40 pb-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FFD100]/10 border border-[#FFD100]/30 text-[#1A1A1A] px-5 py-2.5 rounded-full text-sm font-medium mb-10">
            <span className="w-2 h-2 bg-[#FFD100] rounded-full"></span>
            Serving Memphis &amp; Shelby County
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#1A1A1A] leading-[1.1] tracking-tight mb-8">
            Get Your Traffic Ticket
            <span className="block text-[#4A4A4A]">Dismissed.</span>
          </h1>

          {/* Subhead */}
          <p className="text-xl md:text-2xl text-[#4A4A4A] mb-12 max-w-2xl leading-relaxed font-normal">
            Upload your ticket, pay a flat fee, and let our experienced attorneys handle the rest.
            No court appearances. No hassle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <Link
              href="/intake"
              className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-10 py-5 rounded-xl text-lg font-semibold hover:brightness-105 transition-all"
            >
              Submit Your Ticket
              <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center justify-center border-2 border-[#E5E5E5] text-[#1A1A1A] px-10 py-5 rounded-xl text-lg font-semibold hover:border-[#1A1A1A] transition-colors"
            >
              Learn More
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center gap-8 text-sm text-[#4A4A4A]">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Flat-fee pricing</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#FFD100]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>No court appearance</span>
            </div>
          </div>

          {/* Promo Code Callout */}
          <div className="mt-8 inline-flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-xl">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm font-medium">
              Use code <span className="font-bold bg-emerald-200 px-2 py-0.5 rounded">FDO</span> at checkout for a discount!
            </span>
          </div>

          <p className="text-xs text-[#4A4A4A]/60 mt-6">
            *Court costs and fines not included. See terms for details.
          </p>
        </div>
      </div>
    </section>
  );
}
