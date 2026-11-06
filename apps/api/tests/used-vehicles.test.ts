import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('Certified Used Vehicles API', () => {
  it('lists certified vehicles with pagination and masked registration plates', async () => {
    const response = await request(app).get('/api/used-vehicles');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const { items, pagination } = response.body.data;
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    expect(pagination.total).toBeGreaterThanOrEqual(10);
    expect(pagination.page).toBe(1);

    const car = items[0];
    expect(car.registrationNumberMasked).toMatch(/^UP-32 •• \d{4}$/);
    expect(car.certified).toBe(true);
    expect(typeof car.overallScore).toBe('number');
    expect(car.overallScore).toBeGreaterThan(0);
    expect(car.showroom).toBeDefined();
    expect(car.showroom.city).toBe('Lucknow');
  });

  it('filters used vehicles by fuelType', async () => {
    const response = await request(app).get('/api/used-vehicles').query({ fuelType: 'ELECTRIC' });

    expect(response.status).toBe(200);
    const { items } = response.body.data;
    expect(items.length).toBeGreaterThanOrEqual(1);
    for (const item of items) {
      expect(item.fuelType).toBe('ELECTRIC');
    }
  });

  it('sorts used vehicles by price ascending', async () => {
    const response = await request(app).get('/api/used-vehicles').query({ sort: 'price_asc' });

    expect(response.status).toBe(200);
    const { items } = response.body.data;
    for (let i = 0; i < items.length - 1; i += 1) {
      expect(items[i].pricePaise).toBeLessThanOrEqual(items[i + 1].pricePaise);
    }
  });

  it('retrieves used vehicle detail with inspection report and items', async () => {
    // Get the first slug from list
    const listRes = await request(app).get('/api/used-vehicles');
    const firstSlug = listRes.body.data.items[0].slug;

    const response = await request(app).get(`/api/used-vehicles/${firstSlug}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const car = response.body.data;
    expect(car.slug).toBe(firstSlug);
    expect(car.highlights.length).toBeGreaterThan(0);
    expect(car.inspection).toBeDefined();
    expect(car.inspection.reportReference).toMatch(/^AUR-CERT-2026-\d{3}$/);
    expect(car.inspection.items.length).toBeGreaterThanOrEqual(5);

    const passItem = car.inspection.items.find(
      (item: { rating: string }) => item.rating === 'PASS',
    );
    expect(passItem).toBeDefined();
  });

  it('returns 404 for unknown used vehicle slug', async () => {
    const response = await request(app).get('/api/used-vehicles/unknown-car-slug');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('USED_VEHICLE_NOT_FOUND');
  });
});
