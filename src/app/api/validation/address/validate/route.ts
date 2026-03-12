/**
 * POST /api/validation/address/validate
 * Validate address and return county information
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateAddress } from '@/lib/validation/address-validator';

export async function POST(request: NextRequest) {
  try {
    const { street, city, state, zipCode } = await request.json();

    if (!street) {
      return NextResponse.json(
        { success: false, error: 'Street address is required' },
        { status: 400 }
      );
    }

    const result = await validateAddress(street, city, state, zipCode);

    return NextResponse.json({
      success: result.valid,
      valid: result.valid,
      address: result.address ? {
        deliveryLine1: result.address.deliveryLine1,
        deliveryLine2: result.address.deliveryLine2,
        city: result.address.city,
        state: result.address.state,
        zipCode: result.address.zipCode,
        county: result.address.county,
        latitude: result.address.latitude,
        longitude: result.address.longitude,
      } : undefined,
      error: result.error,
      errorCode: result.errorCode,
    });
  } catch (error) {
    console.error('Address validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
