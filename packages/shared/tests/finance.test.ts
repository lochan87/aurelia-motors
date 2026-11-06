import { describe, expect, it } from 'vitest';

import { calculateEmi, calculateTradeInEstimate } from '../src/finance.js';

describe('calculateEmi', () => {
  it('correctly calculates standard reducing-balance monthly EMI in paise', () => {
    // Principal: Rs 10,00,000 = 100,000,000 paise
    // Vehicle price: Rs 12,00,000 (120,000,000 paise), Down payment: Rs 2,00,000 (20,000,000 paise)
    // Rate: 9.0% p.a., Tenure: 60 months (5 years)
    // Standard EMI formula: E = 1,000,000 * 0.0075 * (1.0075)^60 / ((1.0075)^60 - 1) = ~20758.35 Rs = 2,075,835 paise
    const result = calculateEmi({
      vehiclePricePaise: 120_000_000,
      downPaymentPaise: 20_000_000,
      annualInterestRatePercent: 9.0,
      tenureMonths: 60,
    });

    expect(result.principalPaise).toBe(100_000_000);
    expect(result.monthlyEmiPaise).toBeGreaterThan(2_075_000);
    expect(result.monthlyEmiPaise).toBeLessThan(2_076_500);
    expect(result.totalRepaymentPaise).toBe(result.monthlyEmiPaise * 60);
    expect(result.totalInterestPaise).toBe(result.totalRepaymentPaise - 100_000_000);
  });

  it('handles zero interest rate correctly', () => {
    // 60,000,000 paise over 12 months = 5,000,000 paise / month
    const result = calculateEmi({
      vehiclePricePaise: 60_000_000,
      downPaymentPaise: 0,
      annualInterestRatePercent: 0,
      tenureMonths: 12,
    });

    expect(result.monthlyEmiPaise).toBe(5_000_000);
    expect(result.totalInterestPaise).toBe(0);
    expect(result.totalRepaymentPaise).toBe(60_000_000);
  });

  it('handles zero or negative principal (down payment covers vehicle price)', () => {
    const result = calculateEmi({
      vehiclePricePaise: 50_000_000,
      downPaymentPaise: 60_000_000,
      annualInterestRatePercent: 8.5,
      tenureMonths: 36,
    });

    expect(result.principalPaise).toBe(0);
    expect(result.monthlyEmiPaise).toBe(0);
    expect(result.totalInterestPaise).toBe(0);
    expect(result.totalRepaymentPaise).toBe(0);
  });

  it('handles zero tenure safely', () => {
    const result = calculateEmi({
      vehiclePricePaise: 50_000_000,
      downPaymentPaise: 10_000_000,
      annualInterestRatePercent: 8.5,
      tenureMonths: 0,
    });

    expect(result.monthlyEmiPaise).toBe(0);
  });
});

describe('calculateTradeInEstimate', () => {
  it('calculates expected valuation band for 3-year-old vehicle in good condition', () => {
    // Base reference: Rs 10,00,000 = 100,000,000 paise
    // Year: 2023 (age 3 years at 2026), Mileage: 36,000 km, Good condition, 1 owner
    const result = calculateTradeInEstimate({
      baseReferencePricePaise: 100_000_000,
      registrationYear: 2023,
      currentYear: 2026,
      mileageKm: 36_000,
      condition: 'GOOD',
      ownershipCount: 1,
    });

    // Base dep at 3 years is 40% -> residual ~60% -> ~60,000,000 paise
    expect(result.depreciationPercent).toBe(40);
    expect(result.estimatedMidpointPaise).toBe(60_000_000);
    expect(result.estimatedValuationMinPaise).toBeLessThan(result.estimatedMidpointPaise);
    expect(result.estimatedValuationMaxPaise).toBeGreaterThan(result.estimatedMidpointPaise);
    expect(result.disclaimer).toContain('authorized Aurelia Motors showroom');
  });

  it('adjusts valuation higher for excellent condition and lower for poor condition', () => {
    const excellent = calculateTradeInEstimate({
      baseReferencePricePaise: 100_000_000,
      registrationYear: 2024,
      currentYear: 2026,
      mileageKm: 20_000,
      condition: 'EXCELLENT',
    });

    const poor = calculateTradeInEstimate({
      baseReferencePricePaise: 100_000_000,
      registrationYear: 2024,
      currentYear: 2026,
      mileageKm: 20_000,
      condition: 'POOR',
    });

    expect(excellent.estimatedMidpointPaise).toBeGreaterThan(poor.estimatedMidpointPaise);
  });
});
