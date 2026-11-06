import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import { ProposalStatus } from '@prisma/client';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Expected Set-Cookie header');
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Used-Car Price Approval Workflow API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;
  let usedCarCookie: string;
  let usedCarCsrf: string;
  let usedVehicleId: string;
  let originalVehiclePrice: number;
  let staffProposalId: string;

  beforeAll(async () => {
    // 1. Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // 2. Login Used Car Staff
    const usedLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usedcars@aureliamotors.com', password: demoPassword });
    usedCarCookie = getCookie(usedLogin);
    usedCarCsrf = usedLogin.body.data.csrfToken;

    // 3. Find an available used car
    const vehicle = await prisma.usedVehicle.findFirstOrThrow({
      where: { certified: true },
    });
    usedVehicleId = vehicle.id;
    originalVehiclePrice = vehicle.pricePaise;

    // Clean any prior pending proposals on this vehicle
    await prisma.usedCarPriceProposal.deleteMany({
      where: { usedVehicleId },
    });
  });

  it('rejects proposing the identical price as current price (400)', async () => {
    const res = await request(app)
      .post(`/api/staff/used-vehicles/${usedVehicleId}/propose-price`)
      .set('Cookie', usedCarCookie)
      .set('X-CSRF-Token', usedCarCsrf)
      .send({
        proposedPricePaise: originalVehiclePrice,
        reason: 'Attempting to submit identical price',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('IDENTICAL_PRICE');
  });

  it('allows used car staff to submit a price proposal and notifies admins', async () => {
    const proposedPrice = originalVehiclePrice - 5_000_000; // Rs 50,000 reduction

    const res = await request(app)
      .post(`/api/staff/used-vehicles/${usedVehicleId}/propose-price`)
      .set('Cookie', usedCarCookie)
      .set('X-CSRF-Token', usedCarCsrf)
      .send({
        proposedPricePaise: proposedPrice,
        reason: 'Adjusting price to match festive market demand in Lucknow',
      });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe(ProposalStatus.PENDING);
    expect(res.body.proposedPricePaise).toBe(proposedPrice);
    expect(res.body.currentPricePaise).toBe(originalVehiclePrice);
    staffProposalId = res.body.id;

    // Verify Admin received a notification
    const admin = await prisma.staffUser.findUniqueOrThrow({
      where: { email: 'admin@aureliamotors.com' },
    });

    const notif = await prisma.staffNotification.findFirst({
      where: {
        staffUserId: admin.id,
        type: 'PRICE_PROPOSAL_SUBMITTED',
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(notif).toBeDefined();
    expect(notif?.title).toBe('New Used-Car Price Proposal');
  });

  it('rejects duplicate proposal when one is already pending review (409)', async () => {
    const res = await request(app)
      .post(`/api/staff/used-vehicles/${usedVehicleId}/propose-price`)
      .set('Cookie', usedCarCookie)
      .set('X-CSRF-Token', usedCarCsrf)
      .send({
        proposedPricePaise: originalVehiclePrice - 2_000_000,
        reason: 'Another proposal while one is already pending',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('PROPOSAL_ALREADY_PENDING');
  });

  it('enforces separation of duties: proposer cannot self-approve their own proposal (403)', async () => {
    // Find a second used vehicle distinct from usedVehicleId
    const secondVehicle = await prisma.usedVehicle.findFirstOrThrow({
      where: { id: { not: usedVehicleId } },
    });

    // Clean existing proposals on second vehicle
    await prisma.usedCarPriceProposal.deleteMany({
      where: { usedVehicleId: secondVehicle.id },
    });

    // Admin proposes a price on second vehicle
    const adminProposalRes = await request(app)
      .post(`/api/staff/used-vehicles/${secondVehicle.id}/propose-price`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        proposedPricePaise: secondVehicle.pricePaise + 3_000_000,
        reason: 'Admin price adjustment test',
      });

    expect(adminProposalRes.status).toBe(201);
    const proposalId = adminProposalRes.body.id;

    // Admin attempts to approve their OWN proposal -> must reject with 403 SELF_APPROVAL_FORBIDDEN
    const selfApproveRes = await request(app)
      .post(`/api/staff/used-car-pricing/proposals/${proposalId}/approve`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({ reviewNotes: 'Self-approval attempt' });

    expect(selfApproveRes.status).toBe(403);
    expect(selfApproveRes.body.error.code).toBe('SELF_APPROVAL_FORBIDDEN');
  });

  it('allows administrator to approve used car staff proposal and updates vehicle price', async () => {
    const approveRes = await request(app)
      .post(`/api/staff/used-car-pricing/proposals/${staffProposalId}/approve`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({ reviewNotes: 'Market adjustment verified and approved.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.status).toBe(ProposalStatus.APPROVED);

    // Verify vehicle price was updated in database
    const updatedVehicle = await prisma.usedVehicle.findUniqueOrThrow({
      where: { id: usedVehicleId },
    });
    expect(updatedVehicle.pricePaise).toBe(approveRes.body.proposedPricePaise);

    // Verify proposer was notified
    const proposerNotif = await prisma.staffNotification.findFirst({
      where: {
        staffUserId: approveRes.body.proposedByStaffId,
        type: 'PRICE_APPROVAL',
      },
      orderBy: { createdAt: 'desc' },
    });
    expect(proposerNotif).toBeDefined();
    expect(proposerNotif?.title).toBe('Price Proposal Approved');
  });

  it('rejects stale proposal if vehicle price drifted before approval (409)', async () => {
    // 1. Propose another change
    const newProposal = await request(app)
      .post(`/api/staff/used-vehicles/${usedVehicleId}/propose-price`)
      .set('Cookie', usedCarCookie)
      .set('X-CSRF-Token', usedCarCsrf)
      .send({
        proposedPricePaise: originalVehiclePrice + 1_000_000,
        reason: 'Price adjustment for stale test',
      });

    expect(newProposal.status).toBe(201);
    const proposalId = newProposal.body.id;

    // 2. Simulate out-of-band price drift directly in DB
    await prisma.usedVehicle.update({
      where: { id: usedVehicleId },
      data: { pricePaise: originalVehiclePrice + 8_000_000 },
    });

    // 3. Admin attempts approval -> must reject with 409 STALE_PROPOSAL
    const approveRes = await request(app)
      .post(`/api/staff/used-car-pricing/proposals/${proposalId}/approve`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({});

    expect(approveRes.status).toBe(409);
    expect(approveRes.body.error.code).toBe('STALE_PROPOSAL');
  });
});
