import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) {
    throw new Error('Expected Set-Cookie header to be defined');
  }
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Lead CRM, Enquiries & Response Tracking API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;

  let centralSalesCookie: string;
  let centralSalesCsrf: string;

  let gomtiSalesCookie: string;

  let centralShowroomId: string;
  let gomtiShowroomId: string;
  let sampleModelId: string;

  beforeAll(async () => {
    // 1. Fetch seed showrooms & models
    const centralShowroom = await prisma.showroom.findUniqueOrThrow({
      where: { code: 'LKO-CENTRAL' },
    });
    const gomtiShowroom = await prisma.showroom.findUniqueOrThrow({
      where: { code: 'LKO-GOMTI' },
    });
    const model = await prisma.vehicleModel.findFirstOrThrow({
      where: { isActive: true },
    });

    centralShowroomId = centralShowroom.id;
    gomtiShowroomId = gomtiShowroom.id;
    sampleModelId = model.id;

    // 2. Clean temporary test leads
    await prisma.leadActivity.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.leadNote.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.leadStatusHistory.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.lead.deleteMany({
      where: {
        OR: [
          { customer: { email: { contains: 'test.leads' } } },
          { customer: { phone: '9876500111' } },
        ],
      },
    });
    await prisma.customer.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test.leads' } },
          { phone: '9876500111' },
        ],
      },
    });

    // 3. Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // 4. Login Central Sales Consultant
    const centralLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.central@aureliamotors.com', password: demoPassword });
    centralSalesCookie = getCookie(centralLogin);
    centralSalesCsrf = centralLogin.body.data.csrfToken;

    // 5. Login Gomti Sales Consultant
    const gomtiLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.gomti@aureliamotors.com', password: demoPassword });
    gomtiSalesCookie = getCookie(gomtiLogin);
  });

  afterAll(async () => {
    // Cleanup temporary leads
    await prisma.leadActivity.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.leadNote.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.leadStatusHistory.deleteMany({
      where: { lead: { customer: { email: { contains: 'test.leads' } } } },
    });
    await prisma.lead.deleteMany({
      where: {
        OR: [
          { customer: { email: { contains: 'test.leads' } } },
          { customer: { phone: '9876500111' } },
        ],
      },
    });
    await prisma.customer.deleteMany({
      where: {
        OR: [
          { email: { contains: 'test.leads' } },
          { phone: '9876500111' },
        ],
      },
    });
  });

  describe('POST /api/enquiries (Public Inbound)', () => {
    it('creates a new enquiry, records DPDP consent, and balances assignment workload', async () => {
      const response = await request(app).post('/api/enquiries').send({
        fullName: 'Karan Mehra',
        phone: '9839123456',
        email: 'karan.mehra@test.leads.com',
        showroomId: centralShowroomId,
        modelId: sampleModelId,
        customerRequirements: 'Interested in bespoke leather finish and fast delivery',
        preferredContactMethod: 'PHONE',
        privacyConsent: true,
      });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.leadReference).toMatch(/^LEA-\d{4}-\d{5}$/);

      // Verify lead in database
      const savedLead = await prisma.lead.findUnique({
        where: { leadReference: response.body.data.leadReference },
        include: {
          customer: { include: { consents: true } },
          assignedStaff: true,
        },
      });

      expect(savedLead).not.toBeNull();
      expect(['NEW', 'ASSIGNED']).toContain(savedLead?.status);
      expect(savedLead?.firstResponseAt).toBeNull(); // Crucial: NOT responded yet
      expect(savedLead?.customer.fullName).toBe('Karan Mehra');
      expect(savedLead?.customer.consents.length).toBeGreaterThan(0);
      expect(savedLead?.customer.consents[0]?.purpose).toBe('CUSTOMER_ENQUIRY');
      expect(savedLead?.assignedStaffId).not.toBeNull();
    });

    it('executes enquiry creation and assignment within strict performance SLA (<500ms)', async () => {
      const startTime = Date.now();
      const response = await request(app).post('/api/enquiries').send({
        fullName: 'Performance Tester',
        phone: '9839999888',
        email: 'perf.tester@test.leads.com',
        showroomId: gomtiShowroomId,
        modelId: sampleModelId,
        customerRequirements: 'SLA verification enquiry',
        preferredContactMethod: 'EMAIL',
        privacyConsent: true,
      });
      const durationMs = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(response.body.data.assignmentDurationMs).toBeDefined();
      expect(response.body.data.assignmentDurationMs).toBeLessThan(350);
      expect(durationMs).toBeLessThan(1500); // Under 1.5s total HTTP response (well under 25s 4G SLA)
    });

    it('rejects enquiry when DPDP consent is false', async () => {
      const response = await request(app).post('/api/enquiries').send({
        fullName: 'No Consent User',
        phone: '9839999999',
        email: 'noconsent@test.leads.com',
        showroomId: centralShowroomId,
        privacyConsent: false,
      });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('rejects duplicate enquiry submitted within 30 minutes', async () => {
      const payload = {
        fullName: 'Rohit Agnihotri',
        phone: '9876500111',
        email: 'rohit.agnihotri@test.leads.com',
        showroomId: centralShowroomId,
        modelId: sampleModelId,
        privacyConsent: true,
      };

      // First submission
      const firstRes = await request(app).post('/api/enquiries').send(payload);
      expect(firstRes.status).toBe(201);

      // Duplicate submission
      const dupRes = await request(app).post('/api/enquiries').send(payload);
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.error.code).toBe('DUPLICATE_ENQUIRY');
    });
  });

  describe('Response-Time Tracking & Human Outreach Logging', () => {
    let testLeadId: string;
    let testLeadRef: string;

    beforeAll(async () => {
      const res = await request(app).post('/api/enquiries').send({
        fullName: 'Ananya Singhania',
        phone: '9821098765',
        email: 'ananya.s@test.leads.com',
        showroomId: centralShowroomId,
        modelId: sampleModelId,
        privacyConsent: true,
      });
      testLeadRef = res.body.data.leadReference;
      const lead = await prisma.lead.findUniqueOrThrow({
        where: { leadReference: testLeadRef },
      });
      testLeadId = lead.id;
    });

    it('enquiry creation does NOT count as first-response', async () => {
      const lead = await prisma.lead.findUniqueOrThrow({
        where: { id: testLeadId },
      });
      expect(lead.firstResponseAt).toBeNull();
      expect(['NEW', 'ASSIGNED']).toContain(lead.status);
    });

    it('explicit contact activity establishes firstResponseAt and calculates response time', async () => {
      const contactRes = await request(app)
        .post(`/api/staff/leads/${testLeadId}/activities`)
        .set('Cookie', centralSalesCookie)
        .set('X-CSRF-Token', centralSalesCsrf)
        .send({
          contactMethod: 'PHONE',
          summary: 'Phone call regarding test-drive scheduling and variant options',
          details: 'Client answered. Available Saturday afternoon at Central showroom.',
          updateStatus: 'CONTACTED',
        });

      expect(contactRes.status).toBe(201);

      // Verify updated lead
      const updatedLead = await prisma.lead.findUniqueOrThrow({
        where: { id: testLeadId },
        include: { activities: true, statusHistory: true },
      });

      expect(updatedLead.firstResponseAt).not.toBeNull();
      expect(updatedLead.status).toBe('CONTACTED');
      expect(updatedLead.activities.length).toBeGreaterThan(0);
      expect(updatedLead.activities.some((a) => a.activityType === 'PHONE')).toBe(true);

      // Subsequent contact does not overwrite firstResponseAt
      const originalFirstResponse = updatedLead.firstResponseAt;
      await request(app)
        .post(`/api/staff/leads/${testLeadId}/activities`)
        .set('Cookie', centralSalesCookie)
        .set('X-CSRF-Token', centralSalesCsrf)
        .send({
          contactMethod: 'EMAIL',
          summary: 'Sent brochure and price quotation',
        });

      const secondCheck = await prisma.lead.findUniqueOrThrow({
        where: { id: testLeadId },
      });
      expect(secondCheck.firstResponseAt).toEqual(originalFirstResponse);
    });

    it('flags leads created >30 mins ago without contact as overdue', async () => {
      // Create a simulated older lead directly in database
      const customer = await prisma.customer.create({
        data: {
          fullName: 'Overdue Customer',
          phone: '9911223344',
          email: 'overdue@test.leads.com',
        },
      });

      const fortyMinsAgo = new Date(Date.now() - 40 * 60 * 1000);
      const overdueLead = await prisma.lead.create({
        data: {
          leadReference: 'ENQ-202611-TEST',
          customerId: customer.id,
          showroomId: centralShowroomId,
          status: 'NEW',
          source: 'WEB_ENQUIRY',
          createdAt: fortyMinsAgo,
        },
      });

      const detailRes = await request(app)
        .get(`/api/staff/leads/${overdueLead.id}`)
        .set('Cookie', adminCookie);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.isOverdue).toBe(true);
      expect(detailRes.body.data.firstResponseAt).toBeNull();
    });
  });

  describe('Location Scoping and Access Control', () => {
    let gomtiLeadId: string;

    beforeAll(async () => {
      const res = await request(app).post('/api/enquiries').send({
        fullName: 'Gomti Client',
        phone: '9711002233',
        email: 'gomti.client@test.leads.com',
        showroomId: gomtiShowroomId,
        privacyConsent: true,
      });
      const lead = await prisma.lead.findUniqueOrThrow({
        where: { leadReference: res.body.data.leadReference },
      });
      gomtiLeadId = lead.id;
    });

    it('allows Admin to access all leads across dealerships', async () => {
      const res = await request(app)
        .get(`/api/staff/leads/${gomtiLeadId}`)
        .set('Cookie', adminCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.customerName).toBe('Gomti Client');
    });

    it('blocks Central Sales Consultant from accessing Gomti Nagar lead with 403', async () => {
      const res = await request(app)
        .get(`/api/staff/leads/${gomtiLeadId}`)
        .set('Cookie', centralSalesCookie);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('allows Gomti Sales Consultant to access Gomti Nagar lead', async () => {
      const res = await request(app)
        .get(`/api/staff/leads/${gomtiLeadId}`)
        .set('Cookie', gomtiSalesCookie);

      expect(res.status).toBe(200);
      expect(res.body.data.customerName).toBe('Gomti Client');
    });
  });

  describe('Portal CSV Import (Admin Only)', () => {
    const csvData = `customerName,phone,email,showroom,model,source,message,externalId
Vikram Sethi,9876543210,vikram.sethi@test.leads.com,LKO-CENTRAL,Aurelia Solis,PORTAL_IMPORT,Direct aggregator lead,PORTAL-TEST-001
Deepak Mishra,9811223344,deepak.mishra@test.leads.com,LKO-GOMTI,Aurelia Solis,PORTAL_IMPORT,Looking for corporate rate,PORTAL-TEST-002`;

    it('blocks non-admin staff from previewing or importing CSV with 403', async () => {
      const res = await request(app)
        .post('/api/staff/leads/import/preview')
        .set('Cookie', centralSalesCookie)
        .set('X-CSRF-Token', centralSalesCsrf)
        .send({ csvText: csvData });

      expect(res.status).toBe(403);
    });

    it('allows Admin to preview CSV rows and detect valid entries', async () => {
      const res = await request(app)
        .post('/api/staff/leads/import/preview')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({ csvText: csvData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalRows).toBe(2);
      expect(res.body.data.validRows).toBe(2);
      expect(res.body.data.duplicateRows).toBe(0);
    });

    it('allows Admin to execute CSV import and automatically routes leads', async () => {
      const res = await request(app)
        .post('/api/staff/leads/import')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          filename: 'portal-test.csv',
          source: 'PORTAL_IMPORT',
          rows: [
            {
              rowNumber: 1,
              customerName: 'Vikram Sethi',
              phone: '9876543210',
              email: 'vikram.sethi@test.leads.com',
              showroomName: 'LKO-CENTRAL',
              modelName: 'Aurelia Solis',
              source: 'PORTAL_IMPORT',
              message: 'Direct aggregator lead',
              externalId: 'PORTAL-TEST-001',
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.importedCount).toBe(1);
      expect(res.body.data.batchReference).toMatch(/^IMP-\d{4}-\d{5}$/);

      // Verify lead created with externalLeadId
      const importedLead = await prisma.lead.findFirst({
        where: { externalLeadId: 'PORTAL-TEST-001' },
      });
      expect(importedLead).not.toBeNull();
      expect(importedLead?.source).toBe('PORTAL_IMPORT');
    });

    it('skips duplicate external lead IDs on subsequent import', async () => {
      const res = await request(app)
        .post('/api/staff/leads/import')
        .set('Cookie', adminCookie)
        .set('X-CSRF-Token', adminCsrf)
        .send({
          filename: 'portal-test-dup.csv',
          source: 'PORTAL_IMPORT',
          rows: [
            {
              rowNumber: 1,
              customerName: 'Vikram Sethi Duplicate',
              phone: '9876543210',
              email: 'vikram.sethi@test.leads.com',
              showroomName: 'LKO-CENTRAL',
              source: 'PORTAL_IMPORT',
              externalId: 'PORTAL-TEST-001', // Already imported above!
            },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.importedCount).toBe(0);
      expect(res.body.data.duplicateCount).toBe(1);
    });
  });
});
