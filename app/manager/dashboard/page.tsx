/**
 * /manager/dashboard
 * Compliance manager overview: stats, recent activity, quick actions.
 */
import Link from 'next/link';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';
import { redirect } from 'next/navigation';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildManagerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'Dashboard | Compliance Manager' };
export const dynamic = 'force-dynamic';

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

const STATUS_COLOR: Record<string, string> = {
  'Received':          'bg-blue-500/20 text-blue-300',
  'Under Review':      'bg-amber-500/20 text-amber-300',
  'Clarification':     'bg-orange-500/20 text-orange-300',
  'Approved':          'bg-emerald-500/20 text-emerald-300',
  'Certificate Issued':'bg-teal-500/20 text-teal-300',
  'Rejected':          'bg-rose-500/20 text-rose-300',
  'Pending':           'bg-slate-500/20 text-slate-400',
};

export default async function ManagerDashboardPage() {
  const actor = await resolveManager();
  if (!actor) redirect('/manager/login');

  const db = getAdminClient();

  // Assigned clients — include profile name for the activity feed
  const { data: assignedClients } = await db
    .from('clients')
    .select('id, status, profile_id(company_name, full_name)')
    .eq('assigned_manager_id', actor.id);

  const clientIds = (assignedClients ?? []).map((c: any) => c.id);
  const totalClients = clientIds.length;
  const activeClients = (assignedClients ?? []).filter((c: any) => c.status === 'Active').length;
  const atRiskClients = (assignedClients ?? []).filter((c: any) => c.status === 'At Risk').length;

  // Build client_id → name map (avoids ambiguous profiles embed on filing statuses)
  const clientNameMap: Record<string, string> = {};
  for (const c of assignedClients ?? []) {
    const p = (c as any).profile_id;
    clientNameMap[c.id] = p?.company_name || p?.full_name || 'Unknown';
  }

  // Filing stats
  let pendingFilings = 0, overdueFilings = 0;
  let recentActivity: any[] = [];

  if (clientIds.length > 0) {
    const now = new Date();

    const { data: filings } = await db
      .from('epr_filing_statuses')
      .select('id, current_status, sla_due_at, category, updated_at, client_id, epr_financial_years(label)')
      .in('client_id', clientIds)
      .order('updated_at', { ascending: false })
      .limit(50);

    const all = filings ?? [];
    pendingFilings = all.filter(
      (f: any) => !['Approved', 'Certificate Issued'].includes(f.current_status)
    ).length;
    overdueFilings = all.filter(
      (f: any) => f.sla_due_at && new Date(f.sla_due_at) < now &&
        !['Approved', 'Certificate Issued'].includes(f.current_status)
    ).length;

    recentActivity = all.slice(0, 8).map((f: any) => ({
      id: f.id,
      client_name: clientNameMap[f.client_id] || 'Unknown',
      category: f.category,
      status: f.current_status,
      fy_label: (f.epr_financial_years as any)?.label || '',
      updated_at: f.updated_at,
      sla_due_at: f.sla_due_at,
    }));
  }

  // Docs pending review
  let docsForReview = 0;
  if (clientIds.length > 0) {
    const { count } = await db
      .from('epr_client_documents')
      .select('id', { count: 'exact', head: true })
      .in('client_id', clientIds)
      .eq('status', 'Received');
    docsForReview = count ?? 0;
  }

  // Task summary for this manager
  const now = new Date().toISOString();
  let taskPending = 0, taskOverdue = 0;
  const { data: taskRows } = await db
    .from('portal_tasks')
    .select('id, status, due_at')
    .eq('assigned_to', actor.id)
    .in('status', ['pending', 'in_progress']);

  for (const t of taskRows ?? []) {
    taskPending++;
    if ((t as any).due_at < now) taskOverdue++;
  }

  // Recent tasks (last 5, unfinished first)
  const { data: recentTasks } = await db
    .from('portal_tasks')
    .select('id, title, task_type, status, due_at, created_at, tat_minutes')
    .eq('assigned_to', actor.id)
    .order('due_at', { ascending: true })
    .limit(5);

  // Setup guide data
  const { data: managerProfile } = await db
    .from('profiles')
    .select('full_name, phone')
    .eq('id', actor.id)
    .maybeSingle();
  const { data: completedTaskRow } = await db
    .from('portal_tasks')
    .select('id')
    .eq('assigned_to', actor.id)
    .eq('status', 'done')
    .limit(1);

  const managerSetupSteps = buildManagerSetupSteps({
    hasProfile: !!(managerProfile?.full_name && managerProfile?.phone),
    hasClients: totalClients > 0,
    hasCompletedTask: (completedTaskRow ?? []).length > 0,
    hasChangedPassword: false, // cannot detect server-side; user must self-report
  });

  const stats = [
    {
      label: 'Total Clients',
      value: totalClients,
      sub: 'assigned to you',
      iconPath: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      iconBg: 'bg-teal-500/15',
      iconColor: 'text-teal-400',
      href: '/manager/clients',
    },
    {
      label: 'Active Clients',
      value: activeClients,
      sub: 'in compliance',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-400',
      href: '/manager/clients?status=Active',
    },
    {
      label: 'At Risk',
      value: atRiskClients,
      sub: 'need attention',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-400',
      href: '/manager/clients?status=At Risk',
    },
    {
      label: 'Pending Filings',
      value: pendingFilings,
      sub: overdueFilings > 0 ? `${overdueFilings} overdue` : 'no overdue',
      iconPath: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      iconBg: overdueFilings > 0 ? 'bg-rose-500/15' : 'bg-slate-700/50',
      iconColor: overdueFilings > 0 ? 'text-rose-400' : 'text-slate-400',
      href: '/manager/filings',
    },
    {
      label: 'Docs for Review',
      value: docsForReview,
      sub: 'awaiting review',
      iconPath: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      href: '/manager/clients',
    },
    {
      label: 'Open Tasks',
      value: taskPending,
      sub: taskOverdue > 0 ? `${taskOverdue} overdue` : 'all on time',
      iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      iconBg: taskOverdue > 0 ? 'bg-rose-500/15' : 'bg-violet-500/15',
      iconColor: taskOverdue > 0 ? 'text-rose-400' : 'text-violet-400',
      href: '/manager/tasks',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Welcome back{actor.fullName ? `, ${actor.fullName}` : ''}. Here's your compliance overview.
        </p>
      </div>

      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={managerSetupSteps}
          portalKey={`manager-${actor.id}`}
          accentColor="violet"
          dark={true}
        />
      </TourTarget>

      {/* Stats */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-slate-800/70 bg-[#0c1022] p-4 hover:border-slate-700 hover:bg-slate-800/30 transition"
          >
            <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${s.iconBg}`}>
              <svg viewBox="0 0 24 24" className={`h-4 w-4 ${s.iconColor}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.iconPath} />
              </svg>
            </div>
            <div className="text-2xl font-bold text-slate-100 tabular-nums">{s.value}</div>
            <div className="text-xs font-medium text-slate-300 mt-0.5">{s.label}</div>
            <div className="text-[11px] text-slate-600 mt-0.5">{s.sub}</div>
          </Link>
        ))}
      </TourTarget>

      {/* No clients */}
      {totalClients === 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-amber-400 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm font-semibold text-amber-300">No clients assigned yet</p>
          <p className="text-xs text-slate-500 mt-1">An admin will assign clients to you from the IAM portal.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Recent activity */}
        <TourTarget id="dash-recent-activity" className="lg:col-span-2 rounded-xl border border-slate-800/70 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/70">
            <h2 className="text-sm font-semibold text-slate-200">Recent Filing Activity</h2>
            <Link href="/manager/filings" className="text-xs text-teal-400 hover:text-teal-300 transition">
              View all →
            </Link>
          </div>
          {recentActivity.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-600">No filing activity yet.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{a.client_name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {a.category} {a.fy_label && `· ${a.fy_label}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[a.status] ?? 'bg-slate-700/50 text-slate-400'}`}>
                      {a.status}
                    </span>
                    <span className="text-[10px] text-slate-600">{relativeTime(a.updated_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TourTarget>

        {/* Tasks panel */}
        <div className="rounded-xl border border-slate-800/70 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/70">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-200">My Tasks</h2>
              {taskOverdue > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                  {taskOverdue}
                </span>
              )}
            </div>
            <Link href="/manager/tasks" className="text-xs text-teal-400 hover:text-teal-300 transition">
              View all →
            </Link>
          </div>
          {(recentTasks ?? []).length === 0 ? (
            <div className="px-5 py-6 text-center text-xs text-slate-600">No open tasks.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {(recentTasks ?? []).map((t: any) => {
                const isOverdueTask = t.due_at < now && !['completed','cancelled'].includes(t.status);
                const elapsedMin = Math.floor((Date.now() - new Date(t.created_at).getTime()) / 60000);
                return (
                  <div key={t.id} className={`px-5 py-3 ${isOverdueTask ? 'bg-rose-500/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-slate-200 leading-snug line-clamp-1 flex-1">{t.title}</p>
                      {isOverdueTask ? (
                        <span className="shrink-0 rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300 animate-pulse">
                          ⚠ OVERDUE
                        </span>
                      ) : (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          elapsedMin > 80
                            ? 'bg-amber-500/15 text-amber-300'
                            : 'bg-slate-700/40 text-slate-400'
                        }`}>
                          {elapsedMin < 60 ? `${elapsedMin}m` : `${Math.floor(elapsedMin/60)}h ${elapsedMin%60}m`} / {t.tat_minutes}m
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <TourTarget id="dash-quick-actions" className="rounded-xl border border-slate-800/70 bg-[#0c1022] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-800/70">
            <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
          </div>
          <div className="p-3 space-y-1.5">
            {[
              { label: 'View All My Clients',    href: '/manager/clients',              icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'text-teal-400' },
              { label: 'All Filings',            href: '/manager/filings',             icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-blue-400' },
              { label: 'At-Risk Clients',        href: '/manager/clients?status=At+Risk', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', color: 'text-amber-400' },
              { label: 'Overdue Filings',        href: '/manager/filings?overdue=true', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-rose-400' },
            ].map(({ label, href, icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 hover:bg-slate-800/70 hover:text-slate-200 transition group"
              >
                <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${color} group-hover:opacity-100 opacity-70`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </TourTarget>
      </div>
    </div>
  );
}
