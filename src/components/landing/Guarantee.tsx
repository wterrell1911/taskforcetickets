export function Guarantee() {
  return (
    <section className="py-28 bg-[#F8F8F8]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-[#FFD100] rounded-full mb-10">
          <svg
            className="w-12 h-12 text-[#1A1A1A]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>

        <h2 className="text-4xl md:text-5xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
          Money-Back Guarantee
        </h2>
        <p className="text-xl text-[#4A4A4A] max-w-2xl mx-auto leading-relaxed mb-12">
          If we can&apos;t get your ticket dismissed, you get a full refund of our service fee.
          It&apos;s that simple.
        </p>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[#1A1A1A] font-semibold">No Risk</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[#1A1A1A] font-semibold">Full Refund</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[#1A1A1A] font-semibold">No Questions Asked</span>
          </div>
        </div>
      </div>
    </section>
  );
}
