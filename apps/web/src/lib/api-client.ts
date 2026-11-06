import type {
  ApiResponse,
  CatalogueFilterQuery,
  ModelDetail,
  ModelSummary,
  OnRoadPriceBreakdown,
  PaginatedResult,
  ShowroomSummary,
  UsedVehicleDetail,
  UsedVehicleFilterQuery,
  UsedVehicleSummary,
} from '@aurelia/shared';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchJson<T>(endpoint: string, searchParams?: Record<string, unknown>): Promise<T> {
  const url = API_BASE.startsWith('http')
    ? new URL(`${API_BASE}${endpoint}`)
    : new URL(`${API_BASE}${endpoint}`, window.location.origin);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message, body.error.details);
  }

  return body.data;
}

export const api = {
  getShowrooms: () => fetchJson<ShowroomSummary[]>('/showrooms'),
  getShowroom: (code: string) => fetchJson<ShowroomSummary>(`/showrooms/${code}`),

  getModels: (query?: CatalogueFilterQuery) =>
    fetchJson<ModelSummary[]>('/catalogue/models', query as Record<string, unknown>),
  getModel: (slug: string) => fetchJson<ModelDetail>(`/catalogue/models/${slug}`),
  getVariantPricing: (
    variantSlug: string,
    query?: { showroomCode?: string; showroomId?: string },
  ) => fetchJson<OnRoadPriceBreakdown>(`/catalogue/variants/${variantSlug}/pricing`, query),

  getUsedVehicles: (query?: UsedVehicleFilterQuery) =>
    fetchJson<PaginatedResult<UsedVehicleSummary>>(
      '/used-vehicles',
      query as Record<string, unknown>,
    ),
  getUsedVehicle: (slug: string) => fetchJson<UsedVehicleDetail>(`/used-vehicles/${slug}`),
};
