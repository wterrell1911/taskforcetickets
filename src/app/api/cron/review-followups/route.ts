/**
 * Cron Job: Review Follow-ups
 * GET /api/cron/review-followups
 * 
 * Runs daily to send follow-up review requests
 * Day 3: First follow-up
 * Day 7: Final follow-up
 * 
 * Set up in Vercel: daily at 10am CST
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  getPendingFollowups, 
  sendFollowup1, 
  sendFollowup2 
} from '@/lib/reviews/service';

// Verify cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { followup1Due, followup2Due } = await getPendingFollowups();
    
    const results = {
      followup1: { attempted: 0, success: 0, failed: 0 },
      followup2: { attempted: 0, success: 0, failed: 0 },
    };

    // Send Day 3 follow-ups
    for (const request of followup1Due) {
      results.followup1.attempted++;
      const result = await sendFollowup1(request.id);
      if (result.success) {
        results.followup1.success++;
      } else {
        results.followup1.failed++;
        console.error(`Followup1 failed for ${request.id}:`, result.error);
      }
    }

    // Send Day 7 follow-ups
    for (const request of followup2Due) {
      results.followup2.attempted++;
      const result = await sendFollowup2(request.id);
      if (result.success) {
        results.followup2.success++;
      } else {
        results.followup2.failed++;
        console.error(`Followup2 failed for ${request.id}:`, result.error);
      }
    }

    console.log('Review followup cron completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    console.error('Review followup cron error:', error);
    return NextResponse.json(
      { error: 'Cron job failed' },
      { status: 500 }
    );
  }
}
