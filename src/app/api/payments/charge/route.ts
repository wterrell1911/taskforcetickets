/**
 * POST /api/payments/charge
 *
 * Process a direct charge using LawPay hosted fields token
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { createCharge } from '@/lib/payments/lawpay';
import { sendSubmissionReceivedEmail } from '@/lib/emails/send-email';

export async function POST(request: NextRequest) {
  try {
    const { caseId, tokenId, amount } = await request.json();

    if (!caseId || !tokenId || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
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

    // Verify amount matches case
    const expectedAmount = caseData.amount_charged / 100; // Convert from cents
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Amount mismatch' },
        { status: 400 }
      );
    }

    // Process charge
    const result = await createCharge({
      amount,
      tokenId,
      caseId,
      customerEmail: caseData.customer_email,
      description: `Traffic Ticket Defense - ${caseData.violation_description || 'Case ' + caseId.slice(0, 8)}`,
    });

    if (result.success) {
      // Update case with payment info
      await supabase
        .from('cases')
        .update({
          payment_status: 'succeeded',
          lawpay_charge_id: result.chargeId,
          lawpay_payment_method: 'card',
          paid_at: new Date().toISOString(),
        })
        .eq('id', caseId);

      // Send confirmation email
      try {
        await sendSubmissionReceivedEmail({
          to: caseData.customer_email,
          customerName: caseData.customer_name,
          caseId: caseId.slice(0, 8).toUpperCase(),
          courtDate: caseData.court_date
            ? new Date(caseData.court_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'TBD',
          offenseType: caseData.violation_description || caseData.offense_tier,
          amountCharged: caseData.amount_charged,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't fail the payment if email fails
      }

      return NextResponse.json({
        success: true,
        chargeId: result.chargeId,
      });
    }

    // Payment failed - update case
    await supabase
      .from('cases')
      .update({
        payment_status: 'failed',
        payment_failure_reason: result.error,
      })
      .eq('id', caseId);

    return NextResponse.json(
      { success: false, error: result.error || 'Payment failed' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Payment charge error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
