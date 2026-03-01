/**
 * POST /api/payments/refund
 *
 * Process a refund for money-back guarantee cases
 * Only accessible by admins
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient } from '@/lib/db/supabase';
import { processRefund } from '@/lib/payments/lawpay';

const AUTH_COOKIE_NAME = 'tft_admin_auth';

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

export async function POST(request: NextRequest) {
  // Verify admin access
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { caseId, amount } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Case ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get case data
    const { data: caseData, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('id', caseId)
      .single();

    if (fetchError || !caseData) {
      return NextResponse.json(
        { success: false, error: 'Case not found' },
        { status: 404 }
      );
    }

    // Check if charge exists
    if (!caseData.lawpay_charge_id) {
      return NextResponse.json(
        { success: false, error: 'No charge found for this case' },
        { status: 400 }
      );
    }

    // Check if already refunded
    if (caseData.lawpay_refund_id) {
      return NextResponse.json(
        { success: false, error: 'Case already refunded' },
        { status: 400 }
      );
    }

    // Check if eligible for refund (money-back guarantee)
    if (!caseData.money_back_eligible) {
      return NextResponse.json(
        { success: false, error: 'Case not eligible for money-back guarantee' },
        { status: 400 }
      );
    }

    // Process refund
    const refundAmount = amount || caseData.amount_charged / 100;
    const result = await processRefund(caseData.lawpay_charge_id, refundAmount);

    if (result.success) {
      // Update case with refund info
      await supabase
        .from('cases')
        .update({
          payment_status: 'refunded',
          lawpay_refund_id: result.refundId,
          refund_issued_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      // Log status change
      await supabase.from('case_status_history').insert({
        case_id: caseId,
        old_status: caseData.status,
        new_status: 'refunded',
        changed_by: 'admin',
        notes: `Refund processed: $${refundAmount.toFixed(2)}`,
      });

      return NextResponse.json({
        success: true,
        refundId: result.refundId,
        amount: refundAmount,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Refund failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Refund error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
