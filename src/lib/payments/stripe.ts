/**
 * Stripe Payment Processing Service
 */

import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia',
    });
  }
  return stripeInstance;
}

export interface CreatePaymentIntentResult {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface ConfirmPaymentResult {
  success: boolean;
  chargeId?: string;
  status?: string;
  error?: string;
}

/**
 * Create a payment intent for the given amount
 */
export async function createPaymentIntent(data: {
  amount: number; // in cents
  caseId: string;
  customerEmail: string;
  description: string;
}): Promise<CreatePaymentIntentResult> {
  try {
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: data.amount,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        caseId: data.caseId,
      },
      receipt_email: data.customerEmail,
      description: data.description,
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret || undefined,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Stripe create payment intent error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment intent',
    };
  }
}

/**
 * Retrieve a payment intent to check its status
 */
export async function getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent | null> {
  try {
    const stripe = getStripe();
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (error) {
    console.error('Stripe get payment intent error:', error);
    return null;
  }
}

/**
 * Process a refund
 */
export async function processRefund(
  paymentIntentId: string,
  amount?: number // Optional partial refund amount in cents
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const stripe = getStripe();

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount, // undefined = full refund
    });

    return {
      success: refund.status === 'succeeded' || refund.status === 'pending',
      refundId: refund.id,
    };
  } catch (error) {
    console.error('Stripe refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    };
  }
}
