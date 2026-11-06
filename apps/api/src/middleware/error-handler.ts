import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';

import { env } from '../config/env.js';
import { sendError } from '../lib/api-response.js';
import { AppError } from '../lib/errors.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(404, 'NOT_FOUND', `No route matches ${request.method} ${request.originalUrl}.`),
  );
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  if (response.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    sendError(request, response, error.statusCode, error.code, error.message, error.details);
    return;
  }

  if (error instanceof ZodError) {
    sendError(
      request,
      response,
      422,
      'VALIDATION_ERROR',
      'The request contains invalid data.',
      error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
    return;
  }

  if (error instanceof SyntaxError && 'body' in error) {
    sendError(request, response, 400, 'INVALID_JSON', 'The request body is not valid JSON.');
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error(`[api] Unhandled error on ${request.method} ${request.originalUrl}`, error);
  }

  sendError(
    request,
    response,
    500,
    'INTERNAL_ERROR',
    'An unexpected error occurred. Please try again later.',
  );
};
