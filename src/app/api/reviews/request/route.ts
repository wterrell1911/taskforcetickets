/**
 * API Route: Send Review Request
 * POST /api/reviews/request
 * 
 * Triggers a review request for a dismissed case
 */

import { NextRequest, NextResponse } from 'next/server';
import { createReviewRequest, sendInitialReviewRequest } from '@/lib/reviews/service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, customerName, customerPhone, customerEmail } = body;

    // Validate required fields
    if (!caseId || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: caseId, customerName, customerPhone' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic check)
    const phoneDigits = customerPhone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      return NextResponse.json(
        { error: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Create the review request record
    const createResult = await createReviewRequest(
      caseId,
      customerName,
      customerPhone,
      customerEmail
    );

    if (!createResult.success) {
      return NextResponse.json(
        { error: createResult.error },
        { status: 400 }
      );
    }

    // Send the initial SMS
    const sendResult = await sendInitialReviewRequest(createResult.requestId!);

    if (!sendResult.success) {
      return NextResponse.json(
        { 
          error: 'Review request created but SMS failed to send',
          requestId: createResult.requestId,
          smsError: sendResult.error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      requestId: createResult.requestId,
      message: 'Review request sent successfully'
    });

  } catch (error) {
    console.error('Review request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
