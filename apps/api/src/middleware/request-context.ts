import { randomUUID } from 'node:crypto';

import type { NextFunction, Request, Response } from 'express';

const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{8,100}$/;

export function requestContext(request: Request, response: Response, next: NextFunction): void {
  const incomingRequestId = request.header('x-request-id');

  request.requestId =
    incomingRequestId && REQUEST_ID_PATTERN.test(incomingRequestId)
      ? incomingRequestId
      : randomUUID();

  response.setHeader('x-request-id', request.requestId);
  next();
}
