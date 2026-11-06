import { AlertCircle, ArrowLeft, Lock, Mail, Shield } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import { BrandMark } from '../../components/ui/brand-mark';
import { useAuth } from '../../lib/use-auth';

const DEMO_PASSWORD = 'Aurelia2026!';

const demoAccounts = [
  {
    role: 'Dealership Administrator',
    email: 'admin@aureliamotors.com',
    location: 'Lucknow Central (HQ)',
    badge: 'All Permissions',
  },
  {
    role: 'Sales Consultant',
    email: 'sales.central@aureliamotors.com',
    location: 'Central Lucknow Showroom',
    badge: 'Scoped to Central',
  },
  {
    role: 'Service Advisor',
    email: 'service.gomti@aureliamotors.com',
    location: 'Gomti Nagar Workshop',
    badge: 'Scoped to Workshop',
  },
  {
    role: 'Used Car Specialist',
    email: 'usedcars@aureliamotors.com',
    location: 'Gomti Nagar Showroom',
    badge: 'Certified Inventory',
  },
];

export function StaffLoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/staff/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, navigate straight to returnUrl
  if (isAuthenticated) {
    navigate(returnUrl, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(returnUrl, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Invalid credentials. Please verify and try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-ink-950 px-4 py-12 text-ivory-50 sm:px-6 lg:px-8">
      <div className="text-center sm:mx-auto sm:w-full sm:max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2.5 text-xs text-brass-400/80 hover:text-brass-300"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Public Showroom</span>
        </Link>
        <div className="flex justify-center">
          <BrandMark className="h-12 w-12 text-brass-400" />
        </div>
        <h2 className="mt-4 font-display text-2xl tracking-[0.16em] text-ivory-50 sm:text-3xl">
          AURELIA MOTORS
        </h2>
        <p className="mt-1 text-xs font-semibold tracking-[0.24em] text-brass-400/90 uppercase">
          Dealership Management Console
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-2xl border border-ivory-50/10 bg-white/[0.03] p-8 shadow-2xl backdrop-blur-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-[0.65rem] font-semibold tracking-wider text-ivory-50/70 uppercase">
                Staff Email Address
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ivory-50/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@aureliamotors.com"
                  className="w-full rounded-xl border border-ivory-50/15 bg-white/[0.05] py-2.5 pr-4 pl-10 text-sm text-ivory-50 placeholder-ivory-50/30 focus:border-brass-400 focus:ring-1 focus:ring-brass-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] font-semibold tracking-wider text-ivory-50/70 uppercase">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-ivory-50/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-ivory-50/15 bg-white/[0.05] py-2.5 pr-4 pl-10 text-sm text-ivory-50 placeholder-ivory-50/30 focus:border-brass-400 focus:ring-1 focus:ring-brass-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded-xl bg-brass-400 py-2.5 text-xs font-semibold tracking-wider text-ink-950 uppercase transition-all hover:bg-brass-300 disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                  <span>Signing In…</span>
                </div>
              ) : (
                'Sign In to Staff Portal'
              )}
            </button>
          </form>

          {/* Quick Reviewer Accounts Helper */}
          <div className="mt-8 border-t border-ivory-50/10 pt-6">
            <div className="flex items-center gap-2 text-[0.65rem] font-semibold tracking-wider text-brass-400 uppercase">
              <Shield className="h-3.5 w-3.5" />
              <span>Reviewer Test Accounts</span>
            </div>
            <p className="mt-1 text-[0.7rem] text-ivory-50/50">
              Click any account below to pre-fill credentials for role-based evaluation:
            </p>

            <div className="mt-3 grid grid-cols-1 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => handleQuickFill(account.email)}
                  className="flex items-center justify-between rounded-xl border border-ivory-50/10 bg-white/[0.02] p-2.5 text-left text-xs transition-colors hover:border-brass-400/40 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 pr-2">
                    <div className="truncate font-semibold text-ivory-50">{account.role}</div>
                    <div className="truncate text-[0.68rem] text-ivory-50/50">{account.email}</div>
                  </div>
                  <span className="shrink-0 rounded-full border border-ivory-50/15 bg-white/5 px-2 py-0.5 text-[0.58rem] text-brass-300">
                    {account.badge}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
