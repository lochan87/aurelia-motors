export interface EmiCalculationInput {
  vehiclePricePaise: number;
  downPaymentPaise: number;
  annualInterestRatePercent: number;
  tenureMonths: number;
}

export interface EmiCalculationResult {
  vehiclePricePaise: number;
  downPaymentPaise: number;
  principalPaise: number;
  annualInterestRatePercent: number;
  tenureMonths: number;
  monthlyEmiPaise: number;
  totalInterestPaise: number;
  totalRepaymentPaise: number;
}

/**
 * Standard reducing-balance EMI calculation.
 * Formula: E = P * r * (1 + r)^n / ((1 + r)^n - 1)
 *
 * All money inputs and outputs are in integer paise.
 * Edge cases:
 * - Principal <= 0: EMI = 0
 * - Interest rate = 0: EMI = P / n
 */
export function calculateEmi(input: EmiCalculationInput): EmiCalculationResult {
  const { vehiclePricePaise, downPaymentPaise, annualInterestRatePercent, tenureMonths } = input;

  const principalPaise = Math.max(0, vehiclePricePaise - downPaymentPaise);

  if (tenureMonths <= 0 || principalPaise <= 0) {
    return {
      vehiclePricePaise,
      downPaymentPaise,
      principalPaise,
      annualInterestRatePercent,
      tenureMonths: Math.max(1, tenureMonths),
      monthlyEmiPaise: 0,
      totalInterestPaise: 0,
      totalRepaymentPaise: principalPaise,
    };
  }

  if (annualInterestRatePercent <= 0) {
    const monthlyEmiPaise = Math.round(principalPaise / tenureMonths);
    const totalRepaymentPaise = monthlyEmiPaise * tenureMonths;
    return {
      vehiclePricePaise,
      downPaymentPaise,
      principalPaise,
      annualInterestRatePercent: 0,
      tenureMonths,
      monthlyEmiPaise,
      totalInterestPaise: 0,
      totalRepaymentPaise,
    };
  }

  // Monthly interest rate
  const monthlyRate = annualInterestRatePercent / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const monthlyEmiPaise = Math.round((principalPaise * monthlyRate * factor) / (factor - 1));
  const totalRepaymentPaise = monthlyEmiPaise * tenureMonths;
  const totalInterestPaise = Math.max(0, totalRepaymentPaise - principalPaise);

  return {
    vehiclePricePaise,
    downPaymentPaise,
    principalPaise,
    annualInterestRatePercent,
    tenureMonths,
    monthlyEmiPaise,
    totalInterestPaise,
    totalRepaymentPaise,
  };
}

export type VehicleCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

export interface TradeInEstimateInput {
  baseReferencePricePaise: number;
  registrationYear: number;
  currentYear?: number;
  mileageKm: number;
  condition: VehicleCondition;
  ownershipCount?: number;
}

export interface TradeInEstimateResult {
  estimatedValuationMinPaise: number;
  estimatedValuationMaxPaise: number;
  estimatedMidpointPaise: number;
  depreciationPercent: number;
  disclaimer: string;
}

/**
 * Calculates an illustrative trade-in valuation band based on vehicle age,
 * mileage, condition, and ownership history.
 */
export function calculateTradeInEstimate(input: TradeInEstimateInput): TradeInEstimateResult {
  const currentYear = input.currentYear ?? 2026;
  const ageYears = Math.max(0, currentYear - input.registrationYear);

  // Age-based base depreciation
  let baseDepreciation = 0.15;
  if (ageYears === 1) baseDepreciation = 0.2;
  else if (ageYears === 2) baseDepreciation = 0.3;
  else if (ageYears === 3) baseDepreciation = 0.4;
  else if (ageYears === 4) baseDepreciation = 0.5;
  else if (ageYears === 5) baseDepreciation = 0.6;
  else if (ageYears > 5) {
    baseDepreciation = Math.min(0.85, 0.6 + (ageYears - 5) * 0.05);
  }

  // Mileage adjustment: standard is ~12,000 km/year
  const standardMileage = Math.max(12000, ageYears * 12000);
  const mileageDelta = input.mileageKm - standardMileage;
  const mileageAdj = Math.min(0.15, Math.max(-0.06, (mileageDelta / 10000) * 0.02));

  // Condition adjustment
  let conditionAdj = 0;
  switch (input.condition) {
    case 'EXCELLENT':
      conditionAdj = -0.05; // Less depreciation
      break;
    case 'GOOD':
      conditionAdj = 0;
      break;
    case 'FAIR':
      conditionAdj = 0.1; // More depreciation
      break;
    case 'POOR':
      conditionAdj = 0.25;
      break;
  }

  // Ownership count adjustment
  const ownershipCount = input.ownershipCount ?? 1;
  let ownershipAdj = 0;
  if (ownershipCount === 2) ownershipAdj = 0.05;
  else if (ownershipCount >= 3) ownershipAdj = 0.12;

  // Net depreciation clamped between 15% and 88%
  const totalDepreciation = Math.min(
    0.88,
    Math.max(0.15, baseDepreciation + mileageAdj + conditionAdj + ownershipAdj),
  );

  const residualMultiplier = 1 - totalDepreciation;
  const midpointPaise = Math.round(input.baseReferencePricePaise * residualMultiplier);

  const minPaise = Math.round(midpointPaise * 0.94);
  const maxPaise = Math.round(midpointPaise * 1.06);

  return {
    estimatedValuationMinPaise: minPaise,
    estimatedValuationMaxPaise: maxPaise,
    estimatedMidpointPaise: midpointPaise,
    depreciationPercent: Math.round(totalDepreciation * 100),
    disclaimer:
      'This valuation is an automated estimate for guidance only and does not constitute a formal purchase offer. Final trade-in value is subject to a 140-point physical inspection at an authorized Aurelia Motors showroom.',
  };
}
