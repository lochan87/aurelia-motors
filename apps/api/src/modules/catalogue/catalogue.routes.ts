import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  listModelsQuerySchema,
  modelSlugParamsSchema,
  variantPricingParamsSchema,
  variantPricingQuerySchema,
} from './catalogue.schemas.js';
import { getModelBySlug, getVariantPricing, listModels } from './catalogue.service.js';

export function createCatalogueRouter(): Router {
  const router = Router();

  router.get(
    '/catalogue/models',
    validateRequest({ query: listModelsQuerySchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const query = (req.validated.query ?? {}) as z.infer<typeof listModelsQuerySchema>;
      const models = await listModels(query);
      sendSuccess(req, res, models);
    }),
  );

  router.get(
    '/catalogue/models/:slug',
    validateRequest({ params: modelSlugParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof modelSlugParamsSchema>;
      const model = await getModelBySlug(params.slug);
      sendSuccess(req, res, model);
    }),
  );

  router.get(
    '/catalogue/variants/:slug/pricing',
    validateRequest({
      params: variantPricingParamsSchema,
      query: variantPricingQuerySchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof variantPricingParamsSchema>;
      const query = (req.validated.query ?? {}) as z.infer<typeof variantPricingQuerySchema>;
      const pricing = await getVariantPricing(params.slug, query);
      sendSuccess(req, res, pricing);
    }),
  );

  return router;
}
