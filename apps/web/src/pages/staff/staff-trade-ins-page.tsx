import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, Phone, MapPin, Edit3 } from 'lucide-react';
import { formatInrFromPaise, type TradeInRequestDto } from '@aurelia/shared';
import { api } from '../../lib/api-client';

export function StaffTradeInsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedTradeIn, setSelectedTradeIn] = useState<TradeInRequestDto | null>(null);
  const [offeredAmountRupees, setOfferedAmountRupees] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [staffNotes, setStaffNotes] = useState<string>('');
  const [updateError, setUpdateError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['staff-trade-ins', statusFilter],
    queryFn: () => api.staffGetTradeIns(statusFilter || undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      status,
      offeredValuationPaise,
      notes,
    }: {
      id: string;
      status?: string;
      offeredValuationPaise?: number;
      notes?: string;
    }) =>
      api.staffUpdateTradeIn(id, {
        status,
        offeredValuationPaise,
        staffNotes: notes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-trade-ins'] });
      handleCloseModal();
    },
    onError: (err: unknown) => {
      setUpdateError(err instanceof Error ? err.message : 'Failed to update trade-in record');
    },
  });

  const handleOpenModal = (item: TradeInRequestDto) => {
    setSelectedTradeIn(item);
    setNewStatus(item.status);
    setOfferedAmountRupees(
      item.offeredValuationPaise ? String(item.offeredValuationPaise / 100) : '',
    );
    setStaffNotes(item.staffNotes || '');
    setUpdateError(null);
  };

  const handleCloseModal = () => {
    setSelectedTradeIn(null);
    setUpdateError(null);
  };

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTradeIn) return;

    const offeredValuationPaise = offeredAmountRupees
      ? Math.round(Number(offeredAmountRupees) * 100)
      : undefined;

    updateMutation.mutate({
      id: selectedTradeIn.id,
      status: newStatus || undefined,
      offeredValuationPaise,
      notes: staffNotes,
    });
  };

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Pre-Owned Exchange Queue
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">
            Trade-In Valuation Requests
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Manage customer car evaluation requests, 140-point technical findings, and official
            exchange offers.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap rounded-xl bg-stone-200/70 p-1 text-xs font-medium">
          {['ALL', 'SUBMITTED', 'EVALUATING', 'OFFERED', 'ACCEPTED', 'CLOSED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s === 'ALL' ? '' : s)}
              className={`rounded-lg px-3 py-1.5 transition ${
                (s === 'ALL' && !statusFilter) || statusFilter === s
                  ? 'bg-white font-semibold text-stone-900 shadow-sm'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading trade-in requests...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <Car className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">
            No trade-in requests found
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {statusFilter
              ? `There are no ${statusFilter.toLowerCase()} requests currently.`
              : 'No trade-in requests submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
            <thead className="bg-stone-50 font-semibold tracking-wider text-stone-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Reference & Date</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Existing Vehicle</th>
                <th className="px-6 py-3.5">Indicative Range</th>
                <th className="px-6 py-3.5">Offered Price</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
              {items.map((t: TradeInRequestDto) => (
                <tr key={t.id} className="transition hover:bg-stone-50/50">
                  <td className="px-6 py-4">
                    <div className="font-mono font-bold text-stone-900">{t.reference}</div>
                    <div className="text-[10px] text-stone-400">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-stone-900">{t.customerName}</div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500">
                      <Phone className="h-3 w-3" />
                      {t.customerPhone}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400">
                      <MapPin className="h-3 w-3" />
                      {t.showroomName}
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <div className="font-semibold text-stone-900">
                      {t.registrationYear} {t.make} {t.model} {t.variant || ''}
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {t.mileageKm.toLocaleString('en-IN')} km · {t.condition} condition
                    </div>
                  </td>

                  <td className="px-6 py-4 font-mono text-[11px] text-stone-600">
                    {formatInrFromPaise(t.estimatedValuationMinPaise)} –{' '}
                    {formatInrFromPaise(t.estimatedValuationMaxPaise)}
                  </td>

                  <td className="px-6 py-4 font-mono text-xs font-bold text-stone-900">
                    {t.offeredValuationPaise ? (
                      <span className="text-emerald-700">
                        {formatInrFromPaise(t.offeredValuationPaise)}
                      </span>
                    ) : (
                      <span className="font-normal text-stone-400 italic">Pending Inspection</span>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                        t.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : t.status === 'OFFERED'
                            ? 'bg-sky-100 text-sky-800'
                            : t.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(t)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm hover:bg-stone-50"
                    >
                      <Edit3 className="h-3 w-3" />
                      Evaluate & Offer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Evaluate & Update Modal */}
      {selectedTradeIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              Evaluate Vehicle: {selectedTradeIn.reference}
            </h3>

            <div className="mt-3 space-y-1.5 rounded-xl bg-stone-50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Vehicle:</span>
                <span className="font-bold text-stone-900">
                  {selectedTradeIn.registrationYear} {selectedTradeIn.make} {selectedTradeIn.model}{' '}
                  ({selectedTradeIn.fuelType || 'Petrol'})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Odometer & Condition:</span>
                <span>
                  {selectedTradeIn.mileageKm.toLocaleString('en-IN')} km ·{' '}
                  {selectedTradeIn.condition}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Indicative Guidance Band:</span>
                <span className="font-mono font-medium">
                  {formatInrFromPaise(selectedTradeIn.estimatedValuationMinPaise)} –{' '}
                  {formatInrFromPaise(selectedTradeIn.estimatedValuationMaxPaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Customer Contact:</span>
                <span>
                  {selectedTradeIn.customerName} ({selectedTradeIn.customerPhone})
                </span>
              </div>
              {selectedTradeIn.customerNotes && (
                <div className="border-t border-stone-200 pt-1 text-stone-600">
                  <span className="font-semibold">Customer Note:</span> "
                  {selectedTradeIn.customerNotes}"
                </div>
              )}
            </div>

            {updateError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {updateError}
              </div>
            )}

            <form onSubmit={handleSaveUpdate} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-stone-700">Workflow Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-stone-500 focus:outline-none"
                  >
                    <option value="SUBMITTED">SUBMITTED</option>
                    <option value="EVALUATING">EVALUATING (Under 140-point Inspection)</option>
                    <option value="OFFERED">OFFERED (Formal Price Issued)</option>
                    <option value="ACCEPTED">ACCEPTED (Customer Confirmed Exchange)</option>
                    <option value="REJECTED">REJECTED (Customer Declined Offer)</option>
                    <option value="CLOSED">CLOSED (Deal Finalized)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-stone-700">
                    Formal Offered Valuation (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="e.g. 575000"
                    value={offeredAmountRupees}
                    onChange={(e) => setOfferedAmountRupees(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono text-xs focus:border-stone-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-stone-700">
                  Inspection & Staff Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Notes on tyre tread depth, body scratches, insurance validity, RC status..."
                  value={staffNotes}
                  onChange={(e) => setStaffNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 text-xs focus:border-stone-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 disabled:opacity-50"
                >
                  {updateMutation.isPending ? 'Saving...' : 'Update Valuation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
