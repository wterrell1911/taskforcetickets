import { NextRequest, NextResponse } from 'next/server';
import {
  getEnforcementRecords,
  getIntakeAnalytics,
  getZoneAnalysis,
  getTrendData,
  getOffenseDistribution,
} from '@/lib/db/store';

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const days = parseInt(request.nextUrl.searchParams.get('days') || '90');

  try {
    switch (type) {
      case 'zones': {
        const data = await getZoneAnalysis(days);
        return NextResponse.json({ data });
      }

      case 'trends': {
        const groupBy = (request.nextUrl.searchParams.get('groupBy') as 'day' | 'week') || 'day';
        const data = await getTrendData(days, groupBy);
        return NextResponse.json({ data });
      }

      case 'distribution': {
        const data = await getOffenseDistribution();
        return NextResponse.json({ data });
      }

      case 'enforcement': {
        const source = request.nextUrl.searchParams.get('source') || undefined;
        const zone = request.nextUrl.searchParams.get('zone') || undefined;
        const data = await getEnforcementRecords({ source, zone });
        return NextResponse.json({ data, count: data.length });
      }

      case 'intake': {
        const zone = request.nextUrl.searchParams.get('zone') || undefined;
        const data = await getIntakeAnalytics({ zone });
        return NextResponse.json({ data, count: data.length });
      }

      case 'summary': {
        const [enforcement, intake, zones] = await Promise.all([
          getEnforcementRecords(),
          getIntakeAnalytics(),
          getZoneAnalysis(days),
        ]);

        return NextResponse.json({
          summary: {
            totalEnforcement: enforcement.length,
            totalIntake: intake.length,
            topOpportunityZones: zones.slice(0, 5),
            overallConversionRate:
              enforcement.length > 0
                ? ((intake.length / enforcement.length) * 100).toFixed(2)
                : 0,
          },
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
