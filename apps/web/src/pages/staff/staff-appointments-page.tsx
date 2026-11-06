import { useQuery } from '@tanstack/react-query';
import { Car, Clock, Mail, MapPin, Phone, Search, Wrench } from 'lucide-react';
import { useState } from 'react';

import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';

export function StaffAppointmentsPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TEST_DRIVE' | 'SERVICE'>('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['staff-appointments'],
    queryFn: () => api.getStaffAppointments(),
  });

  const testDrives = data?.testDrives ?? [];
  const services = data?.services ?? [];

  // Combine items
  const allAppointments = [
    ...testDrives.map((td) => ({
      ...td,
      kind: 'TEST_DRIVE' as const,
      searchStr:
        `${td.reference} ${td.title} ${td.customerName} ${td.customerPhone} ${td.customerEmail} ${td.locationName}`.toLowerCase(),
    })),
    ...services.map((s) => ({
      ...s,
      kind: 'SERVICE' as const,
      searchStr:
        `${s.reference} ${s.title} ${s.vehiclePlate} ${s.customerName} ${s.customerPhone} ${s.customerEmail} ${s.locationName}`.toLowerCase(),
    })),
  ].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const filteredAppointments = allAppointments.filter((app) => {
    if (activeTab !== 'ALL' && app.kind !== activeTab) {
      return false;
    }
    if (search.trim()) {
      return app.searchStr.includes(search.trim().toLowerCase());
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">
              Appointments & Bookings
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Authorized operations queue · Customer details unmasked for staff follow-up and
              delivery.
            </p>
          </div>
        </div>

        {/* Filter controls */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5 rounded-xl bg-stone-100 p-1">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${
                activeTab === 'ALL'
                  ? 'bg-white text-ink-950 shadow-sm'
                  : 'text-stone-600 hover:text-ink-950'
              }`}
            >
              All ({allAppointments.length})
            </button>
            {user?.role !== 'SERVICE_ADVISOR' && (
              <button
                type="button"
                onClick={() => setActiveTab('TEST_DRIVE')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${
                  activeTab === 'TEST_DRIVE'
                    ? 'bg-white text-ink-950 shadow-sm'
                    : 'text-stone-600 hover:text-ink-950'
                }`}
              >
                Test Drives ({testDrives.length})
              </button>
            )}
            {user?.role !== 'SALES_CONSULTANT' && (
              <button
                type="button"
                onClick={() => setActiveTab('SERVICE')}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${
                  activeTab === 'SERVICE'
                    ? 'bg-white text-ink-950 shadow-sm'
                    : 'text-stone-600 hover:text-ink-950'
                }`}
              >
                Workshop ({services.length})
              </button>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer, plate, or ref…"
              className="w-full rounded-xl border border-stone-300 py-2 pr-4 pl-9 text-xs focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Appointment Cards / Table */}
      {isLoading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-12 text-center text-stone-500">
          <p className="font-semibold text-stone-700">No appointments found</p>
          <p className="mt-1 text-xs">Try adjusting your search criteria or role scope.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredAppointments.map((app) => (
            <div
              key={app.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-stone-300"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {app.kind === 'TEST_DRIVE' ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-50 px-2.5 py-1 text-[0.68rem] font-semibold text-sky-700 ring-1 ring-sky-600/20">
                        <Car className="h-3 w-3" />
                        <span>Test Drive</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[0.68rem] font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                        <Wrench className="h-3 w-3" />
                        <span>Workshop</span>
                      </span>
                    )}
                    <span className="font-mono text-xs font-semibold text-stone-500">
                      #{app.reference}
                    </span>
                  </div>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wide uppercase ${
                      app.status === 'CONFIRMED'
                        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                        : app.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 ring-1 ring-red-600/20'
                          : 'bg-stone-100 text-stone-700'
                    }`}
                  >
                    {app.status}
                  </span>
                </div>

                <div className="mt-4">
                  <h3 className="font-display text-base text-ink-950">{app.title}</h3>
                  {app.kind === 'SERVICE' && 'vehiclePlate' in app && (
                    <div className="mt-1 inline-flex rounded border border-stone-300 bg-stone-50 px-2 py-0.5 font-mono text-[0.68rem] font-bold text-stone-700 uppercase">
                      Registration: {app.vehiclePlate}
                    </div>
                  )}
                </div>

                {/* Customer Details (Unmasked for Staff) */}
                <div className="mt-4 space-y-1.5 rounded-xl border border-stone-100 bg-stone-50/80 p-3.5 text-xs">
                  <div className="font-semibold text-ink-950">{app.customerName}</div>
                  <div className="flex flex-wrap items-center gap-4 text-stone-600">
                    <a
                      href={`tel:${app.customerPhone}`}
                      className="inline-flex items-center gap-1.5 hover:text-ink-950"
                    >
                      <Phone className="h-3 w-3 text-stone-400" />
                      <span>{app.customerPhone}</span>
                    </a>
                    <a
                      href={`mailto:${app.customerEmail}`}
                      className="inline-flex items-center gap-1.5 hover:text-ink-950"
                    >
                      <Mail className="h-3 w-3 text-stone-400" />
                      <span>{app.customerEmail}</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-4 text-xs text-stone-500">
                <div className="inline-flex items-center gap-1.5">
                  <MapPin className="text-brass-600 h-3.5 w-3.5" />
                  <span>{app.locationName}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-stone-400" />
                  <span>
                    {new Date(app.startTime).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
