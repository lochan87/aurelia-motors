import { useState } from 'react';

import type { SpecificationGroup, VehicleSpecificationSummary } from '@aurelia/shared';

interface SpecificationsTableProps {
  specifications: VehicleSpecificationSummary[];
}

const groupLabels: Record<SpecificationGroup, string> = {
  ENGINE: 'Engine & Transmission',
  PERFORMANCE: 'Performance & Dynamics',
  DIMENSIONS: 'Dimensions & Weight',
  SAFETY: 'Safety & Protection',
  COMFORT: 'Comfort & Convenience',
  TECHNOLOGY: 'Infotainment & Technology',
};

export function SpecificationsTable({ specifications }: SpecificationsTableProps) {
  // Group specifications by SpecificationGroup
  const grouped = specifications.reduce<Record<SpecificationGroup, VehicleSpecificationSummary[]>>(
    (acc, spec) => {
      if (!acc[spec.group]) {
        acc[spec.group] = [];
      }
      acc[spec.group].push(spec);
      return acc;
    },
    {} as Record<SpecificationGroup, VehicleSpecificationSummary[]>,
  );

  const availableGroups = Object.keys(grouped) as SpecificationGroup[];
  const [activeGroup, setActiveGroup] = useState<SpecificationGroup>(
    availableGroups[0] ?? 'ENGINE',
  );

  if (availableGroups.length === 0) {
    return null;
  }

  const activeSpecs = grouped[activeGroup] ?? [];

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 sm:p-8">
      <div>
        <p className="text-[0.62rem] font-semibold tracking-[0.24em] text-stone-500 uppercase">
          Technical Specifications
        </p>
        <h3 className="mt-1 font-display text-2xl text-ink-950 sm:text-3xl">
          Specification Matrix
        </h3>
      </div>

      {/* Group Navigation Tabs */}
      <div className="mt-6 flex flex-wrap gap-2 border-b border-ink-950/10 pb-4">
        {availableGroups.map((group) => {
          const isActive = group === activeGroup;
          return (
            <button
              key={group}
              type="button"
              onClick={() => setActiveGroup(group)}
              className={`rounded-full px-4 py-2 text-[0.65rem] font-semibold tracking-[0.16em] uppercase transition-all ${
                isActive
                  ? 'bg-ink-950 text-ivory-50'
                  : 'bg-ivory-100 text-stone-600 hover:bg-sand-200/60 hover:text-ink-950'
              }`}
            >
              {groupLabels[group] ?? group}
            </button>
          );
        })}
      </div>

      {/* Active Group Key-Value Table */}
      <div className="mt-6">
        <h4 className="font-display text-lg text-ink-950 sm:text-xl">{groupLabels[activeGroup]}</h4>

        <div className="mt-4 divide-y divide-ink-950/10 border-t border-b border-ink-950/10">
          {activeSpecs.map((spec) => (
            <div
              key={spec.id}
              className="grid grid-cols-1 gap-1 py-3.5 sm:grid-cols-2 sm:gap-4 sm:py-4"
            >
              <dt className="text-xs font-semibold text-stone-600 sm:text-sm">{spec.label}</dt>
              <dd className="text-xs font-medium text-ink-950 sm:text-sm">{spec.value}</dd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
