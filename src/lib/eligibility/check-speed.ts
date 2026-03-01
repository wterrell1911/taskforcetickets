/**
 * Speed eligibility check based on jurisdiction
 *
 * Each jurisdiction has its own max speed-over threshold for online service.
 * Tickets exceeding the threshold require specialized representation.
 */

import { SPEED_LIMITS_BY_JURISDICTION, CourtJurisdiction } from '@/lib/constants/jurisdictions';

export interface SpeedEligibilityResult {
  eligible: boolean;
  maxAllowed: number;
  reason?: string;
}

/**
 * Check if a speed violation is eligible for online service
 * based on the jurisdiction and how much over the speed limit.
 *
 * @param jurisdiction - The court/jurisdiction from the dropdown
 * @param speedOver - How many MPH over the speed limit
 * @returns Eligibility result with max allowed and rejection reason if applicable
 */
export function checkSpeedEligibility(
  jurisdiction: CourtJurisdiction,
  speedOver: number
): SpeedEligibilityResult {
  const limits = SPEED_LIMITS_BY_JURISDICTION[jurisdiction];

  if (!limits) {
    return {
      eligible: false,
      maxAllowed: 0,
      reason: 'Unknown jurisdiction - please contact us directly.'
    };
  }

  if (speedOver > limits.maxOver) {
    return {
      eligible: false,
      maxAllowed: limits.maxOver,
      reason: `${limits.label} tickets over ${limits.maxOver} MPH over the limit require specialized representation. Please contact us directly for assistance.`
    };
  }

  return {
    eligible: true,
    maxAllowed: limits.maxOver
  };
}

/**
 * Check if speed data is provided for eligibility check
 */
export function hasSpeedData(speedLimit: string | number | null | undefined, actualSpeed: string | number | null | undefined): boolean {
  const limit = typeof speedLimit === 'string' ? parseInt(speedLimit, 10) : speedLimit;
  const actual = typeof actualSpeed === 'string' ? parseInt(actualSpeed, 10) : actualSpeed;

  return !!(limit && actual && !isNaN(limit) && !isNaN(actual));
}

/**
 * Calculate speed over limit from form values
 */
export function calculateSpeedOver(speedLimit: string | number, actualSpeed: string | number): number | null {
  const limit = typeof speedLimit === 'string' ? parseInt(speedLimit, 10) : speedLimit;
  const actual = typeof actualSpeed === 'string' ? parseInt(actualSpeed, 10) : actualSpeed;

  if (isNaN(limit) || isNaN(actual)) {
    return null;
  }

  return actual - limit;
}
