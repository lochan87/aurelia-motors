import { Check, Fuel, Gauge, Users, Zap } from 'lucide-react';

import type { VariantDetail } from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';

interface VariantSelectorProps {
  variants: VariantDetail[];
  selectedVariantSlug: string;
  onSelectVariant: (slug: string) => void;
}

export function VariantSelector({
  variants,
  selectedVariantSlug,
  onSelectVariant,
}: VariantSelectorProps) {
  const activeVariant = variants.find((v) => v.slug === selectedVariantSlug) ?? variants[0];

  if (!activeVariant) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-[0.62rem] font-semibold tracking-[0.24em] text-stone-500 uppercase">
          Select Variant
        </h3>
        <p className="mt-1 font-display text-2xl text-ink-950 sm:text-3xl">{activeVariant.name}</p>
      </div>

      {/* Variant Pills / Cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {variants.map((variant) => {
          const isSelected = variant.slug === selectedVariantSlug;
          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => onSelectVariant(variant.slug)}
              className={`relative flex flex-col justify-between border p-4 text-left transition-all ${
                isSelected
                  ? 'border-brass-500 bg-ivory-50 shadow-sm ring-2 ring-brass-500/20'
                  : 'border-ink-950/15 bg-ivory-100/40 hover:border-ink-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-base text-ink-950 sm:text-lg">
                  {variant.name}
                </span>
                {isSelected && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brass-500 text-ivory-50">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-1 text-[0.65rem] text-stone-600">
                <span>
                  {variant.fuelType} · {variant.transmission}
                </span>
                <span className="font-semibold text-ink-950">
                  {variant.startingPricePaise
                    ? formatInrFromPaise(variant.startingPricePaise)
                    : 'Price on request'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Specs for Selected Variant */}
      <div className="grid grid-cols-2 gap-4 border-t border-ink-950/10 pt-5 sm:grid-cols-4">
        <div className="flex items-center gap-3 border border-ink-950/10 bg-ivory-50 p-3.5">
          <Fuel className="h-4 w-4 text-brass-500" aria-hidden="true" />
          <div>
            <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
              Fuel
            </span>
            <span className="text-xs font-semibold text-ink-950">{activeVariant.fuelType}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-ink-950/10 bg-ivory-50 p-3.5">
          <Gauge className="h-4 w-4 text-brass-500" aria-hidden="true" />
          <div>
            <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
              Gearbox
            </span>
            <span className="text-xs font-semibold text-ink-950">{activeVariant.transmission}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-ink-950/10 bg-ivory-50 p-3.5">
          <Zap className="h-4 w-4 text-brass-500" aria-hidden="true" />
          <div>
            <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
              Power & Torque
            </span>
            <span className="text-xs font-semibold text-ink-950">
              {activeVariant.powerBhp ? `${activeVariant.powerBhp} bhp` : 'N/A'} ·{' '}
              {activeVariant.torqueNm ? `${activeVariant.torqueNm} Nm` : ''}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 border border-ink-950/10 bg-ivory-50 p-3.5">
          <Users className="h-4 w-4 text-brass-500" aria-hidden="true" />
          <div>
            <span className="block text-[0.52rem] font-semibold tracking-[0.16em] text-stone-500 uppercase">
              Seating
            </span>
            <span className="text-xs font-semibold text-ink-950">
              {activeVariant.seatingCapacity} Passengers
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
