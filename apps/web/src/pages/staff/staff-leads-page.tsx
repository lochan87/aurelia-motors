import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  Loader2,
  MessageSquare,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import type { LeadFilterQuery, LeadSource, LeadStatus } from '@aurelia/shared';
import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';

const statusTabs: Array<{ id: LeadStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Leads' },
  { id: 'NEW', label: 'New' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'CONTACTED', label: 'Contacted' },
  { id: 'QUALIFIED', label: 'Qualified' },
  { id: 'TEST_DRIVE_SCHEDULED', label: 'Test Drive' },
  { id: 'NEGOTIATING', label: 'Negotiating' },
  { id: 'WON', label: 'Won' },
  { id: 'LOST', label: 'Lost' },
];

function statusColor(status: LeadStatus) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'ASSIGNED':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'CONTACTED':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'QUALIFIED':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'TEST_DRIVE_SCHEDULED':
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    case 'NEGOTIATING':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'WON':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'LOST':
      return 'bg-stone-100 text-stone-600 border-stone-200';
  }
}

function sourceBadge(source: LeadSource) {
  switch (source) {
    case 'WEB_ENQUIRY':
      return { label: 'Web Enquiry', bg: 'bg-stone-100 text-stone-700' };
    case 'PORTAL_IMPORT':
      return { label: 'Portal CSV', bg: 'bg-emerald-50 text-emerald-800' };
    case 'TEST_DRIVE_REQUEST':
      return { label: 'Test Drive', bg: 'bg-sky-50 text-sky-800' };
    case 'SERVICE_REQUEST':
      return { label: 'Service', bg: 'bg-violet-50 text-violet-800' };
    case 'PHONE_INQUIRY':
      return { label: 'Phone', bg: 'bg-amber-50 text-amber-800' };
    case 'WALK_IN':
      return { label: 'Walk-In', bg: 'bg-rose-50 text-rose-800' };
  }
}

