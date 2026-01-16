/**
 * POST /api/payments/stripe/create-intent
 *
 * Create a Stripe payment intent for a case
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { createPaymentIntent } from '@/lib/payments/stripe';

export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json(
        { success: false, error: 'Missing caseId' },
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

    // Create payment intent
    const result = await createPaymentIntent({
      amount: caseData.amount_charged, // Already in cents
      caseId,
      customerEmail: caseData.customer_email,
      description: `Traffic Ticket Defense - ${caseData.violation_description || 'Case ' + caseId.slice(0, 8)}`,
    });

    if (result.success) {
      // Store payment intent ID on the case
      await supabase
        .from('cases')
        .update({
          stripe_payment_intent_id: result.paymentIntentId,
        })
        .eq('id', caseId);

      return NextResponse.json({
        success: true,
        clientSecret: result.clientSecret,
      });
    }

    return NextResponse.json(
      { success: false, error: result.error },
      { status: 400 }
    );
  } catch (error) {
    console.error('Create payment intent error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
