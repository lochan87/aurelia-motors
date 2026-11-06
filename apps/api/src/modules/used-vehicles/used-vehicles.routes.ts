import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import {
  usedVehicleFilterQuerySchema,
  usedVehicleSlugParamsSchema,
} from './used-vehicles.schemas.js';
import { getUsedVehicleBySlug, listUsedVehicles } from './used-vehicles.service.js';

export function createUsedVehiclesRouter(): Router {
  const router = Router();

  router.get(
    '/used-vehicles',
    validateRequest({ query: usedVehicleFilterQuerySchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const query = (req.validated.query ?? {}) as z.infer<typeof usedVehicleFilterQuerySchema>;
      const result = await listUsedVehicles(query);
      sendSuccess(req, res, result);
    }),
  );

  router.get(
    '/used-vehicles/:slug',
    validateRequest({ params: usedVehicleSlugParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof usedVehicleSlugParamsSchema>;
      const vehicle = await getUsedVehicleBySlug(params.slug);
      sendSuccess(req, res, vehicle);
    }),
  );

  return router;
}
