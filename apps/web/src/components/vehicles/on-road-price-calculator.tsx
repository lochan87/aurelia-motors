import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Calculator, CheckSquare, HelpCircle, Loader2, Square } from 'lucide-react';
import { useId, useState } from 'react';

import type { ShowroomSummary } from '@aurelia/shared';
import { formatInrFromPaise } from '@aurelia/shared';

import { api } from '../../lib/api-client';

interface OnRoadPriceCalculatorProps {
  variantSlug: string;
  showrooms: ShowroomSummary[];
}

export function OnRoadPriceCalculator({ variantSlug, showrooms }: OnRoadPriceCalculatorProps) {
  const showroomSelectId = useId();
  const [selectedShowroomCode, setSelectedShowroomCode] = useState<string>(
    showrooms[0]?.code ?? 'LKO-CENTRAL',
  );

  const [selectedOptionalCodes, setSelectedOptionalCodes] = useState<Set<string>>(new Set());

  const {
    data: pricing,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['variant-pricing', variantSlug, selectedShowroomCode],
    queryFn: () =>
      api.getVariantPricing(variantSlug, {
        showroomCode: selectedShowroomCode,
      }),
  });

  const toggleOptional = (code: string) => {
    setSelectedOptionalCodes((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Calculate dynamic total
  const exShowroomPaise = pricing?.exShowroomPaise ?? 0;
  const mandatoryTotalPaise = pricing?.mandatoryTotalPaise ?? 0;
  const selectedOptionalTotalPaise =
    pricing?.optionalComponents.reduce((sum, comp) => {
      if (selectedOptionalCodes.has(comp.code)) {
        return sum + comp.amountPaise;
      }
      return sum;
    }, 0) ?? 0;

  const totalCalculatedOnRoadPaise =
    exShowroomPaise + mandatoryTotalPaise + selectedOptionalTotalPaise;

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 sm:p-8">
      {/* Header & Showroom Switcher */}
      <div className="flex flex-col justify-between gap-4 border-b border-ink-950/10 pb-6 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.24em] text-stone-500 uppercase">
            <Calculator className="h-3.5 w-3.5 text-brass-500" />
            Transparent Pricing
          </p>
          <h3 className="mt-1 font-display text-2xl text-ink-950 sm:text-3xl">
            Itemized On-Road Quote
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <label
            htmlFor={showroomSelectId}
            className="text-xs font-semibold text-stone-600 uppercase"
          >
            Showroom:
          </label>
          <select
            id={showroomSelectId}
            value={selectedShowroomCode}
            onChange={(e) => setSelectedShowroomCode(e.target.value)}
            className="h-10 rounded-md border border-ink-950/20 bg-ivory-100 px-3 text-xs font-medium text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.code}>
                {showroom.name} ({showroom.city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-stone-500">
          <Loader2 className="h-6 w-6 animate-spin text-brass-500" />
          <span className="ml-3 text-xs tracking-wider uppercase">
            Calculating official pricing components...
          </span>
        </div>
      )}

      {/* Error / Price on request state */}
      {isError && (
        <div className="my-6 border border-amber-200 bg-amber-50/60 p-6 text-ink-950">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div>
              <h4 className="font-display text-base">Price Available on Request</h4>
              <p className="mt-1 text-xs text-stone-600">
                {(error as Error)?.message ||
                  'Itemized on-road pricing for this variant is currently available through our showroom advisors.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Breakdown Table */}
      {!isLoading && !isError && pricing && (
        <div className="mt-6 flex flex-col gap-6">
          <div className="overflow-hidden border border-ink-950/10 bg-ivory-100/30">
            {/* Ex-showroom */}
            <div className="flex items-center justify-between border-b border-ink-950/10 bg-ivory-100/80 px-5 py-4">
              <div>
                <span className="text-xs font-semibold tracking-wider text-ink-950 uppercase">
                  Ex-Showroom Price
                </span>
                <p className="text-[0.65rem] text-stone-500">Manufacturer baseline</p>
              </div>
              <span className="font-display text-lg font-medium text-ink-950 sm:text-xl">
                {formatInrFromPaise(pricing.exShowroomPaise)}
              </span>
            </div>

            {/* Mandatory breakdown */}
            <div className="divide-y divide-ink-950/10 px-5">
              {pricing.mandatoryComponents.map((comp) => (
                <div key={comp.code} className="flex items-center justify-between py-3 text-xs">
                  <div>
                    <span className="font-medium text-ink-900">{comp.label}</span>
                    {comp.calculation === 'PERCENT_OF_EXSHOWROOM' && comp.rateBasisPoints && (
                      <span className="ml-2 text-[0.62rem] text-stone-500">
                        ({(comp.rateBasisPoints / 100).toFixed(2)}%)
                      </span>
                    )}
                  </div>
                  <span className="font-medium text-stone-800">
                    {formatInrFromPaise(comp.amountPaise)}
                  </span>
                </div>
              ))}
            </div>

            {/* Standard On-Road Subtotal */}
            <div className="flex items-center justify-between border-t border-b border-ink-950/15 bg-sand-200/40 px-5 py-3.5">
              <div>
                <span className="text-xs font-bold text-ink-950 uppercase">
                  Standard On-Road Price
                </span>
                <span className="block text-[0.62rem] text-stone-600">
                  Mandatory components required for registration
                </span>
              </div>
              <span className="font-display text-base font-bold text-ink-950 sm:text-lg">
                {formatInrFromPaise(pricing.standardOnRoadPricePaise)}
              </span>
            </div>

            {/* Optional components */}
            {pricing.optionalComponents.length > 0 && (
              <div className="p-5">
                <span className="text-[0.62rem] font-semibold tracking-widest text-stone-500 uppercase">
                  Optional Add-Ons (Select to Include)
                </span>

                <div className="mt-3 flex flex-col gap-3">
                  {pricing.optionalComponents.map((comp) => {
                    const isChecked = selectedOptionalCodes.has(comp.code);
                    return (
                      <button
                        key={comp.code}
                        type="button"
                        onClick={() => toggleOptional(comp.code)}
                        className={`flex items-center justify-between border p-3.5 text-left transition-all ${
                          isChecked
                            ? 'border-brass-500 bg-ivory-50 ring-1 ring-brass-500/20'
                            : 'border-ink-950/10 bg-ivory-50 hover:border-ink-950/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckSquare className="h-4 w-4 text-brass-500" />
                          ) : (
                            <Square className="h-4 w-4 text-stone-400" />
                          )}
                          <div>
                            <span className="text-xs font-medium text-ink-950">{comp.label}</span>
                            <span className="block text-[0.6rem] text-stone-500">
                              Optional dealership accessory or package
                            </span>
                          </div>
                        </div>

                        <span className="text-xs font-semibold text-ink-950">
                          +{formatInrFromPaise(comp.amountPaise)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grand Total Footer */}
            <div className="flex flex-col justify-between gap-3 bg-ink-950 p-6 text-ivory-50 sm:flex-row sm:items-center">
              <div>
                <span className="block text-[0.6rem] font-semibold tracking-[0.24em] text-brass-300 uppercase">
                  Total On-Road Estimate · {pricing.showroomName}
                </span>
                <p className="text-[0.68rem] text-ivory-50/60">
                  {selectedOptionalCodes.size > 0
                    ? `Includes standard on-road plus ${selectedOptionalCodes.size} optional add-on${selectedOptionalCodes.size === 1 ? '' : 's'}`
                    : 'Standard mandatory on-road price'}
                </p>
              </div>

              <div className="text-right">
                <span className="font-display text-3xl font-medium text-ivory-50 sm:text-4xl">
                  {formatInrFromPaise(totalCalculatedOnRoadPaise)}
                </span>
              </div>
            </div>
          </div>

          {/* Pricing Policy Disclaimer */}
          <div className="flex items-start gap-2.5 rounded-md border border-ink-950/10 bg-sand-200/30 p-4 text-[0.68rem] leading-5 text-stone-600">
            <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-brass-500" />
            <div>
              <strong className="font-semibold text-ink-950">
                Pricing Assumptions & Transparency:
              </strong>{' '}
              Ex-showroom prices, road taxes, registration charges, and insurance estimates are
              illustrative values established for demonstration of dealership operations in Lucknow,
              Uttar Pradesh. Road tax calculations utilize an assumed rate of 8.00% (800 basis
              points). Final quote is subject to statutory RTO revisions, insurance tier selection,
              and municipality cess at the time of delivery.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
