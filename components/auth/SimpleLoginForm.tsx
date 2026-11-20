'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff, CheckCircle, ShieldCheck, Users, Award, Leaf, Lock } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient';
import { safeLoginRedirect } from '@/lib/auth/loginRedirect';
import SupportChatWidget from '@/components/support/SupportChatWidget';
import PublicBrand from '@/components/public-site/PublicBrand';
import GoogleWorkspaceSignIn from './GoogleWorkspaceSignIn';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SimpleLoginFormProps {
  title: string;
  subtitle: string;
  dashboardPath: string;
  /** Role(s) required to access this portal. Used to validate the session
   *  before auto-redirecting an already-signed-in user. Without this prop
   *  the auto-redirect fires for ANY authenticated user, which causes an
   *  infinite loop when a user with the wrong role is redirected back to
   *  the layout's auth gate. */
  requiredRole?: string | string[];
  /** Disable the on-mount auto-redirect entirely. Use this for portals that
   *  gate access by env-var email/ID rather than by profile role (e.g. Intel),
   *  so cross-tab session sharing cannot trigger a redirect loop. */
  skipAutoRedirect?: boolean;
  /** Server verifies the browser cookie and portal access before navigation. */
  sessionCheckPath?: string;
  accent?: 'blue' | 'indigo' | 'teal' | 'gray' | 'green';
  features?: string[];
  showPortalSwitcher?: boolean;
  showForgotPassword?: boolean;
  showHelpLink?: boolean;
  /** Which portal identifier to pass to the support chat widget */
  portal?: string;
  helpHref?: string;
  helpLabel?: string;
  footerNote?: string;
}

// ─── Per-accent left-panel + button styling ───────────────────────────────────

const ACCENT_CONFIG: Record<
  NonNullable<SimpleLoginFormProps['accent']>,
  {
    glow: string;
    accentText: string;
    accentBorder: string;
    btn: string;
    ring: string;
    features: string[];
    icon: React.ReactNode;
  }
> = {
  blue: {
    glow: 'bg-[#07875f]/20',
    accentText: 'text-[#78c943]',
    accentBorder: 'border-[#78c943]/35',
    btn: 'bg-[#07875f] hover:bg-[#066e4e] shadow-[0_8px_18px_rgba(7,135,95,.22)]',
    ring: 'focus:border-[#07875f] focus:ring-[#07875f]/20',
    icon: <ShieldCheck className="w-6 h-6" />,
    features: [
      'Track all EPR compliance deadlines',
      'Download certificates instantly',
      'Secure document vault',
      'Real-time status updates',
    ],
  },
  indigo: {
    glow: 'bg-[#07875f]/20',
    accentText: 'text-[#78c943]',
    accentBorder: 'border-[#78c943]/35',
    btn: 'bg-[#07875f] hover:bg-[#066e4e] shadow-[0_8px_18px_rgba(7,135,95,.22)]',
    ring: 'focus:border-[#07875f] focus:ring-[#07875f]/20',
    icon: <Users className="w-6 h-6" />,
    features: [
      'Manage client portfolios',
      'Track commissions & earnings',
      'Access consultant resources',
      'Referral programme dashboard',
    ],
  },
  teal: {
    glow: 'bg-[#07875f]/20',
    accentText: 'text-[#78c943]',
    accentBorder: 'border-[#78c943]/35',
    btn: 'bg-[#07875f] hover:bg-[#066e4e] shadow-[0_8px_18px_rgba(7,135,95,.22)]',
    ring: 'focus:border-[#07875f] focus:ring-[#07875f]/20',
    icon: <Leaf className="w-6 h-6" />,
    features: [
      'Manage recycler listings',
      'Claim EPR credit certificates',
      'File compliance documents',
      'Access the recycler network',
    ],
  },
  gray: {
    glow: 'bg-[#07875f]/20',
    accentText: 'text-[#78c943]',
    accentBorder: 'border-[#78c943]/35',
    btn: 'bg-[#07875f] hover:bg-[#066e4e] shadow-[0_8px_18px_rgba(7,135,95,.22)]',
    ring: 'focus:border-[#07875f] focus:ring-[#07875f]/20',
    icon: <Lock className="w-6 h-6" />,
    features: [
      'Full platform administration',
      'Client & partner management',
      'Reports and analytics',
      'System configuration',
    ],
  },
  green: {
    glow: 'bg-[#07875f]/20',
    accentText: 'text-[#78c943]',
    accentBorder: 'border-[#78c943]/35',
    btn: 'bg-[#07875f] hover:bg-[#066e4e] shadow-[0_8px_18px_rgba(7,135,95,.22)]',
    ring: 'focus:border-[#07875f] focus:ring-[#07875f]/20',
    icon: <Award className="w-6 h-6" />,
    features: [
      'EPR programme management',
      'Compliance tracking dashboard',
      'Document management',
      'Audit trail & reports',
    ],
  },
};

