import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { StaffRole } from '@aurelia/shared';

import { useAuth } from '../../lib/use-auth';

interface ProtectedRouteProps {
  allowedRoles?: StaffRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-ink-950 px-5 text-ivory-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brass-400 border-t-transparent" />
        <p className="mt-4 text-[0.68rem] font-semibold tracking-[0.2em] text-ivory-50/60 uppercase">
          Verifying credentials…
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/staff/login?returnUrl=${returnUrl}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center p-8 text-center">
        <div className="rounded-full bg-red-950/20 p-4 text-red-400 ring-1 ring-red-500/20">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="mt-4 font-display text-xl tracking-tight text-ink-950">
          Restricted Department Access
        </h2>
        <p className="mt-2 max-w-md text-sm text-stone-600">
          Your staff account (<strong>{user.email}</strong> · {user.role}) does not have clearance
          to view this administration screen.
        </p>
        <a
          href="/staff/dashboard"
          className="mt-6 inline-flex items-center rounded-lg bg-ink-950 px-5 py-2.5 text-xs font-semibold tracking-wider text-ivory-50 uppercase hover:bg-ink-900"
        >
          Return to Staff Overview
        </a>
      </div>
    );
  }

  return <Outlet />;
}
