/**
 * LawPay (8am) Payment Processing Service
 *
 * Handles credit card, eCheck, and Pay Later financing through LawPay's API.
 * Pay Later allows customers to split payments over time with instant approval.
 */

const LAWPAY_API_URL = 'https://secure.lawpay.com/api/v1';

interface LawPayCredentials {
  secretKey: string;
  publicKey: string;
  accountId: string;
}

/**
 * Get LawPay credentials based on mode (test/live)
 */
function getCredentials(): LawPayCredentials {
  const secretKey = process.env.LAWPAY_SECRET_KEY;
  const publicKey = process.env.NEXT_PUBLIC_LAWPAY_PUBLIC_KEY;
  const accountId = process.env.LAWPAY_DEFAULT_ACCOUNT_ID;

  if (!secretKey || !publicKey || !accountId) {
    console.error('Missing LawPay credentials:', {
      hasSecretKey: !!secretKey,
      hasPublicKey: !!publicKey,
      hasAccountId: !!accountId
    });
    throw new Error('LawPay credentials not configured');
  }

  return { secretKey, publicKey, accountId };
}

/**
 * Get authorization header for API requests
 */
function getAuthHeader(): string {
  const { secretKey } = getCredentials();
  // LawPay uses Bearer token authentication
  return `Bearer ${secretKey}`;
}

// Result types
export interface ChargeResult {
  success: boolean;
  chargeId?: string;
  status?: string;
  error?: string;
}

export interface PaymentRequestResult {
  success: boolean;
  paymentRequestId?: string;
  paymentUrl?: string;
  error?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

export interface ChargeStatus {
  id: string;
  status: string;
  amount: number;
  method?: {
    type: string;
    last_four?: string;
  };
  created_at: string;
  error?: string;
}

/**
 * Create a charge using a payment token from hosted fields
 */
export async function createCharge(data: {
  amount: number; // in dollars
  tokenId: string;
  caseId: string;
  customerEmail: string;
  description: string;
}): Promise<ChargeResult> {
  try {
    const { accountId } = getCredentials();

    const response = await fetch(`${LAWPAY_API_URL}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        amount: Math.round(data.amount * 100), // Convert to cents
        account_id: accountId,
        method: data.tokenId,
        reference: data.caseId,
        description: data.description,
        email: data.customerEmail,
      }),
    });

    const result = await response.json();

    if (result.status === 'AUTHORIZED' || result.status === 'COMPLETED') {
      return { success: true, chargeId: result.id, status: result.status };
    }

    return { success: false, error: result.message || 'Payment failed' };
  } catch (error) {
    console.error('LawPay charge error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  }
}

/**
 * Create a payment request for hosted payment page or Pay Later
 * LawPay sends payment link via email and SMS
 */
export async function createPaymentRequest(data: {
  amount: number; // in dollars
  caseId: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  description: string;
  allowPayLater: boolean;
}): Promise<PaymentRequestResult> {
  try {
    const { accountId } = getCredentials();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://taskforcetickets.com';

    // Build payment methods array
    const paymentMethods: string[] = ['card', 'echeck'];
    if (data.allowPayLater && data.amount >= 150) {
      paymentMethods.push('pay_later');
    }

    const requestBody = {
      amount: Math.round(data.amount * 100), // Convert to cents
      account_id: accountId,
      email: data.customerEmail,
      name: data.customerName,
      phone: data.customerPhone,
      reference: data.caseId,
      description: data.description,
      payment_methods: paymentMethods,
      send_email: true,
      send_sms: !!data.customerPhone,
      redirect_uri: `${baseUrl}/payment/success?case=${data.caseId}`,
      cancel_uri: `${baseUrl}/payment/cancel?case=${data.caseId}`,
    };

    console.log('LawPay payment request URL:', `${LAWPAY_API_URL}/payment-requests`);
    console.log('LawPay payment request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${LAWPAY_API_URL}/payment-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log('LawPay response status:', response.status);
    console.log('LawPay response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      return {
        success: false,
        error: `LawPay API error (${response.status}): ${responseText}`,
      };
    }

    if (result.id) {
      return {
        success: true,
        paymentRequestId: result.id,
        paymentUrl: result.payment_uri,
      };
    }

    return {
      success: false,
      error: result.message || 'Failed to create payment request',
    };
  } catch (error) {
    console.error('LawPay payment request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create payment request',
    };
  }
}

/**
 * Process a refund for money-back guarantee
 */
export async function processRefund(
  chargeId: string,
  amount?: number // Optional partial refund amount in dollars
): Promise<RefundResult> {
  try {
    const response = await fetch(`${LAWPAY_API_URL}/charges/${chargeId}/refunds`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getAuthHeader(),
      },
      body: JSON.stringify({
        amount: amount ? Math.round(amount * 100) : undefined, // Full refund if no amount
      }),
    });

    const result = await response.json();

    if (result.status === 'COMPLETED' || result.status === 'PENDING') {
      return { success: true, refundId: result.id };
    }

    return { success: false, error: result.message || 'Refund failed' };
  } catch (error) {
    console.error('LawPay refund error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund processing failed',
    };
  }
}

/**
 * Get charge status and details
 */
export async function getChargeStatus(chargeId: string): Promise<ChargeStatus | null> {
  try {
    const response = await fetch(`${LAWPAY_API_URL}/charges/${chargeId}`, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('LawPay get charge error:', error);
    return null;
  }
}

/**
 * Get payment request status
 */
export async function getPaymentRequestStatus(
  paymentRequestId: string
): Promise<{ status: string; paid: boolean } | null> {
  try {
    const response = await fetch(
      `${LAWPAY_API_URL}/payment-requests/${paymentRequestId}`,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(),
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return {
      status: result.status,
      paid: result.status === 'PAID' || result.status === 'COMPLETED',
    };
  } catch (error) {
    console.error('LawPay get payment request error:', error);
    return null;
  }
}

/**
 * Get public key for client-side hosted fields
 */
export function getPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_LAWPAY_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error('LawPay public key not configured');
  }

  return publicKey;
}

/**
 * Check if Pay Later is available for an amount
 */
export function isPayLaterAvailable(amount: number): boolean {
  return amount >= 150; // $150 minimum for Pay Later
}
