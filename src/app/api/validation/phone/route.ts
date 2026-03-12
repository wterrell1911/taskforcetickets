/**
 * POST /api/validation/phone
 * Validate phone number and detect line type
 */

import { NextRequest, NextResponse } from 'next/server';
import { validatePhone } from '@/lib/validation/phone-validator';

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    if (!phone) {
      return NextResponse.json(
        { success: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const result = await validatePhone(phone);

    return NextResponse.json({
      success: result.valid,
      valid: result.valid,
      formatted: result.formatted,
      lineType: result.lineType,
      carrier: result.carrier,
      location: result.location,
      error: result.error,
      errorCode: result.errorCode,
    });
  } catch (error) {
    console.error('Phone validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
