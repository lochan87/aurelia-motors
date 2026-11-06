import { z } from 'zod';

export const indianPhoneRegex = /^(\+91[-\s]?)?[6-9]\d{9}$/;

export const createEnquirySchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name cannot exceed 100 characters'),
  phone: z
    .string()
    .trim()
    .regex(
      indianPhoneRegex,
      'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210)',
    ),
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  showroomId: z.string().min(1, 'Please select a preferred showroom'),
  modelId: z.string().min(1).optional(),
  variantId: z.string().min(1).optional(),
  usedVehicleId: z.string().min(1).optional(),
  customerRequirements: z.string().trim().max(1000).optional(),
  preferredContactMethod: z.enum(['PHONE', 'EMAIL', 'WHATSAPP']).default('PHONE'),
  privacyConsent: z.boolean().refine((val): val is true => val === true, {
    message: 'DPDP Act 2023 privacy consent is required',
  }),
});

export const leadFilterSchema = z.object({
  status: z
    .enum([
      'NEW',
      'ASSIGNED',
      'CONTACTED',
      'QUALIFIED',
      'TEST_DRIVE_SCHEDULED',
      'NEGOTIATING',
      'WON',
      'LOST',
      'ALL',
    ])
    .optional(),
  source: z
    .enum([
      'WEB_ENQUIRY',
      'TEST_DRIVE_REQUEST',
      'SERVICE_REQUEST',
      'PORTAL_IMPORT',
      'PHONE_INQUIRY',
      'WALK_IN',
      'ALL',
    ])
    .optional(),
  showroomId: z.string().optional(),
  assignedStaffId: z.string().optional(),
  search: z.string().trim().optional(),
  sortBy: z.enum(['newest', 'oldest', 'urgency', 'status']).default('urgency'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const leadParamsSchema = z.object({
  id: z.string().min(1, 'Lead ID is required'),
});

export const updateLeadStatusSchema = z.object({
  status: z.enum([
    'NEW',
    'ASSIGNED',
    'CONTACTED',
    'QUALIFIED',
    'TEST_DRIVE_SCHEDULED',
    'NEGOTIATING',
    'WON',
    'LOST',
  ]),
  reason: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const addLeadNoteSchema = z.object({
  content: z.string().trim().min(2, 'Note cannot be empty').max(2000),
});

export const recordContactActivitySchema = z.object({
  contactMethod: z.enum(['PHONE', 'EMAIL', 'WHATSAPP', 'IN_PERSON']),
  summary: z.string().trim().min(2, 'Summary must be at least 2 characters').max(200),
  details: z.string().trim().max(1000).optional(),
  updateStatus: z
    .enum(['CONTACTED', 'QUALIFIED', 'TEST_DRIVE_SCHEDULED', 'NEGOTIATING', 'WON', 'LOST'])
    .optional(),
});

export const reassignLeadSchema = z.object({
  staffUserId: z.string().min(1, 'Target staff ID is required'),
  reason: z.string().trim().max(500).optional(),
});

export const executeImportSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  source: z
    .enum(['PORTAL_IMPORT', 'WEB_ENQUIRY', 'PHONE_INQUIRY', 'WALK_IN'])
    .default('PORTAL_IMPORT'),
  rows: z
    .array(
      z.object({
        customerName: z.string().trim().min(2, 'Customer name is required'),
        phone: z.string().trim(),
        email: z.string().trim().email(),
        modelName: z.string().trim().optional(),
        showroomCodeOrName: z.string().trim().optional(),
        showroomName: z.string().trim().optional(),
        source: z.string().trim().optional(),
        message: z.string().trim().optional(),
        externalId: z.string().trim().optional(),
      }),
    )
    .min(1, 'At least one row required for import'),
});
