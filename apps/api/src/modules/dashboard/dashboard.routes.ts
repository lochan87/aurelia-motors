import { Router, type Request, type Response } from 'express';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateStaff } from '../../middleware/auth.js';
import { DashboardService } from './dashboard.service.js';

export function createDashboardRouter(): Router {
  const router = Router();
  const dashboardService = new DashboardService();

  router.use(authenticateStaff);

  // GET /api/staff/dashboard
  router.get(
    '/dashboard',
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) {
        return;
      }
      const overview = await dashboardService.getDashboardOverview(req.staffUser);
      sendSuccess(req, res, overview);
    }),
  );

  // GET /api/staff/appointments
  router.get(
    '/appointments',
    asyncHandler(async (req: Request, res: Response) => {
      if (!req.staffUser) {
        return;
      }
      const appointments = await dashboardService.listScopedAppointments(req.staffUser);
      sendSuccess(req, res, appointments);
    }),
  );

  return router;
}
