import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Expected Set-Cookie header');
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Content Management: Banners & Offers API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;
  let salesCookie: string;
  let createdBannerId: string;
  let createdOfferId: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // 2. Login Sales Consultant
    const salesLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.central@aureliamotors.com', password: demoPassword });
    salesCookie = getCookie(salesLogin);
  });

  it('serves active published banners and promotional offers on public endpoints', async () => {
    const bannersRes = await request(app).get('/api/banners');
    expect(bannersRes.status).toBe(200);
    expect(bannersRes.body.items.length).toBeGreaterThan(0);
    expect(bannersRes.body.items[0]).toHaveProperty('headline');
    expect(bannersRes.body.items[0]).toHaveProperty('imageUrl');

    const offersRes = await request(app).get('/api/offers');
    expect(offersRes.status).toBe(200);
    expect(offersRes.body.items.length).toBeGreaterThan(0);
    expect(offersRes.body.items[0]).toHaveProperty('title');
    expect(offersRes.body.items[0]).toHaveProperty('description');
  });

  it('rejects non-admin staff from mutating banners or offers (403 Forbidden)', async () => {
    const bannerRes = await request(app)
      .post('/api/admin/content/banners')
      .set('Cookie', salesCookie)
      .send({
        headline: 'Unauthorized Banner',
        imageUrl: 'https://example.com/banner.jpg',
        ctaLabel: 'Click',
        ctaUrl: '/test',
      });

    expect(bannerRes.status).toBe(403);
    expect(bannerRes.body.error.code).toBe('FORBIDDEN');
  });

  it('allows administrator to create, update, and delete homepage banners', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/admin/content/banners')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        headline: 'Lucknow Monsoon Drive Experience',
        subheadline: 'Visit any of our 3 showrooms for an exclusive rain-handling test-drive.',
        badgeText: 'Seasonal Special',
        imageUrl: 'https://example.com/monsoon-banner.webp',
        ctaLabel: 'Book Now',
        ctaUrl: '/test-drive',
        displayOrder: 10,
        isPublished: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.headline).toBe('Lucknow Monsoon Drive Experience');
    createdBannerId = createRes.body.id;

    // 2. Update
    const patchRes = await request(app)
      .patch(`/api/admin/content/banners/${createdBannerId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({ headline: 'Lucknow Monsoon Drive Carnival 2026' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.headline).toContain('Carnival 2026');

    // 3. Delete
    const deleteRes = await request(app)
      .delete(`/api/admin/content/banners/${createdBannerId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(deleteRes.status).toBe(200);
  });

  it('allows administrator to create, update, and delete promotional offers', async () => {
    // 1. Create
    const createRes = await request(app)
      .post('/api/admin/content/offers')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        title: 'Zero Processing Fee Campaign',
        description: 'Avail zero bank processing charges with partner PSU banks during November.',
        badgeText: 'Save ₹15,000',
        startDate: '2026-11-01T00:00:00Z',
        endDate: '2026-11-30T23:59:59Z',
        displayOrder: 5,
        isPublished: true,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.title).toBe('Zero Processing Fee Campaign');
    createdOfferId = createRes.body.id;

    // 2. Update
    const patchRes = await request(app)
      .patch(`/api/admin/content/offers/${createdOfferId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({ badgeText: 'Save ₹20,000' });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.badgeText).toBe('Save ₹20,000');

    // 3. Delete
    const deleteRes = await request(app)
      .delete(`/api/admin/content/offers/${createdOfferId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(deleteRes.status).toBe(200);
  });
});
