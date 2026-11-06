import {
  CalendarCheck,
  ExternalLink,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Users,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { StaffRole } from '@aurelia/shared';

import { api } from '../../lib/api-client';
import { useAuth } from '../../lib/use-auth';
import { cn } from '../../lib/utils';
import { BrandMark } from '../ui/brand-mark';

function roleBadge(role: StaffRole) {
  switch (role) {
    case 'ADMIN':
      return {
        label: 'Administrator',
        bg: 'bg-brass-400/20 text-brass-300 border-brass-400/30',
      };
    case 'SALES_CONSULTANT':
      return {
        label: 'Sales Consultant',
        bg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
      };
    case 'SERVICE_ADVISOR':
      return {
        label: 'Service Advisor',
        bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      };
    case 'USED_CAR_STAFF':
      return {
        label: 'Used Car Specialist',
        bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
  }
}

export function StaffLayout({ children }: { children?: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  // Change password modal state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/staff/login');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await api.changePassword({ currentPassword, newPassword });
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setPasswordModalOpen(false);
        setPasswordSuccess(null);
      }, 1500);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (!user) {
    return null;
  }

  const roleInfo = roleBadge(user.role);

  return (
    <div className="flex min-h-screen bg-stone-100 font-sans text-stone-900 antialiased">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-ink-950/20 bg-ink-950 px-4 text-ivory-50 lg:hidden">
        <Link to="/staff/dashboard" className="flex items-center gap-2.5">
          <BrandMark className="h-7 w-7 text-brass-400" />
          <span className="font-display text-base tracking-widest text-ivory-50">AURELIA</span>
          <span className="text-[0.6rem] tracking-wider text-brass-400 uppercase">Staff</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-ivory-50/70 hover:bg-white/10 hover:text-ivory-50"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-ink-950/20 bg-ink-950 text-ivory-50 transition-transform duration-200 lg:static lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div>
          {/* Logo / Dealership branding */}
          <div className="flex h-20 items-center gap-3 border-b border-ivory-50/10 px-6">
            <BrandMark className="h-8 w-8 text-brass-400" />
            <div>
              <div className="font-display text-lg tracking-[0.18em] text-ivory-50">AURELIA</div>
              <div className="text-[0.55rem] font-semibold tracking-[0.25em] text-brass-400/80 uppercase">
                Staff Operations
              </div>
            </div>
          </div>

          {/* User Profile Summary */}
          <div className="border-b border-ivory-50/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-400/15 font-display text-sm font-semibold text-brass-300 ring-1 ring-brass-400/30">
                {user.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-ivory-50">{user.fullName}</div>
                <div className="truncate text-xs text-ivory-50/50">{user.email}</div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold tracking-wide uppercase',
                  roleInfo.bg,
                )}
              >
                {roleInfo.label}
              </span>

              {user.locations.map((loc, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full border border-ivory-50/15 bg-white/5 px-2 py-0.5 text-[0.6rem] text-ivory-50/70"
                >
                  {loc.showroomCode || loc.workshopCode || 'Lucknow'}
                </span>
              ))}
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5 px-3 py-4">
            <NavLink
              to="/staff/dashboard"
              end
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors',
                  isActive
                    ? 'bg-brass-400 font-semibold text-ink-950 shadow-sm'
                    : 'text-ivory-50/70 hover:bg-white/5 hover:text-ivory-50',
                )
              }
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>Overview & Metrics</span>
            </NavLink>

            {user.role !== 'USED_CAR_STAFF' && (
              <NavLink
                to="/staff/appointments"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors',
                    isActive
                      ? 'bg-brass-400 font-semibold text-ink-950 shadow-sm'
                      : 'text-ivory-50/70 hover:bg-white/5 hover:text-ivory-50',
                  )
                }
              >
                <CalendarCheck className="h-4 w-4 shrink-0" />
                <span>Appointments</span>
              </NavLink>
            )}

            <NavLink
              to="/staff/leads"
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors',
                  isActive
                    ? 'bg-brass-400 font-semibold text-ink-950 shadow-sm'
                    : 'text-ivory-50/70 hover:bg-white/5 hover:text-ivory-50',
                )
              }
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <span>Leads & CRM</span>
            </NavLink>

            {user.role === 'ADMIN' && (
              <NavLink
                to="/staff/team"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium tracking-wide transition-colors',
                    isActive
                      ? 'bg-brass-400 font-semibold text-ink-950 shadow-sm'
                      : 'text-ivory-50/70 hover:bg-white/5 hover:text-ivory-50',
                  )
                }
              >
                <Users className="h-4 w-4 shrink-0" />
                <span>Staff Management</span>
              </NavLink>
            )}

            <div className="my-3 border-t border-ivory-50/10 pt-3">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium text-ivory-50/50 hover:bg-white/5 hover:text-ivory-50"
              >
                <span className="flex items-center gap-3">
                  <ExternalLink className="h-4 w-4" />
                  <span>Public Showroom</span>
                </span>
                <span className="text-[0.6rem] text-ivory-50/40 uppercase">Opens tab</span>
              </a>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer: Security actions */}
        <div className="space-y-1 border-t border-ivory-50/10 p-3">
          <button
            type="button"
            onClick={() => setPasswordModalOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-ivory-50/70 hover:bg-white/5 hover:text-ivory-50"
          >
            <KeyRound className="h-4 w-4" />
            <span>Change Password</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-6 lg:p-10">
        <div className="mx-auto max-w-7xl">{children ?? <Outlet />}</div>
      </main>

      {/* Change Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="font-display text-lg text-ink-950">Update Staff Password</h3>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePasswordSubmit} className="mt-5 space-y-4">
              {passwordError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
                  {passwordSuccess}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  New Password (min. 8 characters)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  placeholder="Enter at least 8 characters"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold tracking-wider text-stone-700 uppercase">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-stone-300 px-3.5 py-2 text-sm focus:border-ink-950 focus:ring-1 focus:ring-ink-950 focus:outline-none"
                  placeholder="Re-enter new password"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPasswordModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPassword}
                  className="rounded-xl bg-ink-950 px-5 py-2 text-xs font-semibold tracking-wider text-ivory-50 uppercase hover:bg-ink-900 disabled:opacity-50"
                >
                  {isSubmittingPassword ? 'Updating…' : 'Save New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
