import { useState } from 'react';

import type { VehicleColourSummary } from '@aurelia/shared';

interface ColourSelectorProps {
  colours: VehicleColourSummary[];
}

export function ColourSelector({ colours }: ColourSelectorProps) {
  const [selectedColourId, setSelectedColourId] = useState<string>(colours[0]?.id ?? '');

  if (colours.length === 0) {
    return null;
  }

  const activeColour = colours.find((c) => c.id === selectedColourId) ?? colours[0];

  if (!activeColour) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 border-t border-ink-950/10 pt-6">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[0.62rem] font-semibold tracking-[0.24em] text-stone-500 uppercase">
          Exterior Paint
        </h3>
        <span className="text-xs font-semibold text-ink-950">
          {activeColour.name}{' '}
          <span className="font-normal text-stone-500">({activeColour.finish})</span>
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {colours.map((colour) => {
          const isSelected = colour.id === selectedColourId;
          return (
            <button
              key={colour.id}
              type="button"
              onClick={() => setSelectedColourId(colour.id)}
              className={`relative flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                isSelected
                  ? 'border-brass-500 ring-2 ring-brass-500/40 ring-offset-2'
                  : 'border-ink-950/20 hover:scale-105'
              }`}
              style={{ backgroundColor: colour.hexCode }}
              title={`${colour.name} (${colour.finish})`}
              aria-label={`Select ${colour.name} paint`}
            >
              <span className="sr-only">{colour.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
