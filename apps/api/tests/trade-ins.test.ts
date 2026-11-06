import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { VehicleCondition } from '@prisma/client';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Expected Set-Cookie header');
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Trade-In & Vehicle Valuation API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let usedCarCookie: string;
  let usedCarCsrf: string;
  let gomtiShowroomId: string;
  let createdTradeInId: string;

  beforeAll(async () => {
    // 1. Showroom
    const showroom = await prisma.showroom.findUniqueOrThrow({
      where: { code: 'LKO-GOMTI' },
    });
    gomtiShowroomId = showroom.id;

    // 2. Login Used Car Staff
    const usedLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usedcars@aureliamotors.com', password: demoPassword });
    usedCarCookie = getCookie(usedLogin);
    usedCarCsrf = usedLogin.body.data.csrfToken;
  });

  it('computes illustrative valuation band without requiring customer registration', async () => {
    const res = await request(app).post('/api/trade-ins/estimate').send({
      make: 'Honda',
      model: 'City',
      registrationYear: 2022,
      mileageKm: 35000,
      condition: VehicleCondition.GOOD,
      ownershipCount: 1,
    });

    expect(res.status).toBe(200);
    expect(res.body.estimatedValuationMinPaise).toBeGreaterThan(0);
    expect(res.body.estimatedValuationMaxPaise).toBeGreaterThan(
      res.body.estimatedValuationMinPaise,
    );
    expect(res.body.disclaimer).toContain('authorized Aurelia Motors showroom');
  });

  it('rejects trade-in submission without privacy consent (400)', async () => {
    const res = await request(app).post('/api/trade-ins').send({
      fullName: 'Rohit Verma',
      phone: '9876543210',
      email: 'rohit.verma@example.com',
      showroomId: gomtiShowroomId,
      make: 'Hyundai',
      model: 'Creta',
      registrationYear: 2021,
      mileageKm: 42000,
      condition: VehicleCondition.EXCELLENT,
      privacyConsent: false,
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('CONSENT_REQUIRED');
  });

  it('submits trade-in request, generates reference, creates lead, and assigns staff', async () => {
    const res = await request(app).post('/api/trade-ins').send({
      fullName: 'Sameer Shukla',
      phone: '9876541234',
      email: 'sameer.tradein@example.com',
      showroomId: gomtiShowroomId,
      make: 'Vantara',
      model: 'Lumen',
      variant: '1.5 Petrol MT',
      registrationYear: 2023,
      mileageKm: 28000,
      ownershipCount: 1,
      condition: VehicleCondition.GOOD,
      fuelType: 'PETROL',
      transmission: 'MANUAL',
      customerNotes: 'Looking to upgrade to the new Solis automatic.',
      privacyConsent: true,
    });

    expect(res.status).toBe(201);
    expect(res.body.reference).toMatch(/^TRD-2026-\d{5}$/);
    expect(res.body.estimatedValuationMinPaise).toBeGreaterThan(0);

    // Verify DB record
    const tradeIn = await prisma.tradeInRequest.findUniqueOrThrow({
      where: { reference: res.body.reference },
      include: { assignedStaff: true, customer: true },
    });

    createdTradeInId = tradeIn.id;
    expect(tradeIn.customer.email).toBe('sameer.tradein@example.com');
    expect(tradeIn.assignedStaffId).toBeDefined();

    // Verify corresponding Lead was created in CRM
    const lead = await prisma.lead.findFirst({
      where: { customerId: tradeIn.customerId, type: 'USED_CAR' },
    });
    expect(lead).toBeDefined();
    expect(lead?.customerRequirements).toContain('Trade-in enquiry');

    // Verify Staff Notification was created
    if (tradeIn.assignedStaffId) {
      const notif = await prisma.staffNotification.findFirst({
        where: {
          staffUserId: tradeIn.assignedStaffId,
          type: 'TRADE_IN_ASSIGNED',
        },
      });
      expect(notif).toBeDefined();
      expect(notif?.title).toBe('New Trade-In Request Assigned');
    }
  });

  it('allows staff to view trade-in list and detail', async () => {
    const listRes = await request(app).get('/api/staff/trade-ins').set('Cookie', usedCarCookie);

    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThan(0);

    const detailRes = await request(app)
      .get(`/api/staff/trade-ins/${createdTradeInId}`)
      .set('Cookie', usedCarCookie);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.reference).toBeDefined();
    expect(detailRes.body.customerName).toBe('Sameer Shukla');
  });

  it('allows staff to update trade-in evaluation status and formal offer in paise', async () => {
    const offeredPaise = 65_000_000; // Rs 6,50,000

    const patchRes = await request(app)
      .patch(`/api/staff/trade-ins/${createdTradeInId}`)
      .set('Cookie', usedCarCookie)
      .set('X-CSRF-Token', usedCarCsrf)
      .send({
        status: 'OFFERED',
        offeredValuationPaise: offeredPaise,
        staffNotes:
          'Physical inspection completed at Gomti Nagar workshop. Minor scratches on rear bumper.',
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.status).toBe('OFFERED');
    expect(patchRes.body.offeredValuationPaise).toBe(offeredPaise);
    expect(patchRes.body.staffNotes).toContain('Physical inspection completed');
  });
});
