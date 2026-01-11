import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

interface CitationData {
  scrapedAt: string;
  source: 'ijow';
  trafficCitations: {
    week: string;
    year: number;
    agency: string;
    count: number;
  }[];
  summary: {
    totalTHP: number;
    totalSheriff: number;
    dateRange: {
      start: string;
      end: string;
    };
    byMonth: Record<string, { thp: number; sheriff: number }>;
  };
}

/**
 * GET /api/admin/shelby-citations
 * Returns scraped Shelby County citation data (THP + Sheriff)
 */
export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'ijow-citations.json');
    const raw = await fs.readFile(dataPath, 'utf-8');
    const data: CitationData = JSON.parse(raw);

    // Calculate additional stats
    const weeklyData = data.trafficCitations.reduce((acc, c) => {
      if (!acc[c.week]) {
        acc[c.week] = { week: c.week, thp: 0, sheriff: 0, total: 0 };
      }
      if (c.agency.toLowerCase().includes('highway') || c.agency.toLowerCase().includes('thp')) {
        acc[c.week].thp += c.count;
      } else {
        acc[c.week].sheriff += c.count;
      }
      acc[c.week].total += c.count;
      return acc;
    }, {} as Record<string, { week: string; thp: number; sheriff: number; total: number }>);

    const weeklyArray = Object.values(weeklyData).sort((a, b) => a.week.localeCompare(b.week));

    // Monthly aggregation
    const monthlyData = Object.entries(data.summary.byMonth)
      .map(([month, counts]) => ({
        month,
        thp: counts.thp,
        sheriff: counts.sheriff,
        total: counts.thp + counts.sheriff,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return NextResponse.json({
      scrapedAt: data.scrapedAt,
      source: data.source,
      summary: {
        totalTHP: data.summary.totalTHP,
        totalSheriff: data.summary.totalSheriff,
        totalCombined: data.summary.totalTHP + data.summary.totalSheriff,
        dateRange: data.summary.dateRange,
        weekCount: weeklyArray.length,
      },
      weekly: weeklyArray,
      monthly: monthlyData,
    });
  } catch (error) {
    // No data file yet
    return NextResponse.json({
      error: 'No Shelby County data available. Run the scraper first.',
      scrapedAt: null,
      summary: null,
      weekly: [],
      monthly: [],
    });
  }
}
