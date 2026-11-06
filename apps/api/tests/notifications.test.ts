import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Expected Set-Cookie header');
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Staff Notifications API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;
  let salesCookie: string;
  let salesCsrf: string;
  let adminUserId: string;
  let salesUserId: string;
  let testNotifId: string;

  beforeAll(async () => {
    // 1. Fetch user records
    const adminUser = await prisma.staffUser.findUniqueOrThrow({
      where: { email: 'admin@aureliamotors.com' },
    });
    const staffUser = await prisma.staffUser.findUniqueOrThrow({
      where: { email: 'service.gomti@aureliamotors.com' },
    });
    adminUserId = adminUser.id;
    salesUserId = staffUser.id;

    // 2. Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // 3. Login Staff User (Service Advisor - isolated from lead routing)
    const staffLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'service.gomti@aureliamotors.com', password: demoPassword });
    salesCookie = getCookie(staffLogin);
    salesCsrf = staffLogin.body.data.csrfToken;

    // Create a notification for admin
    const notif = await prisma.staffNotification.create({
      data: {
        staffUserId: adminUserId,
        title: 'System Maintenance Notice',
        message: 'Scheduled backup at 02:00 AM IST.',
        type: 'SYSTEM',
        isRead: false,
      },
    });
    testNotifId = notif.id;
  });

  it('lists notifications for the authenticated staff member', async () => {
    const res = await request(app).get('/api/staff/notifications').set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    expect(res.body.items[0]).toHaveProperty('title');
    expect(res.body.items[0]).toHaveProperty('isRead');
  });

  it('returns unread count accurately', async () => {
    const res = await request(app)
      .get('/api/staff/notifications/unread-count')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(typeof res.body.unreadCount).toBe('number');
    expect(res.body.unreadCount).toBeGreaterThanOrEqual(1);
  });

  it('rejects marking notification read if belonging to a different staff member (403)', async () => {
    const res = await request(app)
      .patch(`/api/staff/notifications/${testNotifId}/read`)
      .set('Cookie', salesCookie)
      .set('X-CSRF-Token', salesCsrf);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('marks a notification as read for the rightful owner', async () => {
    const res = await request(app)
      .patch(`/api/staff/notifications/${testNotifId}/read`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(res.status).toBe(200);
    expect(res.body.isRead).toBe(true);
    expect(res.body.readAt).toBeDefined();
  });

  it('marks all notifications read for the current staff user', async () => {
    // Create an unread notification for sales user
    await prisma.staffNotification.create({
      data: {
        staffUserId: salesUserId,
        title: 'New Lead Notification',
        message: 'A new lead was routed to your queue.',
        type: 'NEW_LEAD',
        isRead: false,
      },
    });

    const res = await request(app)
      .post('/api/staff/notifications/mark-all-read')
      .set('Cookie', salesCookie)
      .set('X-CSRF-Token', salesCsrf);

    expect(res.status).toBe(200);
    expect(res.body.markedCount).toBeGreaterThanOrEqual(1);

    const unreadRes = await request(app)
      .get('/api/staff/notifications/unread-count')
      .set('Cookie', salesCookie);

    expect(unreadRes.body.unreadCount).toBe(0);
  });
});
