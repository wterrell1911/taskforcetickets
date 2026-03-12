/**
 * POST /api/validation/contact
 * Validate all contact fields (email, phone, address) in one request
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateContact } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const { email, phone, address } = await request.json();

    if (!email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Email and phone are required' },
        { status: 400 }
      );
    }

    const result = await validateContact(
      email,
      phone,
      address ? {
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
      } : undefined
    );

    return NextResponse.json({
      success: result.valid,
      valid: result.valid,
      errors: result.errors,
      data: result.data,
    });
  } catch (error) {
    console.error('Contact validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Validation failed' },
      { status: 500 }
    );
  }
}
