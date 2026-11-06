import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, AlertCircle } from 'lucide-react';
import { formatInrFromPaise, type ShowroomSummary } from '@aurelia/shared';
import { api } from '../../lib/api-client';

interface AdminPriceBookItem {
  id: string;
  code: string;
  name: string;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  showroom?: { name: string } | null;
  _count?: { entries: number };
  entries?: Array<{
    id: string;
    exShowroomPaise: number;
    variant?: {
      name: string;
      fuelType?: string;
      transmission?: string;
      model?: { name: string };
    };
    components?: Array<{
      id: string;
      label: string;
      calculation: string;
      rateBasisPoints?: number;
      fixedAmountPaise?: number;
      amountPaise?: number;
    }>;
  }>;
}

export function AdminPricingPage() {
  const queryClient = useQueryClient();
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [isCreateBookOpen, setIsCreateBookOpen] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const [bookForm, setBookForm] = useState({
    code: '',
    name: '',
    showroomId: '',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    effectiveTo: '',
    notes: '',
  });

  const { data: priceBooksData, isLoading } = useQuery({
    queryKey: ['admin-price-books'],
    queryFn: () => api.adminGetPriceBooks(),
  });

  const { data: bookDetail } = useQuery<AdminPriceBookItem | null>({
    queryKey: ['admin-price-book-detail', selectedBookId],
    queryFn: () =>
      selectedBookId
        ? (api.adminGetPriceBookDetail(selectedBookId) as unknown as Promise<AdminPriceBookItem>)
        : Promise.resolve(null),
    enabled: Boolean(selectedBookId),
  });

  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  const createBookMutation = useMutation({
    mutationFn: (data: typeof bookForm) =>
      api.adminCreatePriceBook({
        ...data,
        effectiveFrom: new Date(data.effectiveFrom).toISOString(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo).toISOString() : null,
        showroomId: data.showroomId || null,
      }),
    onSuccess: (created: Record<string, unknown>) => {
      queryClient.invalidateQueries({ queryKey: ['admin-price-books'] });
      setIsCreateBookOpen(false);
      setSelectedBookId(created.id as string);
      setPublishError(null);
    },
    onError: (err: unknown) =>
      setPublishError(err instanceof Error ? err.message : 'Failed to create price book'),
  });

  const publishMutation = useMutation({
    mutationFn: (id: string) => api.adminPublishPriceBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-price-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-book-detail', selectedBookId] });
      setPublishError(null);
    },
    onError: (err: unknown) =>
      setPublishError(err instanceof Error ? err.message : 'Failed to publish price book'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.adminArchivePriceBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-price-books'] });
      queryClient.invalidateQueries({ queryKey: ['admin-price-book-detail', selectedBookId] });
    },
  });

  const priceBooks = (priceBooksData?.items as unknown as AdminPriceBookItem[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Tariff Governance & Price Books
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">
            On-Road Pricing & Tariffs
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Manage showroom-specific price books, versioned state road taxes, insurance premiums,
            and published tariffs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPublishError(null);
            setIsCreateBookOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Create Draft Price Book
        </button>
      </div>

      {publishError && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{publishError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Price Books List */}
        <div className="space-y-3 lg:col-span-5">
          <h2 className="text-xs font-bold tracking-wider text-stone-600 uppercase">
            Configured Price Books ({priceBooks.length})
          </h2>

          {isLoading ? (
            <div className="p-8 text-center text-xs text-stone-500">Loading price books...</div>
          ) : (
            <div className="space-y-2.5">
              {priceBooks.map((book: AdminPriceBookItem) => (
                <div
                  key={book.id}
                  onClick={() => {
                    setSelectedBookId(book.id);
                    setPublishError(null);
                  }}
                  className={`cursor-pointer rounded-2xl border p-4.5 transition ${
                    selectedBookId === book.id
                      ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{book.code}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            book.status === 'PUBLISHED'
                              ? selectedBookId === book.id
                                ? 'border border-emerald-400/30 bg-emerald-500/20 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800'
                              : book.status === 'DRAFT'
                                ? selectedBookId === book.id
                                  ? 'border border-amber-400/30 bg-amber-500/20 text-amber-300'
                                  : 'bg-amber-100 text-amber-800'
                                : selectedBookId === book.id
                                  ? 'bg-stone-700 text-stone-300'
                                  : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {book.status}
                        </span>
                      </div>
                      <h3
                        className={`mt-1 font-serif text-sm font-bold ${
                          selectedBookId === book.id ? 'text-white' : 'text-stone-900'
                        }`}
                      >
                        {book.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] ${
                        selectedBookId === book.id ? 'text-stone-300' : 'text-stone-500'
                      }`}
                    >
                      {book._count?.entries || 0} variants
                    </span>
                  </div>

                  <div
                    className={`mt-3 flex items-center justify-between border-t pt-2.5 text-[11px] ${
                      selectedBookId === book.id
                        ? 'border-white/10 text-stone-300'
                        : 'border-stone-100 text-stone-500'
                    }`}
                  >
                    <span>{book.showroom?.name || 'All Dealership Locations'}</span>
                    <span>Eff. {new Date(book.effectiveFrom).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Price Book Inspector */}
        <div className="lg:col-span-7">
          {bookDetail ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col justify-between gap-4 border-b border-stone-100 pb-5 md:flex-row md:items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-stone-500">
                      {bookDetail.code}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        bookDetail.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : bookDetail.status === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {bookDetail.status}
                    </span>
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-bold text-stone-900">
                    {bookDetail.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-stone-500">
                    Location: {bookDetail.showroom?.name || 'All Dealership Locations'} · Effective:{' '}
                    {new Date(bookDetail.effectiveFrom).toLocaleDateString()}{' '}
                    {bookDetail.effectiveTo
                      ? `to ${new Date(bookDetail.effectiveTo).toLocaleDateString()}`
                      : '(Ongoing)'}
                  </p>
                </div>

                <div className="flex gap-2">
                  {bookDetail.status === 'DRAFT' && (
                    <button
                      type="button"
                      onClick={() => publishMutation.mutate(bookDetail.id)}
                      disabled={publishMutation.isPending}
                      className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                    >
                      {publishMutation.isPending ? 'Publishing...' : 'Publish Tariff'}
                    </button>
                  )}
                  {bookDetail.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => archiveMutation.mutate(bookDetail.id)}
                      disabled={archiveMutation.isPending}
                      className="rounded-xl border border-stone-300 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                    >
                      Archive Tariff
                    </button>
                  )}
                </div>
              </div>

              {/* Entries and Itemized Tax Breakdown */}
              <div className="mt-6 space-y-4">
                <h3 className="text-xs font-bold tracking-wider text-stone-600 uppercase">
                  Configured Variant Pricing ({bookDetail.entries?.length || 0})
                </h3>

                <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                  {bookDetail.entries?.map((entry) => (
                    <div key={entry.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-stone-900">
                            {entry.variant?.model?.name} {entry.variant?.name}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {entry.variant?.fuelType} · {entry.variant?.transmission}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-stone-500">Ex-Showroom:</span>
                          <div className="font-mono font-bold text-stone-900">
                            {formatInrFromPaise(entry.exShowroomPaise)}
                          </div>
                        </div>
                      </div>

                      {/* Components Breakdown */}
                      {entry.components && entry.components.length > 0 && (
                        <div className="mt-3 space-y-1 rounded-lg bg-stone-50 p-2.5 text-[11px]">
                          {entry.components.map((c) => (
                            <div key={c.id} className="flex justify-between text-stone-600">
                              <span>
                                {c.label}{' '}
                                {c.calculation === 'PERCENT_OF_EXSHOWROOM' &&
                                  c.rateBasisPoints !== undefined && (
                                    <span className="text-[10px] text-stone-400">
                                      ({(c.rateBasisPoints / 100).toFixed(2)}%)
                                    </span>
                                  )}
                              </span>
                              <span className="font-mono">
                                {c.amountPaise
                                  ? formatInrFromPaise(c.amountPaise)
                                  : c.rateBasisPoints
                                    ? formatInrFromPaise(
                                        Math.round(
                                          (entry.exShowroomPaise * c.rateBasisPoints) / 10000,
                                        ),
                                      )
                                    : '₹0'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-300 p-12 text-center text-xs text-stone-500">
              Select a price book from the left to inspect entries and on-road breakdown.
            </div>
          )}
        </div>
      </div>

      {/* Create Price Book Modal */}
      {isCreateBookOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Create Draft Price Book</h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createBookMutation.mutate(bookForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700">Price Book Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PB-LKO-CENTRAL-2027"
                  value={bookForm.code}
                  onChange={(e) => setBookForm({ ...bookForm, code: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">Display Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Central Lucknow 2027 Tariff"
                  value={bookForm.name}
                  onChange={(e) => setBookForm({ ...bookForm, name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">Showroom (Optional)</label>
                <select
                  value={bookForm.showroomId}
                  onChange={(e) => setBookForm({ ...bookForm, showroomId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                >
                  <option value="">All Dealership Locations</option>
                  {showrooms?.map((s: ShowroomSummary) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Effective From *</label>
                  <input
                    type="date"
                    required
                    value={bookForm.effectiveFrom}
                    onChange={(e) => setBookForm({ ...bookForm, effectiveFrom: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>

                <div>
                  <label className="font-medium text-stone-700">Effective To (Optional)</label>
                  <input
                    type="date"
                    value={bookForm.effectiveTo}
                    onChange={(e) => setBookForm({ ...bookForm, effectiveTo: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBookOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBookMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createBookMutation.isPending ? 'Creating...' : 'Create Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
