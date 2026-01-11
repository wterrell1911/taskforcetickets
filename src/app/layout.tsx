import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
    'traffic ticket lawyer Memphis',
    'Shelby County traffic ticket',
    'dismiss traffic ticket Tennessee',
    'Memphis speeding ticket attorney',
    'traffic defense Memphis',
  ],
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
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
