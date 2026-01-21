import { Metadata } from 'next';
import TrafficReportClient from './TrafficReportClient';

export const metadata: Metadata = {
  title: 'Memphis Traffic Weather Report | Weekly Citation Data | TaskForce Tickets',
  description:
    'Weekly traffic enforcement report for Memphis and Shelby County. Track citation trends, enforcement hotspots, and court statistics. Stay informed and drive safely.',
  keywords: [
    'Memphis traffic report',
    'Shelby County citations',
    'traffic enforcement Memphis',
    'Memphis speeding tickets',
    'traffic court statistics',
    'Memphis police enforcement',
    'weekly traffic data',
    'Tennessee traffic citations',
  ],
  openGraph: {
    title: 'Memphis Traffic Weather Report | TaskForce Tickets',
    description:
      'Weekly traffic enforcement data for Memphis. Track citations, hotspots, and trends.',
    type: 'website',
    locale: 'en_US',
    siteName: 'TaskForce Tickets',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memphis Traffic Weather Report',
    description:
      'Weekly traffic enforcement data for Memphis. Track citations, hotspots, and trends.',
  },
};

export default function TrafficReportPage() {
  return <TrafficReportClient />;
}
