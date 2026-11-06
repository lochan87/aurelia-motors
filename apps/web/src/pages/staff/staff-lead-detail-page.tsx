import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  Mail,
  MessageSquare,
  Phone,
  Send,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import type {
  AddLeadNoteInput,
  LeadStatus,
  ReassignLeadInput,
  RecordContactActivityInput,
  UpdateLeadStatusInput,
} from '@aurelia/shared';
import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';
import { buttonStyles } from '../../components/ui/button-styles';
import { LeadAiAssistant } from '../../components/leads/lead-ai-assistant';

function statusBadge(status: LeadStatus) {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 border-blue-300';
    case 'ASSIGNED':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300';
    case 'CONTACTED':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'QUALIFIED':
      return 'bg-purple-100 text-purple-800 border-purple-300';
    case 'TEST_DRIVE_SCHEDULED':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    case 'NEGOTIATING':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'WON':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'LOST':
      return 'bg-stone-100 text-stone-600 border-stone-300';
  }
}

export function StaffLeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const {
    data: lead,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['staff-lead-detail', id],
    queryFn: () => api.getLead(id ?? ''),
    enabled: Boolean(id),
  });

  // Query staff list for admin reassignment modal
  const { data: staffList = [] } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: () => api.getStaffList(),
    enabled: Boolean(user?.role === 'ADMIN'),
  });

  // State: Contact Action Form
  const [contactMethod, setContactMethod] = useState<'PHONE' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON'>(
    'PHONE',
  );
  const [contactSummary, setContactSummary] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [contactNextStatus, setContactNextStatus] = useState<LeadStatus>('CONTACTED');
  const [isLoggingContact, setIsLoggingContact] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  // State: Internal Note Form
  const [noteContent, setNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // State: Quick Status Change Form
  const [targetStatus, setTargetStatus] = useState<LeadStatus | ''>('');
  const [statusReason, setStatusReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // State: Reassignment Modal
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [reassignStaffId, setReassignStaffId] = useState('');
  const [reassignReason, setReassignReason] = useState('');
  const [isReassigning, setIsReassigning] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
          <p className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
            Loading lead profile & audit timeline…
          </p>
        </div>
      </div>
    );
  }

  if (isError || !lead) {
    return (
      <div className="space-y-4">
        <Link
          to="/staff/leads"
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-ink-950"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lead Inbox
        </Link>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="h-5 w-5" />
            <span>Lead Access Restricted or Not Found</span>
          </div>
          <p className="mt-1 text-sm">
            {error instanceof Error
              ? error.message
              : 'You may not have permission to view leads outside your assigned showroom.'}
          </p>
        </div>
      </div>
    );
  }

  const handleRecordContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactError(null);

    if (!contactSummary.trim()) {
      setContactError('Please enter a brief summary of the conversation.');
      return;
    }

    setIsLoggingContact(true);
    try {
      const payload: RecordContactActivityInput = {
        contactMethod,
        summary: contactSummary.trim(),
        details: contactDetails.trim() || undefined,
        updateStatus: contactNextStatus,
      };
      await api.recordContactActivity(lead.id, payload);
      setContactSummary('');
      setContactDetails('');
      refetch();
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Failed to record contact activity.');
    } finally {
      setIsLoggingContact(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setNoteError(null);

    if (!noteContent.trim()) {
      setNoteError('Please enter note content.');
      return;
    }

    setIsAddingNote(true);
    try {
      const payload: AddLeadNoteInput = {
        content: noteContent.trim(),
      };
      await api.addLeadNote(lead.id, payload);
      setNoteContent('');
      refetch();
    } catch (err) {
      setNoteError(err instanceof Error ? err.message : 'Failed to save note.');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusError(null);

    if (!targetStatus) {
      setStatusError('Please select a target status.');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      const payload: UpdateLeadStatusInput = {
        status: targetStatus,
        reason: statusReason.trim() || undefined,
      };
      await api.updateLeadStatus(lead.id, payload);
      setTargetStatus('');
      setStatusReason('');
      refetch();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : 'Failed to update lead status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    setReassignError(null);

    if (!reassignStaffId) {
      setReassignError('Please select a staff member to reassign to.');
      return;
    }

    setIsReassigning(true);
    try {
      const payload: ReassignLeadInput = {
        staffUserId: reassignStaffId,
        reason: reassignReason.trim() || undefined,
      };
      await api.reassignLead(lead.id, payload);
      setReassignModalOpen(false);
      setReassignStaffId('');
      setReassignReason('');
      refetch();
    } catch (err) {
      setReassignError(err instanceof Error ? err.message : 'Failed to reassign lead.');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleApplyDraft = (params: {
    channel: 'PHONE' | 'EMAIL' | 'WHATSAPP';
    summary: string;
    details: string;
  }) => {
    setContactMethod(params.channel);
    setContactSummary(params.summary);
    setContactDetails(params.details);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          to="/staff/leads"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 transition-colors hover:text-ink-950"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Lead Inbox</span>
        </Link>
      </div>

      {/* Main Header Banner */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-bold tracking-wider text-stone-500 uppercase">
                {lead.leadReference}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[0.62rem] font-bold ${statusBadge(lead.status)}`}
              >
                {lead.status}
              </span>
              <span className="text-[0.68rem] text-stone-500">
                Created{' '}
                {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <h1 className="mt-2 font-display text-2xl text-ink-950 sm:text-3xl">
              {lead.customerName}
            </h1>
            <p className="mt-1 text-sm font-medium text-stone-600">
              Interested in <strong className="text-ink-950">{lead.vehicleInterest}</strong> ·{' '}
              {lead.showroomName}
            </p>
          </div>

          {/* Response SLA Status Banner */}
          <div className="max-w-xs shrink-0 rounded-2xl border p-4 text-xs">
            {lead.firstResponseAt ? (
              <div className="flex items-start gap-2.5 rounded-xl border-emerald-200 bg-emerald-50/70 p-3 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <div className="font-bold text-emerald-800">SLA Responded</div>
                  <div className="mt-0.5 text-[0.68rem]">
                    First contact logged in <strong>{lead.responseTimeMinutes}m</strong>
                  </div>
                  <div className="mt-1 text-[0.65rem] text-stone-500">
                    {new Date(lead.firstResponseAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ) : lead.isOverdue ? (
              <div className="flex items-start gap-2.5 rounded-xl border-red-200 bg-red-50 p-3 text-red-900">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <div className="font-bold text-red-800">SLA Overdue</div>
                  <div className="mt-0.5 text-[0.68rem]">
                    No contact recorded within the 30-minute target window.
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-xl border-amber-200 bg-amber-50 p-3 text-amber-900">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                <div>
                  <div className="font-bold text-amber-800">Pending Response</div>
                  <div className="mt-0.5 text-[0.68rem]">
                    Awaiting first human outreach. Target: &le;30 minutes.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Contact & Action Ribbon */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-stone-100 pt-5 text-xs">
          <a
            href={`tel:${lead.customerPhone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 font-semibold text-ink-950 transition-colors hover:bg-stone-100"
          >
            <Phone className="h-3.5 w-3.5 text-stone-500" />
            <span>Call: {lead.customerPhone}</span>
          </a>

          <a
            href={`mailto:${lead.customerEmail}`}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 font-semibold text-ink-950 transition-colors hover:bg-stone-100"
          >
            <Mail className="h-3.5 w-3.5 text-stone-500" />
            <span>Email: {lead.customerEmail}</span>
          </a>

          {lead.preferredContactMethod && (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-ivory-100 px-3 py-2 text-stone-700">
              <span className="text-[0.68rem] font-semibold text-stone-500 uppercase">
                Prefers:
              </span>
              <strong className="text-ink-950">{lead.preferredContactMethod}</strong>
            </span>
          )}

          {/* Assigned Staff */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-stone-500">Assigned:</span>
            <strong className="text-ink-950">{lead.assignedStaffName || 'Unassigned'}</strong>
            {user?.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setReassignModalOpen(true)}
                className="ml-2 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-[0.68rem] font-semibold text-stone-700 hover:bg-stone-50"
              >
                Reassign
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Action Center (Left) & Timeline / Notes (Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          {/* Grounded AI Assistant (Human-in-the-Loop) */}
          <LeadAiAssistant lead={lead} onApplyDraft={handleApplyDraft} />

          {/* Action 1: Record Human Contact Activity */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <Phone className="text-brass-600 h-5 w-5" />
              <div>
                <h2 className="font-display text-base text-ink-950">Record Customer Outreach</h2>
                <p className="text-[0.68rem] text-stone-500">
                  Establishes first-response time metric and updates lead timeline.
                </p>
              </div>
            </div>

            <form onSubmit={handleRecordContact} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                    Contact Channel
                  </label>
                  <select
                    value={contactMethod}
                    onChange={(e) =>
                      setContactMethod(
                        e.target.value as 'PHONE' | 'EMAIL' | 'WHATSAPP' | 'IN_PERSON',
                      )
                    }
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                  >
                    <option value="PHONE">Phone Call</option>
                    <option value="WHATSAPP">WhatsApp Message</option>
                    <option value="EMAIL">Email Sent</option>
                    <option value="IN_PERSON">In-Person Meeting</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                    Advance Status To
                  </label>
                  <select
                    value={contactNextStatus}
                    onChange={(e) => setContactNextStatus(e.target.value as LeadStatus)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                  >
                    <option value="CONTACTED">CONTACTED (Spoke with client)</option>
                    <option value="QUALIFIED">QUALIFIED (High purchase intent)</option>
                    <option value="TEST_DRIVE_SCHEDULED">TEST_DRIVE_SCHEDULED</option>
                    <option value="NEGOTIATING">NEGOTIATING (Price discussion)</option>
                    <option value="WON">WON (Sale booked)</option>
                    <option value="LOST">LOST (Dropped enquiry)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                  Outreach Summary *
                </label>
                <input
                  type="text"
                  value={contactSummary}
                  onChange={(e) => setContactSummary(e.target.value)}
                  placeholder="e.g. Called customer regarding Solis V8 pricing and demo slot"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                  Discussion Details (Optional)
                </label>
                <textarea
                  value={contactDetails}
                  onChange={(e) => setContactDetails(e.target.value)}
                  placeholder="Client is interested in delivery next month. Preferred weekend test drive at Gomti Nagar..."
                  rows={2}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                />
              </div>

              {contactError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {contactError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingContact}
                className={buttonStyles({ variant: 'primary', size: 'md', className: 'w-full' })}
              >
                <Send className="h-3.5 w-3.5" />
                {isLoggingContact ? 'Logging Outreach...' : 'Save & Record Contact Action'}
              </button>
            </form>
          </div>

          {/* Action 2: Quick Status Transition */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <History className="h-5 w-5 text-stone-600" />
              <div>
                <h2 className="font-display text-base text-ink-950">
                  Update Lead Lifecycle Status
                </h2>
                <p className="text-[0.68rem] text-stone-500">
                  Current: <strong className="text-ink-950">{lead.status}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                    New Status
                  </label>
                  <select
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value as LeadStatus)}
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                    required
                  >
                    <option value="">Select target status...</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="CONTACTED">CONTACTED</option>
                    <option value="QUALIFIED">QUALIFIED</option>
                    <option value="TEST_DRIVE_SCHEDULED">TEST_DRIVE_SCHEDULED</option>
                    <option value="NEGOTIATING">NEGOTIATING</option>
                    <option value="WON">WON</option>
                    <option value="LOST">LOST</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-[0.68rem] font-semibold tracking-wider text-stone-600 uppercase">
                    Reason / Transition Note
                  </label>
                  <input
                    type="text"
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    placeholder="e.g. Customer confirmed test drive booking"
                    className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                  />
                </div>
              </div>

              {statusError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                  {statusError}
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingStatus || !targetStatus}
                className={buttonStyles({
                  variant: 'outline-dark',
                  size: 'md',
                  className: 'w-full',
                })}
              >
                {isUpdatingStatus ? 'Updating Status...' : 'Apply Status Transition'}
              </button>
            </form>
          </div>

          {/* Customer Requirements Detail Card */}
          {lead.customerRequirements && (
            <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="text-xs font-semibold tracking-wider text-stone-500 uppercase">
                Customer Notes / Enquired Requirements
              </h3>
              <p className="mt-2 rounded-xl border border-stone-100 bg-stone-50 p-3 text-xs leading-relaxed text-stone-800">
                {lead.customerRequirements}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Internal Notes & Audit Timeline */}
        <div className="space-y-6">
          {/* Internal Notes Panel */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <MessageSquare className="text-brass-600 h-5 w-5" />
              <div>
                <h2 className="font-display text-base text-ink-950">Internal Staff Notes</h2>
                <p className="text-[0.68rem] text-stone-500">
                  Private notes visible only to dealership staff.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNote} className="mt-4 space-y-2.5">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Add internal consultation notes, financing preferences, or trade-in inquiries..."
                rows={2}
                className="w-full rounded-xl border border-stone-200 bg-white p-2.5 text-xs text-stone-900 focus:border-brass-500 focus:outline-none"
                required
              />

              {noteError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {noteError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isAddingNote || !noteContent.trim()}
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  {isAddingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </form>

            <div className="mt-5 max-h-72 space-y-3 divide-y divide-stone-100 overflow-y-auto">
              {lead.notes.length > 0 ? (
                lead.notes.map((n) => (
                  <div key={n.id} className="pt-3 first:pt-0">
                    <p className="text-xs leading-relaxed text-stone-800">{n.content}</p>
                    <div className="mt-1 flex items-center justify-between text-[0.65rem] text-stone-400">
                      <span className="font-medium text-stone-600">{n.staffName}</span>
                      <span>
                        {new Date(n.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-4 text-center text-xs text-stone-400">
                  No internal notes added yet.
                </p>
              )}
            </div>
          </div>

          {/* Activity & Audit Trail Timeline */}
          <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
              <History className="h-5 w-5 text-stone-600" />
              <div>
                <h2 className="font-display text-base text-ink-950">Activity & Audit Timeline</h2>
                <p className="text-[0.68rem] text-stone-500">
                  Every interaction and status shift recorded.
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-96 space-y-4 overflow-y-auto pr-1">
              {/* Combine activities and status transitions */}
              {lead.activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="bg-brass-100 text-brass-700 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                    <Phone className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-semibold text-ink-950">{act.summary}</span>
                      <span className="shrink-0 text-[0.65rem] text-stone-400">
                        {new Date(act.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {act.details && <p className="mt-0.5 text-stone-600">{act.details}</p>}
                    <p className="mt-0.5 text-[0.65rem] text-stone-400">
                      By: {act.staffName || 'System'}
                    </p>
                  </div>
                </div>
              ))}

              {lead.statusHistory.map((sh) => (
                <div key={sh.id} className="flex items-start gap-3 text-xs">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-stone-800">
                        Status changed to <strong className="text-ink-950">{sh.toStatus}</strong>
                      </span>
                      <span className="shrink-0 text-[0.65rem] text-stone-400">
                        {new Date(sh.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {sh.reason && <p className="mt-0.5 text-stone-500 italic">"{sh.reason}"</p>}
                    <p className="mt-0.5 text-[0.65rem] text-stone-400">
                      By: {sh.changedByName || 'System'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Admin Reassign Modal */}
      {reassignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setReassignModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-display text-lg text-ink-950">Reassign Lead to Consultant</h3>
            <p className="mt-1 text-xs text-stone-500">
              Select an active sales consultant or used-car specialist.
            </p>

            <form onSubmit={handleReassign} className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-[0.68rem] font-semibold text-stone-600 uppercase">
                  Select Staff Member
                </label>
                <select
                  value={reassignStaffId}
                  onChange={(e) => setReassignStaffId(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none"
                  required
                >
                  <option value="">Select consultant...</option>
                  {staffList
                    .filter(
                      (s) =>
                        s.isActive &&
                        (s.role === 'SALES_CONSULTANT' ||
                          s.role === 'USED_CAR_STAFF' ||
                          s.role === 'ADMIN'),
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.role}) ·{' '}
                        {s.locations.map((l) => l.showroomCode || 'Lucknow').join(', ')}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-[0.68rem] font-semibold text-stone-600 uppercase">
                  Reason for Reassignment
                </label>
                <input
                  type="text"
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="e.g. Customer prefers Gomti Nagar consultant"
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              {reassignError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                  {reassignError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReassignModalOpen(false)}
                  className={buttonStyles({ variant: 'outline-dark', size: 'md' })}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning || !reassignStaffId}
                  className={buttonStyles({ variant: 'primary', size: 'md' })}
                >
                  {isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
