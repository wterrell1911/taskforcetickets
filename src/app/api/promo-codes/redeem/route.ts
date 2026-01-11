import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * POST /api/promo-codes/redeem
 * Redeem a promo code for a case (increment usage counter)
 * Called during case submission when promo is applied
 */
export async function POST(request: NextRequest) {
  try {
    const { code, caseId, discountAppliedCents } = await request.json();

    if (!code || !caseId) {
      return NextResponse.json(
        { success: false, error: 'Code and caseId are required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();

    // Get promo code
    const { data: promo, error: fetchError } = await supabase
      .from('promo_codes')
      .select('id, current_uses, max_uses')
      .eq('code', code.toUpperCase().trim())
      .eq('active', true)
      .single();

    if (fetchError || !promo) {
      return NextResponse.json(
        { success: false, error: 'Invalid promo code' },
        { status: 400 }
      );
    }

    // Check if still has uses available
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return NextResponse.json(
        { success: false, error: 'Promo code has reached maximum uses' },
        { status: 400 }
      );
    }

    // Increment usage counter
    const { error: updateError } = await supabase
      .from('promo_codes')
      .update({
        current_uses: promo.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', promo.id);

    if (updateError) {
      console.error('Failed to update promo usage:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to redeem promo code' },
        { status: 500 }
      );
    }

    // Record usage
    await supabase.from('promo_code_usages').insert({
      promo_code_id: promo.id,
      case_id: caseId,
      discount_applied_cents: discountAppliedCents || 0,
    });

    // Update case with promo info
    await supabase
      .from('cases')
      .update({
        promo_code_id: promo.id,
        promo_discount_cents: discountAppliedCents || 0,
      })
      .eq('id', caseId);

    return NextResponse.json({
      success: true,
      message: 'Promo code redeemed successfully',
    });
  } catch (error) {
    console.error('Promo code redemption error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to redeem promo code' },
      { status: 500 }
    );
  }
}
