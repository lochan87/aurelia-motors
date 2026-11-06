import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Car, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import type { UsedVehicleFilterQuery } from '@aurelia/shared';

import { TradeInModal } from '../components/trade-in/trade-in-modal';
import { UsedVehicleCard } from '../components/certified/used-vehicle-card';
import { UsedVehicleFilters } from '../components/certified/used-vehicle-filters';
import { Container } from '../components/ui/container';
import { SectionHeader } from '../components/ui/section-header';
import { api } from '../lib/api-client';

export function CertifiedPage() {
  const [filters, setFilters] = useState<UsedVehicleFilterQuery>({
    page: 1,
    pageSize: 9,
  });
  const [isTradeInOpen, setIsTradeInOpen] = useState(false);

  const {
    data: result,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['used-vehicles', filters],
    queryFn: () => api.getUsedVehicles(filters),
  });

  const { data: showrooms = [] } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  const vehicles = result?.items ?? [];
  const pagination = result?.pagination;

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-ivory-50 py-16 sm:py-24">
      <Container>
        {/* Editorial Heading */}
        <SectionHeader
          eyebrow="Certified Pre-Owned"
          index="02"
          title="Verified used vehicles in Lucknow"
          description="Every vehicle undergoes our multi-point technical assessment with a published inspection report, verified documents, and transparent fixed pricing."
        />

        {/* Trade-In Exchange Callout Banner */}
        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 p-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-xs font-semibold tracking-wider text-amber-800 uppercase">
              Exchange & Upgrade Carnival
            </span>
            <h4 className="mt-1 font-serif text-lg font-bold text-stone-900">
              Looking to sell or trade in your current vehicle?
            </h4>
            <p className="mt-0.5 text-xs text-stone-600">
              Receive an instant indicative valuation band and certified doorstep technical
              evaluation in Lucknow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsTradeInOpen(true)}
            className="rounded-lg bg-stone-900 px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-sm hover:bg-stone-800"
          >
            Calculate Trade-In Value
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-12">
          <UsedVehicleFilters
            filters={filters}
            showrooms={showrooms}
            onChange={setFilters}
            onReset={() => setFilters({ page: 1, pageSize: 9 })}
          />
        </div>

        {/* Content Section */}
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
              <h3 className="mt-4 font-display text-xl">Unable to load certified inventory</h3>
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

          {!isLoading && !isError && vehicles.length === 0 && (
            <div className="border border-ink-950/10 bg-ivory-100/40 p-12 text-center text-ink-950 sm:p-16">
              <Car className="mx-auto h-10 w-10 text-stone-400" aria-hidden="true" />
              <h3 className="mt-4 font-display text-2xl">No certified cars match your search</h3>
              <p className="mt-2 text-xs text-stone-600 sm:text-sm">
                Try widening your parameters or reset the search to view all available vehicles.
              </p>
              <button
                type="button"
                onClick={() => setFilters({ page: 1, pageSize: 9 })}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-ink-950/20 bg-ivory-50 px-5 py-2.5 text-[0.65rem] font-semibold tracking-[0.16em] text-brass-500 uppercase hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}

          {!isLoading && !isError && vehicles.length > 0 && (
            <div className="flex flex-col gap-12">
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {vehicles.map((vehicle) => (
                  <UsedVehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-ink-950/10 pt-8">
                  <span className="text-xs text-stone-600">
                    Showing Page <strong className="text-ink-950">{pagination.page}</strong> of{' '}
                    <strong className="text-ink-950">{pagination.totalPages}</strong> (
                    {pagination.total} total vehicles)
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      className="inline-flex items-center gap-1 rounded-md border border-ink-950/20 bg-ivory-50 px-3 py-2 text-xs font-semibold text-ink-950 disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </button>

                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      className="inline-flex items-center gap-1 rounded-md border border-ink-950/20 bg-ivory-50 px-3 py-2 text-xs font-semibold text-ink-950 disabled:opacity-40"
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Trade-In Modal */}
        <TradeInModal isOpen={isTradeInOpen} onClose={() => setIsTradeInOpen(false)} />
      </Container>
    </div>
  );
}
