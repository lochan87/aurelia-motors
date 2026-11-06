import { CheckCircle2, Clock, MapPin, Store } from 'lucide-react';

import type { ShowroomInventorySummary } from '@aurelia/shared';

interface ShowroomAvailabilityProps {
  inventory: ShowroomInventorySummary[];
}

export function ShowroomAvailability({ inventory }: ShowroomAvailabilityProps) {
  if (inventory.length === 0) {
    return null;
  }

  const totalAvailable = inventory.reduce((sum, inv) => sum + inv.availableCount, 0);

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-2 border-b border-ink-950/10 pb-5 sm:flex-row sm:items-center">
        <div>
          <p className="flex items-center gap-2 text-[0.62rem] font-semibold tracking-[0.24em] text-stone-500 uppercase">
            <Store className="h-3.5 w-3.5 text-brass-500" />
            Showroom Stock
          </p>
          <h3 className="mt-1 font-display text-xl text-ink-950 sm:text-2xl">
            Availability in Lucknow
          </h3>
        </div>

        <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-50 px-3 py-1 text-[0.62rem] font-semibold tracking-[0.16em] text-emerald-800 uppercase sm:self-auto">
          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
          {totalAvailable} {totalAvailable === 1 ? 'Unit in stock' : 'Units in stock'}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {inventory.map((inv) => (
          <div
            key={inv.showroomId}
            className="flex flex-col justify-between border border-ink-950/10 bg-ivory-100/50 p-4"
          >
            <div>
              <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.18em] text-stone-500 uppercase">
                <MapPin className="h-3 w-3 text-brass-500" />
                {inv.showroomCode}
              </div>
              <h4 className="mt-1 text-sm font-semibold text-ink-950">{inv.showroomName}</h4>
            </div>

            <div className="mt-4 flex flex-col gap-1 border-t border-ink-950/10 pt-3 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Available:</span>
                <span
                  className={`font-semibold ${
                    inv.availableCount > 0 ? 'text-emerald-700' : 'text-stone-500'
                  }`}
                >
                  {inv.availableCount} {inv.availableCount === 1 ? 'car' : 'cars'}
                </span>
              </div>
              {inv.inTransitCount > 0 && (
                <div className="flex items-center justify-between text-[0.68rem] text-stone-500">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" /> In transit:
                  </span>
                  <span>{inv.inTransitCount}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
