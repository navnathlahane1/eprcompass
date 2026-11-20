'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { safeLoginRedirect } from '@/lib/auth/loginRedirect';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RoleLoginFormProps {
  /** Roles that are allowed to log in on this page (e.g. ['client']) */
  expectedRoles: string[];
  /** Path to redirect to after successful login (e.g. '/portal/dashboard') */
  dashboardPath: string;
  /** Human-readable portal name shown in the heading (e.g. 'Client Portal') */
  portalLabel: string;
  /** URL of this login page — used in "wrong role" error links */
  loginPath: string;
  /** Tailwind ring/button color key — 'blue' | 'green' | 'indigo' | 'teal' | 'amber' */
  accent?: 'blue' | 'green' | 'indigo' | 'teal' | 'amber';
  /** Optional subtitle */
  description?: string;
  /** Optional local-only dummy login (used for development/testing) */
  localDevLogin?: {
    email: string;
    password: string;
    role: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function persistAccessTokenCookie(token?: string | null, expiresIn?: number | null) {
  if (!token || typeof document === 'undefined') return;
  document.cookie = `sb-access-token=${encodeURIComponent(token)}; Path=/; Max-Age=${Number(expiresIn || 3600)}; SameSite=Lax`;
}

async function fetchSessionRole(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('/api/auth/session-role', {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()).role ?? null;
  } catch {
    return null;
  }
}

function mapAuthError(msg?: string) {
  const n = String(msg || '').toLowerCase();
  if (n.includes('invalid login credentials')) return 'Incorrect email or password.';
  if (n.includes('email not confirmed')) return 'Please confirm your email before signing in.';
  return msg || 'Unable to sign in. Please try again.';
}

const ROLE_DASHBOARDS: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/admin/dashboard',
  client: '/portal/dashboard',
  partner: '/partner/dashboard',
  cepc: '/cepc/dashboard',
  recycler: '/recycler-portal/dashboard',
};

const ROLE_LOGIN_PAGES: Record<string, string> = {
  admin: '/admin/login',
  manager: '/admin/login',
  client: '/portal/login',
  partner: '/partner/login',
  cepc: '/cepc/login',
  recycler: '/recycler-portal/login',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin Panel',
  manager: 'Admin Panel',
  client: 'Client Portal',
  partner: 'Partner Portal',
  cepc: 'CEPC Portal',
  recycler: 'Recycler Portal',
};

// ─── Inner Component (uses hooks) ─────────────────────────────────────────────

function RoleLoginFormInner({
  expectedRoles,
  dashboardPath,
  portalLabel,
  loginPath,
  accent = 'blue',
  description,
  localDevLogin,
}: RoleLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const ringClass = `focus:ring-${accent}-500`;
  const btnClass = `bg-${accent}-600 hover:bg-${accent}-700`;

  // Redirect already-logged-in users immediately
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.access_token) return;
      persistAccessTokenCookie(session.access_token, session.expires_in);
      const role = await fetchSessionRole(session.access_token);
      if (!role || !active) return;
      const normalRole = role.toLowerCase();
      if (expectedRoles.includes(normalRole)) {
        const returnUrl = searchParams?.get('returnUrl');
        window.location.href = safeLoginRedirect(returnUrl, dashboardPath);
      }
      // Wrong role — do nothing, let them see the login page (different portal)
    }
    checkSession().catch(() => { if (active) setError('Unable to restore your session. Please sign in again.'); });
    return () => { active = false; };
  }, [router, searchParams, expectedRoles, dashboardPath]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Development-only bypass for local testing when no backend auth is available.
      if (
        process.env.NODE_ENV !== 'production' &&
        localDevLogin &&
        normalizedEmail === localDevLogin.email.trim().toLowerCase() &&
        password === localDevLogin.password &&
        expectedRoles.includes(localDevLogin.role.trim().toLowerCase())
      ) {
        document.cookie = 'dev-admin-bypass=1; Path=/; Max-Age=28800; SameSite=Lax';
        const returnUrl = searchParams?.get('returnUrl');
        router.replace(safeLoginRedirect(returnUrl, dashboardPath));
        return;
      }

      if (!isSupabaseConfigured) {
        if (process.env.NODE_ENV !== 'production' && localDevLogin) {
          setError(`Supabase is not configured. Use local test login: ${localDevLogin.email} / ${localDevLogin.password}`);
        } else {
          setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in your frontend env file.');
        }
        return;
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (authError) {
        setError(mapAuthError(authError.message));
        return;
      }

      const token = data?.session?.access_token;
      if (!token) { setError('Login failed. Please try again.'); return; }

      persistAccessTokenCookie(token, data.session?.expires_in);

      const role = await fetchSessionRole(token);
      if (!role) {
        setError('Your account does not have an assigned role. Contact support.');
        return;
      }

      const normalRole = role.toLowerCase();
      if (!expectedRoles.includes(normalRole)) {
        // Correct credentials but wrong portal — guide them to the right one
        const rightLogin = ROLE_LOGIN_PAGES[normalRole] || '/login';
        const rightLabel = ROLE_LABELS[normalRole] || 'your dashboard';
        setError(`This account is a ${normalRole} — please use the ${rightLabel}.`);
        // Add a navigation hint after a short delay
        setTimeout(() => {
          router.replace(rightLogin);
        }, 2500);
        return;
      }

      const returnUrl = searchParams?.get('returnUrl');
      window.location.href = safeLoginRedirect(returnUrl, dashboardPath);
    } catch (err: any) {
      setError(err?.message || 'Unable to login right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
          <h1 className="mb-1 text-2xl font-semibold text-gray-900">{portalLabel}</h1>
          <p className="mb-6 text-sm text-gray-500">
            {description ?? 'Sign in with your registered account.'}
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            {process.env.NODE_ENV !== 'production' && localDevLogin && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                Local testing enabled: {localDevLogin.email} / {localDevLogin.password}
              </div>
            )}

            <label className="block text-sm font-medium text-gray-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                className={`mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringClass}`}
              />
            </label>

            <label className="block text-sm font-medium text-gray-700">
              Password
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                aria-label="Password"
                className={`mt-1 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ringClass}`}
              />
            </label>

            <div className="text-right">
              <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-xl ${btnClass} py-2.5 text-sm font-semibold text-white transition disabled:opacity-60`}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-4">
            <p className="text-xs text-gray-500 mb-2">Sign in to a different portal:</p>
            <div className="flex flex-wrap gap-2">
              {loginPath !== '/portal/login' && (
                <Link href="/portal/login" className="text-xs text-blue-600 hover:underline">Client Portal</Link>
              )}
              {loginPath !== '/partner/login' && (
                <Link href="/partner/login" className="text-xs text-blue-600 hover:underline">Partner Portal</Link>
              )}
              {loginPath !== '/cepc/login' && (
                <Link href="/cepc/login" className="text-xs text-blue-600 hover:underline">CEPC Portal</Link>
              )}
              {loginPath !== '/recycler/login' && (
                <Link href="/recycler/login" className="text-xs text-blue-600 hover:underline">Recycler Portal</Link>
              )}
              {loginPath !== '/admin/login' && (
                <Link href="/admin/login" className="text-xs text-blue-600 hover:underline">Admin</Link>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            Need help? <Link href="/contact" className="hover:underline">Contact support</Link>
          </p>
        </div>
      </div>
    </main>
  );
}

// ─── Exported component wrapped in Suspense (required for useSearchParams) ────

export default function RoleLoginForm(props: RoleLoginFormProps) {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gray-50" />}>
      <RoleLoginFormInner {...props} />
    </Suspense>
  );
}
