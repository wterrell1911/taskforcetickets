/**
 * POST /api/payments/create-request
 *
 * Create a LawPay payment request for hosted payment page / Pay Later
 * LawPay sends the payment link via email and SMS
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { createPaymentRequest, isPayLaterAvailable } from '@/lib/payments/lawpay';

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

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

    // Check if already paid
    if (caseData.payment_status === 'succeeded') {
      return NextResponse.json(
        { success: false, error: 'Case already paid' },
        { status: 400 }
      );
    }

    const amount = caseData.amount_charged / 100; // Convert from cents

    // Create payment request
    const result = await createPaymentRequest({
      amount,
      caseId: caseData.id,
      customerEmail: caseData.customer_email,
      customerName: caseData.customer_name,
      customerPhone: caseData.customer_phone,
      description: `Traffic Ticket Defense - Case ${caseData.id.slice(0, 8).toUpperCase()}`,
      allowPayLater: isPayLaterAvailable(amount),
    });

    if (result.success) {
      // Update case with payment request ID
      await supabase
        .from('cases')
        .update({
          lawpay_payment_request_id: result.paymentRequestId,
        })
        .eq('id', caseId);

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentRequestId: result.paymentRequestId,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error || 'Failed to create payment request' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create payment request error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
