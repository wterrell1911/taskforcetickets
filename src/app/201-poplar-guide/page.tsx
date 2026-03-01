import Link from 'next/link';
import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: '201 Poplar Survival Guide (2026) | Parking, Wait Times & How to Skip the Line',
  description:
    "Going to 201 Poplar for traffic court? Our 2026 guide covers parking, what to bring, wait times, and how to skip the trip entirely. Memphis attorney Will Collins.",
  keywords: [
    '201 Poplar',
    '201 Poplar parking',
    'Memphis traffic court',
    'Memphis Criminal Justice Center',
    '201 Poplar court',
    'Memphis traffic ticket',
    'Shelby County traffic court',
  ],
  openGraph: {
    title: '201 Poplar Survival Guide (2026) | TaskForce Tickets',
    description:
      'Everything you need to know about parking, security, and surviving traffic court at 201 Poplar — or how to skip it entirely.',
    type: 'article',
  },
};

const parkingLots = [
  {
    name: '201 Poplar Lot',
    address: '212 Poplar Ave',
    price: '$5-6',
    notes: 'Directly across the street',
  },
  {
    name: 'Justice Center Garage',
    address: '245 Washington Ave',
    price: '$6',
    notes: 'Closest garage',
  },
  {
    name: 'Best Park',
    address: '156 Exchange St',
    price: '$3',
    notes: "Behind St. Mary's Church",
  },
  {
    name: 'Best Park',
    address: '81 N. Second St',
    price: '$5',
    notes: 'Corner of Jefferson & 2nd',
  },
  {
    name: 'Best Park',
    address: '60 N. BB King Blvd',
    price: '$3',
    notes: 'Corner of Jefferson & BB King',
  },
  {
    name: 'Alright Parking',
    address: 'Jefferson & BB King',
    price: '$2',
    notes: 'Closes 6 PM',
  },
  {
    name: 'Premier Parking',
    address: 'Jefferson & BB King',
    price: '$2',
    notes: 'Across from Alright Parking',
  },
  {
    name: 'Secure Parking',
    address: '219 Adams',
    price: '$3',
    notes: "Near D'Army Bailey Courthouse",
  },
];

