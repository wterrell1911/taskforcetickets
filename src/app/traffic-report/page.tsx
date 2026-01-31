import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';
import { TrafficMap } from './TrafficMap';

export const metadata: Metadata = {
  title: 'Memphis Traffic Stop Map — Where Enforcement Is Highest (2026 Data)',
  description:
    'Interactive map showing Memphis traffic enforcement hotspots. See where police pull over the most drivers by ZIP code and precinct. Real city data, updated regularly.',
  keywords: [
    'memphis traffic stops map',
    'memphis speed trap locations',
    'memphis police enforcement areas',
    'where do cops pull you over memphis',
    'memphis traffic enforcement hotspots',
    'memphis ticket hotspot map',
    'MPD traffic stops',
    'shelby county traffic enforcement',
  ],
  openGraph: {
    title: 'Memphis Traffic Stop Hotspot Map | TaskForce Tickets',
    description:
      'See where Memphis police issue the most traffic citations. Interactive map with real city data.',
    type: 'article',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Memphis Traffic Stop Map — Where Enforcement Is Highest (2026 Data)',
  description: 'Interactive map of Memphis traffic enforcement hotspots using real city data.',
  author: { '@type': 'Organization', name: 'TaskForce Tickets', url: 'https://www.taskforcetickets.com' },
  publisher: { '@type': 'Organization', name: 'TaskForce Tickets', url: 'https://www.taskforcetickets.com' },
  datePublished: '2026-01-31',
  dateModified: '2026-01-31',
};

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Where do Memphis police pull over the most drivers?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The highest enforcement areas in Memphis are Midtown (ZIP 38104), Hickory Hill (38115), Parkway Village (38118), and South Memphis (38106). The Crump precinct has the highest number of traffic stops citywide.',
      },
    },
    {
      '@type': 'Question',
      name: 'How often does Memphis run task force operations?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Memphis runs multi-agency task force traffic enforcement operations regularly, often targeting specific corridors and intersections. These operations can issue hundreds of citations in a single day.',
      },
    },
    {
      '@type': 'Question',
      name: 'What should I do if I got a ticket in a hotspot area?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Upload your ticket to TaskForce Tickets. Our attorneys can appear at 201 Poplar on your behalf and work to get your ticket dismissed. Flat fee, no court appearance required, money-back guarantee.',
      },
    },
  ],
};

async function getHotspotData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.taskforcetickets.com';
  try {
    const res = await fetch(`${baseUrl}/api/traffic-hotspots`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  } catch {
    // Fallback: query ArcGIS directly at build time
    const ARCGIS_BASE = 'https://services2.arcgis.com/saWmpKJIUAjyyNVc/arcgis/rest/services/MPD_Traffic_Stops/FeatureServer/0';
    const countRes = await fetch(`${ARCGIS_BASE}/query?f=json&where=1=1&returnCountOnly=true`).then(r => r.json());
    return { totalStops: countRes.count || 733000, byZip: [], byPrecinct: [] };
  }
}

