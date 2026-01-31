import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { Stats } from '@/components/landing/Stats';
import { PointsExplainer } from '@/components/landing/PointsExplainer';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { Guarantee } from '@/components/landing/Guarantee';
import { CTA } from '@/components/landing/CTA';

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LegalService',
  name: 'TaskForce Tickets',
  description: 'Memphis traffic ticket defense. Upload your ticket, pay a flat fee, and our experienced attorneys handle the rest. No court appearance required. Money-back guarantee.',
  url: 'https://www.taskforcetickets.com',
  areaServed: [
    { '@type': 'City', name: 'Memphis', containedInPlace: { '@type': 'State', name: 'Tennessee' } },
    { '@type': 'AdministrativeArea', name: 'Shelby County' },
  ],
  serviceType: ['Traffic Ticket Defense', 'Speeding Ticket Dismissal', 'Traffic Court Representation'],
  priceRange: '$100-$500',
  openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'], opens: '00:00', closes: '23:59' },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Traffic Ticket Defense Services',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Minor Violation Defense' }, price: '100', priceCurrency: 'USD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Standard Violation Defense' }, price: '200', priceCurrency: 'USD' },
      { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Major Violation Defense' }, price: '500', priceCurrency: 'USD' },
    ],
  },
};

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <Header />
      <main className="min-h-screen bg-white">
        <Hero />
        <Stats />
        <PointsExplainer />
        <HowItWorks />
        <Pricing />
        <Guarantee />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
