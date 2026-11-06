import { describe, expect, it } from 'vitest';

import { computeComponentAmountPaise } from '../src/pricing.js';

describe('computeComponentAmountPaise', () => {
  it('computes percentage of ex-showroom using integer basis points', () => {
    // 800 basis points = 8.00%
    // 11,49,000 rupees in paise = 114,900,000 paise
    // 8% = 9,192,000 paise (Rs 91,920)
    const exShowroomPaise = 114_900_000;
    const roadTax = computeComponentAmountPaise(
      exShowroomPaise,
      'PERCENT_OF_EXSHOWROOM',
      null,
      800,
    );
    expect(roadTax).toBe(9_192_000);
  });

  it('handles fixed amount calculation', () => {
    const fixed = computeComponentAmountPaise(114_900_000, 'FIXED', 12_500_00, null);
    expect(fixed).toBe(12_500_00);
  });

  it('returns 0 when rate basis points or amount are missing or non-positive', () => {
    expect(computeComponentAmountPaise(100_000_000, 'PERCENT_OF_EXSHOWROOM', null, null)).toBe(0);
    expect(computeComponentAmountPaise(100_000_000, 'PERCENT_OF_EXSHOWROOM', null, 0)).toBe(0);
    expect(computeComponentAmountPaise(100_000_000, 'FIXED', null, null)).toBe(0);
  });

  it('rounds to the nearest integer paise without float precision drift', () => {
    // 12345678 paise * 333 bps / 10000 = 411111.0774 -> 411111
    const result = computeComponentAmountPaise(12345678, 'PERCENT_OF_EXSHOWROOM', null, 333);
    expect(result).toBe(411111);
    expect(Number.isInteger(result)).toBe(true);
  });
});
