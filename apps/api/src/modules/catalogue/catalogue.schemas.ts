import { z } from 'zod';

export const listModelsQuerySchema = z.object({
  bodyType: z.enum(['HATCHBACK', 'SEDAN', 'SUV', 'CROSSOVER']).optional(),
  fuelType: z.enum(['PETROL', 'DIESEL', 'ELECTRIC']).optional(),
  transmission: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  search: z.string().trim().optional(),
  minPricePaise: z.coerce.number().int().nonnegative().optional(),
  maxPricePaise: z.coerce.number().int().positive().optional(),
  sort: z.enum(['price_asc', 'price_desc', 'name_asc']).optional(),
});

export const modelSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export const variantPricingParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export const variantPricingQuerySchema = z.object({
  showroomCode: z.string().trim().optional(),
  showroomId: z.string().trim().optional(),
});
