import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Shield, ShieldAlert, UserCheck, UserX, X } from 'lucide-react';
import { useState } from 'react';
import type { CreateStaffInput, StaffRole, StaffUserSummary } from '@aurelia/shared';

import { api } from '../../lib/api-client';

export function AdminStaffPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null,
  );

  // New staff form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<StaffRole>('SALES_CONSULTANT');
  const [initialPassword, setInitialPassword] = useState('');
  const [selectedShowroomId, setSelectedShowroomId] = useState('');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');

  // Fetch staff list
  const { data: staffList, isLoading } = useQuery({
    queryKey: ['admin-staff-list'],
    queryFn: () => api.getStaffList(),
  });

  // Fetch showrooms and workshops for assignment dropdowns
  const { data: showrooms } = useQuery({
    queryKey: ['showrooms'],
    queryFn: () => api.getShowrooms(),
  });

  const { data: workshops } = useQuery({
    queryKey: ['workshops'],
    queryFn: () => api.getWorkshops(),
  });

  // Create staff mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateStaffInput) => api.createStaffMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      setFeedback({ type: 'success', message: 'Staff user created successfully.' });
      setModalOpen(false);
      resetForm();
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create staff member',
      });
    },
  });

  // Toggle active/deactivate mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.updateStaffMember(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-staff-list'] });
      setFeedback({ type: 'success', message: 'Staff status updated.' });
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update staff status',
      });
    },
  });

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setRole('SALES_CONSULTANT');
    setInitialPassword('');
    setSelectedShowroomId('');
    setSelectedWorkshopId('');
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload: CreateStaffInput = {
      fullName,
      email,
      phone: phone.trim() ? phone.trim() : undefined,
      role,
      initialPassword: initialPassword.trim() ? initialPassword.trim() : undefined,
      showroomIds: selectedShowroomId ? [selectedShowroomId] : undefined,
      workshopIds: selectedWorkshopId ? [selectedWorkshopId] : undefined,
    };

    createMutation.mutate(payload);
  };

  const handleToggleActive = (staff: StaffUserSummary) => {
    setFeedback(null);
    toggleActiveMutation.mutate({
      id: staff.id,
      isActive: !staff.isActive,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-stone-500 uppercase">
              <Shield className="text-brass-600 h-4 w-4" />
              <span>Executive Administration</span>
            </div>
            <h1 className="mt-1 font-display text-2xl tracking-tight text-ink-950 sm:text-3xl">
              Staff & Role Management
            </h1>
            <p className="mt-1 text-sm text-stone-600">
              Manage accounts, assign Lucknow showrooms and service facilities, and enforce RBAC
              policies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-ink-950 px-4 py-2.5 text-xs font-semibold tracking-wider text-ivory-50 uppercase shadow-sm transition hover:bg-ink-900"
          >
            <Plus className="h-4 w-4" />
            <span>Add Staff Member</span>
          </button>
        </div>

        {/* Safeguard Notice */}
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-xs text-stone-700">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <div>
            <span className="font-semibold tracking-wider text-ink-950 uppercase">
              System Safeguard Active:{' '}
            </span>
            The platform server strictly prevents the deactivation or demotion of the last remaining
            administrator account, ensuring dealership system access is never permanently locked.
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-4 flex items-center justify-between rounded-xl p-3 text-xs ${
              feedback.type === 'error'
                ? 'border border-red-200 bg-red-50 text-red-700'
                : 'border border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            <span>{feedback.message}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Staff Table */}
      <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="flex min-h-[30vh] items-center justify-center p-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-stone-700">
              <thead className="border-b border-stone-100 bg-stone-50/75 text-[0.65rem] font-semibold tracking-wider text-stone-500 uppercase">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Staff Member
                  </th>
                  <th scope="col" className="px-6 py-4">
                    System Role
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Assigned Facility
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {staffList?.map((staff) => (
                  <tr key={staff.id} className="transition hover:bg-stone-50/50">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-ink-950">{staff.fullName}</div>
                      <div className="text-xs text-stone-500">{staff.email}</div>
                      {staff.phone && (
                        <div className="text-[0.68rem] text-stone-400">{staff.phone}</div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase ${
                          staff.role === 'ADMIN'
                            ? 'bg-brass-100 text-brass-800'
                            : staff.role === 'SALES_CONSULTANT'
                              ? 'bg-sky-100 text-sky-800'
                              : staff.role === 'SERVICE_ADVISOR'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {staff.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {staff.locations.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {staff.locations.map((loc, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5 text-xs text-stone-600"
                            >
                              <Building2 className="h-3 w-3 text-stone-400" />
                              <span>{loc.showroomName || loc.workshopName}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-stone-400 italic">Dealership-wide (HQ)</span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.65rem] font-semibold tracking-wider uppercase ${
                          staff.isActive
                            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20'
                            : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            staff.isActive ? 'bg-emerald-500' : 'bg-stone-400'
                          }`}
                        />
                        {staff.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(staff)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wider uppercase transition ${
                          staff.isActive
                            ? 'text-red-600 hover:bg-red-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {staff.isActive ? (
                          <>
                            <UserX className="h-3.5 w-3.5" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Activate</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div>
                <h3 className="font-display text-lg text-ink-950">Add Staff Account</h3>
                <p className="text-xs text-stone-500">
                  Provision new employee access with designated dealership role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Vikramaditya Singh"
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Work Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@aureliamotors.com"
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  System Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as StaffRole)}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                >
                  <option value="SALES_CONSULTANT">Sales Consultant (Showroom Scoped)</option>
                  <option value="SERVICE_ADVISOR">Service Advisor (Workshop Scoped)</option>
                  <option value="USED_CAR_STAFF">Used Car Specialist (Pre-Owned Fleet)</option>
                  <option value="ADMIN">Dealership Administrator (Full Clearance)</option>
                </select>
              </div>

              {/* Location Selectors */}
              {role === 'SALES_CONSULTANT' && (
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Assigned Showroom
                  </label>
                  <select
                    value={selectedShowroomId}
                    onChange={(e) => setSelectedShowroomId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  >
                    <option value="">Select showroom…</option>
                    {showrooms?.map((sr) => (
                      <option key={sr.id} value={sr.id}>
                        {sr.name} ({sr.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {role === 'SERVICE_ADVISOR' && (
                <div>
                  <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                    Assigned Workshop
                  </label>
                  <select
                    value={selectedWorkshopId}
                    onChange={(e) => setSelectedWorkshopId(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  >
                    <option value="">Select workshop facility…</option>
                    {workshops?.map((ws) => (
                      <option key={ws.id} value={ws.id}>
                        {ws.name} ({ws.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  Initial Password (Optional)
                </label>
                <input
                  type="password"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Defaults to Aurelia2026!"
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-stone-100 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="rounded-xl bg-ink-950 px-5 py-2 text-xs font-semibold tracking-wider text-ivory-50 uppercase hover:bg-ink-900 disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creating…' : 'Create Staff User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
