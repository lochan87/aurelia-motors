import type {
  ApiResponse,
  CancelBookingInput,
  CancelBookingResult,
  CatalogueFilterQuery,
  ChangePasswordInput,
  CreateEnquiryInput,
  CreateEnquiryResponse,
  CreateServiceBookingInput,
  CreateStaffInput,
  CreateTestDriveBookingInput,
  CsvImportPreviewResponse,
  DashboardMetricOverview,
  ExecuteCsvImportResponse,
  LeadDetail,
  LeadFilterQuery,
  LeadMetrics,
  LeadSummary,
  LoginInput,
  LoginResponse,
  ModelDetail,
  ModelSummary,
  OnRoadPriceBreakdown,
  PaginatedResult,
  ServiceAvailabilityResponse,
  ServiceBookingConfirmation,
  ServiceTypeSummary,
  ShowroomSummary,
  StaffUserSummary,
  TestDriveAvailabilityResponse,
  TestDriveBookingConfirmation,
  UnifiedBookingDetails,
  UpdateLeadStatusInput,
  AddLeadNoteInput,
  RecordContactActivityInput,
  ReassignLeadInput,
  UpdateStaffInput,
  UsedVehicleDetail,
  UsedVehicleFilterQuery,
  UsedVehicleSummary,
  WorkshopSummary,
} from '@aurelia/shared';

const rawApiUrl = import.meta.env.VITE_API_URL?.trim();
const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

let currentCsrfToken: string | null = null;

export function setCsrfToken(token: string | null): void {
  currentCsrfToken = token;
}

export function getCsrfToken(): string | null {
  return currentCsrfToken;
}

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
    credentials: 'include',
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (currentCsrfToken) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(bodyData),
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message, body.error.details);
  }

  return body.data;
}

async function patchJson<T, B = unknown>(endpoint: string, bodyData: B): Promise<T> {
  const url = API_BASE.startsWith('http')
    ? new URL(`${API_BASE}${endpoint}`)
    : new URL(`${API_BASE}${endpoint}`, window.location.origin);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (currentCsrfToken) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  const response = await fetch(url.toString(), {
    method: 'PATCH',
    credentials: 'include',
    headers,
    body: JSON.stringify(bodyData),
  });

  const body = (await response.json()) as ApiResponse<T>;
  if (!body.success) {
    throw new ApiError(body.error.code, body.error.message, body.error.details);
  }

  return body.data;
}

