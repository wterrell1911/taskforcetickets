/**
 * POST /api/webhooks/stripe
 *
 * Handle Stripe webhook events for async payment confirmations
 * (Klarna, Afterpay, etc. complete asynchronously)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminClient } from '@/lib/db/supabase';

// Lazy-load Stripe to avoid build-time errors when env vars aren't available
let stripe: Stripe | null = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripe;
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !webhookSecret) {
    console.error('Missing stripe signature or webhook secret');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  const stripeClient = getStripe();
  if (!stripeClient) {
    console.error('Stripe not configured');
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getAdminClient();

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const caseId = paymentIntent.metadata?.caseId;

      if (caseId) {
        console.log(`Payment succeeded for case ${caseId}`);

        await supabase
          .from('cases')
          .update({
            payment_status: 'succeeded',
            stripe_payment_intent_id: paymentIntent.id,
            stripe_charge_id: paymentIntent.latest_charge as string,
            paid_at: new Date().toISOString(),
          })
          .eq('id', caseId);
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const caseId = paymentIntent.metadata?.caseId;

      if (caseId) {
        console.log(`Payment failed for case ${caseId}`);

        await supabase
          .from('cases')
          .update({
            payment_status: 'failed',
            payment_failure_reason:
              paymentIntent.last_payment_error?.message || 'Payment failed',
          })
          .eq('id', caseId);
      }
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object as Stripe.Charge;
      const paymentIntentId = charge.payment_intent as string;

      if (paymentIntentId) {
        console.log(`Refund processed for payment ${paymentIntentId}`);

        await supabase
          .from('cases')
          .update({
            payment_status: 'refunded',
            refunded_at: new Date().toISOString(),
          })
          .eq('stripe_payment_intent_id', paymentIntentId);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
