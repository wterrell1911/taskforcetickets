import Link from 'next/link';

const steps = [
  {
    number: '1',
    title: 'Upload Your Ticket',
    subtitle: 'Takes 2 minutes',
  },
  {
    number: '2',
    title: 'Pay a Flat Fee',
    subtitle: 'No hidden costs',
  },
  {
    number: '3',
    title: 'We Handle It',
    subtitle: 'You stay home',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-28 bg-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white text-center mb-20 tracking-tight">
          Here&apos;s how it works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="bg-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-10 text-center"
            >
              {/* Step Circle - Yellow like speed limit sign */}
              <div className="w-28 h-28 bg-[#FFD100] rounded-full flex flex-col items-center justify-center mx-auto mb-10 border-4 border-[#1A1A1A]">
                <span className="text-[#1A1A1A] text-xs font-bold tracking-wider uppercase">
                  Step
                </span>
                <span className="text-[#1A1A1A] text-5xl font-extrabold leading-none">
                  {step.number}
                </span>
              </div>

              {/* Text */}
              <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
              <p className="text-white/50 text-lg">{step.subtitle}</p>

              {/* Yellow accent line */}
              <div className="w-20 h-1 bg-[#FFD100] mx-auto mt-10"></div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link
            href="/intake"
            className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-10 py-5 rounded-xl text-xl font-semibold hover:brightness-105 transition-all"
          >
            Get Started Now
            <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
