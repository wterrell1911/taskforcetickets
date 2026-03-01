import { NextRequest, NextResponse } from 'next/server';
import { addManualEntryBatch, getManualEntryBatches } from '@/lib/db/store';

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get('source') as 'shelby_county' | 'thp' | undefined;

  try {
    const batches = await getManualEntryBatches(source || undefined);
    return NextResponse.json({ batches });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch batches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const batch = await addManualEntryBatch({
      source: body.source,
      dateRangeStart: body.dateRangeStart,
      dateRangeEnd: body.dateRangeEnd,
      totalCitations: body.totalCitations,
      topViolations: body.topViolations || [],
      agencyBreakdown: body.agencyBreakdown || [],
      notes: body.notes,
      enteredBy: body.enteredBy || 'admin',
    });

    return NextResponse.json({ success: true, batch });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create batch' },
      { status: 500 }
    );
  }
}
