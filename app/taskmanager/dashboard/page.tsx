/**
 * /taskmanager/dashboard
 * Server component — renders instantly with real data, no client-side loading.
 */
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildTaskManagerSetupSteps } from '@/components/setup/setupSteps';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'Dashboard | Task Manager' };
export const dynamic  = 'force-dynamic';

function addHours(h: number) { return new Date(Date.now() + h * 3_600_000).toISOString(); }
function relTime(d: string) {
  const diff  = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
function fmtDue(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const TIER_STYLE: Record<string, { dot: string; text: string; label: string }> = {
  critical: { dot: 'bg-rose-500 animate-pulse', text: 'text-rose-400',   label: 'Overdue'   },
  urgent:   { dot: 'bg-orange-500',             text: 'text-orange-400', label: '< 4h'      },
  warning:  { dot: 'bg-amber-500',              text: 'text-amber-400',  label: 'Today'     },
  at_risk:  { dot: 'bg-yellow-500',             text: 'text-yellow-400', label: 'Tomorrow'  },
  ok:       { dot: 'bg-emerald-500',            text: 'text-emerald-400', label: 'On Track' },
  no_sla:   { dot: 'bg-slate-600',              text: 'text-slate-500',  label: 'No SLA'    },
};

const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-rose-400', high: 'text-amber-400', normal: 'text-slate-300', low: 'text-slate-500',
};

export default async function TaskManagerDashboardPage() {
  const actor = await resolveTaskManager();
  if (!actor) redirect('/taskmanager/login');

  const db  = getServiceClient();
  const now = new Date().toISOString();
  const in4h  = addHours(4);
  const in24h = addHours(24);
  const in48h = addHours(48);
  const today = now.split('T')[0];

  // ── 1. portal_tasks ────────────────────────────────────────────────────────
  const { data: ptRaw } = await db
    .from('portal_tasks')
    .select('id, title, task_type, status, priority, due_at, assigned_to, tat_minutes, created_at')
    .not('status', 'in', '("completed","cancelled")')
    .order('due_at', { ascending: true })
    .limit(200);

  const portalTasks = ptRaw ?? [];

  // ── 2. EPR tasks ───────────────────────────────────────────────────────────
  await db.from('client_epr_tasks').update({ status: 'overdue' })
    .eq('status', 'pending').lt('due_date', today);

  const { data: eprRaw } = await db
    .from('client_epr_tasks')
    .select('id, task_name, waste_category, status, priority, due_date, client_id')
    .not('status', 'in', '("completed","skipped","na")')
    .order('due_date', { ascending: true })
    .limit(300);

  const eprTasks = eprRaw ?? [];

  // ── 3. Filings ─────────────────────────────────────────────────────────────
  const { data: filRaw } = await db
    .from('epr_filing_statuses')
    .select('id, client_id, category, current_status, sla_due_at, epr_financial_years(label)')
    .not('current_status', 'in', '("Approved","Certificate Issued","Rejected")')
    .order('sla_due_at', { ascending: true, nullsFirst: false })
    .limit(200);

  const filings = filRaw ?? [];

  // ── 4. Service requests ────────────────────────────────────────────────────
  const { data: srRaw } = await db
    .from('service_requests')
    .select('id, category, status, priority, created_at, updated_at, assigned_to')
    .in('status', ['Submitted','Under Review','Awaiting Pricing','In Progress'])
    .order('created_at', { ascending: true })
    .limit(100);

  const serviceReqs = srRaw ?? [];

  // ── Enrich assignee names ──────────────────────────────────────────────────
  const allAssigneeIds = [
    ...new Set([
      ...portalTasks.map((t: any) => t.assigned_to),
      ...serviceReqs.map((s: any)  => s.assigned_to),
    ].filter(Boolean))
  ];
  const nameMap: Record<string, string> = {};
  if (allAssigneeIds.length > 0) {
    const { data: profiles } = await db
      .from('profiles').select('id, full_name').in('id', allAssigneeIds);
    for (const p of profiles ?? []) nameMap[(p as any).id] = (p as any).full_name || 'Unknown';
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const pt_overdue = portalTasks.filter((t: any) => t.due_at < now).length;
  const pt_urgent  = portalTasks.filter((t: any) => t.due_at >= now && t.due_at < in4h).length;
  const pt_today   = portalTasks.filter((t: any) => t.due_at >= in4h && t.due_at.startsWith(today)).length;

  const epr_overdue = eprTasks.filter((t: any) => t.status === 'overdue').length;
  const epr_today   = eprTasks.filter((t: any) => t.due_date === today && t.status !== 'overdue').length;

  const fil_overdue = filings.filter((f: any) => f.sla_due_at && f.sla_due_at < now).length;
  const fil_urgent  = filings.filter((f: any) => { const s = f.sla_due_at; return s && s >= now && s < in4h; }).length;
  const fil_today   = filings.filter((f: any) => { const s = f.sla_due_at; return s && s >= in4h && s.startsWith(today); }).length;

  const sr_stale = serviceReqs.filter((s: any) => ['Submitted','Under Review'].includes(s.status) && s.updated_at < in48h).length;

  const totalCritical = pt_overdue + epr_overdue + fil_overdue;
  const totalUrgent   = pt_urgent  + fil_urgent;
  const totalWarning  = pt_today   + epr_today + fil_today + sr_stale;

  // ── Assignee health ────────────────────────────────────────────────────────
  const healthMap: Record<string, { total: number; overdue: number; name: string }> = {};
  for (const t of portalTasks as any[]) {
    if (!t.assigned_to) continue;
    if (!healthMap[t.assigned_to]) healthMap[t.assigned_to] = { total: 0, overdue: 0, name: nameMap[t.assigned_to] || 'Unknown' };
    healthMap[t.assigned_to].total++;
    if (t.due_at < now) healthMap[t.assigned_to].overdue++;
  }
  const healthList = Object.entries(healthMap)
    .map(([id, v]) => ({ id, ...v, pct: v.total > 0 ? Math.round(((v.total - v.overdue) / v.total) * 100) : 100 }))
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 8);

  // ── Critical items feed (top 15) ───────────────────────────────────────────
  type FeedItem = { key: string; label: string; detail: string; source: string; tier: string; href: string; time: string | null };
  const criticalFeed: FeedItem[] = [
    ...portalTasks
      .filter((t: any) => t.due_at < now)
      .slice(0, 5)
      .map((t: any) => ({
        key:    `pt-${t.id}`,
        label:  t.title,
        detail: nameMap[t.assigned_to] ? `Assigned to ${nameMap[t.assigned_to]}` : 'Unassigned',
        source: 'Operational Task',
        tier:   'critical',
        href:   '/taskmanager/tasks',
        time:   t.due_at,
      })),
    ...filings
      .filter((f: any) => f.sla_due_at && f.sla_due_at < now)
      .slice(0, 5)
      .map((f: any) => ({
        key:    `fil-${f.id}`,
        label:  f.category,
        detail: `SLA breached · ${f.current_status}`,
        source: 'Filing SLA',
        tier:   'critical',
        href:   '/taskmanager/filings',
        time:   f.sla_due_at,
      })),
    ...eprTasks
      .filter((t: any) => t.status === 'overdue')
      .slice(0, 5)
      .map((t: any) => ({
        key:    `epr-${t.id}`,
        label:  t.task_name,
        detail: `${t.waste_category} EPR task`,
        source: 'EPR Compliance',
        tier:   'critical',
        href:   '/taskmanager/epr-tasks',
        time:   t.due_date,
      })),
  ].slice(0, 15);

  // ── Urgent items feed ──────────────────────────────────────────────────────
  const urgentFeed: FeedItem[] = [
    ...portalTasks
      .filter((t: any) => t.due_at >= now && t.due_at < in4h)
      .slice(0, 5)
      .map((t: any) => ({
        key:    `pt-urg-${t.id}`,
        label:  t.title,
        detail: nameMap[t.assigned_to] ? `Assigned to ${nameMap[t.assigned_to]}` : 'Unassigned',
        source: 'Operational Task',
        tier:   'urgent',
        href:   '/taskmanager/tasks',
        time:   t.due_at,
      })),
    ...filings
      .filter((f: any) => { const s = f.sla_due_at; return s && s >= now && s < in4h; })
      .slice(0, 5)
      .map((f: any) => ({
        key:    `fil-urg-${f.id}`,
        label:  f.category,
        detail: `Filing SLA expires soon · ${f.current_status}`,
        source: 'Filing SLA',
        tier:   'urgent',
        href:   '/taskmanager/filings',
        time:   f.sla_due_at,
      })),
  ].slice(0, 10);

  // ── Workflow funnel ────────────────────────────────────────────────────────
  const [leadsWfRes, proposalsWfRes, filingsWfRes] = await Promise.all([
    db.from('leads').select('id, tc_status'),
    db.from('tc_proposals').select('id, status'),
    db.from('tc_filings').select('id').limit(1),
  ]);
  const allLeadsWf    = leadsWfRes.data    ?? [];
  const allProposals  = proposalsWfRes.data ?? [];
  const wf = {
    leadIn:      allLeadsWf.filter((l: any) => l.tc_status === 'Interested').length,
    proposalOut: allProposals.filter((p: any) => p.status === 'sent').length,
    invoice:     allProposals.filter((p: any) => p.status === 'accepted').length,
    clientOn:    allLeadsWf.filter((l: any) => l.tc_status === 'Converted').length,
    filingDone:  filingsWfRes.error ? 0 : (filingsWfRes.data ?? []).length,
  };

  const { data: tmProfile } = await db.from('profiles').select('full_name, phone').eq('id', actor.id).maybeSingle();
  const { data: completedTask } = await db.from('portal_tasks').select('id').eq('assigned_to', actor.id).eq('status', 'completed').limit(1);

  const tmSetupSteps = buildTaskManagerSetupSteps({
    hasProfile: !!(tmProfile?.full_name && tmProfile?.phone),
    hasPendingTasks: portalTasks.length > 0,
    hasCompletedTask: (completedTask ?? []).length > 0,
  });

  return (
    <div className="space-y-6">
      <TourTarget id="dash-setup-guide">
        <SetupGuideWidget
          steps={tmSetupSteps}
          portalKey={`taskmanager-${actor.id}`}
          accentColor="teal"
          dark={true}
        />
      </TourTarget>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Task Control Centre</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time view across all portals · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Link href="/taskmanager/warnings"
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-orange-500/20 border border-orange-500/30 text-[12px] font-medium text-orange-300 hover:bg-orange-500/30 transition">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Early Warnings
          {totalCritical + totalUrgent > 0 && (
            <span className="ml-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-orange-500 text-[9px] font-bold text-white px-1">
              {totalCritical + totalUrgent}
            </span>
          )}
        </Link>
      </div>

      {/* Severity summary */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Critical / Overdue', val: totalCritical, color: 'text-rose-400',   bg: 'bg-rose-500/10 border-rose-500/30',   dot: 'bg-rose-500', href: '/taskmanager/warnings?tier=critical' },
          { label: 'Urgent (< 4 hours)',  val: totalUrgent,   color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25', dot: 'bg-orange-500', href: '/taskmanager/warnings?tier=urgent' },
          { label: 'Due Today',           val: totalWarning,  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25',  dot: 'bg-amber-500',  href: '/taskmanager/warnings?tier=warning' },
          { label: 'Total Open Tasks',    val: portalTasks.length + eprTasks.filter((t:any)=>t.status!=='completed').length, color: 'text-slate-200', bg: 'bg-slate-800/60 border-slate-700/40', dot: 'bg-slate-500', href: '/taskmanager/tasks' },
        ].map(({ label, val, color, bg, dot, href }) => (
          <Link key={label} href={href}
            className={`rounded-xl border p-4 hover:brightness-110 transition cursor-pointer ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`h-2 w-2 rounded-full ${dot}`} />
              <span className="text-[11px] text-slate-500">{label}</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${color}`}>{val}</div>
          </Link>
        ))}
      </TourTarget>

      {/* Workflow Funnel */}
      <TourTarget id="dash-workflow-funnel" className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="mb-4 text-sm font-semibold text-slate-100">Workflow Pipeline</p>
        <div className="flex flex-col items-center gap-1">
          {([
            { label: 'Lead In',      sub: 'Telecaller qualifies',  count: wf.leadIn,      w: 'w-full',  bg: 'bg-slate-700/80',  text: 'text-slate-100',  border: 'border-slate-600' },
            { label: 'Proposal Out', sub: 'Ops Lead dispatches',   count: wf.proposalOut, w: 'w-[85%]', bg: 'bg-purple-900/60', text: 'text-purple-200', border: 'border-purple-700/50' },
            { label: 'Invoice',      sub: 'Conversion tracked',    count: wf.invoice,     w: 'w-[68%]', bg: 'bg-blue-900/60',   text: 'text-blue-200',   border: 'border-blue-700/50' },
            { label: 'Client On',    sub: 'Onboarding confirmed',  count: wf.clientOn,    w: 'w-[50%]', bg: 'bg-teal-900/60',   text: 'text-teal-200',   border: 'border-teal-700/50' },
            { label: 'Filing Done',  sub: 'Delivery complete',     count: wf.filingDone,  w: 'w-[34%]', bg: 'bg-green-900/60',  text: 'text-green-200',  border: 'border-green-700/50' },
          ] as const).map((stage, i, arr) => {
            const top = arr[0].count;
            const pct = top > 0 ? Math.round((stage.count / top) * 100) : (i === 0 ? 100 : 0);
            return (
              <div key={stage.label} className={stage.w}>
                <div className={`flex items-center justify-between rounded-lg border ${stage.border} ${stage.bg} px-4 py-2.5`}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold text-white tabular-nums">{stage.count}</span>
                    <div>
                      <p className={`text-xs font-semibold ${stage.text}`}>{stage.label}</p>
                      <p className="text-[10px] text-slate-500">{stage.sub}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{pct}%</span>
                </div>
                {i < arr.length - 1 && (
                  <div className="flex justify-center my-0.5">
                    <svg className="h-3 w-3 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12l7 7 7-7"/>
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </TourTarget>

      {/* Per-source stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Operational Tasks', open: portalTasks.length, overdue: pt_overdue, urgent: pt_urgent, href: '/taskmanager/tasks' },
          { label: 'EPR Compliance',    open: eprTasks.length,    overdue: epr_overdue, urgent: epr_today, href: '/taskmanager/epr-tasks', urgentLabel: 'due today' },
          { label: 'Filing SLAs',       open: filings.length,     overdue: fil_overdue, urgent: fil_urgent, href: '/taskmanager/filings' },
          { label: 'Service Requests',  open: serviceReqs.length, overdue: sr_stale,    urgent: 0, href: '/taskmanager/tasks', urgentLabel: 'stale' },
        ].map(s => (
          <Link key={s.label} href={s.href}
            className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 hover:border-slate-700 transition">
            <p className="text-[11px] text-slate-500 mb-2">{s.label}</p>
            <div className="flex items-end gap-3">
              <div>
                <div className="text-2xl font-bold text-slate-200 tabular-nums">{s.open}</div>
                <div className="text-[10px] text-slate-600">open</div>
              </div>
              {s.overdue > 0 && (
                <div>
                  <div className="text-lg font-bold text-rose-400 tabular-nums">{s.overdue}</div>
                  <div className="text-[10px] text-slate-600">overdue</div>
                </div>
              )}
              {s.urgent > 0 && (
                <div>
                  <div className="text-lg font-bold text-orange-400 tabular-nums">{s.urgent}</div>
                  <div className="text-[10px] text-slate-600">{(s as any).urgentLabel || 'urgent'}</div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Critical feed */}
        <TourTarget id="dash-critical-feed" className="lg:col-span-2 rounded-xl border border-rose-500/20 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-500/15">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <h2 className="text-sm font-semibold text-slate-200">Critical & Overdue</h2>
              {totalCritical > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{totalCritical}</span>
              )}
            </div>
            <Link href="/taskmanager/warnings" className="text-xs text-orange-400 hover:text-orange-300 transition">View all →</Link>
          </div>
          {criticalFeed.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-2xl mb-1">✓</div>
              <p className="text-sm font-medium text-emerald-400">No critical or overdue items</p>
              <p className="text-xs text-slate-600 mt-0.5">Everything is on track</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {criticalFeed.map(item => (
                <Link key={item.key} href={item.href} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-800/30 transition">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TIER_STYLE[item.tier]?.dot ?? 'bg-slate-500'}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{item.detail}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded px-1.5 py-0.5">{item.source}</span>
                    {item.time && <p className="text-[10px] text-slate-600 mt-1">{fmtDue(item.time)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TourTarget>

        {/* Urgent feed */}
        <div className="rounded-xl border border-orange-500/20 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-orange-500/15">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              <h2 className="text-sm font-semibold text-slate-200">Urgent (next 4h)</h2>
              {totalUrgent > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-bold text-white">{totalUrgent}</span>
              )}
            </div>
          </div>
          {urgentFeed.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-600">Nothing urgent in the next 4 hours.</div>
          ) : (
            <div className="divide-y divide-slate-800/40">
              {urgentFeed.map(item => (
                <Link key={item.key} href={item.href} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/30 transition">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-200 truncate">{item.label}</p>
                    <p className="text-[11px] text-slate-500">{item.detail}</p>
                    {item.time && <p className="text-[10px] text-orange-400 mt-0.5">Due {fmtDue(item.time)}</p>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assignee health */}
      {healthList.length > 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/60">
            <h2 className="text-sm font-semibold text-slate-200">Assignee Health</h2>
            <p className="text-[11px] text-slate-500">% tasks on time · operational tasks only</p>
          </div>
          <div className="divide-y divide-slate-800/40">
            {healthList.map(h => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-[10px] font-bold text-slate-400">
                  {h.name.split(' ').map((w: string) => w[0]).join('').slice(0,2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200">{h.name}</p>
                  <p className="text-[10px] text-slate-500">{h.total} open · {h.overdue} overdue</p>
                </div>
                {/* Health bar */}
                <div className="hidden sm:flex flex-col items-end gap-1 w-28">
                  <span className={`text-xs font-bold tabular-nums ${h.pct >= 80 ? 'text-emerald-400' : h.pct >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {h.pct}%
                  </span>
                  <div className="w-full h-1.5 rounded-full bg-slate-800">
                    <div className={`h-full rounded-full ${h.pct >= 80 ? 'bg-emerald-500' : h.pct >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${h.pct}%` }} />
                  </div>
                </div>
                {h.pct < 50 && (
                  <span className="shrink-0 text-[10px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded px-1.5 py-0.5">
                    At Risk
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
