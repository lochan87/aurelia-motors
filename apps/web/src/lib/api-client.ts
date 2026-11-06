import type {
  AiLeadSummary,
  AiResponseDraft,
  AiVehicleRecommendation,
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
  HomepageBannerDto,
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
  PromotionOfferDto,
  ServiceAvailabilityResponse,
  ServiceBookingConfirmation,
  ServiceTypeSummary,
  ShowroomSummary,
  StaffNotificationDto,
  StaffUserSummary,
  TestDriveAvailabilityResponse,
  TestDriveBookingConfirmation,
  TradeInEstimateResult,
  TradeInRequestDto,
  UnifiedBookingDetails,
  UpdateLeadStatusInput,
  AddLeadNoteInput,
  RecordContactActivityInput,
  ReassignLeadInput,
  UpdateStaffInput,
  UsedCarPriceProposalDto,
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

async function putJson<T, B = unknown>(endpoint: string, bodyData: B): Promise<T> {
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
    method: 'PUT',
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

async function deleteJson<T>(endpoint: string): Promise<T> {
  const url = API_BASE.startsWith('http')
    ? new URL(`${API_BASE}${endpoint}`)
    : new URL(`${API_BASE}${endpoint}`, window.location.origin);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (currentCsrfToken) {
    headers['X-CSRF-Token'] = currentCsrfToken;
  }

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    credentials: 'include',
    headers,
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

  // Public Content & Marketing
  getBanners: () => fetchJson<{ items: HomepageBannerDto[]; total: number }>('/banners'),
  getOffers: () => fetchJson<{ items: PromotionOfferDto[]; total: number }>('/offers'),

  // Public Trade-In Requests
  calculateTradeInEstimate: (data: {
    make: string;
    model: string;
    registrationYear: number;
    mileageKm: number;
    condition: string;
    ownershipCount?: number;
  }) => postJson<TradeInEstimateResult>('/trade-ins/estimate', data),
  submitTradeIn: (data: {
    fullName: string;
    phone: string;
    email: string;
    showroomId: string;
    make: string;
    model: string;
    variant?: string;
    registrationYear: number;
    mileageKm: number;
    ownershipCount?: number;
    condition: string;
    fuelType?: string;
    transmission?: string;
    customerNotes?: string;
    privacyConsent: boolean;
  }) =>
    postJson<{
      reference: string;
      estimatedValuationMinPaise: number;
      estimatedValuationMaxPaise: number;
      disclaimer: string;
      message: string;
    }>('/trade-ins', data),

  // Staff Trade-Ins
  staffGetTradeIns: (status?: string) =>
    fetchJson<{ items: TradeInRequestDto[]; total: number }>('/staff/trade-ins', { status }),
  staffGetTradeInDetail: (id: string) => fetchJson<TradeInRequestDto>(`/staff/trade-ins/${id}`),
  staffUpdateTradeIn: (
    id: string,
    data: { status?: string; offeredValuationPaise?: number; staffNotes?: string },
  ) => patchJson<TradeInRequestDto>(`/staff/trade-ins/${id}`, data),

  // Used Car Pricing Proposals
  proposeUsedCarPrice: (vehicleId: string, data: { proposedPricePaise: number; reason: string }) =>
    postJson<UsedCarPriceProposalDto>(`/staff/used-vehicles/${vehicleId}/propose-price`, data),
  listUsedCarProposals: (params?: { status?: string; usedVehicleId?: string }) =>
    fetchJson<{ items: UsedCarPriceProposalDto[]; total: number }>(
      '/staff/used-car-pricing/proposals',
      params,
    ),
  approvePriceProposal: (id: string, data?: { reviewNotes?: string }) =>
    postJson<UsedCarPriceProposalDto>(
      `/staff/used-car-pricing/proposals/${id}/approve`,
      data || {},
    ),
  rejectPriceProposal: (id: string, data: { reviewNotes: string }) =>
    postJson<UsedCarPriceProposalDto>(`/staff/used-car-pricing/proposals/${id}/reject`, data),

  // Staff Notifications
  getNotifications: () =>
    fetchJson<{ items: StaffNotificationDto[]; total: number }>('/staff/notifications'),
  getUnreadNotificationCount: () =>
    fetchJson<{ unreadCount: number }>('/staff/notifications/unread-count'),
  markNotificationRead: (id: string) =>
    patchJson<StaffNotificationDto>(`/staff/notifications/${id}/read`, {}),
  markAllNotificationsRead: () =>
    postJson<{ markedCount: number }>('/staff/notifications/mark-all-read', {}),

  // AI-Assisted Lead Operations
  getLeadAiSummary: (leadId: string) => postJson<AiLeadSummary>(`/staff/ai/${leadId}/summary`, {}),
  generateLeadResponseDraft: (leadId: string, channel: 'EMAIL' | 'WHATSAPP' | 'PHONE_SCRIPT') =>
    postJson<AiResponseDraft>(`/staff/ai/${leadId}/response-draft`, { channel }),
  getLeadVehicleRecommendations: (leadId: string) =>
    postJson<AiVehicleRecommendation>(`/staff/ai/${leadId}/recommendations`, {}),

  // Admin CMS
  adminGetModels: () =>
    fetchJson<{ items: Record<string, unknown>[]; total: number }>('/admin/cms/models'),
  adminGetModelDetail: (id: string) =>
    fetchJson<Record<string, unknown>>(`/admin/cms/models/${id}`),
  adminCreateModel: (data: Record<string, unknown>) =>
    postJson<Record<string, unknown>>('/admin/cms/models', data),
  adminUpdateModel: (id: string, data: Record<string, unknown>) =>
    patchJson<Record<string, unknown>>(`/admin/cms/models/${id}`, data),
  adminDeactivateModel: (id: string) =>
    deleteJson<Record<string, unknown>>(`/admin/cms/models/${id}`),
  adminCreateVariant: (modelId: string, data: Record<string, unknown>) =>
    postJson<Record<string, unknown>>(`/admin/cms/models/${modelId}/variants`, data),
  adminUpdateVariant: (id: string, data: Record<string, unknown>) =>
    patchJson<Record<string, unknown>>(`/admin/cms/variants/${id}`, data),
  adminDeactivateVariant: (id: string) =>
    deleteJson<Record<string, unknown>>(`/admin/cms/variants/${id}`),
  adminGetInventory: (params?: { showroomId?: string; status?: string }) =>
    fetchJson<{ items: Record<string, unknown>[]; total: number }>('/admin/cms/inventory', params),
  adminCreateInventory: (data: Record<string, unknown>) =>
    postJson<Record<string, unknown>>('/admin/cms/inventory', data),
  adminUpdateInventory: (id: string, data: Record<string, unknown>) =>
    patchJson<Record<string, unknown>>(`/admin/cms/inventory/${id}`, data),
  adminGetPriceBooks: () =>
    fetchJson<{ items: Record<string, unknown>[]; total: number }>('/admin/cms/price-books'),
  adminGetPriceBookDetail: (id: string) =>
    fetchJson<Record<string, unknown>>(`/admin/cms/price-books/${id}`),
  adminCreatePriceBook: (data: Record<string, unknown>) =>
    postJson<Record<string, unknown>>('/admin/cms/price-books', data),
  adminUpsertPriceEntry: (bookId: string, variantId: string, data: Record<string, unknown>) =>
    putJson<Record<string, unknown>>(`/admin/cms/price-books/${bookId}/entries/${variantId}`, data),
  adminPublishPriceBook: (id: string) =>
    postJson<Record<string, unknown>>(`/admin/cms/price-books/${id}/publish`, {}),
  adminArchivePriceBook: (id: string) =>
    postJson<Record<string, unknown>>(`/admin/cms/price-books/${id}/archive`, {}),
  adminGetBanners: () =>
    fetchJson<{ items: HomepageBannerDto[]; total: number }>('/admin/content/banners'),
  adminCreateBanner: (data: Record<string, unknown>) =>
    postJson<HomepageBannerDto>('/admin/content/banners', data),
  adminUpdateBanner: (id: string, data: Record<string, unknown>) =>
    patchJson<HomepageBannerDto>(`/admin/content/banners/${id}`, data),
  adminDeleteBanner: (id: string) =>
    deleteJson<{ success: boolean }>(`/admin/content/banners/${id}`),
  adminGetOffers: () =>
    fetchJson<{ items: PromotionOfferDto[]; total: number }>('/admin/content/offers'),
  adminCreateOffer: (data: Record<string, unknown>) =>
    postJson<PromotionOfferDto>('/admin/content/offers', data),
  adminUpdateOffer: (id: string, data: Record<string, unknown>) =>
    patchJson<PromotionOfferDto>(`/admin/content/offers/${id}`, data),
  adminDeleteOffer: (id: string) => deleteJson<{ success: boolean }>(`/admin/content/offers/${id}`),
};

export const apiClient = api;
