import Link from 'next/link';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Memphis Task Force Ticket? Here\'s How to Get It Dismissed (2026 Guide)',
  description:
    'Got a Memphis Task Force ticket? Learn what it means, how to fight it, and how to get it dismissed without going to court. Flat fee. Money-back guarantee. Skip 201 Poplar.',
  keywords: [
    'memphis task force ticket',
    'memphis task force',
    'task force ticket memphis',
    'memphis police task force',
    'memphis traffic task force',
    'task force ticket dismissed',
    'memphis task force citation',
    'fight task force ticket memphis',
    'memphis task force speeding ticket',
    'task force memphis tn',
  ],
  openGraph: {
    title: 'Memphis Task Force Ticket? Here\'s How to Get It Dismissed',
    description:
      'Got a task force ticket in Memphis? Our attorneys handle everything. Flat fee, no court appearance, money-back guarantee.',
    type: 'article',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Memphis Task Force Ticket? Here\'s How to Get It Dismissed (2026 Guide)',
  description: 'Complete guide to Memphis Task Force tickets — what they are, how to fight them, and how to get them dismissed without going to court.',
  author: {
    '@type': 'Organization',
    name: 'TaskForce Tickets',
    url: 'https://www.taskforcetickets.com',
  },
  publisher: {
    '@type': 'Organization',
    name: 'TaskForce Tickets',
    url: 'https://www.taskforcetickets.com',
  },
  datePublished: '2026-01-31',
  dateModified: '2026-01-31',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is a Memphis Task Force ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A Memphis Task Force ticket is a traffic citation issued during coordinated multi-agency enforcement operations in Memphis and Shelby County. These operations involve Memphis Police Department (MPD), Shelby County Sheriff\'s Office, and Tennessee Highway Patrol (THP) working together to enforce traffic laws, often targeting specific corridors or intersections.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can I fight a Memphis Task Force ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Task Force tickets are standard traffic citations and can be fought like any other ticket. Many are dismissed with payment of court costs only, especially minor violations like speeding under 10 MPH over the limit, seatbelt violations, and expired tags.',
      },
    },
    {
      '@type': 'Question',
      name: 'Do I have to go to court for a Task Force ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. If you hire an attorney to represent you, they can appear at 201 Poplar on your behalf. You don\'t have to miss work, wait in line, or set foot in the courthouse.',
      },
    },
    {
      '@type': 'Question',
      name: 'How much does it cost to fight a Task Force ticket?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'TaskForce Tickets charges a flat fee starting at $100 for minor violations, $200 for standard violations, and $500 for major violations. Court costs (approximately $130) are separate and paid directly to the court.',
      },
    },
    {
      '@type': 'Question',
      name: 'Where do Memphis Task Force operations happen?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Task Force operations target high-traffic corridors and intersections across Memphis and Shelby County, including Poplar Avenue, Sam Cooper Boulevard, Union Avenue, Winchester Road, Germantown Parkway, I-240 corridors, Summer Avenue, Lamar Avenue, and Elvis Presley Boulevard.',
      },
    },
  ],
};

export default function MemphisTaskForceTicketPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header />
      <main className="min-h-screen bg-white pt-24">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="inline-block bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-[#FFD100] text-sm font-semibold tracking-wide">2026 GUIDE</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Got a Memphis{' '}
              <span className="text-[#FFD100]">Task Force Ticket?</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl leading-relaxed">
              Thousands of Memphis drivers get task force citations every year. Most don&apos;t know they can get them dismissed — without ever stepping foot in 201 Poplar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:brightness-105 transition-all"
              >
                Get My Ticket Dismissed →
              </Link>
              <Link
                href="#what-is-task-force"
                className="inline-flex items-center justify-center border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:border-white/60 transition-all"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        {/* Quick Stats Bar */}
        <section className="bg-[#FFD100] py-6">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">$100</span>
              <span className="text-sm font-medium">Flat Fee<br />Starting Price</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">0</span>
              <span className="text-sm font-medium">Court<br />Appearances</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">3 min</span>
              <span className="text-sm font-medium">To Submit<br />Online</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">100%</span>
              <span className="text-sm font-medium">Money-Back<br />Guarantee</span>
            </div>
          </div>
        </section>

        {/* What Is a Task Force Ticket */}
        <section id="what-is-task-force" className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
              What Is a Memphis Task Force Ticket?
            </h2>
            <div className="prose prose-lg max-w-none text-[#4A4A4A] space-y-6">
              <p>
                If you&apos;ve been pulled over in Memphis and received a citation from what seemed like a large-scale police operation, you likely got a <strong>Task Force ticket</strong>.
              </p>
              <p>
                Memphis Task Force operations are coordinated, multi-agency traffic enforcement efforts involving some combination of:
              </p>
              <ul className="space-y-3 list-none pl-0">
                {[
                  'Memphis Police Department (MPD)',
                  'Shelby County Sheriff\'s Office (SCSO)',
                  'Tennessee Highway Patrol (THP)',
                ].map((agency) => (
                  <li key={agency} className="flex items-start gap-3">
                    <span className="mt-1 w-2 h-2 rounded-full bg-[#FFD100] flex-shrink-0" />
                    <span>{agency}</span>
                  </li>
                ))}
              </ul>
              <p>
                These operations target specific corridors, intersections, and neighborhoods with the goal of reducing traffic accidents and enforcing traffic laws. They typically issue <strong>hundreds of citations in a single operation</strong> — often 200-500+ tickets in a single day.
              </p>
              <div className="bg-[#FFF8E1] border-l-4 border-[#FFD100] p-6 rounded-r-xl my-8">
                <p className="text-[#1A1A1A] font-semibold mb-2">Did you know?</p>
                <p className="text-[#4A4A4A] mb-0">
                  Memphis Task Force operations have issued over <strong>4,600 citations</strong> in recent operations. That&apos;s 4,600 people who need to deal with traffic court at 201 Poplar — or hire someone to handle it for them.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Where Do Task Force Operations Happen */}
        <section className="py-20 bg-[#F8F8F8]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
              Where Do Memphis Task Force Operations Happen?
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-8">
              Task Force operations move around Memphis and Shelby County. Common locations include:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { area: 'Poplar Avenue', detail: 'Midtown to Germantown corridor' },
                { area: 'Sam Cooper Boulevard', detail: 'East Memphis speed enforcement' },
                { area: 'Union Avenue', detail: 'Downtown to East Memphis' },
                { area: 'Winchester Road', detail: 'Airport area, heavy enforcement' },
                { area: 'Germantown Parkway', detail: 'Suburban corridor, speed traps' },
                { area: 'I-240 Corridors', detail: 'Interstate on/off ramp enforcement' },
                { area: 'Summer Avenue', detail: 'Berclair to Bartlett' },
                { area: 'Lamar Avenue', detail: 'South Memphis to Hickory Hill' },
                { area: 'Elvis Presley Boulevard', detail: 'Whitehaven area' },
                { area: 'Stage Road / Covington Pike', detail: 'North Memphis / Raleigh' },
                { area: 'Walnut Grove Road', detail: 'East Memphis residential' },
                { area: 'Getwell Road', detail: 'Near Baptist Hospital corridor' },
              ].map(({ area, detail }) => (
                <div key={area} className="bg-white rounded-xl p-5 border border-[#E5E5E5]">
                  <p className="font-bold text-[#1A1A1A]">{area}</p>
                  <p className="text-sm text-[#4A4A4A]">{detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-white rounded-xl p-6 border border-[#E5E5E5]">
              <p className="text-[#4A4A4A]">
                <strong className="text-[#1A1A1A]">Common citation types from Task Force operations:</strong> speeding, seatbelt violations, expired registration, no proof of insurance, improper lane change, running red lights, reckless driving, and suspended license.
              </p>
            </div>
          </div>
        </section>

        {/* What Happens If You Ignore It */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
              What Happens If You Ignore a Task Force Ticket?
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-8">
              Ignoring a Memphis Task Force ticket doesn&apos;t make it go away. Here&apos;s what happens:
            </p>
            <div className="space-y-4">
              {[
                {
                  title: 'Failure to Appear (FTA)',
                  desc: 'A warrant is issued for your arrest. You can be picked up during any future traffic stop.',
                  icon: '⚠️',
                },
                {
                  title: 'License Suspension',
                  desc: 'Tennessee will suspend your driver\'s license for failure to appear or unpaid fines.',
                  icon: '🚫',
                },
                {
                  title: 'Additional Fines',
                  desc: 'Late fees and court costs pile up. A $50 ticket becomes $300+ with FTA fees.',
                  icon: '💸',
                },
                {
                  title: 'Insurance Rate Increase',
                  desc: 'Points on your record from a conviction can increase your insurance by $500-$1,500+ over 3 years.',
                  icon: '📈',
                },
                {
                  title: 'Permanent Record',
                  desc: 'A conviction stays on your Tennessee driving record and is visible to insurance companies.',
                  icon: '📋',
                },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="flex gap-4 bg-red-50/50 border border-red-100 rounded-xl p-6">
                  <span className="text-2xl flex-shrink-0">{icon}</span>
                  <div>
                    <p className="font-bold text-[#1A1A1A] mb-1">{title}</p>
                    <p className="text-[#4A4A4A]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-[#1A1A1A] text-white rounded-xl p-8 text-center">
              <p className="text-xl font-bold mb-2">The bottom line?</p>
              <p className="text-gray-300 mb-6">
                Dealing with your Task Force ticket now costs a fraction of what ignoring it costs later.
              </p>
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:brightness-105 transition-all"
              >
                Handle My Ticket Now →
              </Link>
            </div>
          </div>
        </section>

        {/* How to Fight Your Task Force Ticket */}
        <section className="py-20 bg-[#F8F8F8]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
              How to Fight a Memphis Task Force Ticket
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-8">
              You have three options when you receive a Task Force citation:
            </p>

            {/* Option 1 */}
            <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-8 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-red-100 text-red-600 font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Go to 201 Poplar Yourself</h3>
                  <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1">NOT RECOMMENDED</span>
                </div>
              </div>
              <ul className="space-y-2 text-[#4A4A4A] ml-14">
                <li>Miss a full day of work (traffic court runs all day)</li>
                <li>Wait in line with 100-300+ other people</li>
                <li>Navigate the courthouse process alone</li>
                <li>Risk saying the wrong thing and getting convicted</li>
                <li>Pay the same court costs either way (~$130)</li>
              </ul>
            </div>

            {/* Option 2 */}
            <div className="bg-white rounded-2xl border-2 border-[#E5E5E5] p-8 mb-6">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-amber-100 text-amber-600 font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Pay the Ticket (Plead Guilty)</h3>
                  <span className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1">RISKY</span>
                </div>
              </div>
              <ul className="space-y-2 text-[#4A4A4A] ml-14">
                <li>Paying = guilty plea = conviction on your record</li>
                <li>Points added to your license</li>
                <li>Insurance rates increase for 3-5 years</li>
                <li>A &quot;minor&quot; $50 ticket can cost $1,500+ in insurance hikes</li>
                <li>Future tickets stack — more points, higher risk of suspension</li>
              </ul>
            </div>

            {/* Option 3 */}
            <div className="bg-white rounded-2xl border-2 border-[#FFD100] p-8 shadow-lg">
              <div className="flex items-start gap-4 mb-4">
                <span className="bg-[#FFD100] text-[#1A1A1A] font-bold text-lg w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                <div>
                  <h3 className="text-xl font-bold text-[#1A1A1A]">Hire TaskForce Tickets to Handle It</h3>
                  <span className="inline-block bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full mt-1">BEST OPTION</span>
                </div>
              </div>
              <ul className="space-y-2 text-[#4A4A4A] ml-14">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Upload your ticket online in 3 minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Pay a flat fee — $100 for minor, $200 for standard, $500 for major</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Our attorneys appear at 201 Poplar on your behalf</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Most minor violations dismissed with court costs only</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>No conviction on your record. No points. No insurance increase.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  <span>Money-back guarantee if we can&apos;t help</span>
                </li>
              </ul>
              <div className="mt-6 ml-14">
                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:brightness-105 transition-all"
                >
                  Upload My Task Force Ticket →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* The Math */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-8 tracking-tight">
              The Real Cost of a Memphis Task Force Ticket
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-10">
              People think a traffic ticket is just the fine. It&apos;s not. Here&apos;s what a single speeding ticket actually costs:
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Pay the ticket */}
              <div className="border-2 border-red-200 rounded-2xl p-8 bg-red-50/30">
                <h3 className="text-xl font-bold text-red-700 mb-6">❌ Just Pay the Ticket</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Fine</span>
                    <span className="font-bold text-[#1A1A1A]">$50–$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Court costs</span>
                    <span className="font-bold text-[#1A1A1A]">~$130</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Insurance increase (3 yrs)</span>
                    <span className="font-bold text-red-600">$1,000–$1,500+</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Lost wages (day off)</span>
                    <span className="font-bold text-[#1A1A1A]">$100–$300</span>
                  </div>
                  <hr className="border-red-200" />
                  <div className="flex justify-between">
                    <span className="font-bold text-[#1A1A1A]">Total Cost</span>
                    <span className="font-extrabold text-red-600 text-xl">$1,280–$2,130+</span>
                  </div>
                </div>
              </div>

              {/* Hire us */}
              <div className="border-2 border-emerald-200 rounded-2xl p-8 bg-emerald-50/30">
                <h3 className="text-xl font-bold text-emerald-700 mb-6">✅ Hire TaskForce Tickets</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Our flat fee</span>
                    <span className="font-bold text-[#1A1A1A]">$100–$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Court costs</span>
                    <span className="font-bold text-[#1A1A1A]">~$130</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Insurance increase</span>
                    <span className="font-bold text-emerald-600">$0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#4A4A4A]">Time off work</span>
                    <span className="font-bold text-emerald-600">$0</span>
                  </div>
                  <hr className="border-emerald-200" />
                  <div className="flex justify-between">
                    <span className="font-bold text-[#1A1A1A]">Total Cost</span>
                    <span className="font-extrabold text-emerald-600 text-xl">$230–$330</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 bg-[#FFF8E1] border border-[#FFD100]/30 rounded-xl p-8 text-center">
              <p className="text-2xl font-extrabold text-[#1A1A1A] mb-2">
                You save $1,000–$1,800
              </p>
              <p className="text-[#4A4A4A]">
                by hiring us instead of paying the ticket and taking the conviction.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-[#1A1A1A] text-white">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-12 tracking-tight text-center">
              How It Works — 3 Simple Steps
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: '1',
                  title: 'Upload Your Ticket',
                  desc: 'Snap a photo of your Task Force citation and submit it through our secure online form. Takes about 3 minutes.',
                },
                {
                  step: '2',
                  title: 'Pay a Flat Fee',
                  desc: 'Know your price upfront. $100 for minor violations, $200 for standard, $500 for major. No hidden fees. Ever.',
                },
                {
                  step: '3',
                  title: 'We Handle Everything',
                  desc: 'Our attorneys appear at 201 Poplar on your behalf, negotiate for dismissal, and keep you updated every step of the way.',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#FFD100] text-[#1A1A1A] font-extrabold text-2xl flex items-center justify-center mx-auto mb-6">
                    {step}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{title}</h3>
                  <p className="text-gray-400 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:brightness-105 transition-all"
              >
                Get Started — Upload Your Ticket →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#1A1A1A] mb-12 tracking-tight">
              Memphis Task Force Ticket FAQ
            </h2>
            <div className="space-y-6">
              {[
                {
                  q: 'What is a Memphis Task Force ticket?',
                  a: 'A Task Force ticket is a traffic citation issued during coordinated multi-agency enforcement operations in Memphis and Shelby County. Multiple agencies (MPD, Sheriff\'s Office, THP) work together to target specific areas, issuing hundreds of citations in a single operation.',
                },
                {
                  q: 'Can a Task Force ticket be dismissed?',
                  a: 'Yes. Task Force tickets are standard traffic citations. Many minor violations (speeding under 10 MPH over, seatbelt, expired tags) can be dismissed with payment of court costs only — meaning no conviction, no points, and no insurance increase.',
                },
                {
                  q: 'Do I have to go to 201 Poplar for a Task Force ticket?',
                  a: 'No. When you hire an attorney, they appear on your behalf. You never have to miss work, wait in line, or step foot inside 201 Poplar. Our attorneys handle everything from start to finish.',
                },
                {
                  q: 'How much does it cost to fight a Task Force ticket?',
                  a: 'Our flat fees start at $100 for minor violations, $200 for standard violations, and $500 for major violations. Court costs (~$130) are paid separately to the court. We offer a money-back guarantee — if we can\'t help, you don\'t pay.',
                },
                {
                  q: 'What if I already missed my court date?',
                  a: 'If you\'ve missed your court date, a Failure to Appear (FTA) warrant may have been issued. It\'s important to act quickly. Upload your ticket and we\'ll advise you on your options — we handle FTA cases regularly.',
                },
                {
                  q: 'How long does it take to resolve my ticket?',
                  a: 'Most tickets are resolved within 2-4 weeks, depending on your court date. We handle the scheduling, appearances, and negotiations. You\'ll receive updates throughout the process.',
                },
                {
                  q: 'Will this show up on my driving record?',
                  a: 'If your ticket is dismissed (which is the goal), there is no conviction on your record. No points assessed. Your insurance company sees nothing. It\'s as if the ticket never happened.',
                },
                {
                  q: 'What types of Task Force tickets do you handle?',
                  a: 'We handle all traffic citations issued during Memphis Task Force operations: speeding, seatbelt violations, expired registration, no proof of insurance, improper lane change, running red lights, reckless driving, and more.',
                },
              ].map(({ q, a }) => (
                <div key={q} className="border border-[#E5E5E5] rounded-xl p-6">
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">{q}</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Internal Links Section */}
        <section className="py-16 bg-[#F8F8F8]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-8">Related Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/201-poplar-guide" className="block bg-white rounded-xl p-6 border border-[#E5E5E5] hover:border-[#FFD100] transition-colors">
                <h3 className="font-bold text-[#1A1A1A] mb-2">201 Poplar Survival Guide →</h3>
                <p className="text-sm text-[#4A4A4A]">Everything you need to know about parking, security, and surviving Memphis traffic court.</p>
              </Link>
              <Link href="/intake" className="block bg-white rounded-xl p-6 border border-[#E5E5E5] hover:border-[#FFD100] transition-colors">
                <h3 className="font-bold text-[#1A1A1A] mb-2">Submit Your Ticket →</h3>
                <p className="text-sm text-[#4A4A4A]">Upload your Task Force citation in 3 minutes and let our attorneys handle the rest.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-[#1A1A1A] text-white text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight">
              Ready to Get Your Task Force Ticket Dismissed?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Submit your ticket today and let us handle the rest. Most cases are resolved without any court appearance.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-10 py-5 rounded-xl text-xl font-bold hover:brightness-105 transition-all"
            >
              Submit Your Task Force Ticket Now →
            </Link>
            <p className="mt-6 text-gray-500 text-sm">
              100% Money-Back Guarantee · No Court Appearance Required · Flat Fee Pricing
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
