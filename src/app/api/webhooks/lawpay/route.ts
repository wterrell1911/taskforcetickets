/**
 * POST /api/webhooks/lawpay
 *
 * Webhook handler for LawPay payment events
 * Handles charge completion, payment request completion, and refunds
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { sendSubmissionReceivedEmail } from '@/lib/emails/send-email';

// LawPay webhook event types
interface LawPayWebhookEvent {
  type: string;
  data: {
    id: string;
    reference?: string;
    status?: string;
    amount?: number;
    method?: {
      type: string;
      last_four?: string;
    };
    failure_message?: string;
    created_at?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const event: LawPayWebhookEvent = await request.json();

    console.log('LawPay webhook received:', event.type, event.data?.id);

    switch (event.type) {
      case 'charge.completed':
      case 'transaction.completed':
        await handlePaymentCompleted(event.data);
        break;

      case 'charge.failed':
      case 'transaction.failed':
        await handlePaymentFailed(event.data);
        break;

      case 'refund.completed':
        await handleRefundCompleted(event.data);
        break;

      case 'payment_request.completed':
      case 'payment_request.paid':
        await handlePaymentRequestCompleted(event.data);
        break;

      default:
        console.log('Unhandled webhook event type:', event.type);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('LawPay webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentCompleted(data: LawPayWebhookEvent['data']) {
  const caseId = data.reference;
  if (!caseId) {
    console.log('No case reference in payment completed event');
    return;
  }

  const supabase = getAdminClient();

  // Update case
  const { data: caseData, error } = await supabase
    .from('cases')
    .update({
      payment_status: 'succeeded',
      lawpay_charge_id: data.id,
      lawpay_payment_method: data.method?.type || 'card',
      paid_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update case for payment:', error);
    return;
  }

  // Send confirmation email
  if (caseData) {
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
    }
  }

  console.log('Payment completed for case:', caseId);
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(data: LawPayWebhookEvent['data']) {
  const caseId = data.reference;
  if (!caseId) {
    console.log('No case reference in payment failed event');
    return;
  }

  const supabase = getAdminClient();

  await supabase
    .from('cases')
    .update({
      payment_status: 'failed',
      payment_failure_reason: data.failure_message || 'Payment declined',
    })
    .eq('id', caseId);

  console.log('Payment failed for case:', caseId);
}

/**
 * Handle refund completion
 */
async function handleRefundCompleted(data: LawPayWebhookEvent['data']) {
  const caseId = data.reference;
  if (!caseId) {
    console.log('No case reference in refund completed event');
    return;
  }

  const supabase = getAdminClient();

  await supabase
    .from('cases')
    .update({
      payment_status: 'refunded',
      lawpay_refund_id: data.id,
      refund_issued_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  console.log('Refund completed for case:', caseId);
}

/**
 * Handle payment request completion (hosted page / Pay Later)
 */
async function handlePaymentRequestCompleted(data: LawPayWebhookEvent['data']) {
  const caseId = data.reference;
  if (!caseId) {
    console.log('No case reference in payment request completed event');
    return;
  }

  const supabase = getAdminClient();

  // Update case
  const { data: caseData, error } = await supabase
    .from('cases')
    .update({
      payment_status: 'succeeded',
      paid_at: new Date().toISOString(),
    })
    .eq('id', caseId)
    .select()
    .single();

  if (error) {
    console.error('Failed to update case for payment request:', error);
    return;
  }

  // Send confirmation email
  if (caseData) {
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
    }
  }

  console.log('Payment request completed for case:', caseId);
}
