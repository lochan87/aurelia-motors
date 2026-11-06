import { Router } from 'express';

import type { HealthCheckData } from '@aurelia/shared';

import { SERVICE_NAME, SERVICE_VERSION } from '../config/constants.js';
import { sendSuccess } from '../lib/api-response.js';
import { asyncHandler } from '../lib/async-handler.js';
import type { DatabaseCheck } from '@aurelia/shared';

export type DatabaseProbe = () => Promise<DatabaseCheck>;

export function createHealthRouter(databaseProbe: DatabaseProbe): Router {
  const router = Router();

  router.get(
    '/health',
    asyncHandler(async (request, response) => {
      const database = await databaseProbe();

      const data: HealthCheckData = {
        status: database.status === 'up' ? 'ok' : 'degraded',
        service: SERVICE_NAME,
        version: SERVICE_VERSION,
        uptimeSeconds: Math.floor(process.uptime()),
        checks: {
          database,
        },
      };

      sendSuccess(request, response, data, database.status === 'up' ? 200 : 503);
    }),
  );

  return router;
}
