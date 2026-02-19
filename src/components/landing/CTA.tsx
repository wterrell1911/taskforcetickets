import Link from 'next/link';
import { PhoneNumber } from '@/components/ui/PhoneNumber';

export function CTA() {
  return (
    <section className="py-28 bg-[#1A1A1A]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-8 tracking-tight">
          Ready to Get Your Ticket Dismissed?
        </h2>
        <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
          Submit your ticket today and let us handle the rest. Most cases are resolved
          without any court appearance required.
        </p>
        <Link
          href="/intake"
          className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-12 py-6 rounded-xl text-xl font-bold hover:brightness-105 transition-all shadow-brand-lg"
        >
          Submit Your Ticket Now
          <svg className="w-6 h-6 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M17 8l4 4m0 0l-4 4m4-4H3"
            />
          </svg>
        </Link>
        <div className="mt-6">
          <span className="text-white/60 text-lg">Prefer to talk? Call us: </span>
          <PhoneNumber variant="cta" showIcon={false} />
        </div>
        <p className="text-white/40 mt-8 text-sm">
          Must submit at least 3 business days before your court date
        </p>
      </div>
    </section>
  );
}
