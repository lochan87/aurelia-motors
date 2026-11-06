import { Search, X } from 'lucide-react';

import type { BodyType, CatalogueFilterQuery, FuelType, Transmission } from '@aurelia/shared';

interface VehicleFiltersProps {
  filters: CatalogueFilterQuery;
  onChange: (filters: CatalogueFilterQuery) => void;
  onReset: () => void;
}

const bodyTypes: Array<{ label: string; value: BodyType }> = [
  { label: 'All bodies', value: undefined as unknown as BodyType },
  { label: 'Crossover', value: 'CROSSOVER' },
  { label: 'Sedan', value: 'SEDAN' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Hatchback', value: 'HATCHBACK' },
];

const fuelTypes: Array<{ label: string; value: FuelType }> = [
  { label: 'All fuels', value: undefined as unknown as FuelType },
  { label: 'Petrol', value: 'PETROL' },
  { label: 'Diesel', value: 'DIESEL' },
  { label: 'Electric', value: 'ELECTRIC' },
];

const transmissions: Array<{ label: string; value: Transmission }> = [
  { label: 'All transmissions', value: undefined as unknown as Transmission },
  { label: 'Manual', value: 'MANUAL' },
  { label: 'Automatic', value: 'AUTOMATIC' },
];

export function VehicleFilters({ filters, onChange, onReset }: VehicleFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.bodyType || filters.fuelType || filters.transmission || filters.search || filters.sort,
  );

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="search-input" className="sr-only">
            Search models
          </label>
          <Search
            className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            id="search-input"
            type="search"
            placeholder="Search models..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 pr-4 pl-10 text-xs text-ink-950 placeholder-stone-400 focus:border-brass-500 focus:outline-none"
          />
        </div>

        {/* Body Type */}
        <div>
          <label htmlFor="body-type-select" className="sr-only">
            Body type
          </label>
          <select
            id="body-type-select"
            value={filters.bodyType ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                bodyType: (e.target.value || undefined) as BodyType | undefined,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            {bodyTypes.map((type) => (
              <option key={type.label} value={type.value ?? ''}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fuel Type */}
        <div>
          <label htmlFor="fuel-type-select" className="sr-only">
            Fuel type
          </label>
          <select
            id="fuel-type-select"
            value={filters.fuelType ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                fuelType: (e.target.value || undefined) as FuelType | undefined,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            {fuelTypes.map((type) => (
              <option key={type.label} value={type.value ?? ''}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label htmlFor="transmission-select" className="sr-only">
            Transmission
          </label>
          <select
            id="transmission-select"
            value={filters.transmission ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                transmission: (e.target.value || undefined) as Transmission | undefined,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            {transmissions.map((type) => (
              <option key={type.label} value={type.value ?? ''}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div>
          <label htmlFor="sort-select" className="sr-only">
            Sort by
          </label>
          <select
            id="sort-select"
            value={filters.sort ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                sort: (e.target.value || undefined) as CatalogueFilterQuery['sort'],
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            <option value="">Sort: Default</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between border-t border-ink-950/10 pt-4">
          <p className="text-[0.62rem] font-medium tracking-[0.16em] text-stone-500 uppercase">
            Filtered results
          </p>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold tracking-[0.16em] text-brass-500 uppercase hover:underline"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
