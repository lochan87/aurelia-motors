export type PriceComponentCategory =
  'EX_SHOWROOM' | 'ROAD_TAX' | 'INSURANCE' | 'REGISTRATION' | 'ACCESSORIES' | 'OTHER';

export type PriceCalculation = 'FIXED' | 'PERCENT_OF_EXSHOWROOM';

export type PriceKind = 'EXACT' | 'SAMPLE_ESTIMATE' | 'PRICE_ON_REQUEST';

export interface PriceComponentBreakdown {
  code: string;
  label: string;
  category: PriceComponentCategory;
  calculation: PriceCalculation;
  isOptional: boolean;
  sortOrder: number;
  rateBasisPoints?: number | null;
  amountPaise: number;
}

export interface OnRoadPriceBreakdown {
  priceBookCode: string;
  priceBookName: string;
  variantId: string;
  variantSlug: string;
  variantName: string;
  showroomId: string;
  showroomCode: string;
  showroomName: string;
  priceKind: PriceKind;
  exShowroomPaise: number;
  mandatoryComponents: PriceComponentBreakdown[];
  optionalComponents: PriceComponentBreakdown[];
  mandatoryTotalPaise: number;
  standardOnRoadPricePaise: number;
  totalWithOptionsPaise: number;
  notes?: string | null;
}

/**
 * Calculates a component amount in integer paise.
 * For percentage-based rates, basis points are used (100 bps = 1%).
 * Integer arithmetic is used to prevent floating-point rounding errors.
 */
export function computeComponentAmountPaise(
  exShowroomPaise: number,
  calculation: PriceCalculation,
  amountPaise?: number | null,
  rateBasisPoints?: number | null,
): number {
  if (calculation === 'PERCENT_OF_EXSHOWROOM') {
    if (!rateBasisPoints || rateBasisPoints <= 0) {
      return 0;
    }
    return Math.round((exShowroomPaise * rateBasisPoints) / 10000);
  }

  return amountPaise ?? 0;
}
