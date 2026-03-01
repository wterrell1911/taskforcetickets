import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { GTMProvider } from '@/components/tracking/GTMProvider';
import { AttributionCapture } from '@/components/tracking/AttributionCapture';
import { TrackingProvider } from '@/components/tracking/TrackingProvider';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TaskForce Tickets | Memphis Traffic Defense',
  description:
    'Get your Memphis & Shelby County traffic ticket dismissed. Upload your citation, pay a flat fee, and let our experienced attorneys handle everything. Money-back guarantee.',
  keywords: [
    'memphis task force ticket',
    'traffic ticket lawyer Memphis',
    'Shelby County traffic ticket',
    'dismiss traffic ticket Tennessee',
    'Memphis speeding ticket attorney',
    'traffic defense Memphis',
    'memphis traffic ticket',
    'fight traffic ticket memphis',
    'traffic court memphis 201 poplar',
  ],
  verification: {
    google: 'google96f9008c159da05b',
  },
  openGraph: {
    title: 'TaskForce Tickets | Memphis Traffic Defense',
    description: 'Get your traffic ticket dismissed. Flat fee. Money-back guarantee.',
    type: 'website',
  },
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CALLRAIL_COMPANY_ID = process.env.NEXT_PUBLIC_CALLRAIL_COMPANY_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        {/* Google Tag Manager */}
        {GTM_ID && (
          <Script
            id="gtm-script"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${GTM_ID}');
              `,
            }}
          />
        )}
        
        {/* CallRail Dynamic Number Insertion */}
        {CALLRAIL_COMPANY_ID && (
          <Script
            src={`https://cdn.callrail.com/companies/${CALLRAIL_COMPANY_ID}/swap.js`}
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* Google Tag Manager (noscript) */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}
        <GTMProvider>
          <AttributionCapture />
          <TrackingProvider>
            {children}
          </TrackingProvider>
        </GTMProvider>
      </body>
    </html>
  );
}
