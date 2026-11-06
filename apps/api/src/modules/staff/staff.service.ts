import * as argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import type { CreateStaffInput, StaffUserSummary, UpdateStaffInput } from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';
import { mapStaffUserSummary } from '../auth/auth.service.js';

const DEFAULT_STAFF_PASSWORD = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

export class StaffService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async listStaff(): Promise<StaffUserSummary[]> {
    const users = await this.prisma.staffUser.findMany({
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      include: {
        locationAssignments: {
          include: {
            showroom: true,
            workshop: true,
          },
        },
      },
    });

    return users.map(mapStaffUserSummary);
  }

  async getStaffById(id: string): Promise<StaffUserSummary> {
    const user = await this.prisma.staffUser.findUnique({
      where: { id },
      include: {
        locationAssignments: {
          include: {
            showroom: true,
            workshop: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError(404, 'STAFF_NOT_FOUND', `Staff user with id '${id}' not found`);
    }

    return mapStaffUserSummary(user);
  }

  async createStaff(input: CreateStaffInput): Promise<StaffUserSummary> {
    const normalizedEmail = input.email.trim().toLowerCase();

    const existing = await this.prisma.staffUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      throw new AppError(
        409,
        'EMAIL_EXISTS',
        `A staff user with email '${normalizedEmail}' already exists`,
      );
    }

    const password = input.initialPassword || DEFAULT_STAFF_PASSWORD;
    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.staffUser.create({
        data: {
          email: normalizedEmail,
          fullName: input.fullName.trim(),
          phone: input.phone?.trim() || null,
          role: input.role,
          passwordHash,
          isActive: true,
        },
      });

      // Assign showrooms if provided
      if (input.showroomIds && input.showroomIds.length > 0) {
        for (let i = 0; i < input.showroomIds.length; i++) {
          await tx.staffLocationAssignment.create({
            data: {
              staffUserId: created.id,
              showroomId: input.showroomIds[i],
              isPrimary: i === 0,
            },
          });
        }
      }

      // Assign workshops if provided
      if (input.workshopIds && input.workshopIds.length > 0) {
        for (let i = 0; i < input.workshopIds.length; i++) {
          await tx.staffLocationAssignment.create({
            data: {
              staffUserId: created.id,
              workshopId: input.workshopIds[i],
              isPrimary: i === 0,
            },
          });
        }
      }

      return tx.staffUser.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          locationAssignments: {
            include: {
              showroom: true,
              workshop: true,
            },
          },
        },
      });
    });

    return mapStaffUserSummary(user);
  }

  async updateStaff(id: string, input: UpdateStaffInput): Promise<StaffUserSummary> {
    const existing = await this.prisma.staffUser.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, 'STAFF_NOT_FOUND', `Staff user with id '${id}' not found`);
    }

    // Safeguard: Do not allow demoting or deactivating the last active ADMIN
    if (existing.role === 'ADMIN') {
      const isDemoting = input.role && input.role !== 'ADMIN';
      const isDeactivating = input.isActive === false;

      if (isDemoting || isDeactivating) {
        const activeAdminCount = await this.prisma.staffUser.count({
          where: { role: 'ADMIN', isActive: true },
        });

        if (activeAdminCount <= 1) {
          throw new AppError(
            400,
            'CANNOT_DEMOTE_LAST_ADMIN',
            'Cannot demote or deactivate the last active administrator in the system.',
          );
        }
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      // If deactivating, revoke all active sessions
      if (input.isActive === false) {
        await tx.staffSession.updateMany({
          where: { staffUserId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      // Update location assignments if supplied
      if (input.showroomIds !== undefined || input.workshopIds !== undefined) {
        await tx.staffLocationAssignment.deleteMany({
          where: { staffUserId: id },
        });

        if (input.showroomIds) {
          for (let i = 0; i < input.showroomIds.length; i++) {
            await tx.staffLocationAssignment.create({
              data: {
                staffUserId: id,
                showroomId: input.showroomIds[i],
                isPrimary: i === 0,
              },
            });
          }
        }

        if (input.workshopIds) {
          for (let i = 0; i < input.workshopIds.length; i++) {
            await tx.staffLocationAssignment.create({
              data: {
                staffUserId: id,
                workshopId: input.workshopIds[i],
                isPrimary: i === 0,
              },
            });
          }
        }
      }

      return tx.staffUser.update({
        where: { id },
        data: {
          fullName: input.fullName?.trim(),
          phone: input.phone === null ? null : input.phone?.trim(),
          role: input.role,
          isActive: input.isActive,
        },
        include: {
          locationAssignments: {
            include: {
              showroom: true,
              workshop: true,
            },
          },
        },
      });
    });

    return mapStaffUserSummary(updated);
  }

  async disableStaff(id: string): Promise<StaffUserSummary> {
    return this.updateStaff(id, { isActive: false });
  }
}
