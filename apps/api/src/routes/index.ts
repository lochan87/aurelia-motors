import { Router } from 'express';

import { createAppointmentsRouter } from '../modules/appointments/appointments.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCatalogueRouter } from '../modules/catalogue/catalogue.routes.js';
import { createDashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import {
  createPublicEnquiriesRouter,
  createStaffLeadsRouter,
} from '../modules/leads/leads.routes.js';
import { createShowroomsRouter } from '../modules/showrooms/showrooms.routes.js';
import { createStaffRouter } from '../modules/staff/staff.routes.js';
import { createUsedVehiclesRouter } from '../modules/used-vehicles/used-vehicles.routes.js';
import { createHealthRouter, type DatabaseProbe } from './health.routes.js';

interface ApiRouterOptions {
  databaseProbe: DatabaseProbe;
}

export function createApiRouter({ databaseProbe }: ApiRouterOptions): Router {
  const router = Router();

  router.use(createHealthRouter(databaseProbe));
  router.use(createShowroomsRouter());
  router.use(createCatalogueRouter());
  router.use(createUsedVehiclesRouter());
  router.use(createAppointmentsRouter());
  router.use('/auth', createAuthRouter());
  router.use('/admin/staff', createStaffRouter());
  router.use('/staff', createDashboardRouter());
  router.use('/staff/leads', createStaffLeadsRouter());
  router.use('/enquiries', createPublicEnquiriesRouter());

  return router;
}
