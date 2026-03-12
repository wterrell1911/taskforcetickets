/**
 * POST /api/validation/email
 * Validate email address (blocks disposable emails)
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateEmail } from '@/lib/validation/email-validator';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const result = await validateEmail(email);

    return NextResponse.json({
      success: result.valid,
      valid: result.valid,
      error: result.error,
      errorCode: result.errorCode,
      suggestion: result.suggestion,
      isDisposable: result.isDisposable,
    });
  } catch (error) {
    console.error('Email validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
