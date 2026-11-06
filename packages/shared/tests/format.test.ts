import { describe, expect, it } from 'vitest';

import { formatInr, formatInrFromPaise } from '../src/format.js';

function normaliseSpaces(value: string): string {
  return value.replace(/[\u00a0\u202f]/g, ' ');
}

describe('formatInr', () => {
  it('uses Indian digit grouping for rupee amounts', () => {
    expect(normaliseSpaces(formatInr(1234500))).toBe('₹12,34,500');
  });

  it('formats zero', () => {
    expect(normaliseSpaces(formatInr(0))).toBe('₹0');
  });

  it('converts paise to rupees before formatting', () => {
    expect(normaliseSpaces(formatInrFromPaise(123450000))).toBe('₹12,34,500');
  });

  it('accepts bigint paise values', () => {
    expect(normaliseSpaces(formatInrFromPaise(9000000000n))).toBe('₹9,00,00,000');
  });
});
