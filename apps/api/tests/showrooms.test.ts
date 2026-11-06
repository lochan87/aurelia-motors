import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../src/app.js';

const app = createApp();

describe('GET /api/showrooms', () => {
  it('returns active showrooms with correct attributes', async () => {
    const response = await request(app).get('/api/showrooms');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(3);

    const central = response.body.data.find((s: { code: string }) => s.code === 'LKO-CENTRAL');
    expect(central).toBeDefined();
    expect(central).toMatchObject({
      code: 'LKO-CENTRAL',
      name: 'Central Lucknow',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      isActive: true,
    });
  });

  it('retrieves an individual showroom by code', async () => {
    const response = await request(app).get('/api/showrooms/LKO-GOMTI');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      code: 'LKO-GOMTI',
      name: 'Gomti Nagar',
      city: 'Lucknow',
    });
  });

  it('returns 404 for non-existent showroom code', async () => {
    const response = await request(app).get('/api/showrooms/NON-EXISTENT');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('SHOWROOM_NOT_FOUND');
  });
});