export const api = {
  // Showrooms
  getShowrooms: () => fetchJson<ShowroomSummary[]>('/showrooms'),
  getShowroom: (code: string) => fetchJson<ShowroomSummary>(`/showrooms/${code}`),

  // Catalogue
  getModels: (query?: CatalogueFilterQuery) =>
    fetchJson<ModelSummary[]>('/catalogue/models', query as Record<string, unknown>),
  getModel: (slug: string) => fetchJson<ModelDetail>(`/catalogue/models/${slug}`),
  getVariantPricing: (
    variantSlug: string,
    query?: { showroomCode?: string; showroomId?: string },
  ) => fetchJson<OnRoadPriceBreakdown>(`/catalogue/variants/${variantSlug}/pricing`, query),

  // Used Vehicles
  getUsedVehicles: (query?: UsedVehicleFilterQuery) =>
    fetchJson<PaginatedResult<UsedVehicleSummary>>(
      '/used-vehicles',
      query as Record<string, unknown>,
    ),
  getUsedVehicle: (slug: string) => fetchJson<UsedVehicleDetail>(`/used-vehicles/${slug}`),

  // Public Enquiries
  createEnquiry: (data: CreateEnquiryInput) =>
    postJson<CreateEnquiryResponse, CreateEnquiryInput>('/enquiries', data),

  // Staff CRM & Leads
  getLeadMetrics: () => fetchJson<LeadMetrics>('/staff/leads/metrics'),
  getLeads: (query?: LeadFilterQuery) =>
    fetchJson<PaginatedResult<LeadSummary>>('/staff/leads', query as Record<string, unknown>),
  getLead: (id: string) => fetchJson<LeadDetail>(`/staff/leads/${id}`),
  updateLeadStatus: (id: string, data: UpdateLeadStatusInput) =>
    patchJson<LeadDetail, UpdateLeadStatusInput>(`/staff/leads/${id}/status`, data),
  addLeadNote: (id: string, data: AddLeadNoteInput) =>
    postJson<{ message: string }, AddLeadNoteInput>(`/staff/leads/${id}/notes`, data),
  recordContactActivity: (id: string, data: RecordContactActivityInput) =>
    postJson<{ message: string }, RecordContactActivityInput>(
      `/staff/leads/${id}/activities`,
      data,
    ),
  reassignLead: (id: string, data: ReassignLeadInput) =>
    patchJson<{ message: string }, ReassignLeadInput>(`/staff/leads/${id}/assignment`, data),

  // Portal CSV Import (Admin only)
  previewCsvImport: (csvText: string) =>
    postJson<CsvImportPreviewResponse, { csvText: string }>('/staff/leads/import/preview', {
      csvText,
    }),
  executeCsvImport: (data: {
    filename: string;
    source: string;
    rows: Array<{
      rowNumber: number;
      customerName: string;
      phone: string;
      email: string;
      modelName: string;
      showroomName: string;
      source: string;
      message: string;
      externalId?: string;
    }>;
  }) => postJson<ExecuteCsvImportResponse, typeof data>('/staff/leads/import', data),
  getImportBatches: () =>
    fetchJson<
      Array<{
        id: string;
        batchReference: string;
        filename: string;
        source: string;
        totalRows: number;
        importedCount: number;
        duplicateCount: number;
        failedCount: number;
        createdAt: string;
        importedBy: { id: string; fullName: string };
      }>
    >('/staff/leads/imports'),

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

  // Staff Authentication & Sessions
  login: async (credentials: LoginInput): Promise<LoginResponse> => {
    const result = await postJson<LoginResponse>('/auth/login', credentials);
    if (result.csrfToken) {
      setCsrfToken(result.csrfToken);
    }
    return result;
  },
  logout: async (): Promise<{ message: string }> => {
    const result = await postJson<{ message: string }>('/auth/logout', {});
    setCsrfToken(null);
    return result;
  },
  getMe: async (): Promise<{ user: StaffUserSummary; csrfToken: string }> => {
    const result = await fetchJson<{ user: StaffUserSummary; csrfToken: string }>('/auth/me');
    if (result.csrfToken) {
      setCsrfToken(result.csrfToken);
    }
    return result;
  },
  changePassword: (data: ChangePasswordInput) =>
    postJson<{ message: string }>('/auth/change-password', data),

  // Admin Staff Management
  getStaffList: () => fetchJson<StaffUserSummary[]>('/admin/staff'),
  getStaffMember: (id: string) => fetchJson<StaffUserSummary>(`/admin/staff/${id}`),
  createStaffMember: (data: CreateStaffInput) => postJson<StaffUserSummary>('/admin/staff', data),
  updateStaffMember: (id: string, data: UpdateStaffInput) =>
    patchJson<StaffUserSummary>(`/admin/staff/${id}`, data),
  disableStaffMember: (id: string) => postJson<StaffUserSummary>(`/admin/staff/${id}/disable`, {}),

  // Staff Dashboard & Scoped Appointments
  getDashboardOverview: () => fetchJson<DashboardMetricOverview>('/staff/dashboard'),
  getStaffAppointments: () =>
    fetchJson<{
      testDrives: Array<{
        id: string;
        reference: string;
        type: 'TEST_DRIVE';
        title: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        locationName: string;
        startTime: string;
        endTime: string;
        status: string;
      }>;
      services: Array<{
        id: string;
        reference: string;
        type: 'SERVICE';
        title: string;
        customerName: string;
        customerPhone: string;
        customerEmail: string;
        locationName: string;
        startTime: string;
        endTime: string;
        status: string;
        vehiclePlate: string;
      }>;
    }>('/staff/appointments'),
};
