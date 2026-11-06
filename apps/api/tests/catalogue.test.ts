import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('Catalogue Models API', () => {
  it('lists active models with primary images and starting prices', async () => {
    const response = await request(app).get('/api/catalogue/models');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(5);

    const lumen = response.body.data.find((m: { slug: string }) => m.slug === 'vantara-lumen');
    expect(lumen).toBeDefined();
    expect(lumen).toMatchObject({
      slug: 'vantara-lumen',
      make: 'Vantara',
      name: 'Lumen',
      bodyType: 'CROSSOVER',
    });
    expect(lumen.startingPricePaise).toBeGreaterThan(0);
    expect(lumen.primaryImage?.url).toContain('vantara-lumen-exterior.svg');
    expect(lumen.fuelTypes).toContain('PETROL');
    expect(lumen.transmissions).toContain('MANUAL');
  });

  it('filters models by bodyType', async () => {
    const response = await request(app).get('/api/catalogue/models').query({ bodyType: 'SEDAN' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    for (const model of response.body.data) {
      expect(model.bodyType).toBe('SEDAN');
    }
  });

  it('filters models by fuelType', async () => {
    const response = await request(app)
      .get('/api/catalogue/models')
      .query({ fuelType: 'ELECTRIC' });

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    for (const model of response.body.data) {
      expect(model.fuelTypes).toContain('ELECTRIC');
    }
  });

  it('retrieves model detail by slug with variants, specs, colours, and showroom availability', async () => {
    const response = await request(app).get('/api/catalogue/models/vantara-lumen');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.slug).toBe('vantara-lumen');
    expect(response.body.data.images.length).toBeGreaterThanOrEqual(2);
    expect(response.body.data.colours.length).toBeGreaterThanOrEqual(4);
    expect(response.body.data.variants.length).toBeGreaterThanOrEqual(3);

    const variant = response.body.data.variants[0];
    expect(variant.specifications.length).toBeGreaterThan(0);
    expect(variant.inventory.length).toBeGreaterThanOrEqual(3);

    const centralInv = variant.inventory.find(
      (inv: { showroomCode: string }) => inv.showroomCode === 'LKO-CENTRAL',
    );
    expect(centralInv).toBeDefined();
    expect(typeof centralInv.availableCount).toBe('number');
  });

  it('returns 404 for non-existent model slug', async () => {
    const response = await request(app).get('/api/catalogue/models/non-existent-model');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('MODEL_NOT_FOUND');
  });
});

describe('On-Road Pricing API', () => {
  it('computes transparent itemized on-road pricing for a variant in a showroom', async () => {
    const response = await request(app)
      .get('/api/catalogue/variants/vantara-lumen-petrol-mt/pricing')
      .query({ showroomCode: 'LKO-CENTRAL' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const pricing = response.body.data;
    expect(pricing.variantSlug).toBe('vantara-lumen-petrol-mt');
    expect(pricing.showroomCode).toBe('LKO-CENTRAL');
    expect(pricing.exShowroomPaise).toBe(114_900_000); // Rs 11,49,000

    // Mandatory components: road tax, insurance, registration, logistics
    expect(pricing.mandatoryComponents.length).toBe(4);
    const roadTax = pricing.mandatoryComponents.find(
      (c: { code: string }) => c.code === 'ROAD_TAX',
    );
    expect(roadTax).toBeDefined();
    expect(roadTax.rateBasisPoints).toBe(800);
    expect(roadTax.amountPaise).toBe(9_192_000); // 8% of 11,49,000 in paise = 91,920

    // Verify mathematical invariants
    const sumMandatory = pricing.mandatoryComponents.reduce(
      (acc: number, c: { amountPaise: number }) => acc + c.amountPaise,
      0,
    );
    expect(pricing.mandatoryTotalPaise).toBe(sumMandatory);
    expect(pricing.standardOnRoadPricePaise).toBe(pricing.exShowroomPaise + sumMandatory);

    // Optional components: accessories, warranty
    expect(pricing.optionalComponents.length).toBe(2);
    const sumOptional = pricing.optionalComponents.reduce(
      (acc: number, c: { amountPaise: number }) => acc + c.amountPaise,
      0,
    );
    expect(pricing.totalWithOptionsPaise).toBe(pricing.standardOnRoadPricePaise + sumOptional);
  });

  it('correctly reports PRICING_NOT_FOUND when variant pricing is excluded from a showroom', async () => {
    // Gomti Nagar excludes the top Aria EV variant in sample seed
    const response = await request(app)
      .get('/api/catalogue/variants/vantara-aria-ev-long-range-awd/pricing')
      .query({ showroomCode: 'LKO-GOMTI' });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('PRICING_NOT_FOUND');
  });

  it('returns 404 when querying unknown variant slug', async () => {
    const response = await request(app)
      .get('/api/catalogue/variants/unknown-slug/pricing')
      .query({ showroomCode: 'LKO-CENTRAL' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('VARIANT_NOT_FOUND');
  });
});
