import type { DatabaseCheck } from '@aurelia/shared';

import { prisma } from '../db/prisma.js';

/**
 * Performs a real round-trip to PostgreSQL. A health response must never
 * report the database as up unless this query actually succeeds.
 */
export async function probeDatabase(): Promise<DatabaseCheck> {
  const startedAt = performance.now();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'up',
      latencyMs: Math.max(0, Math.round(performance.now() - startedAt)),
    };
  } catch {
    return {
      status: 'down',
      latencyMs: null,
    };
  }
}
