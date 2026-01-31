'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from '@/components/ui/Logo';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#E5E5E5]">
      <nav className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <Logo size="sm" showTagline={false} />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          <Link
            href="#how-it-works"
            className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium"
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium"
          >
            Pricing
          </Link>
          <Link
            href="/traffic-report"
            className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium"
          >
            Hotspot Map
          </Link>
          <Link
            href="/intake"
            className="bg-[#FFD100] text-[#1A1A1A] px-6 py-3 rounded-lg hover:brightness-105 transition-all font-semibold"
          >
            Submit Your Ticket
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile Nav */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E5E5] px-6 py-6 space-y-4">
          <Link
            href="#how-it-works"
            className="block text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            How It Works
          </Link>
          <Link
            href="#pricing"
            className="block text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Pricing
          </Link>
          <Link
            href="/traffic-report"
            className="block text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors font-medium py-2"
            onClick={() => setMobileMenuOpen(false)}
          >
            Hotspot Map
          </Link>
          <Link
            href="/intake"
            className="block bg-[#FFD100] text-[#1A1A1A] px-6 py-3 rounded-lg text-center font-semibold"
            onClick={() => setMobileMenuOpen(false)}
          >
            Submit Your Ticket
          </Link>
        </div>
      )}
    </header>
  );
}
