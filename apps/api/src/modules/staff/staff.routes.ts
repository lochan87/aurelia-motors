import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateStaff, requireRole, verifyCsrf } from '../../middleware/auth.js';
import { validateRequest } from '../../middleware/validate.js';
import { createStaffSchema, staffParamsSchema, updateStaffSchema } from './staff.schemas.js';
import { StaffService } from './staff.service.js';

export function createStaffRouter(): Router {
  const router = Router();
  const staffService = new StaffService();

  // All endpoints require ADMIN authentication
  router.use(authenticateStaff);
  router.use(requireRole('ADMIN'));

  // GET /api/admin/staff - List all staff
  router.get(
    '/',
    asyncHandler(async (req: Request, res: Response) => {
      const staffList = await staffService.listStaff();
      sendSuccess(req, res, staffList);
    }),
  );

  // GET /api/admin/staff/:id - Get staff member
  router.get(
    '/:id',
    validateRequest({ params: staffParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof staffParamsSchema>;
      const staff = await staffService.getStaffById(params.id);
      sendSuccess(req, res, staff);
    }),
  );

  // POST /api/admin/staff - Create new staff member
  router.post(
    '/',
    verifyCsrf,
    validateRequest({ body: createStaffSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof createStaffSchema>;
      const created = await staffService.createStaff(body);
      sendSuccess(req, res, created, 201);
    }),
  );

  // PATCH /api/admin/staff/:id - Update staff member
  router.patch(
    '/:id',
    verifyCsrf,
    validateRequest({
      params: staffParamsSchema,
      body: updateStaffSchema,
    }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof staffParamsSchema>;
      const body = req.validated.body as z.infer<typeof updateStaffSchema>;
      const updated = await staffService.updateStaff(params.id, body);
      sendSuccess(req, res, updated);
    }),
  );

  // POST /api/admin/staff/:id/disable - Disable staff member
  router.post(
    '/:id/disable',
    verifyCsrf,
    validateRequest({ params: staffParamsSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const params = req.validated.params as z.infer<typeof staffParamsSchema>;
      const disabled = await staffService.disableStaff(params.id);
      sendSuccess(req, res, disabled);
    }),
  );

  return router;
}
