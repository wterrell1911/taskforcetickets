import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-SZHXZQ7Q93"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              analytics_storage: 'granted',
              ad_storage: 'granted',
            });
            gtag('config', 'G-SZHXZQ7Q93');
          `}
        </Script>
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
