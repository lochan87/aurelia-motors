export interface ApiMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta: ApiMeta;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiError {
  success: false;
  error: ApiErrorDetail;
  meta: ApiMeta;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface DatabaseCheck {
  status: 'up' | 'down';
  latencyMs: number | null;
}

export interface HealthCheckData {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  uptimeSeconds: number;
  checks: {
    database: DatabaseCheck;
  };
}
