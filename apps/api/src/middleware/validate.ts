import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';

import { AppError } from '../lib/errors.js';

interface RequestSchemas {
  body?: ZodType;
  query?: ZodType;
  params?: ZodType;
}

/**
 * Parses and replaces request data with validated values. Parsed data is also
 * stored on request.validated so query objects are not mutated; Express 5
 * exposes req.query through a getter.
 */
export function validateRequest(schemas: RequestSchemas) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      const body = schemas.body ? schemas.body.parse(request.body) : undefined;
      const query = schemas.query ? schemas.query.parse(request.query) : undefined;
      const params = schemas.params ? schemas.params.parse(request.params) : undefined;

      if (body !== undefined) {
        request.body = body;
      }

      request.validated = { body, query, params };
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(
          new AppError(
            422,
            'VALIDATION_ERROR',
            'The request contains invalid data.',
            error.issues.map((issue) => ({
              path: issue.path.join('.'),
              message: issue.message,
            })),
          ),
        );
        return;
      }

      next(error);
    }
  };
}
