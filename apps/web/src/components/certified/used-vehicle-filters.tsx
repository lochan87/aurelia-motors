import { Search, X } from 'lucide-react';

import type {
  FuelType,
  ShowroomSummary,
  Transmission,
  UsedVehicleFilterQuery,
} from '@aurelia/shared';

interface UsedVehicleFiltersProps {
  filters: UsedVehicleFilterQuery;
  showrooms: ShowroomSummary[];
  onChange: (filters: UsedVehicleFilterQuery) => void;
  onReset: () => void;
}

export function UsedVehicleFilters({
  filters,
  showrooms,
  onChange,
  onReset,
}: UsedVehicleFiltersProps) {
  const hasActiveFilters = Boolean(
    filters.fuelType ||
    filters.transmission ||
    filters.showroomCode ||
    filters.search ||
    filters.sort,
  );

  return (
    <div className="border border-ink-950/10 bg-ivory-50 p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* Search */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <label htmlFor="used-search-input" className="sr-only">
            Search certified inventory
          </label>
          <Search
            className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            id="used-search-input"
            type="search"
            placeholder="Search make, model, plate..."
            value={filters.search ?? ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value || undefined, page: 1 })}
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 pr-4 pl-10 text-xs text-ink-950 placeholder-stone-400 focus:border-brass-500 focus:outline-none"
          />
        </div>

        {/* Showroom Location */}
        <div>
          <label htmlFor="showroom-filter-select" className="sr-only">
            Location
          </label>
          <select
            id="showroom-filter-select"
            value={filters.showroomCode ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                showroomCode: e.target.value || undefined,
                page: 1,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            <option value="">All Showrooms</option>
            {showrooms.map((showroom) => (
              <option key={showroom.id} value={showroom.code}>
                {showroom.name}
              </option>
            ))}
          </select>
        </div>

        {/* Fuel Type */}
        <div>
          <label htmlFor="used-fuel-select" className="sr-only">
            Fuel type
          </label>
          <select
            id="used-fuel-select"
            value={filters.fuelType ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                fuelType: (e.target.value || undefined) as FuelType | undefined,
                page: 1,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            <option value="">All Fuel Types</option>
            <option value="PETROL">Petrol</option>
            <option value="DIESEL">Diesel</option>
            <option value="ELECTRIC">Electric</option>
          </select>
        </div>

        {/* Transmission */}
        <div>
          <label htmlFor="used-transmission-select" className="sr-only">
            Transmission
          </label>
          <select
            id="used-transmission-select"
            value={filters.transmission ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                transmission: (e.target.value || undefined) as Transmission | undefined,
                page: 1,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            <option value="">All Transmissions</option>
            <option value="MANUAL">Manual</option>
            <option value="AUTOMATIC">Automatic</option>
          </select>
        </div>

        {/* Sorting */}
        <div>
          <label htmlFor="used-sort-select" className="sr-only">
            Sort
          </label>
          <select
            id="used-sort-select"
            value={filters.sort ?? ''}
            onChange={(e) =>
              onChange({
                ...filters,
                sort: (e.target.value || undefined) as UsedVehicleFilterQuery['sort'],
                page: 1,
              })
            }
            className="h-11 w-full rounded-md border border-ink-950/20 bg-ivory-50 px-3 text-xs text-ink-950 focus:border-brass-500 focus:outline-none"
          >
            <option value="">Sort: Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="mileage_asc">Mileage: Low to High</option>
            <option value="year_desc">Year: Newest</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-4 flex items-center justify-between border-t border-ink-950/10 pt-4">
          <p className="text-[0.62rem] font-medium tracking-[0.16em] text-stone-500 uppercase">
            Filtered inventory
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
