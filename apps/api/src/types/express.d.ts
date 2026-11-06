import type { StaffUserSummary } from '@aurelia/shared';

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      staffUser?: StaffUserSummary;
      sessionToken?: string;
      csrfToken?: string;
      validated: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

export {};
