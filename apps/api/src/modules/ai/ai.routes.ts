import { Router } from 'express';
import { z } from 'zod';
import { authenticateStaff } from '../../middleware/auth.js';
import { validateBody } from '../../middleware/validate.js';
import { AppError } from '../../lib/errors.js';
import { AiService } from './ai.service.js';

const draftResponseSchema = z.object({
  channel: z.enum(['EMAIL', 'WHATSAPP', 'PHONE_SCRIPT']).default('WHATSAPP'),
});

export function createStaffAiRouter(service: AiService = new AiService()): Router {
  const router = Router();

  router.use(authenticateStaff);

  router.post('/:leadId/summary', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const leadId = req.params.leadId as string;
      const summary = await service.generateLeadSummary(leadId, req.staffUser);
      res.json(summary);
    } catch (err) {
      next(err);
    }
  });

  router.post(
    '/:leadId/response-draft',
    validateBody(draftResponseSchema),
    async (req, res, next) => {
      try {
        if (!req.staffUser) {
          throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }
        const leadId = req.params.leadId as string;
        const draft = await service.draftFirstResponse(leadId, req.staffUser, req.body.channel);
        res.json(draft);
      } catch (err) {
        next(err);
      }
    },
  );

  router.post('/:leadId/recommendations', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const leadId = req.params.leadId as string;
      const recommendations = await service.recommendVehicles(leadId, req.staffUser);
      res.json(recommendations);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
