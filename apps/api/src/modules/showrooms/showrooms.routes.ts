import { Router, type Request, type Response } from 'express';
import { z } from 'zod';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { validateRequest } from '../../middleware/validate.js';
import { getShowroomByCode, listShowrooms } from './showrooms.service.js';

const showroomCodeParamsSchema = z.object({
  code: z.string().min(1),
});

export function createShowroomsRouter(): Router {
  const router = Router();

  router.get(
    '/showrooms',
    asyncHandler(async (req: Request, res: Response) => {
      const showrooms = await listShowrooms();
      sendSuccess(req, res, showrooms);
    }),
  );

  router.get(
    '/showrooms/:code',
    validateRequest({ params: showroomCodeParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof showroomCodeParamsSchema>;
      const showroom = await getShowroomByCode(params.code);
      sendSuccess(req, res, showroom);
    }),
  );

  return router;
}
