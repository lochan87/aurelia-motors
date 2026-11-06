import { Router } from 'express';

import { createCatalogueRouter } from '../modules/catalogue/catalogue.routes.js';
import { createShowroomsRouter } from '../modules/showrooms/showrooms.routes.js';
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

  return router;
}
