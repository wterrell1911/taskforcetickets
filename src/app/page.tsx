import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/landing/Hero';
import { PointsExplainer } from '@/components/landing/PointsExplainer';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Pricing } from '@/components/landing/Pricing';
import { Guarantee } from '@/components/landing/Guarantee';
import { CTA } from '@/components/landing/CTA';

export default function Home() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        <Hero />
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
