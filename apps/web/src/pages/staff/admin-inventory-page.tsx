import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { api } from '../../lib/api-client';
import type { ShowroomSummary } from '@aurelia/shared';

interface AdminVariantItem {
  id: string;
  name: string;
  slug?: string;
  fuelType: string;
  transmission: string;
  powerBhp?: number | null;
}

interface AdminModelItem {
  id: string;
  name: string;
  make: string;
  bodyType: string;
  slug: string;
  summary: string;
  isActive?: boolean;
  variants?: AdminVariantItem[];
}

interface AdminInventoryItem {
  id: string;
  stockNumber: string;
  manufactureYear: number;
  status: string;
  colour?: { name: string };
  variant?: {
    name: string;
    fuelType?: string;
    model?: { name: string };
  };
  showroom?: { name: string };
}

export function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'MODELS' | 'STOCK'>('MODELS');

  // Modals state
  const [isCreateModelOpen, setIsCreateModelOpen] = useState(false);
  const [isCreateVariantOpen, setIsCreateVariantOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [selectedModelIdForVariant, setSelectedModelIdForVariant] = useState<string>('');

  // Form states
  const [modelForm, setModelForm] = useState({
    name: '',
    make: 'Vantara',
    slug: '',
    bodyType: 'SEDAN',
    summary: '',
    description: '',
  });

  const [variantForm, setVariantForm] = useState({
    name: '',
    slug: '',
    fuelType: 'PETROL',
    transmission: 'AUTOMATIC',
    engineCapacityCc: 1498,
    powerBhp: 120,
    torqueNm: 150,
  });

  const [stockForm, setStockForm] = useState({
    showroomId: '',
    variantId: '',
    stockNumber: '',
    manufactureYear: 2026,
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Queries
  const { data: modelsData, isLoading: isModelsLoading } = useQuery({
    queryKey: ['admin-models'],
    queryFn: () => api.adminGetModels(),
  });

  const { data: inventoryData, isLoading: isInventoryLoading } = useQuery({
    queryKey: ['admin-inventory'],
    queryFn: () => api.adminGetInventory(),
    enabled: activeTab === 'STOCK',
  });

  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  // Mutations
  const createModelMutation = useMutation({
    mutationFn: (data: typeof modelForm) => api.adminCreateModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      setIsCreateModelOpen(false);
      setModelForm({
        name: '',
        make: 'Vantara',
        slug: '',
        bodyType: 'SEDAN',
        summary: '',
        description: '',
      });
      setFormError(null);
    },
    onError: (err: unknown) =>
      setFormError(err instanceof Error ? err.message : 'Failed to create model'),
  });

  const createVariantMutation = useMutation({
    mutationFn: (data: typeof variantForm) =>
      api.adminCreateVariant(selectedModelIdForVariant, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      setIsCreateVariantOpen(false);
      setFormError(null);
    },
    onError: (err: unknown) =>
      setFormError(err instanceof Error ? err.message : 'Failed to create variant'),
  });

  const createStockMutation = useMutation({
    mutationFn: (data: typeof stockForm) => api.adminCreateInventory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inventory'] });
      setIsAddStockOpen(false);
      setFormError(null);
    },
    onError: (err: unknown) =>
      setFormError(err instanceof Error ? err.message : 'Failed to add stock unit'),
  });

  const models = (modelsData?.items as unknown as AdminModelItem[]) || [];
  const inventory = (inventoryData?.items as unknown as AdminInventoryItem[]) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <span className="text-xs font-semibold tracking-wider text-amber-700 uppercase">
            Catalogue & Stock Operations
          </span>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">
            Vehicle & Inventory CMS
          </h1>
          <p className="mt-1 text-xs text-stone-500">
            Create and maintain vehicle models, powertrain variants, and physical showroom inventory
            stock units.
          </p>
        </div>

        <div className="flex gap-2">
          {activeTab === 'MODELS' ? (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsCreateModelOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Add Vehicle Model
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                setIsAddStockOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-stone-800"
            >
              <Plus className="h-4 w-4" />
              Add Stock Unit
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setActiveTab('MODELS')}
          className={`border-b-2 px-6 py-3 text-xs font-bold transition ${
            activeTab === 'MODELS'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Vehicle Models & Variants ({models.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('STOCK')}
          className={`border-b-2 px-6 py-3 text-xs font-bold transition ${
            activeTab === 'STOCK'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-700'
          }`}
        >
          Physical Showroom Inventory Stock
        </button>
      </div>

      {/* Content */}
      {activeTab === 'MODELS' ? (
        isModelsLoading ? (
          <div className="p-12 text-center text-xs text-stone-500">Loading catalogue models...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {models.map((model: AdminModelItem) => (
              <div
                key={model.id}
                className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-stone-700 uppercase">
                      {model.bodyType}
                    </span>
                    <h3 className="mt-2 font-serif text-xl font-bold text-stone-900">
                      {model.make} {model.name}
                    </h3>
                    <p className="mt-1 text-xs text-stone-500">{model.summary}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      model.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {model.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Variants List */}
                <div className="mt-6 border-t border-stone-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-700">
                      Variants ({model.variants?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModelIdForVariant(model.id);
                        setFormError(null);
                        setIsCreateVariantOpen(true);
                      }}
                      className="text-[11px] font-semibold text-amber-700 hover:underline"
                    >
                      + Add Variant
                    </button>
                  </div>

                  <div className="mt-3 space-y-2">
                    {model.variants?.map((v: AdminVariantItem) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between rounded-xl bg-stone-50 p-2.5 text-xs"
                      >
                        <div>
                          <div className="font-semibold text-stone-900">{v.name}</div>
                          <div className="text-[10px] text-stone-500">
                            {v.fuelType} · {v.transmission}
                            {v.powerBhp ? ` · ${v.powerBhp} BHP` : ''}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-stone-400">/{v.slug}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : isInventoryLoading ? (
        <div className="p-12 text-center text-xs text-stone-500">Loading showroom stock...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-left text-xs">
            <thead className="bg-stone-50 font-semibold tracking-wider text-stone-600 uppercase">
              <tr>
                <th className="px-6 py-3.5">Stock Number</th>
                <th className="px-6 py-3.5">Vehicle</th>
                <th className="px-6 py-3.5">Showroom</th>
                <th className="px-6 py-3.5">Manufacture Year</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal text-stone-800">
              {inventory.map((unit: AdminInventoryItem) => (
                <tr key={unit.id} className="hover:bg-stone-50/50">
                  <td className="px-6 py-4 font-mono font-bold text-stone-900">
                    {unit.stockNumber}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-stone-900">
                      {unit.variant?.model?.name} {unit.variant?.name}
                    </div>
                    <div className="text-[10px] text-stone-500">
                      {unit.colour?.name || 'Standard Shade'}
                    </div>
                  </td>
                  <td className="px-6 py-4">{unit.showroom?.name}</td>
                  <td className="px-6 py-4 font-mono">{unit.manufactureYear}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        unit.status === 'AVAILABLE'
                          ? 'bg-emerald-100 text-emerald-800'
                          : unit.status === 'RESERVED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      {unit.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Model Modal */}
      {isCreateModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Add Vehicle Model</h3>
            {formError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createModelMutation.mutate(modelForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Make / Brand *</label>
                  <input
                    type="text"
                    required
                    value={modelForm.make}
                    onChange={(e) => setModelForm({ ...modelForm, make: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Aethel"
                    value={modelForm.name}
                    onChange={(e) =>
                      setModelForm({
                        ...modelForm,
                        name: e.target.value,
                        slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">URL Slug *</label>
                  <input
                    type="text"
                    required
                    value={modelForm.slug}
                    onChange={(e) => setModelForm({ ...modelForm, slug: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">Body Type *</label>
                  <select
                    value={modelForm.bodyType}
                    onChange={(e) => setModelForm({ ...modelForm, bodyType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  >
                    <option value="SEDAN">SEDAN</option>
                    <option value="SUV">SUV</option>
                    <option value="HATCHBACK">HATCHBACK</option>
                    <option value="CROSSOVER">CROSSOVER</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-medium text-stone-700">Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="One-line elevator pitch..."
                  value={modelForm.summary}
                  onChange={(e) => setModelForm({ ...modelForm, summary: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">Detailed Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Full editorial description..."
                  value={modelForm.description}
                  onChange={(e) => setModelForm({ ...modelForm, description: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModelOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModelMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createModelMutation.isPending ? 'Saving...' : 'Create Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Variant Modal */}
      {isCreateVariantOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Add Variant</h3>
            {formError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createVariantMutation.mutate(variantForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700">Variant Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prestige Turbo CVT"
                  value={variantForm.name}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      name: e.target.value,
                      slug: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                />
              </div>

              <div>
                <label className="font-medium text-stone-700">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={variantForm.slug}
                  onChange={(e) => setVariantForm({ ...variantForm, slug: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Fuel Type *</label>
                  <select
                    value={variantForm.fuelType}
                    onChange={(e) => setVariantForm({ ...variantForm, fuelType: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  >
                    <option value="PETROL">PETROL</option>
                    <option value="DIESEL">DIESEL</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-stone-700">Transmission *</label>
                  <select
                    value={variantForm.transmission}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, transmission: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  >
                    <option value="MANUAL">MANUAL</option>
                    <option value="AUTOMATIC">AUTOMATIC</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-stone-700">Power (BHP)</label>
                  <input
                    type="number"
                    value={variantForm.powerBhp}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, powerBhp: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
                <div>
                  <label className="font-medium text-stone-700">Torque (Nm)</label>
                  <input
                    type="number"
                    value={variantForm.torqueNm}
                    onChange={(e) =>
                      setVariantForm({ ...variantForm, torqueNm: Number(e.target.value) })
                    }
                    className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateVariantOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVariantMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createVariantMutation.isPending ? 'Saving...' : 'Add Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stock Unit Modal */}
      {isAddStockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-serif text-xl font-bold text-stone-900">Add Inventory Unit</h3>
            {formError && (
              <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700">
                {formError}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createStockMutation.mutate(stockForm);
              }}
              className="mt-4 space-y-4 text-xs"
            >
              <div>
                <label className="font-medium text-stone-700">Showroom Location *</label>
                <select
                  required
                  value={stockForm.showroomId}
                  onChange={(e) => setStockForm({ ...stockForm, showroomId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                >
                  <option value="">Select Showroom</option>
                  {showrooms?.map((s: ShowroomSummary) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-stone-700">Variant *</label>
                <select
                  required
                  value={stockForm.variantId}
                  onChange={(e) => setStockForm({ ...stockForm, variantId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2"
                >
                  <option value="">Select Variant</option>
                  {models.flatMap((m: AdminModelItem) =>
                    (m.variants || []).map((v: AdminVariantItem) => (
                      <option key={v.id} value={v.id}>
                        {m.name} {v.name} ({v.fuelType})
                      </option>
                    )),
                  )}
                </select>
              </div>

              <div>
                <label className="font-medium text-stone-700">Stock Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STK-LUM-2026-0042"
                  value={stockForm.stockNumber}
                  onChange={(e) => setStockForm({ ...stockForm, stockNumber: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 p-2 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStockOpen(false)}
                  className="rounded-lg border border-stone-300 px-4 py-2 font-semibold text-stone-700 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStockMutation.isPending}
                  className="rounded-lg bg-stone-900 px-5 py-2 font-semibold text-white shadow-sm hover:bg-stone-800"
                >
                  {createStockMutation.isPending ? 'Saving...' : 'Add Stock Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
