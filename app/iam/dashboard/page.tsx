import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildIamSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const metadata = { title: 'Dashboard | Access Manager' };
export const dynamic = 'force-dynamic';

async function getIamReadClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerComponentClient();
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const PORTAL_ROLES = [
  { role: 'client',          label: 'EPR Portal',     color: 'text-blue-400',   bar: 'bg-blue-500',   href: '/iam/users?role=client'          },
  { role: 'partner',         label: 'Partner Portal', color: 'text-indigo-400', bar: 'bg-indigo-500', href: '/iam/users?role=partner'         },
  { role: 'cepc',            label: 'CEPC Portal',    color: 'text-violet-400', bar: 'bg-violet-500', href: '/iam/users?role=cepc'            },
  { role: 'recycler',        label: 'Recycler Portal',color: 'text-teal-400',   bar: 'bg-teal-500',   href: '/iam/users?role=recycler'        },
  { role: 'telecaller',      label: 'Telecalling',    color: 'text-orange-400', bar: 'bg-orange-500', href: '/iam/users?role=telecaller'      },
  { role: 'manager',         label: 'Admin Panel',    color: 'text-rose-400',   bar: 'bg-rose-500',   href: '/iam/users?role=manager'         },
  { role: 'user_manager',    label: 'Access Mgr',     color: 'text-slate-400',  bar: 'bg-slate-500',  href: '/iam/users?role=user_manager'    },
  { role: 'task_manager',    label: 'Task Manager',   color: 'text-orange-400', bar: 'bg-orange-500', href: '/iam/users?role=task_manager'    },
  { role: 'sales-executive', label: 'Sales',          color: 'text-amber-400',  bar: 'bg-amber-500',  href: '/iam/users?role=sales-executive' },
];

const ACTION_BADGE: Record<string, string> = {
  create:         'bg-emerald-500/20 text-emerald-300',
  ban:            'bg-rose-500/20 text-rose-300',
  unban:          'bg-teal-500/20 text-teal-300',
  role_change:    'bg-blue-500/20 text-blue-300',
  update:         'bg-slate-500/20 text-slate-400',
  password_reset: 'bg-amber-500/20 text-amber-300',
  invite_email_sent: 'bg-cyan-500/20 text-cyan-300',
  delete:         'bg-red-500/20 text-red-400',
};

