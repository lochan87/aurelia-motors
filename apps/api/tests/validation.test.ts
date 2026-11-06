import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { sendSuccess } from '../src/lib/api-response.js';
import { errorHandler } from '../src/middleware/error-handler.js';
import { requestContext } from '../src/middleware/request-context.js';
import { validateRequest } from '../src/middleware/validate.js';

function buildValidationApp() {
  const app = express();

  app.use(requestContext);
  app.use(express.json());

  app.post(
    '/validate',
    validateRequest({
      body: z.object({
        fullName: z.string().trim().min(2),
        consent: z.literal(true),
      }),
    }),
    (req, res) => {
      sendSuccess(req, res, { accepted: true }, 201);
    },
  );

  app.use(errorHandler);

  return app;
}

describe('request validation', () => {
  it('accepts a valid body', async () => {
    const response = await request(buildValidationApp())
      .post('/validate')
      .send({ fullName: 'Anaya Mehrotra', consent: true });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });

  it('returns structured validation details for invalid data', async () => {
    const response = await request(buildValidationApp())
      .post('/validate')
      .send({ fullName: 'A', consent: false });

    expect(response.status).toBe(422);
    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
      },
    });
    expect(response.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'fullName' }),
        expect.objectContaining({ path: 'consent' }),
      ]),
    );
  });
});
