import { z } from 'zod';

export const createStaffSchema = z.object({
  email: z.string().trim().email('A valid email address is required').toLowerCase(),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Phone must be a valid phone number (e.g. +919876543210)')
    .optional(),
  role: z.enum(['ADMIN', 'SALES_CONSULTANT', 'USED_CAR_STAFF', 'SERVICE_ADVISOR']),
  showroomIds: z.array(z.string().min(1)).optional(),
  workshopIds: z.array(z.string().min(1)).optional(),
  initialPassword: z
    .string()
    .min(8, 'Initial password must be at least 8 characters long')
    .optional(),
});

export const updateStaffSchema = z.object({
  fullName: z.string().trim().min(2).max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{7,14}$/, 'Phone must be a valid phone number')
    .nullable()
    .optional(),
  role: z.enum(['ADMIN', 'SALES_CONSULTANT', 'USED_CAR_STAFF', 'SERVICE_ADVISOR']).optional(),
  isActive: z.boolean().optional(),
  showroomIds: z.array(z.string().min(1)).optional(),
  workshopIds: z.array(z.string().min(1)).optional(),
});

export const staffParamsSchema = z.object({
  id: z.string().min(1, 'Staff ID is required'),
});
