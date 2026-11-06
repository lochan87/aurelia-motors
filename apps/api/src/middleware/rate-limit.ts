import { rateLimit } from 'express-rate-limit';

import { sendError } from '../lib/api-response.js';

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (request, response) => {
    sendError(request, response, 429, 'RATE_LIMITED', 'Too many requests. Please try again later.');
  },
});

export const authLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (request, response) => {
    sendError(
      request,
      response,
      429,
      'TOO_MANY_ATTEMPTS',
      'Too many login attempts. Please wait a minute before trying again.',
    );
  },
});
