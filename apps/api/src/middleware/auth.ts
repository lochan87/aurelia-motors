import type { NextFunction, Request, Response } from 'express';
import type { StaffRole } from '@aurelia/shared';

import { AppError } from '../lib/errors.js';
import { AuthService, SESSION_COOKIE_NAME, verifyCsrfToken } from '../modules/auth/auth.service.js';

const authService = new AuthService();

export function extractSessionToken(req: Request): string | undefined {
  // 1. Check HttpOnly cookie
  if (req.cookies && req.cookies[SESSION_COOKIE_NAME]) {
    return req.cookies[SESSION_COOKIE_NAME];
  }

  // 2. Fallback to Authorization: Bearer <token> for testing/API clients
  const authHeader = req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }

  return undefined;
}

export async function authenticateStaff(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const sessionToken = extractSessionToken(req);

  if (!sessionToken) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required. No session found.'));
    return;
  }

  try {
    const sessionData = await authService.validateSession(sessionToken);
    req.staffUser = sessionData.user;
    req.sessionToken = sessionData.sessionToken;
    req.csrfToken = sessionData.csrfToken;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: StaffRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.staffUser) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.staffUser.role)) {
      next(
        new AppError(
          403,
          'FORBIDDEN',
          `Access denied. Role ${req.staffUser.role} is not authorized for this resource.`,
        ),
      );
      return;
    }

    next();
  };
}

export function verifyCsrf(req: Request, _res: Response, next: NextFunction): void {
  const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (!mutatingMethods.includes(req.method.toUpperCase())) {
    next();
    return;
  }

  if (!req.sessionToken) {
    next();
    return;
  }

  const providedCsrf = req.header('x-csrf-token');
  if (!verifyCsrfToken(req.sessionToken, providedCsrf)) {
    next(
      new AppError(
        403,
        'CSRF_INVALID',
        'Invalid or missing CSRF token. Please refresh and try again.',
      ),
    );
    return;
  }

  next();
}
