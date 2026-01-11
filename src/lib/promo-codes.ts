/**
 * Promo Code Utilities
 *
 * Calculate discounts and format promo code information
 */

export interface PromoCodeInfo {
  code: string;
  discountType: 'percentage' | 'fixed' | 'free';
  discountValue: number;
  description?: string;
}

/**
 * Calculate the final price after applying a promo code
 *
 * @param basePriceCents - Original price in cents
 * @param promo - Promo code information
 * @returns Final price in cents (minimum 0)
 */
export function calculateDiscountedPrice(basePriceCents: number, promo: PromoCodeInfo | null): number {
  if (!promo) {
    return basePriceCents;
  }

  switch (promo.discountType) {
    case 'free':
      return 0;

    case 'percentage':
      // discountValue is 0-100 representing percentage off
      const percentOff = Math.min(100, Math.max(0, promo.discountValue));
      return Math.round(basePriceCents * (1 - percentOff / 100));

    case 'fixed':
      // discountValue is in cents
      return Math.max(0, basePriceCents - promo.discountValue);

    default:
      return basePriceCents;
  }
}

/**
 * Calculate the discount amount in cents
 *
 * @param basePriceCents - Original price in cents
 * @param promo - Promo code information
 * @returns Discount amount in cents
 */
export function calculateDiscountAmount(basePriceCents: number, promo: PromoCodeInfo | null): number {
  if (!promo) {
    return 0;
  }

  const finalPrice = calculateDiscountedPrice(basePriceCents, promo);
  return basePriceCents - finalPrice;
}

/**
 * Format discount description for display
 *
 * @param promo - Promo code information
 * @returns Human-readable discount description
 */
export function formatDiscountDescription(promo: PromoCodeInfo): string {
  switch (promo.discountType) {
    case 'free':
      return 'Free submission';

    case 'percentage':
      return `${promo.discountValue}% off`;

    case 'fixed':
      return `$${(promo.discountValue / 100).toFixed(2)} off`;

    default:
      return promo.description || 'Discount applied';
  }
}

/**
 * Determine if promo makes the submission free
 *
 * @param basePriceCents - Original price in cents
 * @param promo - Promo code information
 * @returns True if final price is 0
 */
export function isFreeWithPromo(basePriceCents: number, promo: PromoCodeInfo | null): boolean {
  if (!promo) return false;
  return calculateDiscountedPrice(basePriceCents, promo) === 0;
}

/**
 * Validate promo code client-side before submission
 *
 * @param code - Promo code string
 * @param orderAmountCents - Optional order amount for minimum checks
 * @returns Promise with validation result
 */
export async function validatePromoCode(
  code: string,
  orderAmountCents?: number
): Promise<{
  valid: boolean;
  promo?: PromoCodeInfo;
  message?: string;
}> {
  try {
    const response = await fetch('/api/promo-codes/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, orderAmountCents }),
    });

    const result = await response.json();

    if (result.valid) {
      return {
        valid: true,
        promo: {
          code: result.code,
          discountType: result.discountType,
          discountValue: result.discountValue,
          description: result.description,
        },
      };
    }

    return {
      valid: false,
      message: result.message || 'Invalid promo code',
    };
  } catch (error) {
    console.error('Promo validation error:', error);
    return {
      valid: false,
      message: 'Failed to validate promo code',
    };
  }
}

/**
 * Redeem a promo code after case submission
 *
 * @param code - Promo code string
 * @param caseId - Case UUID
 * @param discountAppliedCents - Amount of discount applied
 * @returns Promise with success status
 */
export async function redeemPromoCode(
  code: string,
  caseId: string,
  discountAppliedCents: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/promo-codes/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, caseId, discountAppliedCents }),
    });

    return await response.json();
  } catch (error) {
    console.error('Promo redemption error:', error);
    return { success: false, error: 'Failed to redeem promo code' };
  }
}
