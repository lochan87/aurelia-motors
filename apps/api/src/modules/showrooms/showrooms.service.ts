import type { ShowroomSummary } from '@aurelia/shared';

import { prisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export async function listShowrooms(): Promise<ShowroomSummary[]> {
  const rows = await prisma.showroom.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    city: row.city,
    state: row.state,
    timezone: row.timezone,
    isActive: row.isActive,
  }));
}

export async function getShowroomByCode(code: string): Promise<ShowroomSummary> {
  const row = await prisma.showroom.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!row || !row.isActive) {
    throw new AppError(404, 'SHOWROOM_NOT_FOUND', `Showroom with code '${code}' was not found.`);
  }

  return {
    id: row.id,
    code: row.code,
    name: row.name,
    city: row.city,
    state: row.state,
    timezone: row.timezone,
    isActive: row.isActive,
  };
}
