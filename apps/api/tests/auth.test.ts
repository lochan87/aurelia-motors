import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';
import { SESSION_COOKIE_NAME } from '../src/modules/auth/auth.service.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) {
    throw new Error('Expected Set-Cookie header to be defined');
  }
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return first.split(';')[0];
}

describe('Staff Authentication and RBAC API', () => {
  const adminEmail = 'admin@aureliamotors.com';
  const salesEmail = 'sales.central@aureliamotors.com';
  const serviceEmail = 'service.gomti@aureliamotors.com';
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;
  let adminSessionToken: string;

  let salesCookie: string;
  let serviceCookie: string;

  beforeAll(async () => {
    // Ensure audit events and temporary test users are cleaned
    await prisma.staffUser.deleteMany({
      where: {
        email: { in: ['temp.sales@aureliamotors.com', 'test.deactivate@aureliamotors.com'] },
      },
    });
  });

  describe('POST /api/auth/login', () => {
    it('authenticates valid admin credentials, sets HttpOnly cookie, and issues CSRF token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: demoPassword });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        email: adminEmail,
        role: 'ADMIN',
        isActive: true,
      });
      expect(typeof response.body.data.csrfToken).toBe('string');
      expect(response.body.data.csrfToken.length).toBeGreaterThan(16);

      // Verify Set-Cookie header
      const cookies = response.headers['set-cookie'] as string[] | string | undefined;
      expect(cookies).toBeDefined();
      const cookieStr = Array.isArray(cookies) ? cookies.join(';') : (cookies ?? '');
      expect(cookieStr).toContain(SESSION_COOKIE_NAME);
      expect(cookieStr.toLowerCase()).toContain('httponly');

      // Save for subsequent tests
      adminCookie = getCookie(response);
      adminCsrf = response.body.data.csrfToken;
      adminSessionToken = adminCookie.replace(`${SESSION_COOKIE_NAME}=`, '');
    });

    it('authenticates sales consultant and sets location context', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: salesEmail, password: demoPassword });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('SALES_CONSULTANT');
      expect(response.body.data.user.locations.length).toBeGreaterThan(0);
      expect(response.body.data.user.locations[0].showroomCode).toBe('LKO-CENTRAL');

      salesCookie = getCookie(response);
    });

    it('authenticates service advisor and sets workshop context', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: serviceEmail, password: demoPassword });

      expect(response.status).toBe(200);
      expect(response.body.data.user.role).toBe('SERVICE_ADVISOR');
      expect(response.body.data.user.locations.length).toBeGreaterThan(0);
      expect(response.body.data.user.locations[0].workshopCode).toBe('WS-GOMTI');

      serviceCookie = getCookie(response);
    });

    it('rejects invalid password with 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects non-existent email with 401', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody@aureliamotors.com', password: demoPassword });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('rejects deactivated user with 403', async () => {
      // Create a temporary inactive user
      const inactiveUser = await prisma.staffUser.create({
        data: {
          email: 'test.deactivate@aureliamotors.com',
          fullName: 'Inactive Test Staff',
          passwordHash: 'dummy',
          role: 'SALES_CONSULTANT',
          isActive: false,
        },
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: inactiveUser.email, password: demoPassword });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ACCOUNT_DEACTIVATED');

      await prisma.staffUser.delete({ where: { id: inactiveUser.id } });
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns user profile and CSRF token when session cookie is provided', async () => {
      const response = await request(app).get('/api/auth/me').set('Cookie', adminCookie);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(adminEmail);
      expect(response.body.data.user.role).toBe('ADMIN');
      expect(response.body.data.csrfToken).toBe(adminCsrf);
    });

    it('returns user profile when Bearer authorization header is provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminSessionToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.user.email).toBe(adminEmail);
    });

    it('returns 401 UNAUTHORIZED when no credentials are provided', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when forged/expired session token is provided', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Cookie', `${SESSION_COOKIE_NAME}=completely_invalid_session_token_12345`);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/change-password & CSRF Protection', () => {
    it('rejects mutating requests missing CSRF token with 403 CSRF_INVALID', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', adminCookie)
        .send({
          currentPassword: demoPassword,
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CSRF_INVALID');
    });

    it('rejects mutating requests with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', 'forged-csrf-token-value')
        .send({
          currentPassword: demoPassword,
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CSRF_INVALID');
    });

    it('rejects password change if current password is wrong', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          currentPassword: 'WrongCurrentPassword!',
          newPassword: 'BrandNewSecurePassword2026!',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('INVALID_PASSWORD');
    });

    it('rejects password change if new password is too short (< 8 chars)', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          currentPassword: demoPassword,
          newPassword: 'short',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Role-Based Access Control (RBAC) & Admin Safeguards', () => {
    it('allows ADMIN to access /api/admin/staff', async () => {
      const response = await request(app).get('/api/admin/staff').set('Cookie', adminCookie);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(6);
    });

    it('blocks SALES_CONSULTANT from accessing /api/admin/staff with 403 FORBIDDEN', async () => {
      const response = await request(app).get('/api/admin/staff').set('Cookie', salesCookie);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('blocks unauthenticated requests to /api/admin/staff with 401 UNAUTHORIZED', async () => {
      const response = await request(app).get('/api/admin/staff');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('allows ADMIN to create a new staff account', async () => {
      const response = await request(app)
        .post('/api/admin/staff')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          email: 'temp.sales@aureliamotors.com',
          fullName: 'Temporary Sales Rep',
          phone: '+919876500099',
          role: 'SALES_CONSULTANT',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.email).toBe('temp.sales@aureliamotors.com');
      expect(response.body.data.role).toBe('SALES_CONSULTANT');
      expect(response.body.data.isActive).toBe(true);
    });

    it('safeguards against demoting or deactivating the last active administrator', async () => {
      // Find the admin user ID
      const adminUser = await prisma.staffUser.findUniqueOrThrow({
        where: { email: adminEmail },
      });

      // Attempt to deactivate the only active admin
      const deactResponse = await request(app)
        .post(`/api/admin/staff/${adminUser.id}/disable`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf);

      expect(deactResponse.status).toBe(400);
      expect(deactResponse.body.error.code).toBe('CANNOT_DEMOTE_LAST_ADMIN');

      // Attempt to demote the only active admin to sales consultant
      const demoteResponse = await request(app)
        .patch(`/api/admin/staff/${adminUser.id}`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({ role: 'SALES_CONSULTANT' });

      expect(demoteResponse.status).toBe(400);
      expect(demoteResponse.body.error.code).toBe('CANNOT_DEMOTE_LAST_ADMIN');
    });

    it('allows ADMIN to deactivate a non-admin staff member and revokes their session', async () => {
      const tempUser = await prisma.staffUser.findUniqueOrThrow({
        where: { email: 'temp.sales@aureliamotors.com' },
      });

      // Login as temp user to create a session
      const tempLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: tempUser.email, password: demoPassword });

      expect(tempLogin.status).toBe(200);
      const tempCookie = getCookie(tempLogin);

      // Disable temp user
      const disableResponse = await request(app)
        .post(`/api/admin/staff/${tempUser.id}/disable`)
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf);

      expect(disableResponse.status).toBe(200);
      expect(disableResponse.body.data.isActive).toBe(false);

      // Verify temp user's session is now rejected with 403 or 401
      const checkSession = await request(app).get('/api/auth/me').set('Cookie', tempCookie);

      expect([401, 403]).toContain(checkSession.status);
    });
  });

  describe('Location-Scoped Dashboard & Appointments', () => {
    it('returns dealership-wide metrics and appointments for ADMIN', async () => {
      const dashboard = await request(app).get('/api/staff/dashboard').set('Cookie', adminCookie);

      expect(dashboard.status).toBe(200);
      expect(dashboard.body.data.role).toBe('ADMIN');
      expect(typeof dashboard.body.data.metrics.inventoryTotal).toBe('number');
      expect(typeof dashboard.body.data.metrics.testDrivesTotal).toBe('number');
      expect(typeof dashboard.body.data.metrics.servicesTotal).toBe('number');
      expect(typeof dashboard.body.data.metrics.activeStaffCount).toBe('number');

      const appointments = await request(app)
        .get('/api/staff/appointments')
        .set('Cookie', adminCookie);

      expect(appointments.status).toBe(200);
      expect(Array.isArray(appointments.body.data.testDrives)).toBe(true);
      expect(Array.isArray(appointments.body.data.services)).toBe(true);
    });

    it('scopes dashboard and appointments strictly to assigned showroom for SALES_CONSULTANT', async () => {
      const dashboard = await request(app).get('/api/staff/dashboard').set('Cookie', salesCookie);

      expect(dashboard.status).toBe(200);
      expect(dashboard.body.data.role).toBe('SALES_CONSULTANT');
      // Sales consultant dashboard should not include service metrics or recent services
      expect(dashboard.body.data.recentServices).toHaveLength(0);

      const appointments = await request(app)
        .get('/api/staff/appointments')
        .set('Cookie', salesCookie);

      expect(appointments.status).toBe(200);
      expect(appointments.body.data.services).toHaveLength(0);
      // All returned test drives must belong to Central showroom
      for (const td of appointments.body.data.testDrives) {
        expect(td.locationName).toContain('Central');
      }
    });

    it('scopes dashboard and appointments strictly to assigned workshop for SERVICE_ADVISOR', async () => {
      const dashboard = await request(app).get('/api/staff/dashboard').set('Cookie', serviceCookie);

      expect(dashboard.status).toBe(200);
      expect(dashboard.body.data.role).toBe('SERVICE_ADVISOR');
      // Service advisor dashboard should not include test drives
      expect(dashboard.body.data.recentTestDrives).toHaveLength(0);

      const appointments = await request(app)
        .get('/api/staff/appointments')
        .set('Cookie', serviceCookie);

      expect(appointments.status).toBe(200);
      expect(appointments.body.data.testDrives).toHaveLength(0);
      // All returned services must belong to Gomti Nagar workshop
      for (const s of appointments.body.data.services) {
        expect(s.locationName).toContain('Gomti');
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the session and clears the cookie', async () => {
      // Create a dedicated session to log out
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: salesEmail, password: demoPassword });

      const cookie = getCookie(loginRes);

      const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.data.message).toMatch(/Signed out/i);

      // Verify the cookie was expired
      const logoutCookies = logoutRes.headers['set-cookie'];
      expect(logoutCookies).toBeDefined();

      // Subsequent request with that cookie should fail
      const meRes = await request(app).get('/api/auth/me').set('Cookie', cookie);

      expect(meRes.status).toBe(401);
    });
  });
});
