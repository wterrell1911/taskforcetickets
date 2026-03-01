/**
 * API Route: Review Request Stats
 * GET /api/reviews/stats
 * 
 * Returns review request statistics for admin dashboard
 */

import { NextResponse } from 'next/server';
import { getReviewStats } from '@/lib/reviews/service';

export async function GET() {
  try {
    const stats = await getReviewStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Review stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review stats' },
      { status: 500 }
    );
  }
}