// ─── Role → portal mapping ────────────────────────────────────────────────────

const ROLE_PORTAL_MAP: { roles: string[]; name: string; path: string }[] = [
  { roles: ['admin', 'manager', 'sales-executive', 'epr-executive', 'operator', 'hr-executive', 'training-executive'], name: 'Admin Panel', path: '/admin/login' },
  { roles: ['partner'], name: 'Partner Portal', path: '/partner/login' },
  { roles: ['client'], name: 'Client Portal', path: '/portal/login' },
  { roles: ['recycler'], name: 'Recycler Portal', path: '/recycler-portal/login' },
  { roles: ['cepc'], name: 'CEPC Portal', path: '/cepc/login' },
  { roles: ['cfo', 'finance_executive'], name: 'Finance Portal', path: '/finance/login' },
  { roles: ['user_manager'], name: 'IAM Portal', path: '/iam/login' },
  { roles: ['comms_cmo', 'comms_brand_manager', 'comms_regional_manager', 'comms_campaign_manager', 'comms_social_media_manager', 'comms_content_strategist', 'comms_content_creator', 'comms_graphic_designer', 'comms_community_manager', 'comms_performance_specialist', 'comms_pr_manager', 'comms_influencer_manager', 'comms_marketing_analyst', 'comms_marketing_ops', 'comms_marketing_intern'], name: 'Comms Portal', path: '/comms/login' },
  { roles: ['academy_director', 'academy_manager', 'training_program_manager', 'trainer', 'guest_trainer'], name: 'Academy Portal', path: '/academy/login' },
  { roles: ['task_manager'], name: 'Task Manager', path: '/taskmanager/login' },
  { roles: ['tendering_manager', 'tendering_executive'], name: 'Tendering Portal', path: '/tendering/login' },
  { roles: ['legal', 'compliance_manager'], name: 'Legal Portal', path: '/legal-portal/login' },
];

function getPortalForRole(role: string): { name: string; path: string } | null {
  return ROLE_PORTAL_MAP.find(p => p.roles.includes(role)) ?? null;
}

// ─── Cookie helper ────────────────────────────────────────────────────────────

