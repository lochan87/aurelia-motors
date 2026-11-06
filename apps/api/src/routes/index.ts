import { Router } from 'express';

import { createAdminCmsRouter } from '../modules/admin/cms.routes.js';
import { createUsedCarPricingRouter } from '../modules/admin/used-car-pricing.routes.js';
import { createStaffAiRouter } from '../modules/ai/ai.routes.js';
import { createAppointmentsRouter } from '../modules/appointments/appointments.routes.js';
import { createAuthRouter } from '../modules/auth/auth.routes.js';
import { createCatalogueRouter } from '../modules/catalogue/catalogue.routes.js';
import {
  createAdminContentRouter,
  createPublicContentRouter,
} from '../modules/content/content.routes.js';
import { createDashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import {
  createPublicEnquiriesRouter,
  createStaffLeadsRouter,
} from '../modules/leads/leads.routes.js';
import { createStaffNotificationsRouter } from '../modules/notifications/notifications.routes.js';
import { createShowroomsRouter } from '../modules/showrooms/showrooms.routes.js';
import { createStaffRouter } from '../modules/staff/staff.routes.js';
import {
  createPublicTradeInsRouter,
  createStaffTradeInsRouter,
} from '../modules/trade-ins/trade-ins.routes.js';
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
  router.use(createPublicContentRouter());
  router.use('/trade-ins', createPublicTradeInsRouter());
  router.use('/auth', createAuthRouter());
  router.use('/admin/staff', createStaffRouter());
  router.use('/admin', createAdminCmsRouter());
  router.use('/admin', createAdminContentRouter());
  router.use('/staff', createDashboardRouter());
  router.use('/staff', createUsedCarPricingRouter());
  router.use('/staff/notifications', createStaffNotificationsRouter());
  router.use('/staff/trade-ins', createStaffTradeInsRouter());
  router.use('/staff/ai', createStaffAiRouter());
  router.use('/staff/leads', createStaffLeadsRouter());
  router.use('/enquiries', createPublicEnquiriesRouter());

  return router;
}
