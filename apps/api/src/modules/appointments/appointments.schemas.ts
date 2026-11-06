import { z } from 'zod';

export const testDriveAvailabilityQuerySchema = z.object({
  showroomId: z.string().min(1, 'showroomId is required'),
  variantId: z.string().min(1, 'variantId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});

export const createTestDriveBookingSchema = z.object({
  showroomId: z.string().min(1, 'showroomId is required'),
  variantId: z.string().min(1, 'variantId is required'),
  startTime: z.string().datetime({ message: 'startTime must be an ISO-8601 datetime' }),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{10,15}$/, 'Invalid phone number format'),
  customerEmail: z.string().trim().email('Invalid email address'),
  driverLicenseNumber: z.string().trim().min(5).max(30).optional(),
  notes: z.string().trim().max(500).optional(),
  consentGranted: z.boolean().refine((val): val is true => val === true, {
    message: 'DPDP consent must be accepted to proceed with booking',
  }),
  idempotencyKey: z.string().trim().min(8, 'idempotencyKey must be at least 8 characters').max(128),
});

export const serviceAvailabilityQuerySchema = z.object({
  workshopId: z.string().min(1, 'workshopId is required'),
  serviceTypeId: z.string().min(1, 'serviceTypeId is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be in YYYY-MM-DD format'),
});

export const createServiceBookingSchema = z.object({
  workshopId: z.string().min(1, 'workshopId is required'),
  serviceTypeId: z.string().min(1, 'serviceTypeId is required'),
  startTime: z.string().datetime({ message: 'startTime must be an ISO-8601 datetime' }),
  registrationNumber: z
    .string()
    .trim()
    .min(4, 'Vehicle registration must be at least 4 characters')
    .max(20),
  vehicleModel: z.string().trim().min(2, 'Vehicle model must be at least 2 characters').max(100),
  vehicleYear: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1)
    .optional(),
  currentMileageKm: z.number().int().min(0).max(1000000).optional(),
  customerName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  customerPhone: z
    .string()
    .trim()
    .regex(/^[+0-9\s-]{10,15}$/, 'Invalid phone number format'),
  customerEmail: z.string().trim().email('Invalid email address'),
  notes: z.string().trim().max(500).optional(),
  consentGranted: z.boolean().refine((val): val is true => val === true, {
    message: 'DPDP consent must be accepted to proceed with booking',
  }),
  idempotencyKey: z.string().trim().min(8, 'idempotencyKey must be at least 8 characters').max(128),
});

export const bookingLookupParamsSchema = z.object({
  reference: z.string().trim().min(4, 'Booking reference is required'),
});

export const bookingLookupQuerySchema = z.object({
  token: z.string().trim().optional(),
});

export const cancelBookingSchema = z.object({
  confirmationToken: z.string().trim().min(1, 'confirmationToken is required to cancel a booking'),
  reason: z.string().trim().max(300).optional(),
});
