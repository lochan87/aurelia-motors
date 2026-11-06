import type {
  ApiResponse,
  CancelBookingInput,
  CancelBookingResult,
  CatalogueFilterQuery,
  CreateServiceBookingInput,
  CreateTestDriveBookingInput,
  ModelDetail,
  ModelSummary,
  OnRoadPriceBreakdown,
  PaginatedResult,
  ServiceAvailabilityResponse,
  ServiceBookingConfirmation,
  ServiceTypeSummary,
  ShowroomSummary,
  TestDriveAvailabilityResponse,
  TestDriveBookingConfirmation,
  UnifiedBookingDetails,
  UsedVehicleDetail,
  UsedVehicleFilterQuery,
  UsedVehicleSummary,
  WorkshopSummary,
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

async function postJson<T, B = unknown>(endpoint: string, bodyData: B): Promise<T> {
  const url = API_BASE.startsWith('http')
    ? new URL(`${API_BASE}${endpoint}`)
    : new URL(`${API_BASE}${endpoint}`, window.location.origin);

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(bodyData),
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

  // Test Drives
  getTestDriveAvailability: (query: { showroomId: string; variantId: string; date: string }) =>
    fetchJson<TestDriveAvailabilityResponse>('/test-drives/availability', query),
  bookTestDrive: (data: CreateTestDriveBookingInput) =>
    postJson<TestDriveBookingConfirmation, CreateTestDriveBookingInput>('/test-drives', data),

  // Workshops & Services
  getWorkshops: () => fetchJson<WorkshopSummary[]>('/services/workshops'),
  getServiceTypes: () => fetchJson<ServiceTypeSummary[]>('/services/types'),
  getServiceAvailability: (query: { workshopId: string; serviceTypeId: string; date: string }) =>
    fetchJson<ServiceAvailabilityResponse>('/services/availability', query),
  bookService: (data: CreateServiceBookingInput) =>
    postJson<ServiceBookingConfirmation, CreateServiceBookingInput>('/services/bookings', data),

  // Booking Confirmation & Cancellation
  getBookingConfirmation: (reference: string, token?: string) =>
    fetchJson<UnifiedBookingDetails>(`/bookings/confirmation/${reference}`, { token }),
  cancelBooking: (reference: string, data: CancelBookingInput) =>
    postJson<CancelBookingResult, CancelBookingInput>(`/bookings/${reference}/cancel`, data),
};
