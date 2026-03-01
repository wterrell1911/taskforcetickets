import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

export interface PromoCodeValidation {
  valid: boolean;
  code?: string;
  discountType?: 'percentage' | 'fixed' | 'free';
  discountValue?: number;
  description?: string;
  message?: string;
}

interface PromoCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  min_order_cents: number;
  active: boolean;
}

// Hardcoded promo codes (for testing or special codes that bypass database)
const HARDCODED_PROMOS: Record<string, { discountType: 'percentage' | 'fixed' | 'free'; discountValue: number; description: string }> = {
  'FDO': { discountType: 'free', discountValue: 0, description: 'Friends & Family - Free Service' },
};

/**
 * POST /api/promo-codes/validate
 * Validate a promo code and return discount info
 */
export async function POST(request: NextRequest) {
  try {
    const { code, orderAmountCents } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json<PromoCodeValidation>({
        valid: false,
        message: 'Promo code is required',
      });
    }

    const normalizedCode = code.toUpperCase().trim();

    // Check hardcoded promos first
    if (HARDCODED_PROMOS[normalizedCode]) {
      const hardcoded = HARDCODED_PROMOS[normalizedCode];
      return NextResponse.json<PromoCodeValidation>({
        valid: true,
        code: normalizedCode,
        discountType: hardcoded.discountType,
        discountValue: hardcoded.discountValue,
        description: hardcoded.description,
      });
    }

    const supabase = getAdminClient();

    // Fetch promo code
    const { data: promo, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .single();

    if (error || !promo) {
      return NextResponse.json<PromoCodeValidation>({
        valid: false,
        message: 'Invalid promo code',
      });
    }

    const promoData = promo as PromoCode;

    // Check if code is within valid date range
    const now = new Date();

    if (promoData.valid_from && new Date(promoData.valid_from) > now) {
      return NextResponse.json<PromoCodeValidation>({
        valid: false,
        message: 'This promo code is not yet active',
      });
    }

    if (promoData.valid_until && new Date(promoData.valid_until) < now) {
      return NextResponse.json<PromoCodeValidation>({
        valid: false,
        message: 'This promo code has expired',
      });
    }

    // Check max uses
    if (promoData.max_uses !== null && promoData.current_uses >= promoData.max_uses) {
      return NextResponse.json<PromoCodeValidation>({
        valid: false,
        message: 'This promo code has reached its maximum number of uses',
      });
    }

    // Check minimum order amount
    if (orderAmountCents && promoData.min_order_cents > 0) {
      if (orderAmountCents < promoData.min_order_cents) {
        return NextResponse.json<PromoCodeValidation>({
          valid: false,
          message: `Minimum order of $${(promoData.min_order_cents / 100).toFixed(2)} required for this promo`,
        });
      }
    }

    // Valid promo code
    return NextResponse.json<PromoCodeValidation>({
      valid: true,
      code: promoData.code,
      discountType: promoData.discount_type,
      discountValue: promoData.discount_value,
      description: promoData.description || undefined,
    });
  } catch (error) {
    console.error('Promo code validation error:', error);
    return NextResponse.json<PromoCodeValidation>(
      {
        valid: false,
        message: 'Failed to validate promo code',
      },
      { status: 500 }
    );
  }
}
