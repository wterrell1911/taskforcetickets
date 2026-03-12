/**
 * POST /api/payments/stripe/confirm
 *
 * Confirm payment was successful and update case
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { getPaymentIntent } from '@/lib/payments/stripe';
import { sendSubmissionReceivedEmail } from '@/lib/emails/send-email';
import { createServiceAgreement } from '@/lib/pandadoc';

export async function POST(request: NextRequest) {
  try {
    const { caseId, paymentIntentId } = await request.json();

    if (!caseId || !paymentIntentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify payment was successful
    const paymentIntent = await getPaymentIntent(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { success: false, error: `Payment not completed: ${paymentIntent.status}` },
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

    // Update case with payment info
    await supabase
      .from('cases')
      .update({
        payment_status: 'succeeded',
        stripe_payment_intent_id: paymentIntentId,
        stripe_charge_id: paymentIntent.latest_charge as string,
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

    // Generate and send service agreement via PandaDoc
    try {
      // Parse customer name into first/last
      const nameParts = (caseData.customer_name || '').trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

      const agreementResult = await createServiceAgreement({
        caseId,
        customerName: caseData.customer_name,
        customerFirstName: firstName,
        customerLastName: lastName,
        customerEmail: caseData.customer_email,
        customerPhone: caseData.customer_phone || '',
        customerAddress: caseData.customer_address_encrypted || undefined,
        courtDate: caseData.court_date,
        courtJurisdiction: caseData.court_jurisdiction || '',
        courtLocation: caseData.court_location || undefined,
        offenseDescription: caseData.violation_description || caseData.offense_tier || 'Traffic Violation',
        amountCharged: caseData.amount_charged,
        ticketNumber: caseData.citation_number || undefined,
      });

      if (agreementResult.success && agreementResult.documentId) {
        // Update case with PandaDoc document ID
        await supabase
          .from('cases')
          .update({
            pandadoc_document_id: agreementResult.documentId,
            pandadoc_status: 'sent',
            agreement_sent_at: new Date().toISOString(),
          })
          .eq('id', caseId);

        console.log(`Service agreement sent for case ${caseId}: ${agreementResult.documentId}`);
      } else {
        console.error('Failed to create service agreement:', agreementResult.error);
      }
    } catch (pandadocError) {
      console.error('Failed to generate service agreement:', pandadocError);
      // Don't fail the payment if PandaDoc fails - can be resent manually
    }

    return NextResponse.json({
      success: true,
      chargeId: paymentIntent.latest_charge,
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
