import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { DatabaseCheck } from '@aurelia/shared';

import { createApp } from '../src/app.js';

const databaseUp: DatabaseCheck = { status: 'up', latencyMs: 3 };
const databaseDown: DatabaseCheck = { status: 'down', latencyMs: null };

function buildApp(database: DatabaseCheck = databaseUp) {
  return createApp({
    databaseProbe: async () => database,
  });
}

describe('GET /api/health', () => {
  it('returns a real health envelope and preserves a valid request id', async () => {
    const response = await request(buildApp())
      .get('/api/health')
      .set('x-request-id', 'review-request-001');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/application\/json/);
    expect(response.headers['x-request-id']).toBe('review-request-001');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'ok',
        service: 'aurelia-motors-api',
        version: '0.1.0',
        checks: {
          database: {
            status: 'up',
            latencyMs: 3,
          },
        },
      },
      meta: {
        requestId: 'review-request-001',
      },
    });
    expect(typeof response.body.data.uptimeSeconds).toBe('number');
    expect(Number.isNaN(Date.parse(response.body.meta.timestamp))).toBe(false);
  });

  it('generates a request id when the caller does not supply one', async () => {
    const response = await request(buildApp()).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('reports a degraded service when the database probe fails', async () => {
    const response = await request(buildApp(databaseDown)).get('/api/health');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: 'degraded',
        checks: {
          database: {
            status: 'down',
            latencyMs: null,
          },
        },
      },
    });
  });
});

describe('API conventions', () => {
  it('returns the standard error envelope for unknown routes', async () => {
    const response = await request(buildApp()).get('/api/not-a-real-route');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'NOT_FOUND',
      },
    });
    expect(response.body.meta.requestId).toBe(response.headers['x-request-id']);
  });

  it('returns INVALID_JSON for malformed request bodies', async () => {
    const response = await request(buildApp())
      .post('/api/not-a-real-route')
      .set('Content-Type', 'application/json')
      .send('{ broken');

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'INVALID_JSON',
      },
    });
  });

  it('allows configured CORS origins and ignores unknown origins', async () => {
    const allowed = await request(buildApp())
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');

    expect(allowed.status).toBe(200);
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');

    const blocked = await request(buildApp())
      .get('/api/health')
      .set('Origin', 'http://untrusted.example');

    expect(blocked.status).toBe(200);
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('answers CORS preflight requests for allowed origins', async () => {
    const response = await request(buildApp())
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'GET');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
  });
});
