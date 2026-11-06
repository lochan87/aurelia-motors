import crypto from 'node:crypto';
import * as argon2 from 'argon2';
import type { PrismaClient } from '@prisma/client';
import type { StaffUserSummary } from '@aurelia/shared';

import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

const SESSION_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days
const CSRF_SECRET = process.env.CSRF_SECRET || 'aurelia-dealership-csrf-secret-key-lucknow-2026';

export const SESSION_COOKIE_NAME = 'aurelia_session';

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateCsrfToken(sessionToken: string): string {
  return crypto.createHmac('sha256', CSRF_SECRET).update(sessionToken).digest('hex');
}

export function verifyCsrfToken(sessionToken: string, providedToken?: string): boolean {
  if (!providedToken) {
    return false;
  }
  const expected = generateCsrfToken(sessionToken);
  try {
    const expectedBuf = Buffer.from(expected, 'utf8');
    const providedBuf = Buffer.from(providedToken, 'utf8');
    if (expectedBuf.length !== providedBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export function mapStaffUserSummary(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date;
  locationAssignments?: Array<{
    showroomId: string | null;
    workshopId: string | null;
    isPrimary: boolean;
    showroom?: { name: string; code: string } | null;
    workshop?: { name: string; code: string } | null;
  }>;
}): StaffUserSummary {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role as StaffUserSummary['role'],
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    locations: (user.locationAssignments ?? []).map((assignment) => ({
      showroomId: assignment.showroomId,
      showroomName: assignment.showroom?.name ?? null,
      showroomCode: assignment.showroom?.code ?? null,
      workshopId: assignment.workshopId,
      workshopName: assignment.workshop?.name ?? null,
      workshopCode: assignment.workshop?.code ?? null,
      isPrimary: assignment.isPrimary,
    })),
  };
}

export class AuthService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async login(
    email: string,
    password: string,
    meta?: { ipHash?: string; userAgent?: string },
  ): Promise<{ sessionToken: string; csrfToken: string; user: StaffUserSummary }> {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.staffUser.findUnique({
      where: { email: normalizedEmail },
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
      await this.prisma.authenticationAuditEvent.create({
        data: {
          email: normalizedEmail,
          eventType: 'LOGIN_FAILED_UNKNOWN_USER',
          ipHash: meta?.ipHash,
          userAgent: meta?.userAgent,
        },
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    if (!user.isActive) {
      await this.prisma.authenticationAuditEvent.create({
        data: {
          staffUserId: user.id,
          email: normalizedEmail,
          eventType: 'LOGIN_BLOCKED_INACTIVE_USER',
          ipHash: meta?.ipHash,
          userAgent: meta?.userAgent,
        },
      });
      throw new AppError(
        403,
        'ACCOUNT_DEACTIVATED',
        'This staff account has been deactivated. Please contact an administrator.',
      );
    }

    let passwordValid = false;
    try {
      passwordValid = await argon2.verify(user.passwordHash, password);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      await this.prisma.authenticationAuditEvent.create({
        data: {
          staffUserId: user.id,
          email: normalizedEmail,
          eventType: 'LOGIN_FAILED_BAD_PASSWORD',
          ipHash: meta?.ipHash,
          userAgent: meta?.userAgent,
        },
      });
      throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.prisma.staffSession.create({
      data: {
        tokenHash,
        staffUserId: user.id,
        expiresAt,
        ipHash: meta?.ipHash,
        userAgent: meta?.userAgent,
      },
    });

    await this.prisma.authenticationAuditEvent.create({
      data: {
        staffUserId: user.id,
        email: normalizedEmail,
        eventType: 'LOGIN_SUCCESS',
        ipHash: meta?.ipHash,
        userAgent: meta?.userAgent,
      },
    });

    const csrfToken = generateCsrfToken(sessionToken);

    return {
      sessionToken,
      csrfToken,
      user: mapStaffUserSummary(user),
    };
  }

  async validateSession(sessionToken: string): Promise<{
    user: StaffUserSummary;
    sessionToken: string;
    csrfToken: string;
  }> {
    const tokenHash = hashToken(sessionToken);

    const session = await this.prisma.staffSession.findUnique({
      where: { tokenHash },
      include: {
        staffUser: {
          include: {
            locationAssignments: {
              include: {
                showroom: true,
                workshop: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired session. Please sign in again.');
    }

    if (!session.staffUser.isActive) {
      throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This staff account has been deactivated.');
    }

    // Touch lastActiveAt if more than 5 minutes have elapsed
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    if (session.lastActiveAt < fiveMinutesAgo) {
      await this.prisma.staffSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
    }

    return {
      user: mapStaffUserSummary(session.staffUser),
      sessionToken,
      csrfToken: generateCsrfToken(sessionToken),
    };
  }

  async logout(
    sessionToken: string,
    meta?: { ipHash?: string; userAgent?: string },
  ): Promise<void> {
    const tokenHash = hashToken(sessionToken);

    const session = await this.prisma.staffSession.findUnique({
      where: { tokenHash },
      include: { staffUser: true },
    });

    if (session && !session.revokedAt) {
      await this.prisma.staffSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });

      await this.prisma.authenticationAuditEvent.create({
        data: {
          staffUserId: session.staffUserId,
          email: session.staffUser.email,
          eventType: 'LOGOUT',
          ipHash: meta?.ipHash,
          userAgent: meta?.userAgent,
        },
      });
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    meta?: { ipHash?: string; userAgent?: string },
  ): Promise<void> {
    const user = await this.prisma.staffUser.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Staff user not found or inactive');
    }

    const currentMatches = await argon2.verify(user.passwordHash, currentPassword);
    if (!currentMatches) {
      throw new AppError(400, 'INVALID_PASSWORD', 'Current password does not match');
    }

    const newPasswordHash = await argon2.hash(newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await this.prisma.staffUser.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    await this.prisma.authenticationAuditEvent.create({
      data: {
        staffUserId: user.id,
        email: user.email,
        eventType: 'PASSWORD_CHANGED',
        ipHash: meta?.ipHash,
        userAgent: meta?.userAgent,
      },
    });
  }
}