export function StaffLeadsPage() {
  const { user } = useAuth();

  const [selectedStatus, setSelectedStatus] = useState<LeadStatus | 'ALL'>('ALL');
  const [selectedSource, setSelectedSource] = useState<LeadSource | 'ALL'>('ALL');
  const [selectedShowroom, setSelectedShowroom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'newest' | 'oldest'>('urgency');
  const [page, setPage] = useState(1);

  // Fetch metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['staff-leads-metrics'],
    queryFn: () => api.getLeadMetrics(),
    refetchInterval: 30000,
  });

  // Fetch showrooms for filters
  const { data: showrooms = [] } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  // Fetch paginated leads
  const queryParams: LeadFilterQuery = {
    status: selectedStatus,
    source: selectedSource,
    showroomId: selectedShowroom || undefined,
    search: searchQuery.trim() || undefined,
    sortBy,
    page,
    pageSize: 15,
  };

  const {
    data: leadsData,
    isLoading: isLeadsLoading,
    isFetching,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ['staff-leads', queryParams],
    queryFn: () => api.getLeads(queryParams),
  });

  const handleRefresh = () => {
    refetchMetrics();
    refetchLeads();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-stone-500 uppercase">
            <MessageSquare className="text-brass-600 h-4 w-4" />
            <span>Lead CRM & Enquiry Management</span>
          </div>
          <h1 className="mt-1 font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">
            Customer Enquiries & Portal Leads
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Real-time workload-balanced lead inbox · 30-minute first-human-response SLA tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isFetching}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {user?.role === 'ADMIN' && (
            <Link
              to="/staff/leads/import"
              className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2 text-xs font-semibold tracking-wider text-ivory-50 uppercase shadow-sm transition hover:bg-ink-900"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Import Portal CSV</span>
            </Link>
          )}
        </div>
      </div>

      {/* SLA & CRM Metric Cards */}
      {metrics && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
            <span className="text-[0.62rem] font-semibold tracking-wider text-stone-500 uppercase">
              Total Inbound Leads
            </span>
            <div className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
              {metrics.totalLeads}
            </div>
            <p className="mt-1 text-[0.68rem] text-stone-500">Across all active channels</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
            <span className="text-[0.62rem] font-semibold tracking-wider text-blue-700 uppercase">
              New Unaddressed
            </span>
            <div className="mt-2 font-display text-2xl text-blue-900 sm:text-3xl">
              {metrics.newLeads}
            </div>
            <p className="mt-1 text-[0.68rem] text-blue-700">Awaiting initial action</p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[0.62rem] font-semibold tracking-wider text-red-700 uppercase">
                SLA Overdue
              </span>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
            <div className="mt-2 font-display text-2xl text-red-900 sm:text-3xl">
              {metrics.overdueLeads}
            </div>
            <p className="mt-1 text-[0.68rem] text-red-700">&gt;30 mins with no contact</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <span className="text-[0.62rem] font-semibold tracking-wider text-emerald-700 uppercase">
              Avg Response Time
            </span>
            <div className="mt-2 font-display text-2xl text-emerald-900 sm:text-3xl">
              {metrics.averageResponseTimeMinutes !== null
                ? `${metrics.averageResponseTimeMinutes}m`
                : '—'}
            </div>
            <p className="mt-1 text-[0.68rem] text-emerald-700">
              Target: &le;{metrics.responseSlaMinutes}m SLA
            </p>
          </div>

          <div className="col-span-2 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:col-span-1">
            <span className="text-[0.62rem] font-semibold tracking-wider text-stone-500 uppercase">
              SLA Compliance
            </span>
            <div className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
              {metrics.slaComplianceRatePercent !== null
                ? `${metrics.slaComplianceRatePercent}%`
                : '100%'}
            </div>
            <p className="mt-1 text-[0.68rem] text-stone-500">First-contact benchmark</p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {/* Status Tabs */}
        <div className="flex gap-1 overflow-x-auto border-b border-stone-100 pb-2 text-xs">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedStatus(tab.id);
                  setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-ink-950 font-semibold text-ivory-50'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, phone, email, ref..."
              className="w-full rounded-xl border border-stone-200 bg-white py-2 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 focus:border-brass-500 focus:outline-none"
            />
          </div>

          {/* Source Dropdown */}
          <div>
            <select
              value={selectedSource}
              onChange={(e) => {
                setSelectedSource(e.target.value as LeadSource | 'ALL');
                setPage(1);
              }}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
            >
              <option value="ALL">All Sources</option>
              <option value="WEB_ENQUIRY">Web Enquiries</option>
              <option value="PORTAL_IMPORT">Portal CSV Imports</option>
              <option value="TEST_DRIVE_REQUEST">Test Drive Requests</option>
              <option value="SERVICE_REQUEST">Service Requests</option>
              <option value="PHONE_INQUIRY">Phone Inquiries</option>
              <option value="WALK_IN">Walk-In Clients</option>
            </select>
          </div>

          {/* Showroom Dropdown */}
          <div>
            <select
              value={selectedShowroom}
              onChange={(e) => {
                setSelectedShowroom(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
            >
              <option value="">All Scoped Showrooms</option>
              {showrooms.map((sh) => (
                <option key={sh.id} value={sh.id}>
                  {sh.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as 'urgency' | 'newest' | 'oldest');
                setPage(1);
              }}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
            >
              <option value="urgency">Sort by SLA Urgency</option>
              <option value="newest">Sort by Newest First</option>
              <option value="oldest">Sort by Oldest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {isLeadsLoading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
              <p className="text-xs text-stone-500">Loading leads...</p>
            </div>
          </div>
        ) : leadsData && leadsData.items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 font-semibold text-stone-600">
                  <th className="px-4 py-3">Lead Reference</th>
                  <th className="px-4 py-3">Customer Details</th>
                  <th className="px-4 py-3">Interest & Location</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Consultant</th>
                  <th className="px-4 py-3">SLA / Response</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leadsData.items.map((lead) => {
                  const src = sourceBadge(lead.source);
                  return (
                    <tr key={lead.id} className="transition-colors hover:bg-stone-50/80">
                      <td className="px-4 py-3.5 font-mono font-bold text-ink-950">
                        {lead.leadReference}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-ink-950">{lead.customerName}</div>
                        <div className="text-[0.68rem] text-stone-500">
                          {lead.customerPhone} · {lead.customerEmail}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-ink-950">{lead.vehicleInterest}</div>
                        <div className="text-[0.68rem] text-stone-500">{lead.showroomName}</div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[0.62rem] font-medium ${src.bg}`}
                        >
                          {src.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold ${statusColor(
                            lead.status,
                          )}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        {lead.assignedStaffName ? (
                          <div className="flex items-center gap-1.5 text-stone-800">
                            <User className="h-3.5 w-3.5 text-stone-400" />
                            <span>{lead.assignedStaffName}</span>
                          </div>
                        ) : (
                          <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-semibold text-amber-700">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* SLA Urgency Indicator */}
                      <td className="px-4 py-3.5">
                        {lead.firstResponseAt ? (
                          <span className="inline-flex items-center gap-1 text-[0.68rem] font-medium text-emerald-700">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            Responded ({lead.responseTimeMinutes}m)
                          </span>
                        ) : lead.isOverdue ? (
                          <span className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-0.5 text-[0.68rem] font-bold text-red-600">
                            <AlertCircle className="h-3.5 w-3.5" />
                            SLA Overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[0.68rem] font-medium text-amber-700">
                            <Clock className="h-3.5 w-3.5" />
                            Pending Response
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <Link
                          to={`/staff/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 py-1 font-semibold text-ink-950 shadow-xs hover:bg-stone-50"
                        >
                          <span>View & Respond</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-stone-300" />
            <h3 className="mt-3 font-display text-base text-ink-950">No leads found</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-stone-500">
              No customer enquiries match your current filters. Adjust your status tabs, search
              query, or showroom selection.
            </p>
          </div>
        )}

        {/* Pagination Bar */}
        {leadsData && leadsData.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/50 px-4 py-3 text-xs text-stone-600">
            <div>
              Showing page <strong>{leadsData.pagination.page}</strong> of{' '}
              <strong>{leadsData.pagination.totalPages}</strong> ({leadsData.pagination.total}{' '}
              leads)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={leadsData.pagination.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1 font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={leadsData.pagination.page >= leadsData.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1 font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
