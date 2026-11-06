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

describe('AI-Assisted Lead Operations API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let gomtiSalesCookie: string;
  let testLeadId: string;
  let centralShowroomId: string;

  beforeAll(async () => {
    // 1. Showroom & Lead
    const centralShowroom = await prisma.showroom.findUniqueOrThrow({
      where: { code: 'LKO-CENTRAL' },
    });
    centralShowroomId = centralShowroom.id;

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);

    // Login Gomti Sales (assigned only to Gomti showroom)
    const gomtiLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.gomti@aureliamotors.com', password: demoPassword });
    gomtiSalesCookie = getCookie(gomtiLogin);

    // Create a customer and lead in Central Lucknow showroom
    const customer = await prisma.customer.create({
      data: {
        fullName: 'Prashant Mishra',
        phone: '9876599999',
        email: 'prashant.ai.test@example.com',
      },
    });

    const model = await prisma.vehicleModel.findFirstOrThrow({
      where: { isActive: true },
      include: { variants: true },
    });

    const lead = await prisma.lead.create({
      data: {
        leadReference: `ENQ-AI-${Date.now()}`,
        customerId: customer.id,
        showroomId: centralShowroomId,
        modelId: model.id,
        variantId: model.variants[0]?.id || null,
        type: 'NEW_CAR',
        source: 'WEB_ENQUIRY',
        customerRequirements:
          'Interested in booking test-drive immediately, urgent delivery required before wedding.',
      },
    });
    testLeadId = lead.id;
  });

  it('generates structured lead summary with urgency and intent assessment', async () => {
    const res = await request(app)
      .post(`/api/staff/ai/${testLeadId}/summary`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.leadId).toBe(testLeadId);
    expect(res.body.urgency).toBe('HIGH');
    expect(res.body.intent).toContain('Enquired about purchasing');
    expect(res.body.summary).toContain('Prashant Mishra');
    expect(res.body.recommendedNextStep).toBeDefined();
    expect(res.body.provider).toContain('Grounded Domain Engine');
  });

  it('drafts personalized human-in-the-loop response for multiple channels', async () => {
    // 1. WhatsApp Draft
    const whatsappRes = await request(app)
      .post(`/api/staff/ai/${testLeadId}/response-draft`)
      .set('Cookie', adminCookie)
      .send({ channel: 'WHATSAPP' });

    expect(whatsappRes.status).toBe(200);
    expect(whatsappRes.body.channel).toBe('WHATSAPP');
    expect(whatsappRes.body.body).toContain('Namaste Prashant');
    expect(whatsappRes.body.disclaimer).toContain('human-in-the-loop');

    // 2. Email Draft
    const emailRes = await request(app)
      .post(`/api/staff/ai/${testLeadId}/response-draft`)
      .set('Cookie', adminCookie)
      .send({ channel: 'EMAIL' });

    expect(emailRes.status).toBe(200);
    expect(emailRes.body.channel).toBe('EMAIL');
    expect(emailRes.body.subject).toContain('Aurelia Motors');
    expect(emailRes.body.body).toContain('Dear Prashant Mishra');

    // 3. Phone Call Script
    const scriptRes = await request(app)
      .post(`/api/staff/ai/${testLeadId}/response-draft`)
      .set('Cookie', adminCookie)
      .send({ channel: 'PHONE_SCRIPT' });

    expect(scriptRes.status).toBe(200);
    expect(scriptRes.body.channel).toBe('PHONE_SCRIPT');
    expect(scriptRes.body.body).toContain('DISCOVERY');
  });

  it('provides grounded vehicle recommendations querying real PostgreSQL stock', async () => {
    const res = await request(app)
      .post(`/api/staff/ai/${testLeadId}/recommendations`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.leadId).toBe(testLeadId);
    expect(res.body.recommendations.length).toBeGreaterThan(0);
    expect(res.body.recommendations[0]).toHaveProperty('title');
    expect(res.body.recommendations[0]).toHaveProperty('pricePaise');
    expect(res.body.recommendations[0]).toHaveProperty('rationale');
  });

  it('enforces location access control: consultant from another showroom cannot access lead (403)', async () => {
    const res = await request(app)
      .post(`/api/staff/ai/${testLeadId}/summary`)
      .set('Cookie', gomtiSalesCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('LOCATION_FORBIDDEN');
  });
});
