import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/db/supabase';

const AUTH_COOKIE_NAME = 'tft_admin_auth';
const REVIEW_INCENTIVE_AMOUNT = 500; // $5.00 in cents

/**
 * Verify admin authentication
 */
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * POST /api/admin/cases/[id]/review-incentive
 * Mark review as received and process $5 refund
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getAdminClient();

  // Get case data
  const { data: caseData, error: fetchError } = await supabase
    .from('cases')
    .select('id, status, stripe_payment_intent_id, review_incentive_paid')
    .eq('id', id)
    .single();

  if (fetchError || !caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  // Verify case is dismissed
  if (caseData.status !== 'dismissed') {
    return NextResponse.json(
      { error: 'Review incentive only available for dismissed cases' },
      { status: 400 }
    );
  }

  // Check if already paid
  if (caseData.review_incentive_paid) {
    return NextResponse.json(
      { error: 'Review incentive already processed' },
      { status: 400 }
    );
  }

  try {
    // Process refund via Stripe
    // TODO: Implement Stripe refund
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    // await stripe.refunds.create({
    //   payment_intent: caseData.stripe_payment_intent_id,
    //   amount: REVIEW_INCENTIVE_AMOUNT,
    //   reason: 'requested_by_customer',
    // });

    // For now, just mark as paid (implement Stripe integration later)
    const now = new Date().toISOString();

    await supabase
      .from('cases')
      .update({
        review_submitted_at: now,
        review_incentive_paid: true,
        review_incentive_paid_at: now,
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: `Review incentive of $${REVIEW_INCENTIVE_AMOUNT / 100} processed`,
    });
  } catch (error) {
    console.error('Failed to process review incentive:', error);
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/cases/[id]/review-incentive
 * Get review incentive status for a case
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getAdminClient();

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('id, status, review_requested_at, review_submitted_at, review_incentive_paid, review_incentive_paid_at')
    .eq('id', id)
    .single();

  if (error || !caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  return NextResponse.json({
    eligible: caseData.status === 'dismissed',
    reviewRequested: !!caseData.review_requested_at,
    reviewSubmitted: !!caseData.review_submitted_at,
    incentivePaid: caseData.review_incentive_paid,
    incentivePaidAt: caseData.review_incentive_paid_at,
    incentiveAmount: REVIEW_INCENTIVE_AMOUNT,
  });
}
