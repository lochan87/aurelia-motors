import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Calendar } from 'lucide-react';
import type { HomepageBannerDto, PromotionOfferDto } from '@aurelia/shared';
import { api } from '../../lib/api-client';

export function AdminContentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'BANNERS' | 'OFFERS'>('BANNERS');

  const [isCreateBannerOpen, setIsCreateBannerOpen] = useState(false);
  const [isCreateOfferOpen, setIsCreateOfferOpen] = useState(false);

  const [bannerForm, setBannerForm] = useState({
    headline: '',
    subheadline: '',
    badgeText: '',
    imageUrl: '',
    ctaLabel: 'Explore Details',
    ctaUrl: '/test-drive',
    displayOrder: 1,
  });

  const [offerForm, setOfferForm] = useState(() => {
    const today = new Date();
    const thirtyDaysAhead = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return {
      title: '',
      description: '',
      badgeText: '',
      imageUrl: '',
      ctaLabel: 'Enquire Now',
      ctaUrl: '/contact',
      startDate: today.toISOString().slice(0, 10),
      endDate: thirtyDaysAhead.toISOString().slice(0, 10),
      displayOrder: 1,
    };
  });

  const { data: bannersData, isLoading: isBannersLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: () => api.adminGetBanners(),
  });

  const { data: offersData, isLoading: isOffersLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => api.adminGetOffers(),
  });

  const createBannerMutation = useMutation({
    mutationFn: (data: typeof bannerForm) => api.adminCreateBanner(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setIsCreateBannerOpen(false);
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: typeof offerForm) =>
      api.adminCreateOffer({
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      setIsCreateOfferOpen(false);
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteOffer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-offers'] }),
  });

  const banners = bannersData?.items || [];
  const offers = offersData?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Marketing & Website Content CMS
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">
            Banners & Promotional Campaigns
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Manage public website hero banners, festival campaigns, seasonal financing schemes, and
            workshop clinics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (activeTab === 'BANNERS') setIsCreateBannerOpen(true);
            else setIsCreateOfferOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          {activeTab === 'BANNERS' ? 'Add Homepage Banner' : 'Add Promotion Offer'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('BANNERS')}
          className={`border-b-2 px-6 py-3 text-xs font-bold transition ${
            activeTab === 'BANNERS'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Homepage Banners ({banners.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('OFFERS')}
          className={`border-b-2 px-6 py-3 text-xs font-bold transition ${
            activeTab === 'OFFERS'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Promotional Offers & Schemes ({offers.length})
        </button>
      </div>

      {activeTab === 'BANNERS' ? (
        isBannersLoading ? (
          <div className="p-12 text-center text-xs text-stone-500">Loading banners...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {banners.map((b: HomepageBannerDto) => (
              <div
                key={b.id}
                className="flex flex-col justify-between overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
              >
                <div>
                  <div className="relative aspect-16/9 w-full bg-stone-900">
                    <img
                      src={b.imageUrl}
                      alt={b.headline}
                      className="h-full w-full object-cover opacity-80"
                    />
                    {b.badgeText && (
                      <span className="absolute top-3 left-3 rounded-full bg-amber-500/90 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
                        {b.badgeText}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <h3 className="font-serif text-lg font-bold text-stone-900">{b.headline}</h3>
                    {b.subheadline && (
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{b.subheadline}</p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-800">
                      <span>CTA: {b.ctaLabel}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-stone-400">{b.ctaUrl}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-stone-100 bg-stone-50 px-5 py-3 text-xs">
                  <span className="font-mono text-[11px] text-stone-500">
                    Order: {b.displayOrder}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteBannerMutation.mutate(b.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-rose-700 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : isOffersLoading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading promotional offers...</div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {offers.map((o: PromotionOfferDto) => (
            <div
              key={o.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
            >
              <div>
                {o.badgeText && (
                  <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                    {o.badgeText}
                  </span>
                )}
                <h3 className="mt-2.5 font-serif text-base font-bold text-stone-900">{o.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-stone-600">{o.description}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-stone-400">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Valid: {new Date(o.startDate).toLocaleDateString()} to{' '}
                    {new Date(o.endDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-stone-100 pt-3 text-xs">
                <span className="text-[11px] font-semibold text-amber-700">CTA: {o.ctaLabel}</span>
                <button
                  type="button"
                  onClick={() => deleteOfferMutation.mutate(o.id)}
                  className="text-stone-400 hover:text-rose-700"
                  title="Delete Offer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Banner Modal */}
      {isCreateBannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Add Homepage Banner</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createBannerMutation.mutate(bannerForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700">Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. All-Electric Vantara E-Pulse Available in Lucknow"
                  value={bannerForm.headline}
                  onChange={(e) => setBannerForm({ ...bannerForm, headline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">Subheadline (Optional)</label>
                <input
                  type="text"
                  placeholder="Supporting subtitle text..."
                  value={bannerForm.subheadline}
                  onChange={(e) => setBannerForm({ ...bannerForm, subheadline: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Badge Label</label>
                  <input
                    type="text"
                    placeholder="e.g. Festive Special"
                    value={bannerForm.badgeText}
                    onChange={(e) => setBannerForm({ ...bannerForm, badgeText: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">Display Order</label>
                  <input
                    type="number"
                    value={bannerForm.displayOrder}
                    onChange={(e) =>
                      setBannerForm({ ...bannerForm, displayOrder: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700">Background Image URL *</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">CTA Label *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.ctaLabel}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaLabel: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">CTA Destination URL *</label>
                  <input
                    type="text"
                    required
                    value={bannerForm.ctaUrl}
                    onChange={(e) => setBannerForm({ ...bannerForm, ctaUrl: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateBannerOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createBannerMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createBannerMutation.isPending ? 'Publishing...' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Offer Modal */}
      {isCreateOfferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Add Promotion Offer</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createOfferMutation.mutate(offerForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700">Campaign Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Festival Exchange Bonus Scheme"
                  value={offerForm.title}
                  onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">Offer Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Terms and benefit details..."
                  value={offerForm.description}
                  onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Badge Text</label>
                  <input
                    type="text"
                    placeholder="e.g. Save ₹50,000"
                    value={offerForm.badgeText}
                    onChange={(e) => setOfferForm({ ...offerForm, badgeText: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">Display Order</label>
                  <input
                    type="number"
                    value={offerForm.displayOrder}
                    onChange={(e) =>
                      setOfferForm({ ...offerForm, displayOrder: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={offerForm.startDate}
                    onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={offerForm.endDate}
                    onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOfferOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOfferMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createOfferMutation.isPending ? 'Publishing...' : 'Publish Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