function setAuthCookie(token: string, maxAge = 3600) {
  if (typeof document === 'undefined') return;
  document.cookie = `sb-access-token=${token}; Path=/; Max-Age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
}

// ─── Inner form (needs useSearchParams → must be in Suspense) ─────────────────

function LoginFormInner({
  title,
  subtitle,
  dashboardPath,
  requiredRole,
  skipAutoRedirect = false,
  sessionCheckPath,
  accent = 'blue',
  features,
  showPortalSwitcher = true,
  showForgotPassword = true,
  showHelpLink = true,
  portal = 'general',
  helpLabel = 'Live Support',
  footerNote = 'EPR Compass © 2026',
}: SimpleLoginFormProps) {
  const searchParams = useSearchParams();
  const cfg = ACCENT_CONFIG[accent];
  const resolvedFeatures = features && features.length > 0 ? features : cfg.features;

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(() => sessionCheckPath && searchParams?.get('intelError')
    ? searchParams.get('intelError') === 'denied'
      ? 'Your account is not authorized for Intel. Ask your administrator to enable Intel access.'
      : 'Intel access verification is temporarily unavailable. Contact your administrator.'
    : '');

  // Auto-redirect if already logged in — BUT only if the session belongs to a user
  // whose role matches this portal. Without the role check, a user logged in as
  // (say) 'partner' would be auto-redirected to /portal/dashboard, the layout
  // would reject them (wrong role), redirect them back to /portal/login, and the
  // useEffect would fire again → infinite loop.
  //
  // skipAutoRedirect completely disables this for portals that gate by env-var
  // email/ID rather than role (e.g. Intel) to prevent cross-tab redirect loops.
  useEffect(() => {
    if (skipAutoRedirect || !isSupabaseConfigured) return;

    let alive = true;
    const allowedRoles: string[] | null = requiredRole
      ? (Array.isArray(requiredRole) ? requiredRole : [requiredRole])
      : null;

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!alive || !session?.access_token) return;

      if (allowedRoles) {
        // Validate the role before redirecting. The profiles table must allow
        // SELECT for the authenticated user (standard RLS policy).
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, is_banned')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profileError || !profile || profile.is_banned || !alive) return;
          const role = profile.role ?? '';
          if (!allowedRoles.includes(role)) {
            // Session exists but belongs to a different portal — show a hint.
            const suggested = getPortalForRole(role);
            if (suggested) {
              setError(`You're signed in to the ${suggested.name}. Please go to ${suggested.path} or sign in with the correct account.`);
            }
            return;
          }
        } catch {
          // If the profiles query fails (e.g. RLS), skip auto-redirect rather
          // than risk a loop.
          return;
        }
      }

      setAuthCookie(session.access_token, session.expires_in ?? 3600);
      const returnUrl = searchParams?.get('returnUrl');
      if (alive) window.location.href = safeLoginRedirect(returnUrl, dashboardPath);
    })().catch(() => { if (alive) setError('Unable to restore your session. Please sign in again.'); });

    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skipAutoRedirect]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isSupabaseConfigured) { setError('Sign-in is unavailable until the service is configured. Please contact support.'); return; }
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        const msg = authError.message.toLowerCase();
        if (msg.includes('invalid login credentials')) {
          setError('Incorrect email or password. Please try again.');
        } else if (msg.includes('database error querying schema') || msg.includes('database error finding users')) {
          setError('Sign-in is temporarily unavailable. Please contact support.');
        } else if (msg.includes('email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else {
          setError(authError.message || 'Unable to sign in. Please try again.');
        }
        return;
      }

      const token = data.session?.access_token;
      if (!token) {
        setError('Login failed — no session returned. Please try again.');
        return;
      }

      // If this portal requires a specific role, verify it before redirecting.
      // Catching the wrong-portal case here avoids a server-side bounce loop and
      // gives the user a clear message about where they should sign in.
      if (requiredRole && data.session?.user) {
        const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, is_banned')
          .eq('id', data.session.user.id)
          .maybeSingle();

        const userRole: string = profile?.role ?? '';
        if (profileError || !userRole || profile?.is_banned) {
          setAuthCookie('', 0);
          await supabase.auth.signOut();
          setError('Your portal access could not be verified. Please contact support.');
          return;
        }
        // The server still authorizes access; reject known wrong-portal sessions here.
        if (userRole && !allowedRoles.includes(userRole)) {
          setAuthCookie('', 0);
          await supabase.auth.signOut();
          const suggested = getPortalForRole(userRole);
          setError(
            suggested
              ? `These credentials belong to the ${suggested.name}. Please sign in at ${suggested.path} instead.`
              : 'Your account does not have access to this portal. Please use the correct portal for your account.'
          );
          return;
        }
      }

      setAuthCookie(token, data.session?.expires_in ?? 3600);
      if (sessionCheckPath) {
        const response = await fetch(sessionCheckPath, { credentials: 'same-origin', cache: 'no-store' });
        const access = await response.json();
        if (!response.ok || access.allowed !== true) {
          setError(access.error || 'Your portal access could not be verified. Contact your administrator.');
          return;
        }
      }
      const returnUrl = searchParams?.get('returnUrl');
      window.location.href = safeLoginRedirect(returnUrl, dashboardPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to sign in right now.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="epr-public grid min-h-dvh lg:grid-cols-[minmax(280px,42%)_1fr]">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-[#032f3a] px-6 py-7 text-white sm:px-10 lg:min-h-dvh lg:px-12 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className={`pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full blur-3xl ${cfg.glow}`} />
        <div className="pointer-events-none absolute -bottom-20 right-0 h-56 w-56 rounded-full bg-[#78c943]/15 blur-3xl" />

        <div className="relative z-10">
          <PublicBrand inverse compact />
        </div>

        <div className="relative z-10 mt-10 max-w-md lg:mt-8">
          <div className={`mb-4 inline-flex items-center gap-2 rounded-lg border bg-white/5 px-3 py-1.5 ${cfg.accentBorder}`}>
            <span className={cfg.accentText}>{cfg.icon}</span>
            <span className={`text-sm font-semibold ${cfg.accentText}`}>{title}</span>
          </div>
          <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-tight sm:text-[32px]">
            Sign in to<br />
            <span className="text-[#78c943]">{title}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">{subtitle}</p>
          <ul className="mt-6 hidden space-y-2.5 sm:block">
            {resolvedFeatures.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-white/85">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#78c943]" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 mt-8 text-[11px] text-white/45">Secured session · SSL encrypted</p>
      </aside>

      <section className="flex items-start justify-center bg-[#fbfdfc] px-5 py-10 sm:px-8 lg:items-center lg:px-16 lg:py-12">
        <div className="w-full max-w-[400px]">
          {showPortalSwitcher ? (
            <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-[#07875f] hover:underline">
              ← All portals
            </Link>
          ) : (
            <p className="mb-6 inline-flex rounded-full border border-[#dfe9e4] bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#607279]">
              Restricted access
            </p>
          )}

          <h1 className="text-[1.65rem] font-extrabold tracking-tight text-[#102c32]">Sign in</h1>
          <p className="mt-1.5 text-sm text-[#607279]">Enter your credentials to access {title}.</p>

          {!isSupabaseConfigured && <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Sign-in is currently unavailable. Please contact support.</p>}
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label htmlFor="email" className="block text-sm font-semibold text-[#102c32]">
              Email
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                aria-label="Email address"
                className={`mt-1.5 min-h-12 w-full rounded-xl border border-[#dfe9e4] bg-white px-4 text-base text-[#102c32] placeholder:text-[#8aa0a6] outline-none transition focus:ring-2 ${cfg.ring}`}
              />
            </label>

            <div>
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="password" className="text-sm font-semibold text-[#102c32]">Password</label>
                {showForgotPassword ? (
                  <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#07875f] hover:underline">
                    Forgot password?
                  </Link>
                ) : null}
              </div>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  aria-label="Password"
                  className={`min-h-12 w-full rounded-xl border border-[#dfe9e4] bg-white px-4 pr-11 text-base text-[#102c32] outline-none transition focus:ring-2 ${cfg.ring}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8aa0a6] hover:text-[#102c32]"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error ? (
              <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              aria-busy={loading}
              className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${cfg.btn}`}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          {requiredRole === 'client' && !skipAutoRedirect && <GoogleWorkspaceSignIn />}

          <div className="mt-8 flex items-center justify-between gap-4 border-t border-[#dfe9e4] pt-5 text-sm">
            {showHelpLink ? (
              <span className="text-[#607279]">{helpLabel}</span>
            ) : (
              <span className="text-[#607279]">Staff workspace</span>
            )}
            <span className="text-right text-xs text-[#8aa0a6]">{footerNote}</span>
          </div>
        </div>
      </section>

      {showHelpLink ? <SupportChatWidget portal={portal} accent={accent as 'blue' | 'indigo' | 'teal' | 'green' | 'gray'} /> : null}
    </main>
  );
}

// ─── Exported component (wraps inner in Suspense for useSearchParams) ─────────

export default function SimpleLoginForm(props: SimpleLoginFormProps) {
  return (
    <Suspense fallback={
      <main className="grid min-h-dvh lg:grid-cols-[42%_1fr]">
        <div className="bg-[#032f3a]" />
        <div className="bg-[#fbfdfc] p-10"><p role="status">Loading sign in…</p><Link href="/login" className="mt-4 inline-block text-emerald-700 underline">Main sign in</Link></div>
      </main>
    }>
      <LoginFormInner {...props} />
    </Suspense>
  );
}

