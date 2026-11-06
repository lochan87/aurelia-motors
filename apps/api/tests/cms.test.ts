import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';
import {
  BodyType,
  FuelType,
  PriceComponentCategory,
  PriceCalculation,
  Transmission,
} from '@prisma/client';

import { createApp } from '../src/app.js';
import { prisma } from '../src/db/prisma.js';

const app = createApp();

function getCookie(response: request.Response): string {
  const cookies = response.headers['set-cookie'];
  if (!cookies) throw new Error('Expected Set-Cookie header');
  const first = Array.isArray(cookies) ? cookies[0] : cookies;
  return (first || '').split(';')[0] || '';
}

describe('Admin CMS, Inventory & Pricing Management API', () => {
  const demoPassword = process.env.AURELIA_DEMO_PASSWORD || 'Aurelia2026!';

  let adminCookie: string;
  let adminCsrf: string;
  let salesCookie: string;
  let showroomId: string;
  let createdModelId: string;
  let createdVariantId: string;

  beforeAll(async () => {
    const showroom = await prisma.showroom.findFirstOrThrow({ where: { isActive: true } });
    showroomId = showroom.id;

    // Login Admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@aureliamotors.com', password: demoPassword });
    adminCookie = getCookie(adminLogin);
    adminCsrf = adminLogin.body.data.csrfToken;

    // Login Sales Consultant (non-admin)
    const salesLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales.central@aureliamotors.com', password: demoPassword });
    salesCookie = getCookie(salesLogin);

    // Clean any prior test models and their relations
    const testModels = await prisma.vehicleModel.findMany({
      where: { slug: { in: ['test-cms-aeris', 'test-cms-aeris-updated'] } },
      select: { id: true, variants: { select: { id: true } } },
    });
    for (const m of testModels) {
      for (const v of m.variants) {
        await prisma.newVehicleInventory.deleteMany({ where: { variantId: v.id } });
        await prisma.priceEntry.deleteMany({ where: { variantId: v.id } });
      }
      await prisma.vehicleVariant.deleteMany({ where: { modelId: m.id } });
    }
    await prisma.vehicleModel.deleteMany({
      where: { slug: { in: ['test-cms-aeris', 'test-cms-aeris-updated'] } },
    });
  });

  it('rejects non-admin staff from accessing CMS endpoints (403 Forbidden)', async () => {
    const res = await request(app).get('/api/admin/cms/models').set('Cookie', salesCookie);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('creates, reads, updates, and soft-deactivates vehicle models via Admin CMS', async () => {
    // 1. Create Model
    const createRes = await request(app)
      .post('/api/admin/cms/models')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Aeris GT',
        make: 'Vantara',
        slug: 'test-cms-aeris',
        bodyType: BodyType.SEDAN,
        summary: 'A sleek luxury electric sedan engineered for long touring.',
        description: 'Detailed description of the test vehicle for CMS verification.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.slug).toBe('test-cms-aeris');
    expect(createRes.body.isActive).toBe(true);
    createdModelId = createRes.body.id;

    // 2. Read Model
    const getRes = await request(app)
      .get(`/api/admin/cms/models/${createdModelId}`)
      .set('Cookie', adminCookie);

    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Aeris GT');

    // 3. Update Model
    const updateRes = await request(app)
      .patch(`/api/admin/cms/models/${createdModelId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        summary: 'Updated summary for the luxury electric touring sedan.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.summary).toContain('Updated summary');

    // 4. Deactivate Model (Soft Delete)
    const deleteRes = await request(app)
      .delete(`/api/admin/cms/models/${createdModelId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(deleteRes.status).toBe(200);
    expect(deleteRes.body.isActive).toBe(false);
  });

  it('creates and manages vehicle variants under a model', async () => {
    // Re-activate model for variant test
    await prisma.vehicleModel.update({
      where: { id: createdModelId },
      data: { isActive: true },
    });

    const createVariantRes = await request(app)
      .post(`/api/admin/cms/models/${createdModelId}/variants`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        name: 'Aeris GT Long Range AWD',
        slug: 'aeris-gt-lr-awd',
        fuelType: FuelType.ELECTRIC,
        transmission: Transmission.AUTOMATIC,
        powerBhp: 380,
        torqueNm: 520,
        seatingCapacity: 5,
        sortOrder: 1,
      });

    expect(createVariantRes.status).toBe(201);
    expect(createVariantRes.body.name).toBe('Aeris GT Long Range AWD');
    createdVariantId = createVariantRes.body.id;

    // Update variant
    const patchRes = await request(app)
      .patch(`/api/admin/cms/variants/${createdVariantId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({ powerBhp: 400 });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.powerBhp).toBe(400);
  });

  it('creates and manages new inventory units in integer paise and stock numbers', async () => {
    const stockNumber = `STK-TEST-${Date.now()}`;
    const createInvRes = await request(app)
      .post('/api/admin/cms/inventory')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        showroomId,
        variantId: createdVariantId,
        stockNumber,
        manufactureYear: 2026,
      });

    expect(createInvRes.status).toBe(201);
    expect(createInvRes.body.stockNumber).toBe(stockNumber);

    // List inventory
    const listRes = await request(app).get('/api/admin/cms/inventory').set('Cookie', adminCookie);

    expect(listRes.status).toBe(200);
    expect(listRes.body.items.length).toBeGreaterThan(0);
  });

  it('creates draft price book, upserts components, and enforces overlap prevention on publish', async () => {
    // Create an isolated test showroom for price book publish testing
    const testShowroom = await prisma.showroom.create({
      data: {
        code: `TEST-PB-${Date.now()}`,
        name: 'Test Pricing Showroom',
      },
    });

    const bookCode1 = `PB-TEST-1-${Date.now()}`;
    const bookCode2 = `PB-TEST-2-${Date.now()}`;

    // 1. Create first draft price book
    const createRes1 = await request(app)
      .post('/api/admin/cms/price-books')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        code: bookCode1,
        name: 'Festive Tariff Phase 1',
        showroomId: testShowroom.id,
        effectiveFrom: '2026-10-01T00:00:00Z',
        effectiveTo: '2026-10-31T23:59:59Z',
        notes: 'Introductory seasonal price book',
      });

    expect(createRes1.status).toBe(201);
    const bookId1 = createRes1.body.id;

    // 2. Add entry with itemized components in integer paise
    const entryRes = await request(app)
      .put(`/api/admin/cms/price-books/${bookId1}/entries/${createdVariantId}`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        exShowroomPaise: 250_000_000, // 25 Lakhs in paise
        components: [
          {
            code: 'ROAD_TAX_UP',
            label: 'Uttar Pradesh State Road Tax',
            category: PriceComponentCategory.ROAD_TAX,
            calculation: PriceCalculation.PERCENT_OF_EXSHOWROOM,
            rateBasisPoints: 800, // 8.00%
            isOptional: false,
            sortOrder: 1,
          },
          {
            code: 'INSURANCE_COMPREHENSIVE',
            label: '1-Year Comprehensive + 3-Year Third Party Insurance',
            category: PriceComponentCategory.INSURANCE,
            calculation: PriceCalculation.FIXED,
            amountPaise: 6_500_000, // Rs 65,000
            isOptional: false,
            sortOrder: 2,
          },
        ],
      });

    expect(entryRes.status).toBe(200);
    expect(entryRes.body.exShowroomPaise).toBe(250_000_000);
    expect(entryRes.body.components).toHaveLength(2);

    // 3. Publish Book 1
    const publishRes1 = await request(app)
      .post(`/api/admin/cms/price-books/${bookId1}/publish`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(publishRes1.status).toBe(200);
    expect(publishRes1.body.status).toBe('PUBLISHED');

    // 4. Create second price book with overlapping date range for the same showroom
    const createRes2 = await request(app)
      .post('/api/admin/cms/price-books')
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf)
      .send({
        code: bookCode2,
        name: 'Conflicting Tariff',
        showroomId: testShowroom.id,
        effectiveFrom: '2026-10-15T00:00:00Z',
        effectiveTo: '2026-11-15T23:59:59Z',
      });

    expect(createRes2.status).toBe(201);
    const bookId2 = createRes2.body.id;

    // 5. Attempt to publish Book 2 -> must reject with 409 Conflict DATE_OVERLAP
    const publishRes2 = await request(app)
      .post(`/api/admin/cms/price-books/${bookId2}/publish`)
      .set('Cookie', adminCookie)
      .set('X-CSRF-Token', adminCsrf);

    expect(publishRes2.status).toBe(409);
    expect(publishRes2.body.error.code).toBe('DATE_OVERLAP');
  });
});
