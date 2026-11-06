import { createServer } from 'node:http';

import { createApp } from './app.js';
import { SERVICE_NAME, SERVICE_VERSION } from './config/constants.js';
import { env } from './config/env.js';
import { prisma } from './db/prisma.js';

const app = createApp();
const server = createServer(app);
let shuttingDown = false;

function shutdown(signal: string): void {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`[api] ${signal} received, shutting down.`);

  const forceExitTimer = setTimeout(() => {
    console.error('[api] Graceful shutdown timed out.');
    process.exit(1);
  }, 10_000);

  forceExitTimer.unref();

  server.close((error) => {
    void prisma.$disconnect().finally(() => {
      if (error) {
        console.error('[api] Failed to close the HTTP server.', error);
        process.exit(1);
      }

      process.exit(0);
    });
  });
}

server.on('error', (error) => {
  console.error('[api] HTTP server error.', error);
  process.exit(1);
});

server.listen(env.API_PORT, env.API_HOST, () => {
  console.log(
    `[api] ${SERVICE_NAME} ${SERVICE_VERSION} listening at http://${env.API_HOST}:${env.API_PORT}`,
  );
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