export default async function TrafficReportPage() {
  const data = await getHotspotData();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Header />
      <main className="min-h-screen bg-white pt-24">
        {/* Hero */}
        <section className="bg-[#1A1A1A] text-white py-16">
          <div className="max-w-5xl mx-auto px-6">
            <div className="inline-block bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-full px-4 py-1.5 mb-6">
              <span className="text-[#FFD100] text-sm font-semibold tracking-wide">LIVE DATA · LAST 90 DAYS</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Memphis Traffic Stop{' '}
              <span className="text-[#FFD100]">Hotspot Map</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl leading-relaxed">
              See where Memphis police issue the most traffic citations. Real data from {data.totalStops?.toLocaleString() || '60,000'}+ traffic stops in the last 90 days.
            </p>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-[#FFD100] py-5">
          <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[#1A1A1A]">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">{data.totalStops?.toLocaleString() || '60,000'}+</span>
              <span className="text-sm font-medium">Traffic Stops<br />Last 90 Days</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">{data.byZip?.length || 23}</span>
              <span className="text-sm font-medium">ZIP Codes<br />Tracked</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">{data.byPrecinct?.length || 9}</span>
              <span className="text-sm font-medium">MPD Precincts<br />Active</span>
            </div>
            <div className="hidden md:block w-px h-8 bg-[#1A1A1A]/20" />
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold">#1</span>
              <span className="text-sm font-medium">{data.byZip?.[0]?.name || 'Midtown'}<br />Most Stops</span>
            </div>
          </div>
        </section>

        {/* Map Section */}
        <section className="py-12">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">
              Interactive Hotspot Map
            </h2>
            <p className="text-[#4A4A4A] mb-6">
              Larger circles = more traffic stops. Click any marker to see details. <span className="text-[#FFD100] font-semibold">Yellow</span> = moderate enforcement. <span className="text-[#CF2A27] font-semibold">Red</span> = heavy enforcement.
            </p>
            <TrafficMap data={data.byZip || []} />
          </div>
        </section>

        {/* Top Hotspots Table */}
        <section className="py-16 bg-[#F8F8F8]">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-8">
              Top 10 Traffic Enforcement Hotspots
            </h2>
            <div className="space-y-3">
              {(data.byZip || []).slice(0, 10).map((z: { zip: string; name: string; count: number }, i: number) => {
                const maxCount = data.byZip?.[0]?.count || 1;
                const pct = Math.round((z.count / maxCount) * 100);
                return (
                  <div key={z.zip} className="bg-white rounded-xl p-5 border border-[#E5E5E5]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i < 3 ? 'bg-[#CF2A27] text-white' : 'bg-[#FFD100] text-[#1A1A1A]'}`}>
                          {i + 1}
                        </span>
                        <div>
                          <span className="font-bold text-[#1A1A1A]">{z.name}</span>
                          <span className="text-[#4A4A4A] text-sm ml-2">ZIP {z.zip}</span>
                        </div>
                      </div>
                      <span className="font-extrabold text-[#1A1A1A]">{z.count.toLocaleString()} stops</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${i < 3 ? 'bg-[#CF2A27]' : 'bg-[#FFD100]'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 bg-[#1A1A1A] text-white rounded-xl p-8 text-center">
              <p className="text-xl font-bold mb-2">Got a ticket in one of these areas?</p>
              <p className="text-gray-300 mb-6">
                Our attorneys handle Memphis traffic tickets every day. Flat fee. No court appearance. Money-back guarantee.
              </p>
              <Link
                href="/intake"
                className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-xl text-lg font-bold hover:brightness-105 transition-all"
              >
                Upload Your Ticket →
              </Link>
            </div>
          </div>
        </section>

        {/* Precinct Breakdown */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-8">
              Enforcement by MPD Precinct
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {(data.byPrecinct || []).map((p: { precinct: string; count: number }, i: number) => (
                <div key={p.precinct} className={`rounded-xl p-6 border-2 ${i === 0 ? 'border-[#CF2A27] bg-red-50/30' : 'border-[#E5E5E5] bg-white'}`}>
                  {i === 0 && (
                    <span className="inline-block bg-[#CF2A27] text-white text-xs font-bold px-2 py-0.5 rounded-full mb-2">
                      HIGHEST ENFORCEMENT
                    </span>
                  )}
                  <p className="text-xl font-bold text-[#1A1A1A]">{p.precinct}</p>
                  <p className="text-2xl font-extrabold text-[#1A1A1A] mt-1">{p.count.toLocaleString()}</p>
                  <p className="text-sm text-[#4A4A4A]">traffic stops</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-[#F8F8F8]">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold text-[#1A1A1A] mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              {[
                { q: 'Where do Memphis police pull over the most drivers?', a: 'The highest enforcement areas are Midtown (ZIP 38104 with 58,000+ stops), Hickory Hill (38115), Parkway Village (38118), and South Memphis (38106). The Crump precinct leads all precincts with 119,000+ traffic stops.' },
                { q: 'What is a Memphis Task Force operation?', a: 'Task Force operations are coordinated, multi-agency traffic enforcement events where MPD, Shelby County Sheriff, and THP work together to target specific areas. They can issue hundreds of tickets in a single day.' },
                { q: 'Got a ticket in a hotspot area — what should I do?', a: 'Upload your ticket to TaskForce Tickets. Our attorneys appear at 201 Poplar on your behalf and work to get your ticket dismissed. Flat fee starting at $100, no court appearance required, and a money-back guarantee.' },
                { q: 'Where does this data come from?', a: 'This data comes directly from the Memphis Data Hub (data.memphistn.gov), the City of Memphis\' official open data portal. It includes all recorded MPD traffic stops.' },
              ].map(({ q, a }) => (
                <div key={q} className="border border-[#E5E5E5] rounded-xl p-6 bg-white">
                  <h3 className="text-lg font-bold text-[#1A1A1A] mb-3">{q}</h3>
                  <p className="text-[#4A4A4A] leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-12">
          <div className="max-w-4xl mx-auto px-6">
            <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-6">Related Resources</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Link href="/memphis-task-force-ticket" className="block bg-white rounded-xl p-6 border border-[#E5E5E5] hover:border-[#FFD100] transition-colors">
                <h3 className="font-bold text-[#1A1A1A] mb-2">Memphis Task Force Ticket Guide →</h3>
                <p className="text-sm text-[#4A4A4A]">Everything you need to know about task force citations and how to get them dismissed.</p>
              </Link>
              <Link href="/201-poplar-guide" className="block bg-white rounded-xl p-6 border border-[#E5E5E5] hover:border-[#FFD100] transition-colors">
                <h3 className="font-bold text-[#1A1A1A] mb-2">201 Poplar Survival Guide →</h3>
                <p className="text-sm text-[#4A4A4A]">Parking, security, what to bring, and how to skip the trip entirely.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 bg-[#1A1A1A] text-white text-center">
          <div className="max-w-3xl mx-auto px-6">
            <h2 className="text-3xl font-extrabold mb-4">Don&apos;t Let a Traffic Ticket Cost You Thousands</h2>
            <p className="text-xl text-gray-300 mb-8">
              Upload your ticket, pay a flat fee, and our attorneys handle everything. No court appearance required.
            </p>
            <Link
              href="/intake"
              className="inline-flex items-center justify-center bg-[#FFD100] text-[#1A1A1A] px-10 py-5 rounded-xl text-xl font-bold hover:brightness-105 transition-all"
            >
              Submit Your Ticket Now →
            </Link>
            <p className="mt-4 text-gray-500 text-sm">Money-Back Guarantee · Flat Fee · No Court Required</p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
