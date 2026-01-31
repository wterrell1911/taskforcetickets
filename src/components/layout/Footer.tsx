import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';

export function Footer() {
  return (
    <footer className="bg-[#1A1A1A] text-white py-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Logo variant="light" showTagline size="md" href="/" />
            <p className="text-white/60 max-w-md mt-6 leading-relaxed">
              Professional traffic ticket resolution services for Memphis and Shelby County.
              We handle your citation so you can focus on what matters.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-sm tracking-wide uppercase text-white/40">
              Quick Links
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="#how-it-works" className="text-white/70 hover:text-white transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="text-white/70 hover:text-white transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/intake" className="text-white/70 hover:text-white transition-colors">
                  Submit a Ticket
                </Link>
              </li>
              <li>
                <Link href="/memphis-task-force-ticket" className="text-white/70 hover:text-white transition-colors">
                  Task Force Tickets
                </Link>
              </li>
              <li>
                <Link href="/traffic-report" className="text-white/70 hover:text-white transition-colors">
                  Traffic Hotspot Map
                </Link>
              </li>
              <li>
                <Link href="/201-poplar-guide" className="text-white/70 hover:text-white transition-colors">
                  201 Poplar Guide
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-white/70 hover:text-white transition-colors">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-6 text-sm tracking-wide uppercase text-white/40">
              Legal
            </h4>
            <ul className="space-y-4">
              <li>
                <Link href="/terms" className="text-white/70 hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white/70 hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-white/70 hover:text-white transition-colors">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Highway line accent */}
        <div className="highway-line mb-8" />

        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-white/40 text-sm">
            &copy; {new Date().getFullYear()} TaskForce Tickets. All rights reserved.
          </p>
          <p className="text-white/30 text-xs text-center md:text-right max-w-lg">
            *Court costs and fines are not included in our service fee. Results may vary.
            Attorney-client relationship is not established until acceptance confirmation is received.
          </p>
        </div>
      </div>
    </footer>
  );
}
