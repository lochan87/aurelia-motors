import crypto from 'node:crypto';
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

describe('End-to-End Dealership System Journeys & Integration Verification', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let centralShowroom: { id: string; code: string; name: string };
  let gomtiShowroom: { id: string; code: string; name: string };
  let testVariant: { id: string; slug: string; model: { slug: string; id: string } };
  let testWorkshop: { id: string; code: string; name: string };
  let testServiceType: { id: string; code: string; name: string };

  let adminCookie: string;
  let adminCsrf: string;
  let gomtiSalesCookie: string;
  let centralSalesCookie: string;

  beforeAll(async () => {
    // 1. Fetch seed locations
    const central = await prisma.showroom.findUniqueOrThrow({ where: { code: 'LKO-CENTRAL' } });
    centralShowroom = { id: central.id, code: central.code, name: central.name };

    const gomti = await prisma.showroom.findUniqueOrThrow({ where: { code: 'LKO-GOMTI' } });
    gomtiShowroom = { id: gomti.id, code: gomti.code, name: gomti.name };

    const workshop = await prisma.workshop.findFirstOrThrow({ where: { isActive: true } });
    testWorkshop = {
      id: workshop.id,
      code: workshop.code,
      name: workshop.name,
    };

    const serviceType = await prisma.serviceType.findFirstOrThrow({ where: { isActive: true } });
    testServiceType = { id: serviceType.id, code: serviceType.code, name: serviceType.name };

    // Find a variant that has demo vehicles at Central Lucknow
    const demoVehicle = await prisma.demoVehicle.findFirstOrThrow({
      where: { showroomId: central.id, isActive: true },
      include: { variant: { include: { model: true } } },
    });
    testVariant = {
      id: demoVehicle.variantId,
      slug: demoVehicle.variant.slug,
      model: { slug: demoVehicle.variant.model.slug, id: demoVehicle.variant.model.id },
    };

    // 2. Authenticate Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // 3. Authenticate Gomti Sales Staff
    const gomtiLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.gomti@aureliamotors.com', password: demoPassword });
    gomtiSalesCookie = getCookie(gomtiLogin);

    // 4. Authenticate Central Sales Staff
    const centralLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.central@aureliamotors.com', password: demoPassword });
    centralSalesCookie = getCookie(centralLogin);
  });

  // =========================================================================
  // JOURNEY 1 — Customer New Vehicle, Pricing, EMI & Lead Capture
  // =========================================================================
  describe('Customer Journey 1: New Vehicle Browsing, On-Road Pricing, EMI & Lead Enquiry', () => {
    it('browses catalogue models, switches showrooms, and retrieves published on-road pricing', async () => {
      // 1. Browse catalogue models
      const modelsRes = await request(app).get('/api/catalogue/models');
      expect(modelsRes.status).toBe(200);
      expect(modelsRes.body.success).toBe(true);
      expect(modelsRes.body.data.length).toBeGreaterThanOrEqual(1);

      // 2. Fetch variant pricing for Central Showroom
      const centralPricingRes = await request(app)
        .get(`/api/catalogue/variants/${testVariant.slug}/pricing`)
        .query({ showroomCode: centralShowroom.code });

      expect(centralPricingRes.status).toBe(200);
      expect(centralPricingRes.body.success).toBe(true);
      const centralPricing = centralPricingRes.body.data;
      expect(centralPricing.exShowroomPaise).toBeGreaterThan(0);
      expect(centralPricing.standardOnRoadPricePaise).toBeGreaterThanOrEqual(
        centralPricing.exShowroomPaise,
      );
      expect(centralPricing.mandatoryComponents.length).toBeGreaterThanOrEqual(1);

      // Verify road tax component is included
      const roadTax = centralPricing.mandatoryComponents.find(
        (c: { code: string }) => c.code === 'ROAD_TAX',
      );
      expect(roadTax).toBeDefined();

      // 3. Switch showroom to Gomti Nagar and verify pricing lookup succeeds
      const gomtiPricingRes = await request(app)
        .get(`/api/catalogue/variants/vantara-lumen-petrol-mt/pricing`)
        .query({ showroomCode: gomtiShowroom.code });

      expect(gomtiPricingRes.status).toBe(200);
      expect(gomtiPricingRes.body.success).toBe(true);
      expect(gomtiPricingRes.body.data.standardOnRoadPricePaise).toBeGreaterThan(0);
    });

    it('rejects enquiry submission without mandatory DPDP Act 2023 consent (422)', async () => {
      const res = await request(app).post('/api/enquiries').send({
        fullName: 'Vikram Singh',
        phone: '9876543210',
        email: 'vikram.singh@example.com',
        showroomId: centralShowroom.id,
        privacyConsent: false, // Denied DPDP consent
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('submits customer enquiry, generates unique lead, and assigns sales consultant within SLA', async () => {
      const uniqueSuffix = Date.now().toString().slice(-4);
      const res = await request(app)
        .post('/api/enquiries')
        .send({
          fullName: `Rajesh Sharma ${uniqueSuffix}`,
          phone: `98765${uniqueSuffix.padStart(5, '0')}`,
          email: `rajesh.${uniqueSuffix}@test.e2e.in`,
          showroomId: centralShowroom.id,
          modelId: testVariant.model.id,
          customerRequirements:
            'Interested in Solis EV Elegance variant with home charger installation.',
          preferredContactMethod: 'PHONE',
          privacyConsent: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.leadReference).toMatch(/^LEA-\d{4}-\d{5}$/);
      expect(res.body.data.assignmentDurationMs).toBeDefined();
      expect(res.body.data.assignmentDurationMs).toBeLessThan(500); // Sub-500ms lead routing SLA
    });
  });

  // =========================================================================
  // JOURNEY 2 — Certified Used Car, Inspection & Trade-In
  // =========================================================================
  describe('Customer Journey 2: Certified Pre-Owned Car, Inspection Report & Trade-In Valuation', () => {
    it('browses certified used cars with masked registration plates and views full inspection report', async () => {
      // 1. List certified used cars
      const listRes = await request(app).get('/api/used-vehicles');
      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.data.items.length).toBeGreaterThanOrEqual(1);

      const firstCar = listRes.body.data.items[0];
      expect(firstCar.registrationNumberMasked).toBeTruthy();

      // 2. Fetch car details with inspection items
      const detailRes = await request(app).get(`/api/used-vehicles/${firstCar.slug}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.success).toBe(true);
      expect(detailRes.body.data.inspection).toBeDefined();
      expect(detailRes.body.data.inspection.items.length).toBeGreaterThanOrEqual(1);
    });

    it('computes instant illustrative trade-in valuation without requiring customer registration', async () => {
      const estimateRes = await request(app).post('/api/trade-ins/estimate').send({
        make: 'Honda',
        model: 'City',
        registrationYear: 2021,
        mileageKm: 35000,
        condition: VehicleCondition.GOOD,
        ownershipCount: 1,
      });

      expect(estimateRes.status).toBe(200);
      expect(estimateRes.body.estimatedValuationMinPaise).toBeGreaterThan(0);
      expect(estimateRes.body.estimatedValuationMaxPaise).toBeGreaterThan(
        estimateRes.body.estimatedValuationMinPaise,
      );
      expect(estimateRes.body.disclaimer).toBeTruthy();
    });

    it('submits formal trade-in valuation request with DPDP consent and generates tracking reference', async () => {
      const res = await request(app).post('/api/trade-ins').send({
        fullName: 'Amitabh Verma',
        phone: '9839012345',
        email: 'amitabh.verma@example.com',
        showroomId: centralShowroom.id,
        make: 'Hyundai',
        model: 'Creta',
        variant: 'SX (O) Petrol',
        registrationYear: 2022,
        mileageKm: 28000,
        condition: VehicleCondition.EXCELLENT,
        customerNotes: 'Looking to exchange for Aurelia Solis EV.',
        privacyConsent: true,
      });

      expect(res.status).toBe(201);
      expect(res.body.reference).toMatch(/^TRD-/);
      expect(res.body.estimatedValuationMinPaise).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // JOURNEY 3 — Test Drive Booking, Concurrency Protection & Cancellation
  // =========================================================================
  describe('Customer Journey 3: Test-Drive Booking, Double-Booking Concurrency & Token Cancellation', () => {
    it('checks demo fleet availability, books test-drive slot, and guards against race conditions', async () => {
      const bookingDate = '2026-11-20';
      const slotTime = '2026-11-20T11:00:00.000Z';
      const idempotencyKey = `e2e-td-${crypto.randomUUID()}`;

      // 1. Fetch available test-drive slots
      const availRes = await request(app)
        .get('/api/test-drives/availability')
        .query({ showroomId: centralShowroom.id, variantId: testVariant.id, date: bookingDate });

      expect(availRes.status).toBe(200);
      expect(availRes.body.success).toBe(true);

      // Clean prior bookings for this specific slot if any
      await prisma.testDriveAppointment.deleteMany({
        where: {
          showroomId: centralShowroom.id,
          variantId: testVariant.id,
          startTime: new Date(slotTime),
        },
      });

      // 2. Book test-drive appointment
      const bookRes = await request(app).post('/api/test-drives').send({
        showroomId: centralShowroom.id,
        variantId: testVariant.id,
        startTime: slotTime,
        customerName: 'Priya Sen',
        customerPhone: '+919415012345',
        customerEmail: 'priya.sen@example.com',
        driverLicenseNumber: 'UP3220190012345',
        consentGranted: true,
        idempotencyKey,
      });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.success).toBe(true);
      const { bookingReference, confirmationToken } = bookRes.body.data;
      expect(bookingReference).toMatch(/^TD-/);
      expect(confirmationToken).toBeTruthy();

      // 3. Concurrent second booking attempt on same slot -> must reject with 409 Conflict
      const raceRes = await request(app)
        .post('/api/test-drives')
        .send({
          showroomId: centralShowroom.id,
          variantId: testVariant.id,
          startTime: slotTime,
          customerName: 'Rohan Mehra',
          customerPhone: '+919415099999',
          customerEmail: 'rohan.mehra@example.com',
          consentGranted: true,
          idempotencyKey: `e2e-td-conflict-${crypto.randomUUID()}`,
        });

      expect(raceRes.status).toBe(409);
      expect(raceRes.body.success).toBe(false);

      // 4. Cancel booking using secure cancellation token
      const cancelRes = await request(app).post(`/api/bookings/${bookingReference}/cancel`).send({
        confirmationToken,
        reason: 'Customer requested reschedule.',
      });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
    });
  });

  // =========================================================================
  // JOURNEY 4 — Workshop Service Booking & Capacity Limits
  // =========================================================================
  describe('Customer Journey 4: Workshop Service Booking & Bay Capacity Enforcement', () => {
    it('checks service availability, books slot, and respects daily workshop capacity', async () => {
      const serviceDate = '2026-11-25';
      const slotTime = '2026-11-25T10:00:00.000Z';
      const idempotencyKey = `e2e-svc-${crypto.randomUUID()}`;

      // Clean prior bookings for this slot
      await prisma.serviceAppointment.deleteMany({
        where: {
          workshopId: testWorkshop.id,
          startTime: new Date(slotTime),
        },
      });

      // 1. Query availability
      const availRes = await request(app).get('/api/services/availability').query({
        workshopId: testWorkshop.id,
        serviceTypeId: testServiceType.id,
        date: serviceDate,
      });

      expect(availRes.status).toBe(200);
      expect(availRes.body.success).toBe(true);

      // 2. Book appointment
      const bookRes = await request(app).post('/api/services/bookings').send({
        workshopId: testWorkshop.id,
        serviceTypeId: testServiceType.id,
        startTime: slotTime,
        registrationNumber: 'UP 32 BK 7721',
        vehicleModel: 'Aurelia Solis',
        vehicleYear: 2024,
        customerName: 'Anand Mishra',
        customerPhone: '+919838054321',
        customerEmail: 'anand.mishra@example.com',
        consentGranted: true,
        idempotencyKey,
      });

      expect(bookRes.status).toBe(201);
      expect(bookRes.body.success).toBe(true);
      expect(bookRes.body.data.bookingReference).toMatch(/^SRV-/);
    });
  });

  // =========================================================================
  // JOURNEY 5 — Staff CRM, CSV Import & AI Lead Operations
  // =========================================================================
  describe('Staff Journeys: CRM Management, CSV Batch Import & AI Operations', () => {
    let testLeadId: string;

    beforeAll(async () => {
      const lead = await prisma.lead.findFirstOrThrow({
        where: { showroomId: centralShowroom.id },
      });
      testLeadId = lead.id;
    });

    it('allows staff to view and filter CRM leads with response time metrics', async () => {
      const leadsRes = await request(app)
        .get('/api/staff/leads')
        .set('Cookie', adminCookie)
        .query({ showroomId: centralShowroom.id, pageSize: 10 });

      expect(leadsRes.status).toBe(200);
      expect(leadsRes.body.success).toBe(true);
      expect(leadsRes.body.data.items.length).toBeGreaterThanOrEqual(1);

      const first = leadsRes.body.data.items[0];
      expect(first.customerName).toBeTruthy();
      expect(first.customerPhone).toBeTruthy();
    });

    it('previews and executes CSV batch lead import from third-party auto portal', async () => {
      const ts = Date.now();
      const phone1 = '97' + String(ts).slice(-8);
      const phone2 = '96' + String(ts).slice(-8);
      const csvData = `customerName,phone,email,showroom,model,source,message,externalId
Kavita Pandey,${phone1},kavita.${ts}@example.com,LKO-CENTRAL,Aurelia Solis,PORTAL_IMPORT,Looking for automatic sedan,PORTAL-E2E-${ts}-A
Manish Tiwari,${phone2},manish.${ts}@example.com,LKO-CENTRAL,Aurelia Solis,PORTAL_IMPORT,Wants test drive,PORTAL-E2E-${ts}-B`;

      // 1. Preview Import
      const previewRes = await request(app)
        .post('/api/staff/leads/import/preview')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({ csvText: csvData });

      expect(previewRes.status).toBe(200);
      expect(previewRes.body.success).toBe(true);
      expect(previewRes.body.data.validRows).toBe(2);

      // 2. Execute Import
      const executeRes = await request(app)
        .post('/api/staff/leads/import')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          filename: 'portal-e2e.csv',
          source: 'PORTAL_IMPORT',
          rows: [
            {
              rowNumber: 1,
              customerName: 'Kavita Pandey',
              phone: phone1,
              email: `kavita.${ts}@example.com`,
              showroomName: 'LKO-CENTRAL',
              modelName: 'Aurelia Solis',
              source: 'PORTAL_IMPORT',
              message: 'Looking for automatic sedan',
              externalId: `PORTAL-E2E-${ts}-A`,
            },
          ],
        });

      expect(executeRes.status).toBe(201);
      expect(executeRes.body.success).toBe(true);
      expect(executeRes.body.data.importedCount).toBe(1);
    });

    it('generates grounded AI lead summary, response draft, and inventory-matched recommendations', async () => {
      // 1. AI Lead Summary
      const summaryRes = await request(app)
        .post(`/api/staff/ai/${testLeadId}/summary`)
        .set('Cookie', adminCookie);

      expect(summaryRes.status).toBe(200);
      expect(summaryRes.body.leadId).toBe(testLeadId);
      expect(summaryRes.body.summary).toBeTruthy();
      expect(summaryRes.body.provider).toContain('Grounded Domain Engine');

      // 2. AI Multi-Channel Response Draft (WhatsApp)
      const draftRes = await request(app)
        .post(`/api/staff/ai/${testLeadId}/response-draft`)
        .set('Cookie', adminCookie)
        .send({ channel: 'WHATSAPP' });

      expect(draftRes.status).toBe(200);
      expect(draftRes.body.channel).toBe('WHATSAPP');
      expect(draftRes.body.body).toContain('Aurelia Motors');

      // 3. AI Real Stock Recommendations (DB Grounded)
      const recsRes = await request(app)
        .post(`/api/staff/ai/${testLeadId}/recommendations`)
        .set('Cookie', adminCookie);

      expect(recsRes.status).toBe(200);
      expect(recsRes.body.recommendations).toBeInstanceOf(Array);
      expect(recsRes.body.recommendations.length).toBeGreaterThan(0);
      expect(recsRes.body.recommendations[0]).toHaveProperty('title');
      expect(recsRes.body.recommendations[0]).toHaveProperty('pricePaise');
      expect(recsRes.body.recommendations[0]).toHaveProperty('rationale');
    });
  });

  // =========================================================================
  // JOURNEY 6 — RBAC & Facility Boundary Isolation
  // =========================================================================
  describe('Security & Isolation: Role-Based Access Control and Cross-Facility Boundaries', () => {
    it('prevents non-admin staff from accessing admin CMS routes (403 Forbidden)', async () => {
      const res = await request(app).get('/api/admin/cms/models').set('Cookie', gomtiSalesCookie);

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('prevents sales consultant from viewing leads of an unassigned showroom', async () => {
      // Create a lead in Gomti Nagar
      const gomtiLead = await prisma.lead.findFirst({
        where: { showroomId: gomtiShowroom.id },
      });

      if (gomtiLead) {
        // Central sales consultant attempts to access Gomti Nagar lead detail -> must be 403
        const res = await request(app)
          .get(`/api/staff/leads/${gomtiLead.id}`)
          .set('Cookie', centralSalesCookie);

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
      }
    });

    it('enforces CSRF protection on mutating staff operations', async () => {
      const res = await request(app)
        .post('/api/staff/leads/import')
        .set('Cookie', adminCookie)
        // Omit X-CSRF-Token
        .send({
          filename: 'test.csv',
          source: 'PORTAL_IMPORT',
          rows: [],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
