import { z } from 'zod';

export const usedVehicleFilterQuerySchema = z.object({
  make: z.string().trim().optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  minYear: z.coerce.number().int().min(1990).max(2030).optional(),
  maxYear: z.coerce.number().int().min(1990).max(2030).optional(),
  minMileageKm: z.coerce.number().int().nonnegative().optional(),
  maxMileageKm: z.coerce.number().int().positive().optional(),
  minPricePaise: z.coerce.number().int().nonnegative().optional(),
  maxPricePaise: z.coerce.number().int().positive().optional(),
  showroomCode: z.string().trim().optional(),
  showroomId: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'mileage_asc', 'year_desc']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(12),
});

export const usedVehicleSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