export default function PoplarGuidePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-[#1A1A1A] text-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-[#FFD100] font-semibold mb-4">2026 EDITION</p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 leading-tight">
              Going to 201 Poplar?
              <br />
              <span className="text-[#FFD100]">Read This First.</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl">
              Everything you need to know about parking, security, and surviving
              traffic court at Memphis&apos; Criminal Justice Center — or how to skip
              it entirely.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#FFD100]/90 transition-colors"
              >
                Skip 201 Poplar — We&apos;ll Go For You
              </Link>
            </div>
            <p className="text-sm text-gray-400">
              Memphis attorney Will Collins appears at 201 Poplar weekly
            </p>
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-8 bg-[#F8F8F8] border-b border-[#E5E5E5]">
          <div className="max-w-4xl mx-auto px-6">
            <p className="font-semibold text-[#1A1A1A] mb-3">Jump to:</p>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="#parking" className="text-[#1A1A1A] hover:text-[#FFD100] underline">
                Parking
              </a>
              <span className="text-gray-400">|</span>
              <a href="#what-to-bring" className="text-[#1A1A1A] hover:text-[#FFD100] underline">
                What to Bring
              </a>
              <span className="text-gray-400">|</span>
              <a href="#what-to-expect" className="text-[#1A1A1A] hover:text-[#FFD100] underline">
                What to Expect
              </a>
              <span className="text-gray-400">|</span>
              <a href="#skip-the-line" className="text-[#1A1A1A] hover:text-[#FFD100] underline">
                Skip the Line
              </a>
              <span className="text-gray-400">|</span>
              <a href="#contact" className="text-[#1A1A1A] hover:text-[#FFD100] underline">
                Contact Info
              </a>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <article className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-6">
            {/* Intro */}
            <section className="mb-16">
              <p className="text-xl text-[#4A4A4A] leading-relaxed mb-6">
                If you&apos;ve got a traffic ticket in Memphis, you&apos;ve probably heard
                the address: <strong className="text-[#1A1A1A]">201 Poplar Avenue</strong>.
                It&apos;s where dreams of a quick court visit go to die.
              </p>
              <p className="text-lg text-[#4A4A4A] leading-relaxed mb-6">
                The Criminal Justice Center at 201 Poplar houses everything from
                traffic court to serious criminal cases. For most Memphians, it
                means one thing: a confusing, frustrating, all-day ordeal for a
                simple speeding ticket.
              </p>
              <div className="bg-[#CF2A27]/10 border border-[#CF2A27]/30 rounded-xl p-6 mb-6">
                <p className="text-[#CF2A27] font-semibold mb-2">
                  December 2025: One Traffic Court Docket
                </p>
                <p className="text-4xl font-bold text-[#CF2A27] mb-2">850 people</p>
                <p className="text-[#4A4A4A]">
                  Scheduled for the same session. The line wrapped through the
                  hallways. People waited for hours.
                </p>
              </div>
              <p className="text-lg text-[#4A4A4A] leading-relaxed">
                This guide will help you survive 201 Poplar — or avoid it altogether.
              </p>
            </section>

            {/* Parking Section */}
            <section id="parking" className="mb-16 scroll-mt-8">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                Where to Park at 201 Poplar
              </h2>
              <p className="text-lg text-[#4A4A4A] mb-6">
                There is <strong className="text-[#CF2A27]">NO free parking</strong> at
                201 Poplar. Plan to pay $2-6 depending on the lot.
              </p>

              <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">
                Closest Parking Options
              </h3>
              <div className="overflow-x-auto mb-8">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#F8F8F8]">
                      <th className="text-left p-3 border border-[#E5E5E5] font-semibold">
                        Lot
                      </th>
                      <th className="text-left p-3 border border-[#E5E5E5] font-semibold">
                        Address
                      </th>
                      <th className="text-left p-3 border border-[#E5E5E5] font-semibold">
                        Price
                      </th>
                      <th className="text-left p-3 border border-[#E5E5E5] font-semibold">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {parkingLots.map((lot, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F8F8F8]/50'}>
                        <td className="p-3 border border-[#E5E5E5] font-medium">
                          {lot.name}
                        </td>
                        <td className="p-3 border border-[#E5E5E5] text-[#4A4A4A]">
                          {lot.address}
                        </td>
                        <td className="p-3 border border-[#E5E5E5] font-semibold text-[#1A1A1A]">
                          {lot.price}
                        </td>
                        <td className="p-3 border border-[#E5E5E5] text-[#4A4A4A]">
                          {lot.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#FFD100]/20 border border-[#FFD100]/50 rounded-xl p-6 mb-6">
                <h4 className="font-bold text-[#1A1A1A] mb-3">Pro Tips</h4>
                <ul className="space-y-2 text-[#4A4A4A]">
                  <li>• Arrive early. The $2-3 lots fill up fast on heavy court days</li>
                  <li>• Bring cash — some lots don&apos;t take cards</li>
                  <li>• Don&apos;t feed a meter and assume you&apos;ll be out in an hour. You won&apos;t.</li>
                  <li>
                    • <strong className="text-[#CF2A27]">DO NOT park in the jail visitor lot</strong>{' '}
                    — that&apos;s for people visiting inmates
                  </li>
                </ul>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-6">
                <h4 className="font-bold text-[#1A1A1A] mb-2">Street Parking</h4>
                <p className="text-[#4A4A4A]">
                  Metered parking is available but risky. Meters run $1/hour, 8 AM -
                  6 PM. If your court session runs long (it will), you&apos;ll get a
                  ticket while fighting a ticket. The irony is not lost on anyone.
                </p>
              </div>
            </section>

            {/* What to Bring Section */}
            <section id="what-to-bring" className="mb-16 scroll-mt-8">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                What to Bring (and Leave in Your Car)
              </h2>
              <p className="text-lg text-[#4A4A4A] mb-6">
                You will pass through a metal detector and have your belongings
                X-rayed. Security at 201 Poplar is strict.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-6">
                  <h3 className="font-bold text-[#10B981] mb-4 text-lg">BRING</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">✓</span>
                      <span>Government-issued photo ID (driver&apos;s license, passport)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">✓</span>
                      <span>Your traffic ticket (the paper citation)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">✓</span>
                      <span>Any evidence you plan to present</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#10B981]">✓</span>
                      <span>Cash or credit card for potential fines/court costs</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#CF2A27]/10 border border-[#CF2A27]/30 rounded-xl p-6">
                  <h3 className="font-bold text-[#CF2A27] mb-4 text-lg">
                    LEAVE IN YOUR CAR
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <span className="text-[#CF2A27]">✗</span>
                      <span>Weapons of any kind (guns, knives, pepper spray)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#CF2A27]">✗</span>
                      <span>Sharp objects (scissors, nail files)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#CF2A27]">✗</span>
                      <span>Recording devices (cameras, audio recorders)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#CF2A27]">✗</span>
                      <span>Food, drinks, and gum</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-6 mb-6">
                <h4 className="font-bold text-[#1A1A1A] mb-2">Cell Phones</h4>
                <p className="text-[#4A4A4A]">
                  You can bring your phone, but it must be{' '}
                  <strong>turned off or silenced</strong> before entering a
                  courtroom. Do not record anything. Do not take photos. Violations
                  can result in contempt of court charges.
                </p>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-6">
                <h4 className="font-bold text-[#1A1A1A] mb-2">Dress Code</h4>
                <p className="text-[#4A4A4A]">
                  This isn&apos;t strictly enforced for traffic court, but avoid: shorts,
                  tank tops, clothing with holes, anything with vulgar language or
                  images, and flip-flops (security lines sometimes involve removing
                  shoes).
                </p>
              </div>
            </section>

            {/* What to Expect Section */}
            <section id="what-to-expect" className="mb-16 scroll-mt-8">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                What Happens When You Get There
              </h2>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center font-bold text-[#1A1A1A] flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-2">Security Screening</h3>
                    <p className="text-[#4A4A4A]">
                      Enter through the main entrance at 201 Poplar Avenue.
                      You&apos;ll go through a metal detector and have your belongings
                      X-rayed. This line can be 10-30 minutes depending on the day.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center font-bold text-[#1A1A1A] flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-2">Find Your Courtroom</h3>
                    <p className="text-[#4A4A4A] mb-3">
                      Your ticket will show which Division you&apos;re assigned to:
                    </p>
                    <ul className="text-[#4A4A4A] space-y-1">
                      <li>
                        • <strong>Divisions 1, 2, 3</strong> — Memphis City tickets
                        (issued by MPD)
                      </li>
                      <li>
                        • <strong>Division 14</strong> — Shelby County tickets
                        (Sheriff&apos;s Office or THP) — 4th floor
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center font-bold text-[#1A1A1A] flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-2">Check In</h3>
                    <p className="text-[#4A4A4A]">
                      When you arrive at your courtroom, a clerk will be checking
                      people in. Get in line. They&apos;ll hand you paperwork.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#CF2A27] rounded-full flex items-center justify-center font-bold text-white flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-2">Wait</h3>
                    <p className="text-[#4A4A4A] mb-3">
                      This is where 201 Poplar earns its reputation.{' '}
                      <strong>You will wait. Possibly for hours.</strong> Traffic
                      court dockets regularly have 100-300+ people scheduled.
                    </p>
                    <p className="text-[#4A4A4A]">
                      Court sessions are typically scheduled at: 9:00 AM, 10:30 AM,
                      and 1:30 PM.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-[#FFD100] rounded-full flex items-center justify-center font-bold text-[#1A1A1A] flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h3 className="font-bold text-[#1A1A1A] mb-2">See the Judge</h3>
                    <p className="text-[#4A4A4A] mb-3">
                      When your name is called, approach the bench. The judge will
                      read the charge. You can:
                    </p>
                    <ul className="text-[#4A4A4A] space-y-1">
                      <li>• Plead guilty (pay the fine, get points on your record)</li>
                      <li>• Plead not guilty (get a trial date)</li>
                      <li>• Request driving school (if eligible)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Skip the Line Section */}
            <section id="skip-the-line" className="mb-16 scroll-mt-8">
              <div className="bg-[#1A1A1A] text-white rounded-2xl p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6">
                  How to Skip 201 Poplar Entirely
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Here&apos;s what most people don&apos;t know:{' '}
                  <strong className="text-[#FFD100]">You don&apos;t have to go.</strong>
                </p>
                <p className="text-gray-300 mb-8">
                  If you hire an attorney to represent you, they can appear on your
                  behalf. You stay at work. You stay with your family. You never set
                  foot in 201 Poplar.
                </p>

                <h3 className="text-xl font-bold text-[#FFD100] mb-4">
                  What happens when we represent you:
                </h3>
                <ol className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#FFD100] text-[#1A1A1A] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <span>You upload your ticket to us</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#FFD100] text-[#1A1A1A] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <span>We review your eligibility for dismissal</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#FFD100] text-[#1A1A1A] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <span>We appear in court on your behalf</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#FFD100] text-[#1A1A1A] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      4
                    </span>
                    <span>
                      For most minor violations, we negotiate dismissal with payment
                      of court costs only
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-[#FFD100] text-[#1A1A1A] rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      5
                    </span>
                    <span>
                      No conviction. No points. No insurance increase.
                    </span>
                  </li>
                </ol>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Total Cost</p>
                    <p className="text-3xl font-bold text-[#FFD100]">~$230</p>
                    <p className="text-gray-400 text-sm">
                      ($100 our fee + ~$130 court costs)
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-6">
                    <p className="text-gray-400 text-sm mb-1">Potential Insurance Savings</p>
                    <p className="text-3xl font-bold text-[#10B981]">$1,530+</p>
                    <p className="text-gray-400 text-sm">Over 3 years</p>
                  </div>
                </div>

                <Link
                  href="/intake"
                  className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#FFD100]/90 transition-colors w-full md:w-auto"
                >
                  Upload Your Ticket Now — Skip 201 Poplar
                </Link>
              </div>
            </section>

            {/* Court Outcomes Section */}
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                What Actually Happens in Memphis Traffic Court
              </h2>
              <p className="text-lg text-[#4A4A4A] mb-6">
                Here&apos;s the reality most people don&apos;t understand until they&apos;ve been
                through it:
              </p>

              <div className="space-y-6">
                <div className="bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl p-6">
                  <h3 className="font-bold text-[#10B981] mb-3">
                    For Minor Violations
                  </h3>
                  <p className="text-[#4A4A4A] mb-3">
                    Speeding under 10 MPH over, seatbelt, improper lane change,
                    no-injury accidents:
                  </p>
                  <ul className="text-[#4A4A4A] space-y-2">
                    <li>
                      → Most are dismissed with payment of{' '}
                      <strong>court costs only (~$130)</strong>
                    </li>
                    <li>→ No conviction goes on your record</li>
                    <li>→ No points assessed</li>
                    <li>→ No driving school required for Memphis City tickets</li>
                  </ul>
                </div>

                <div className="bg-[#FFD100]/20 border border-[#FFD100]/50 rounded-xl p-6">
                  <h3 className="font-bold text-[#1A1A1A] mb-3">
                    For Shelby County Tickets
                  </h3>
                  <ul className="text-[#4A4A4A] space-y-2">
                    <li>
                      → Typically requires completion of a 4-hour defensive driving
                      course
                    </li>
                    <li>→ 6-month probationary period</li>
                    <li>→ Dismissed upon completion if no new tickets</li>
                  </ul>
                </div>

                <div className="bg-[#F8F8F8] rounded-xl p-6">
                  <h3 className="font-bold text-[#1A1A1A] mb-3">The Catch</h3>
                  <p className="text-[#4A4A4A]">
                    You have to know how to ask for this outcome. And you have to
                    spend 2-4 hours at 201 Poplar to get it.
                  </p>
                  <p className="text-[#4A4A4A] mt-3">
                    Or you can hire us. We know the prosecutors. We know the
                    procedures. We go to 201 Poplar so you don&apos;t have to.
                  </p>
                </div>
              </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="mb-16 scroll-mt-8">
              <h2 className="text-3xl font-bold text-[#1A1A1A] mb-6">
                201 Poplar Contact Information
              </h2>

              <div className="bg-[#F8F8F8] rounded-xl p-6 mb-6">
                <h3 className="font-bold text-[#1A1A1A] mb-4">
                  Memphis City Traffic Violations Bureau
                </h3>
                <ul className="text-[#4A4A4A] space-y-2">
                  <li>
                    <strong>Address:</strong> 201 Poplar Ave, LL-80, Memphis, TN
                    38103
                  </li>
                  <li>
                    <strong>Phone:</strong> (901) 636-3400 or (901) 636-3450
                  </li>
                  <li>
                    <strong>Hours:</strong> Monday - Friday, 8:00 AM - 4:30 PM
                  </li>
                </ul>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-6">
                <h3 className="font-bold text-[#1A1A1A] mb-4">
                  Shelby County General Sessions Court
                </h3>
                <ul className="text-[#4A4A4A] space-y-2">
                  <li>
                    <strong>Division 14 (Traffic):</strong> 4th Floor, 201 Poplar Ave
                  </li>
                  <li>
                    <strong>Phone:</strong> (901) 222-3200
                  </li>
                </ul>
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-br from-[#FFD100]/20 to-[#FFD100]/5 border border-[#FFD100]/30 rounded-2xl p-8 text-center">
              <h2 className="text-2xl font-bold text-[#1A1A1A] mb-4">
                Skip the Line. Keep Your Record Clean.
              </h2>
              <p className="text-[#4A4A4A] mb-6 max-w-xl mx-auto">
                Don&apos;t waste half your day at 201 Poplar. Upload your ticket and
                let us handle it. Most cases result in dismissal with no points and
                no conviction.
              </p>
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-[#2A2A2A] transition-colors"
              >
                Submit Your Ticket Now
              </Link>
              <p className="text-sm text-[#4A4A4A] mt-4">
                100% money-back guarantee if we can&apos;t help
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