function relativeTime(d: string) {
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default async function IamDashboardPage() {
  const adminClient = await getIamReadClient();

  // ── Counts by role ──────────────────────────────────────────────────────────
  const { data: roleCounts } = await adminClient
    .from('profiles')
    .select('role')
    .not('role', 'eq', 'admin');

  const countByRole: Record<string, number> = {};
  for (const row of roleCounts || []) {
    countByRole[row.role] = (countByRole[row.role] || 0) + 1;
  }
  const totalNonAdmin = Object.values(countByRole).reduce((a, b) => a + b, 0);
  const maxCount = Math.max(...Object.values(countByRole), 1);

  // ── Banned count (graceful: column may not exist yet) ────────────────────
  let bannedCount = 0;
  const { count: bc, error: banErr } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_banned', true)
    .not('role', 'eq', 'admin');
  if (!banErr) bannedCount = bc ?? 0;

  // ── New this week ────────────────────────────────────────────────────────
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: newThisWeek } = await adminClient
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .gt('created_at', weekAgo)
    .not('role', 'eq', 'admin');

  // ── Recent audit log (graceful: table may not exist yet) ─────────────────
  let recentAudit: any[] = [];
  const { data: auditData, error: auditErr } = await adminClient
    .from('iam_audit_log')
    .select('id, actor_name, target_email, action, created_at, notes')
    .order('created_at', { ascending: false })
    .limit(6);
  if (!auditErr) recentAudit = auditData || [];

  const iamMigrationNeeded = !!banErr || !!auditErr;

  const stats = [
    {
      label:    'Total Users',
      value:    totalNonAdmin,
      sub:      'across all portals',
      color:    'text-slate-100',
      iconPath: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      iconBg:   'bg-slate-700/50',
    },
    {
      label:    'New This Week',
      value:    newThisWeek ?? 0,
      sub:      'last 7 days',
      color:    'text-emerald-400',
      iconPath: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
      iconBg:   'bg-emerald-500/15',
    },
    {
      label:    'Banned Accounts',
      value:    bannedCount,
      sub:      banErr ? 'run migration' : 'suspended access',
      color:    bannedCount > 0 ? 'text-rose-400' : 'text-slate-500',
      iconPath: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
      iconBg:   bannedCount > 0 ? 'bg-rose-500/15' : 'bg-slate-700/50',
    },
    {
      label:    'Active Portals',
      value:    8,
      sub:      'platform portals',
      color:    'text-violet-400',
      iconPath: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      iconBg:   'bg-violet-500/15',
    },
  ];

  const iamSetupSteps = buildIamSetupSteps({
    hasReviewedUsers: totalNonAdmin > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={iamSetupSteps}
          portalKey="iam"
          accentColor="violet"
          dark={true}
        />
      </TourTarget>

      {/* ── Migration warning ─────────────────────────────────────────────── */}
      {iamMigrationNeeded && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-amber-300">IAM migration required</p>
            <p className="mt-0.5 text-xs text-amber-400/70">
              The <code className="font-mono rounded bg-amber-500/10 px-1">is_banned</code> column and{' '}
              <code className="font-mono rounded bg-amber-500/10 px-1">iam_audit_log</code> table are missing.
              Run the SQL below in Supabase to unlock ban management and audit logging.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer select-none text-[11px] text-amber-400 hover:text-amber-300 transition">
                Show migration SQL ›
              </summary>
              <pre className="mt-2 overflow-x-auto rounded-lg border border-slate-800 bg-[#060c1a] p-3 text-[10px] leading-relaxed text-slate-300">{`ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_banned     boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_reason text,
  ADD COLUMN IF NOT EXISTS banned_at     timestamptz,
  ADD COLUMN IF NOT EXISTS banned_by     uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS notes         text;

CREATE TABLE IF NOT EXISTS iam_audit_log (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id     uuid        REFERENCES auth.users(id),
  actor_name   text,
  target_id    uuid,
  target_email text,
  action       text        NOT NULL,
  old_value    jsonb,
  new_value    jsonb,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_iam_audit_log_created_at
  ON iam_audit_log(created_at DESC);

ALTER TABLE iam_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_only" ON iam_audit_log
  USING (auth.role() = 'service_role');`}</pre>
            </details>
          </div>
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">Platform-wide user access overview</p>
        </div>
        <Link href="/iam/create"
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-700">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New User
        </Link>
      </div>

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="overflow-hidden rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className={`mt-1.5 text-3xl font-bold tabular-nums tracking-tight ${s.color}`}>
                  {s.value}
                </p>
                <p className="mt-0.5 text-[10px] text-slate-600">{s.sub}</p>
              </div>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
                <svg viewBox="0 0 24 24" className={`h-4 w-4 ${s.color}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </TourTarget>

      {/* ── Middle grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Portal breakdown */}
        <div className="lg:col-span-2 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Users by Portal</h2>
              <p className="mt-0.5 text-[11px] text-slate-600">{totalNonAdmin} accounts across {PORTAL_ROLES.length} portals</p>
            </div>
            <Link href="/iam/users" className="text-xs text-violet-400 transition hover:text-violet-300">
              View all →
            </Link>
          </div>

          <div className="space-y-2.5">
            {PORTAL_ROLES.map(({ role, label, color, bar, href }) => {
              const count = countByRole[role] ?? 0;
              const pct   = totalNonAdmin > 0 ? Math.round((count / totalNonAdmin) * 100) : 0;
              const barW  = totalNonAdmin > 0 ? Math.max((count / maxCount) * 100, count > 0 ? 3 : 0) : 0;
              return (
                <Link key={role} href={href}
                  className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-slate-800/40 group">
                  <div className="w-28 shrink-0">
                    <p className={`text-xs font-semibold ${color}`}>{label}</p>
                    <p className="text-[10px] capitalize text-slate-600">{role.replace(/-/g, ' ')}</p>
                  </div>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${bar} opacity-60 transition-all duration-500`}
                      style={{ width: `${barW}%` }} />
                  </div>
                  <div className="w-14 shrink-0 text-right">
                    <span className={`text-sm font-bold tabular-nums ${count > 0 ? color : 'text-slate-700'}`}>
                      {count}
                    </span>
                    {count > 0 && (
                      <span className="ml-1 text-[10px] text-slate-600">{pct}%</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-3">

          {/* Quick actions */}
          <TourTarget id="dash-quick-actions" className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Quick Actions</p>
            <div className="space-y-2">
              {[
                {
                  href: '/iam/create',
                  icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
                  label: 'Create User',
                  sub: 'Add portal account',
                  border: 'border-violet-500/20',
                  bg: 'bg-violet-500/8 hover:bg-violet-500/15',
                  iconBg: 'bg-violet-500/20',
                  iconColor: 'text-violet-400',
                },
                {
                  href: '/iam/managers',
                  icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
                  label: 'Compliance Managers',
                  sub: 'Create & manage managers',
                  border: 'border-rose-500/20',
                  bg: 'bg-rose-500/8 hover:bg-rose-500/15',
                  iconBg: 'bg-rose-500/20',
                  iconColor: 'text-rose-400',
                },
                {
                  href: '/iam/users?status=banned',
                  icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
                  label: 'Banned Accounts',
                  sub: banErr ? 'Migration needed' : `${bannedCount} suspended`,
                  border: 'border-rose-500/20',
                  bg: 'bg-rose-500/8 hover:bg-rose-500/15',
                  iconBg: 'bg-rose-500/20',
                  iconColor: 'text-rose-400',
                },
                {
                  href: '/iam/audit',
                  icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                  label: 'Audit Log',
                  sub: auditErr ? 'Migration needed' : 'View access history',
                  border: 'border-blue-500/20',
                  bg: 'bg-blue-500/8 hover:bg-blue-500/15',
                  iconBg: 'bg-blue-500/20',
                  iconColor: 'text-blue-400',
                },
              ].map(a => (
                <Link key={a.href} href={a.href}
                  className={`flex items-center gap-2.5 rounded-lg border ${a.border} ${a.bg} p-2.5 transition`}>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${a.iconBg}`}>
                    <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${a.iconColor}`} fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{a.label}</p>
                    <p className="text-[10px] text-slate-500">{a.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </TourTarget>

          {/* System status */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-slate-600">System Status</p>
            <div className="space-y-2">
              {[
                { label: 'Auth provider',    value: 'Supabase',       dot: 'bg-emerald-500 animate-pulse' },
                { label: 'IAM migration',    value: iamMigrationNeeded ? 'Pending' : 'Applied', dot: iamMigrationNeeded ? 'bg-amber-500' : 'bg-emerald-500' },
                { label: 'Role enforcement', value: 'Active',         dot: 'bg-emerald-500' },
                { label: 'Total accounts',   value: String(totalNonAdmin), dot: 'bg-blue-500' },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className={`h-1.5 w-1.5 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent activity ───────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Recent Activity</h2>
            <p className="mt-0.5 text-[11px] text-slate-600">Latest IAM events</p>
          </div>
          <Link href="/iam/audit" className="text-xs text-violet-400 transition hover:text-violet-300">
            Full log →
          </Link>
        </div>

        {auditErr ? (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-6 text-center">
            <p className="text-sm text-amber-400/70">
              Audit log unavailable — run the IAM migration SQL to enable it.
            </p>
          </div>
        ) : recentAudit.length === 0 ? (
          <div className="rounded-lg border border-slate-800/60 bg-slate-900/20 px-4 py-8 text-center">
            <svg viewBox="0 0 24 24" className="mx-auto mb-2 h-8 w-8 text-slate-700" fill="none" stroke="currentColor" strokeWidth={1.25}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-slate-600">No activity yet</p>
            <p className="mt-1 text-[11px] text-slate-700">Events appear here as you manage users</p>
          </div>
        ) : (
          <div className="space-y-1">
            {recentAudit.map((entry: any) => (
              <div key={entry.id}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-slate-800/30">
                <span className={`min-w-[72px] shrink-0 rounded-md px-2 py-0.5 text-center text-[10px] font-bold uppercase tracking-wide ${ACTION_BADGE[entry.action] || 'bg-slate-700/50 text-slate-400'}`}>
                  {entry.action.replace(/_/g, ' ')}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-slate-300">
                    <span className="font-semibold text-slate-200">{entry.actor_name || 'System'}</span>
                    <span className="mx-1 text-slate-600">→</span>
                    <span className="text-slate-400">{entry.target_email || '—'}</span>
                    {entry.notes && <span className="text-slate-600"> · {entry.notes}</span>}
                  </p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[10px] text-slate-600">
                  {relativeTime(entry.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
