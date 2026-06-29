import { NextRequest, NextResponse } from 'next/server';
import { getZoneAnalysis } from '@/lib/db/enforcement-store';

export async function GET(request: NextRequest) {
  const days = parseInt(request.nextUrl.searchParams.get('days') || '90');

  try {
    const zones = await getZoneAnalysis(days);

    // Generate CSV
    const headers = ['Zone', 'Enforcement Volume', 'Intake Volume', 'Conversion %', 'Opportunity Score'];
    const rows = zones.map(z => [
      z.zone,
      z.enforcementVolume.toString(),
      z.intakeVolume.toString(),
      z.conversionRate.toString(),
      z.opportunityScore.toString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="zone-analysis-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
