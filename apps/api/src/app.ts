import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { allowedOrigins } from './config/env.js';
import { probeDatabase } from './lib/database.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRateLimiter } from './middleware/rate-limit.js';
import { requestContext } from './middleware/request-context.js';
import { createApiRouter } from './routes/index.js';
import type { DatabaseProbe } from './routes/health.routes.js';

export interface CreateAppOptions {
  databaseProbe?: DatabaseProbe;
}

export function createApp(options: CreateAppOptions = {}) {
  const app = express();

  app.disable('x-powered-by');

  // Attach the request id before any parser or middleware can fail, so every
  // response, including malformed JSON errors, carries a correlation id.
  app.use(requestContext);

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-CSRF-Token'],
      exposedHeaders: ['X-Request-Id'],
      maxAge: 600,
    }),
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '1mb', type: ['application/json', 'application/*+json'] }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  app.use('/api', apiRateLimiter);
  app.use(
    '/api',
    createApiRouter({
      databaseProbe: options.databaseProbe ?? probeDatabase,
    }),
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
