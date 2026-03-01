'use client';

import { formatCurrency } from '@/lib/utils';

interface InsuranceSavingsCalculatorProps {
  ticketType: 'minor' | 'standard' | 'major';
  serviceFee: number; // in cents
}

const INSURANCE_IMPACT = {
  minor: { increase: 15, label: 'Under 15 MPH over', yearsOnRecord: 3 },
  standard: { increase: 22, label: '15-29 MPH over', yearsOnRecord: 3 },
  major: { increase: 42, label: '30+ MPH / Reckless', yearsOnRecord: 5 },
};

// Average Tennessee auto insurance premium
const AVG_ANNUAL_PREMIUM = 180000; // $1,800 in cents

// Estimated Memphis court costs
const COURT_COSTS = 13000; // $130 in cents

export function InsuranceSavingsCalculator({
  ticketType,
  serviceFee,
}: InsuranceSavingsCalculatorProps) {
  const impact = INSURANCE_IMPACT[ticketType];
  const yearlyIncrease = Math.round(
    (impact.increase / 100) * AVG_ANNUAL_PREMIUM
  );
  const totalInsuranceCost = yearlyIncrease * impact.yearsOnRecord;
  const totalCostWithUs = serviceFee + COURT_COSTS;
  const potentialSavings = totalInsuranceCost - totalCostWithUs;

  return (
    <div className="bg-gradient-to-br from-[#CF2A27]/5 to-[#FFD100]/10 rounded-2xl p-6 border border-[#CF2A27]/20">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">💰</span>
        <h3 className="text-lg font-bold text-[#1A1A1A]">
          What This Ticket Could Cost You
        </h3>
      </div>

      <div className="space-y-3">
        {/* Insurance increase */}
        <div className="flex justify-between items-center">
          <div>
            <span className="text-[#4A4A4A]">Insurance increase</span>
            <span className="text-xs text-[#4A4A4A] ml-1">
              (~{impact.increase}%)
            </span>
          </div>
          <span className="font-semibold text-[#CF2A27]">
            +{formatCurrency(yearlyIncrease)}/year
          </span>
        </div>

        {/* Multi-year cost */}
        <div className="flex justify-between items-center">
          <span className="text-[#4A4A4A]">
            Over {impact.yearsOnRecord} years on your record
          </span>
          <span className="font-bold text-[#CF2A27] text-lg">
            +{formatCurrency(totalInsuranceCost)}
          </span>
        </div>

        <hr className="border-[#CF2A27]/20" />

        {/* Our fee */}
        <div className="flex justify-between items-center">
          <span className="text-[#4A4A4A]">TaskForce Tickets fee</span>
          <span className="font-medium text-[#1A1A1A]">
            {formatCurrency(serviceFee)}
          </span>
        </div>

        {/* Court costs */}
        <div className="flex justify-between items-center">
          <span className="text-[#4A4A4A]">Court costs (estimated)</span>
          <span className="font-medium text-[#1A1A1A]">
            {formatCurrency(COURT_COSTS)}
          </span>
        </div>

        {/* Total with us */}
        <div className="flex justify-between items-center pt-2 border-t border-[#CF2A27]/20">
          <span className="font-semibold text-[#1A1A1A]">Your total with us</span>
          <span className="font-bold text-[#1A1A1A]">
            {formatCurrency(totalCostWithUs)}
          </span>
        </div>
      </div>

      {/* Savings highlight */}
      <div className="mt-4 p-4 bg-[#10B981]/10 rounded-xl border border-[#10B981]/30">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-[#10B981]">Potential savings</span>
          <span className="text-2xl font-bold text-[#10B981]">
            {formatCurrency(potentialSavings)}
          </span>
        </div>
        <p className="text-sm text-[#10B981]/80 mt-1">
          By keeping this off your record
        </p>
      </div>

      {/* Fine print */}
      <p className="text-xs text-[#4A4A4A] mt-4">
        * Based on average TN insurance rates. Actual savings vary by driver and
        insurer.
      </p>
    </div>
  );
}
