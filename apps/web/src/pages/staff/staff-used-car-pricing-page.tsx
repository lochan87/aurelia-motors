import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, Clock, User } from 'lucide-react';
import { formatInrFromPaise, type UsedCarPriceProposalDto } from '@aurelia/shared';
import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';

export function StaffUsedCarPricingPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [selectedProposal, setSelectedProposal] = useState<UsedCarPriceProposalDto | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['used-car-proposals', statusFilter],
    queryFn: () => api.listUsedCarProposals({ status: statusFilter || undefined }),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      api.approvePriceProposal(id, { reviewNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['used-car-proposals'] });
      handleCloseModal();
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Failed to approve proposal');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      api.rejectPriceProposal(id, { reviewNotes: notes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['used-car-proposals'] });
      handleCloseModal();
    },
    onError: (err: unknown) => {
      setActionError(err instanceof Error ? err.message : 'Failed to reject proposal');
    },
  });

  const handleCloseModal = () => {
    setSelectedProposal(null);
    setActionType(null);
    setReviewNotes('');
    setActionError(null);
  };

  const handleConfirmAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProposal || !actionType) return;

    if (actionType === 'REJECT' && !reviewNotes.trim()) {
      setActionError('Please provide a reason for rejecting this price proposal');
      return;
    }

    if (actionType === 'APPROVE') {
      approveMutation.mutate({ id: selectedProposal.id, notes: reviewNotes });
    } else {
      rejectMutation.mutate({ id: selectedProposal.id, notes: reviewNotes });
    }
  };

  const proposals = data?.items || [];
  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Governance & Pricing Approvals
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">
            Used-Car Price Revision Proposals
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Enforces strict two-person separation of duties before any pre-owned inventory price
            changes go live.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex rounded-xl bg-stone-200/70 p-1 text-xs font-medium">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s === 'ALL' ? '' : s)}
              className={`rounded-lg px-3.5 py-1.5 transition ${
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
        <div className="p-12 text-center text-xs text-stone-500">Loading price proposals...</div>
      ) : proposals.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-12 text-center">
          <Clock className="mx-auto h-10 w-10 text-stone-300" />
          <h3 className="mt-3 font-serif text-lg font-bold text-stone-900">
            No price proposals found
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {statusFilter
              ? `There are no ${statusFilter.toLowerCase()} proposals currently.`
              : 'No proposals submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
            <thead className="bg-stone-50 font-semibold tracking-wider text-stone-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Current Price</th>
                <th className="px-6 py-3.5">Proposed Price</th>
                <th className="px-6 py-3.5">Difference</th>
                <th className="px-6 py-3.5">Proposer & Reason</th>
                <th className="px-6 py-3.5">Status</th>
                {isAdmin && <th className="px-6 py-3.5 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
              {proposals.map((p: UsedCarPriceProposalDto) => {
                const isPriceDrop = p.differencePaise < 0;
                const isProposer = p.proposedByStaffId === user?.id;

                return (
                  <tr key={p.id} className="transition hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-stone-900">{p.usedVehicleTitle}</div>
                      <div className="font-mono text-[10px] text-stone-400">
                        Submitted {new Date(p.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-medium text-stone-600">
                      {formatInrFromPaise(p.currentPricePaise)}
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-stone-900">
                      {formatInrFromPaise(p.proposedPricePaise)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[11px] font-bold ${
                          isPriceDrop
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {isPriceDrop ? '-' : '+'}
                        {formatInrFromPaise(Math.abs(p.differencePaise))}
                      </span>
                    </td>

                    <td className="max-w-xs px-6 py-4">
                      <div className="flex items-center gap-1 font-medium text-stone-900">
                        <User className="h-3 w-3 text-stone-400" />
                        {p.proposedByStaffName}
                      </div>
                      <p className="mt-0.5 truncate text-stone-600" title={p.reason}>
                        "{p.reason}"
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : p.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {p.status === 'APPROVED' && <CheckCircle2 className="h-3 w-3" />}
                        {p.status === 'REJECTED' && <XCircle className="h-3 w-3" />}
                        {p.status === 'PENDING' && <Clock className="h-3 w-3" />}
                        {p.status}
                      </span>
                      {p.reviewedByStaffName && (
                        <div className="mt-1 text-[10px] text-stone-400">
                          Reviewed by {p.reviewedByStaffName}
                        </div>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        {p.status === 'PENDING' ? (
                          isProposer ? (
                            <span
                              className="text-[11px] text-stone-400 italic"
                              title="You cannot approve your own proposal"
                            >
                              Self-Approval Blocked
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProposal(p);
                                  setActionType('APPROVE');
                                }}
                                className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProposal(p);
                                  setActionType('REJECT');
                                }}
                                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                              >
                                Reject
                              </button>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] text-stone-400">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Approve / Reject Modal */}
      {selectedProposal && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">
              {actionType === 'APPROVE' ? 'Approve Price Revision' : 'Reject Price Proposal'}
            </h3>

            <p className="mt-2 text-xs text-stone-600">
              Vehicle:{' '}
              <span className="font-bold text-stone-900">{selectedProposal.usedVehicleTitle}</span>
            </p>

            <div className="mt-4 space-y-1 rounded-xl bg-stone-50 p-3 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Current Price:</span>
                <span className="font-mono font-medium">
                  {formatInrFromPaise(selectedProposal.currentPricePaise)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Proposed Price:</span>
                <span className="font-mono font-bold text-stone-900">
                  {formatInrFromPaise(selectedProposal.proposedPricePaise)}
                </span>
              </div>
              <div className="flex justify-between border-t border-stone-200 pt-1">
                <span className="text-stone-500">Proposer:</span>
                <span>{selectedProposal.proposedByStaffName}</span>
              </div>
            </div>

            {actionError && (
              <div className="mt-4 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-stone-700">
                  {actionType === 'APPROVE' ? 'Approval Notes (Optional)' : 'Rejection Reason *'}
                </label>
                <textarea
                  rows={3}
                  required={actionType === 'REJECT'}
                  placeholder={
                    actionType === 'APPROVE'
                      ? 'e.g. Market revision verified and aligned with festive targets.'
                      : 'e.g. Price reduction exceeds standard showroom threshold.'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
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
                  disabled={approveMutation.isPending || rejectMutation.isPending}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-sm ${
                    actionType === 'APPROVE'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : 'bg-rose-700 hover:bg-rose-800'
                  }`}
                >
                  {approveMutation.isPending || rejectMutation.isPending
                    ? 'Processing...'
                    : actionType === 'APPROVE'
                      ? 'Confirm & Publish Price'
                      : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
