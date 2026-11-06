export type LeadSource =
  | 'WEB_ENQUIRY'
  | 'TEST_DRIVE_REQUEST'
  | 'SERVICE_REQUEST'
  | 'PORTAL_IMPORT'
  | 'PHONE_INQUIRY'
  | 'WALK_IN';

export type LeadStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'TEST_DRIVE_SCHEDULED'
  | 'NEGOTIATING'
  | 'WON'
  | 'LOST';

export type PreferredContactMethod = 'PHONE' | 'EMAIL' | 'WHATSAPP';

export type LeadType = 'NEW_CAR' | 'USED_CAR' | 'SERVICE' | 'GENERAL';

export interface CreateEnquiryInput {
  fullName: string;
  phone: string;
  email: string;
  showroomId: string;
  modelId?: string;
  variantId?: string;
  usedVehicleId?: string;
  customerRequirements?: string;
  preferredContactMethod?: PreferredContactMethod;
  privacyConsent: boolean;
}

export interface CreateEnquiryResponse {
  leadReference: string;
  assignmentDurationMs?: number;
  message: string;
}

export interface LeadSummary {
  id: string;
  leadReference: string;
  type: LeadType;
  source: LeadSource;
  status: LeadStatus;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  vehicleInterest: string;
  showroomName: string;
  showroomId: string;
  assignedStaffName: string | null;
  assignedStaffId: string | null;
  firstResponseAt: string | null;
  lastContactedAt: string | null;
  createdAt: string;
  isOverdue: boolean;
  responseTimeMinutes: number | null;
  consentStatus?: string | null;
}

export interface LeadActivityItem {
  id: string;
  activityType: string;
  summary: string;
  details: string | null;
  staffName: string | null;
  createdAt: string;
}

export interface LeadNoteItem {
  id: string;
  content: string;
  staffName: string;
  createdAt: string;
}

export interface LeadStatusHistoryItem {
  id: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  changedByName: string | null;
  reason: string | null;
  createdAt: string;
}

export interface LeadDetail extends LeadSummary {
  preferredContactMethod: PreferredContactMethod;
  customerRequirements: string | null;
  externalLeadId: string | null;
  assignedAt: string | null;
  closedAt: string | null;
  lostReason: string | null;
  activities: LeadActivityItem[];
  notes: LeadNoteItem[];
  statusHistory: LeadStatusHistoryItem[];
}

export interface LeadFilterQuery {
  status?: LeadStatus | 'ALL';
  source?: LeadSource | 'ALL';
  showroomId?: string;
  assignedStaffId?: string;
  search?: string;
  sortBy?: 'newest' | 'oldest' | 'urgency' | 'status';
  page?: number;
  pageSize?: number;
}

export interface UpdateLeadStatusInput {
  status: LeadStatus;
  reason?: string;
  notes?: string;
}

export interface AddLeadNoteInput {
  content: string;
}

export interface RecordContactActivityInput {
  contactMethod: 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON';
  summary: string;
  details?: string;
  updateStatus?: LeadStatus;
}

export interface ReassignLeadInput {
  staffUserId: string;
  reason?: string;
}

export interface LeadMetrics {
  totalLeads: number;
  newLeads: number;
  assignedLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  wonLeads: number;
  lostLeads: number;
  overdueLeads: number;
  unassignedLeads: number;
  averageResponseTimeMinutes: number | null;
  responseSlaMinutes: number;
  slaComplianceRatePercent: number | null;
  leadsByShowroom: Record<string, number>;
}

export interface CsvImportPreviewRow {
  rowNumber: number;
  customerName: string;
  phone: string;
  email: string;
  modelName: string;
  showroomName: string;
  source: string;
  message: string;
  externalId?: string;
  isValid: boolean;
  isDuplicate: boolean;
  validationError?: string;
}

export interface CsvImportPreviewResponse {
  totalRows: number;
  validRows: number;
  duplicateRows: number;
  invalidRows: number;
  preview: CsvImportPreviewRow[];
}

export interface ExecuteCsvImportResponse {
  batchReference: string;
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  failedCount: number;
}
