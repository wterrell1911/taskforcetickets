import { OffenseCategory, PricingTier } from '@/types';

// All prices are stored in CENTS to match database schema
export const PRICING_TIERS: PricingTier[] = [
  // $100 Tier - Minor/Simple Violations
  {
    category: 'minor',
    label: 'Minor Violation',
    description: 'Speeding under 15 mph over, seatbelt, expired tags, equipment violations',
    price: 10000, // $100.00 in cents
    dismissible: true,
    moneyBackGuarantee: true,
  },
  // $150 Tier - Standard Violations
  {
    category: 'standard',
    label: 'Standard Violation',
    description: 'Speeding 15-29 mph over, no proof of insurance, expired license',
    price: 15000, // $150.00 in cents
    dismissible: true,
    moneyBackGuarantee: true,
  },
  // $300 Tier - Major Violations
  {
    category: 'major',
    label: 'Major Violation',
    description: 'Speeding 30+ mph over, reckless driving, other serious moving violations',
    price: 30000, // $300.00 in cents
    dismissible: true,
    moneyBackGuarantee: false,
  },
  // Non-dismissible - requires consultation
  {
    category: 'non_dismissible',
    label: 'Not Sure / Other',
    description: 'DUI, accidents, or unsure about your violation - we\'ll review and contact you',
    price: 0,
    dismissible: false,
    moneyBackGuarantee: false,
  },
];

// Minimum amount for Pay Later financing option (in cents)
// Affirm minimum is $50, so all our tiers qualify
export const PAY_LATER_MINIMUM = 5000; // $50.00

export function getPriceForCategory(category: OffenseCategory): number {
  const tier = PRICING_TIERS.find(t => t.category === category);
  return tier?.price ?? 0;
}

export function getTierByCategory(category: OffenseCategory): PricingTier | undefined {
  return PRICING_TIERS.find(t => t.category === category);
}

export function isDismissible(category: OffenseCategory): boolean {
  const tier = PRICING_TIERS.find(t => t.category === category);
  return tier?.dismissible ?? false;
}
