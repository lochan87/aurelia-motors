import { Router } from 'express';

import { createHealthRouter, type DatabaseProbe } from './health.routes.js';

interface ApiRouterOptions {
  databaseProbe: DatabaseProbe;
}

export function createApiRouter({ databaseProbe }: ApiRouterOptions): Router {
  const router = Router();

  router.use(createHealthRouter(databaseProbe));

  return router;
}
