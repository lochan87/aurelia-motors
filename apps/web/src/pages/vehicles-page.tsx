import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Car, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import type { CatalogueFilterQuery } from '@aurelia/shared';

import { VehicleCard } from '../components/vehicles/vehicle-card';
import { VehicleFilters } from '../components/vehicles/vehicle-filters';
import { Container } from '../components/ui/container';
import { SectionHeader } from '../components/ui/section-header';
import { api } from '../lib/api-client';

export function VehiclesPage() {
  const [filters, setFilters] = useState<CatalogueFilterQuery>({});

  const {
    data: models,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['catalogue-models', filters],
    queryFn: () => api.getModels(filters),
  });

  return (
    <div className="bg-ivory-50 py-16 sm:py-24">
      <Container>
        {/* Editorial Heading */}
        <SectionHeader
          eyebrow="The Fleet"
          index="01"
          title="New vehicle catalogue"
          description="Engineered with restraint, appointed with purpose. Explore our current portfolio of sedans, crossovers, and electric powertrains in Lucknow."
        />

        {/* Filters */}
        <div className="mt-12">
          <VehicleFilters filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
        </div>

        {/* Content States */}
        <div className="mt-12">
          {isLoading && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse border border-ink-950/10 bg-ivory-100/60 p-6">
                  <div className="aspect-16/10 w-full bg-stone-300/40" />
                  <div className="mt-6 h-6 w-1/3 bg-stone-300/40" />
                  <div className="mt-3 h-8 w-2/3 bg-stone-300/40" />
                  <div className="mt-4 h-4 w-full bg-stone-300/40" />
                  <div className="mt-8 h-10 w-full bg-stone-300/40" />
                </div>
              ))}
            </div>
          )}

          {isError && (
            <div className="border border-red-200 bg-red-50/50 p-8 text-center text-ink-950 sm:p-12">
              <AlertCircle className="mx-auto h-8 w-8 text-red-600" aria-hidden="true" />
              <h3 className="mt-4 font-display text-xl">Unable to load vehicle catalogue</h3>
              <p className="mt-2 text-xs text-stone-600 sm:text-sm">
                {(error as Error)?.message || 'A network error occurred. Please try again.'}
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-950/20 bg-ivory-50 px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.16em] uppercase hover:border-brass-500"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && models && models.length === 0 && (
            <div className="border border-ink-950/10 bg-ivory-100/40 p-12 text-center text-ink-950 sm:p-16">
              <Car className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-2xl">No vehicles match your criteria</h3>
              <p className="mt-2 text-xs text-stone-600 sm:text-sm">
                Try widening your search terms or clearing one or more active filters.
              </p>
              <button
                type="button"
                onClick={() => setFilters({})}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-950/20 bg-ivory-50 px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.16em] text-brass-500 uppercase hover:underline"
              >
                Reset all filters
              </button>
            </div>
          )}

          {!isLoading && !isError && models && models.length > 0 && (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <VehicleCard key={model.id} model={model} />
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
