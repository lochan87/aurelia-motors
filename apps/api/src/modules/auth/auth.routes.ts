import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import type { z } from 'zod';

import { sendSuccess } from '../../lib/api-response.js';
import { asyncHandler } from '../../lib/async-handler.js';
import { authenticateStaff, extractSessionToken, verifyCsrf } from '../../middleware/auth.js';
import { authLoginLimiter } from '../../middleware/rate-limit.js';
import { validateRequest } from '../../middleware/validate.js';
import { changePasswordSchema, loginSchema } from './auth.schemas.js';
import { AuthService, SESSION_COOKIE_NAME } from './auth.service.js';

function getIpHash(req: Request): string {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

export function createAuthRouter(): Router {
  const router = Router();
  const authService = new AuthService();

  // POST /api/auth/login
  router.post(
    '/login',
    authLoginLimiter,
    validateRequest({ body: loginSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof loginSchema>;
      const ipHash = getIpHash(req);
      const userAgent = req.header('user-agent');

      const result = await authService.login(body.email, body.password, {
        ipHash,
        userAgent,
      });

      // Set secure HttpOnly session cookie
      res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 14 * 24 * 60 * 60 * 1000,
      });

      sendSuccess(req, res, {
        user: result.user,
        csrfToken: result.csrfToken,
      });
    }),
  );

  // POST /api/auth/logout
  router.post(
    '/logout',
    asyncHandler(async (req: Request, res: Response) => {
      const sessionToken = extractSessionToken(req);
      if (sessionToken) {
        const ipHash = getIpHash(req);
        const userAgent = req.header('user-agent');
        await authService.logout(sessionToken, { ipHash, userAgent });
      }

      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      sendSuccess(req, res, { message: 'Signed out successfully' });
    }),
  );

  // GET /api/auth/me
  router.get(
    '/me',
    authenticateStaff,
    asyncHandler(async (req: Request, res: Response) => {
      sendSuccess(req, res, {
        user: req.staffUser,
        csrfToken: req.csrfToken,
      });
    }),
  );

  // POST /api/auth/change-password
  router.post(
    '/change-password',
    authenticateStaff,
    verifyCsrf,
    validateRequest({ body: changePasswordSchema }),
    asyncHandler(async (req: Request, res: Response) => {
      const body = req.validated.body as z.infer<typeof changePasswordSchema>;
      const ipHash = getIpHash(req);
      const userAgent = req.header('user-agent');

      if (!req.staffUser) {
        return;
      }

      await authService.changePassword(req.staffUser.id, body.currentPassword, body.newPassword, {
        ipHash,
        userAgent,
      });

      sendSuccess(req, res, { message: 'Password updated successfully' });
    }),
  );

  return router;
}
