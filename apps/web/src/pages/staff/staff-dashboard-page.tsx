import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Building2,
  CalendarCheck,
  Car,
  CheckCircle2,
  Shield,
  Users,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';

export function StaffDashboardPage() {
  const { user } = useAuth();

  const {
    data: dashboard,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['staff-dashboard'],
    queryFn: () => api.getDashboardOverview(),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
          <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Loading dealership operational metrics…
          </p>
        </div>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-5 w-5" />
          <span>Error loading dashboard metrics</span>
        </div>
        <p className="mt-1 text-sm">
          {error instanceof Error ? error.message : 'Please check your connection and try again.'}
        </p>
      </div>
    );
  }

  const { metrics, role, recentTestDrives, recentServices } = dashboard;

  return (
    <div className="space-y-8">
      {/* Welcome Banner & Location Scope */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-stone-500 uppercase">
              <Building2 className="text-brass-600 h-4 w-4" />
              <span>Aurelia Motors · Lucknow Operations</span>
            </div>
            <h1 className="mt-1 font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">
              Welcome back, {user?.fullName}
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Logged in as <strong className="text-ink-950">{user?.role}</strong> · Operational
              access is strictly scoped by role and location assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/staff/appointments"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-xs font-semibold tracking-wider text-ivory-50 uppercase shadow-sm transition hover:bg-ink-900"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>View Appointments</span>
            </Link>
          </div>
        </div>

        {/* Location Scope Notice */}
        <div className="border-brass-200 bg-brass-50/50 text-brass-900 mt-6 flex items-start gap-3 rounded-2xl border p-4 text-xs">
          <Shield className="text-brass-700 mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <span className="font-semibold tracking-wider uppercase">
              RBAC Location Scoping Enforced:{' '}
            </span>
            {role === 'ADMIN' && (
              <span>
                Dealership-wide executive view active. All 3 showrooms (Central, Gomti Nagar,
                Sushant Golf City) and 2 workshops are included.
              </span>
            )}
            {role === 'SALES_CONSULTANT' && (
              <span>
                Showroom scoped. You are only viewing appointments and availability assigned to your
                primary showroom.
              </span>
            )}
            {role === 'SERVICE_ADVISOR' && (
              <span>
                Workshop scoped. You are viewing service bookings and lane capacity for your
                assigned service facility.
              </span>
            )}
            {role === 'USED_CAR_STAFF' && (
              <span>
                Certified inventory scoped. Metrics reflect evaluated pre-owned inventory and
                inspection statuses.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Metric 1: Test Drives */}
        {metrics.testDrivesTotal !== undefined && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold tracking-wider uppercase">
                {role === 'ADMIN' ? 'Total Test Drives' : 'Showroom Test Drives'}
              </span>
              <Car className="h-5 w-5 text-sky-600" />
            </div>
            <div className="mt-4 font-display text-3xl text-ink-950">{metrics.testDrivesTotal}</div>
            <p className="mt-1 text-xs text-stone-500">Scheduled demo vehicle bookings</p>
          </div>
        )}

        {/* Metric 2: Service Bookings */}
        {metrics.servicesTotal !== undefined && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold tracking-wider uppercase">
                {role === 'ADMIN' ? 'Total Services' : 'Workshop Bookings'}
              </span>
              <Wrench className="h-5 w-5 text-emerald-600" />
            </div>
            <div className="mt-4 font-display text-3xl text-ink-950">{metrics.servicesTotal}</div>
            <p className="mt-1 text-xs text-stone-500">
              {metrics.todaysServicesCount !== undefined
                ? `${metrics.todaysServicesCount} scheduled for today`
                : 'Confirmed workshop slots'}
            </p>
          </div>
        )}

        {/* Metric 3: New Vehicle Inventory */}
        {metrics.inventoryAvailable !== undefined && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Available Stock
              </span>
              <CheckCircle2 className="text-brass-600 h-5 w-5" />
            </div>
            <div className="mt-4 font-display text-3xl text-ink-950">
              {metrics.inventoryAvailable}
            </div>
            <p className="mt-1 text-xs text-stone-500">
              {metrics.inventoryTotal !== undefined
                ? `Out of ${metrics.inventoryTotal} total showroom units`
                : 'Ready for customer allocation'}
            </p>
          </div>
        )}

        {/* Metric 4: Certified Pre-Owned */}
        {metrics.certifiedUsedCount !== undefined && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Certified Pre-Owned
              </span>
              <Shield className="h-5 w-5 text-amber-600" />
            </div>
            <div className="mt-4 font-display text-3xl text-ink-950">
              {metrics.certifiedUsedCount}
            </div>
            <p className="mt-1 text-xs text-stone-500">150-point inspected vehicles</p>
          </div>
        )}

        {/* Metric 5: Active Staff (Admin only) */}
        {metrics.activeStaffCount !== undefined && (
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between text-stone-500">
              <span className="text-xs font-semibold tracking-wider uppercase">
                Active Staff Users
              </span>
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="mt-4 font-display text-3xl text-ink-950">
              {metrics.activeStaffCount}
            </div>
            <p className="mt-1 text-xs text-stone-500">Across 3 showrooms & 2 workshops</p>
          </div>
        )}
      </div>

      {/* Recent Activity Sections */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Test Drives Table */}
        {recentTestDrives.length > 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-display text-lg text-ink-950">Recent Test-Drive Bookings</h2>
                <p className="text-xs text-stone-500">
                  {role === 'SALES_CONSULTANT' ? 'At your assigned showroom' : 'Across dealership'}
                </p>
              </div>
              <Link
                to="/staff/appointments"
                className="text-brass-700 hover:text-brass-800 text-xs font-semibold"
              >
                View all →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100 overflow-hidden">
              {recentTestDrives.map((td) => (
                <div key={td.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{td.modelName}</div>
                    <div className="text-xs text-stone-500">
                      Customer: <strong className="text-stone-700">{td.customerName}</strong> ·{' '}
                      {td.showroomName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[0.62rem] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                      {td.status}
                    </span>
                    <div className="mt-1 text-[0.68rem] text-stone-400">
                      {new Date(td.time).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services Table */}
        {recentServices.length > 0 && (
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div>
                <h2 className="font-display text-lg text-ink-950">Recent Workshop Appointments</h2>
                <p className="text-xs text-stone-500">
                  {role === 'SERVICE_ADVISOR' ? 'At your assigned workshop' : 'Across dealership'}
                </p>
              </div>
              <Link
                to="/staff/appointments"
                className="text-brass-700 hover:text-brass-800 text-xs font-semibold"
              >
                View all →
              </Link>
            </div>

            <div className="mt-4 divide-y divide-stone-100 overflow-hidden">
              {recentServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3.5">
                  <div>
                    <div className="text-sm font-semibold text-ink-950">{s.serviceName}</div>
                    <div className="text-xs text-stone-500">
                      Plate: <strong className="text-stone-700">{s.vehiclePlate}</strong> ·{' '}
                      {s.workshopName}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex rounded-full bg-sky-50 px-2.5 py-0.5 text-[0.62rem] font-semibold text-sky-700 ring-1 ring-sky-600/20">
                      {s.status}
                    </span>
                    <div className="mt-1 text-[0.68rem] text-stone-400">
                      {new Date(s.time).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
