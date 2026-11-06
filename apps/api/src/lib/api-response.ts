import type { Request, Response } from 'express';

import type { ApiError, ApiMeta, ApiSuccess } from '@aurelia/shared';

export function createMeta(request: Request): ApiMeta {
  return {
    requestId: request.requestId,
    timestamp: new Date().toISOString(),
  };
}

export function sendSuccess<T>(
  request: Request,
  response: Response,
  data: T,
  statusCode = 200,
): Response {
  const body: ApiSuccess<T> = {
    success: true,
    data,
    meta: createMeta(request),
  };

  return response.status(statusCode).json(body);
}

export function sendError(
  request: Request,
  response: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown,
): Response {
  const body: ApiError = {
    success: false,
    error: {
      code,
      message,
      ...(details === undefined ? {} : { details }),
    },
    meta: createMeta(request),
  };

  return response.status(statusCode).json(body);
}
