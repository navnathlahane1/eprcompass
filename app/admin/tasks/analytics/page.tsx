import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function avgCompletionDays(rows: any[]) {
  const done = (rows || []).filter((r) => r.completed_at);
  if (!done.length) return 0;
  const total = done.reduce((sum, row) => {
    const created = new Date(row.created_at).getTime();
    const completed = new Date(row.completed_at).getTime();
    return sum + Math.max(0, (completed - created) / (1000 * 60 * 60 * 24));
  }, 0);
  return Number((total / done.length).toFixed(1));
}

export default async function TaskAnalyticsPage() {
  const supabase = await createServerComponentClient();

  const [{ data: tasks }, { data: profiles }] = await Promise.all([
    (supabase as any)
      .from('tasks')
      .select('id, title, status, priority, entity_type, assigned_to, sla_hours, created_at, completed_at, due_date')
      .order('created_at', { ascending: false }),
    (supabase as any).from('profiles').select('id, full_name')
  ]);

  const openCount = (tasks || []).filter((t: any) => ['Open', 'In Progress', 'Blocked'].includes(t.status)).length;
  const overdueCount = (tasks || []).filter((t: any) => t.status !== 'Done' && t.due_date && new Date(t.due_date).getTime() < Date.now()).length;
  const avgDays = avgCompletionDays(tasks || []);

  const withSla = (tasks || []).filter((t: any) => t.sla_hours && t.completed_at);
  const slaBreaches = withSla.filter((t: any) => {
    const elapsed = (new Date(t.completed_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60 * 60);
    return elapsed > Number(t.sla_hours);
  }).length;
  const slaBreachRate = withSla.length ? Number(((slaBreaches / withSla.length) * 100).toFixed(1)) : 0;

  const profileMap = new Map<string, string>((profiles || []).map((p: any) => [p.id, p.full_name || p.id]));

  const thisMonthStart = new Date();
  thisMonthStart.setDate(1);
  thisMonthStart.setHours(0, 0, 0, 0);

  const completedByMemberMap = new Map<string, number>();
  (tasks || []).forEach((task: any) => {
    if (!task.completed_at) return;
    if (new Date(task.completed_at).getTime() < thisMonthStart.getTime()) return;
    const key = task.assigned_to || 'Unassigned';
    completedByMemberMap.set(key, (completedByMemberMap.get(key) || 0) + 1);
  });
  const completedByMember: Array<{ name: string; count: number }> = Array.from(completedByMemberMap.entries()).map(([id, count]) => ({
    name: profileMap.get(id) || id,
    count
  }));

  const byEntityMap = new Map<string, { totalDays: number; count: number }>();
  (tasks || []).forEach((task: any) => {
    if (!task.completed_at) return;
    const key = task.entity_type;
    const days = Math.max(0, (new Date(task.completed_at).getTime() - new Date(task.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const prev = byEntityMap.get(key) || { totalDays: 0, count: 0 };
    byEntityMap.set(key, { totalDays: prev.totalDays + days, count: prev.count + 1 });
  });
  const avgByEntity: Array<{ entity: string; avgDays: number }> = Array.from(byEntityMap.entries()).map(([entity, val]) => ({
    entity,
    avgDays: Number((val.totalDays / val.count).toFixed(1))
  }));

  const topOverdue = (tasks || [])
    .filter((t: any) => t.status !== 'Done' && t.due_date && new Date(t.due_date).getTime() < Date.now())
    .map((t: any) => ({ ...t, overdueDays: Math.floor((Date.now() - new Date(t.due_date).getTime()) / (1000 * 60 * 60 * 24)) }))
    .sort((a: any, b: any) => b.overdueDays - a.overdueDays)
    .slice(0, 5);

  const maxMember = Math.max(1, ...completedByMember.map((x) => x.count));
  const maxEntity = Math.max(1, ...avgByEntity.map((x) => x.avgDays));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Task Analytics</h1>
        <p className="mt-1 text-sm text-slate-400">Completion and SLA performance.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Open</p><p className="mt-2 text-2xl font-semibold text-slate-100">{openCount}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Overdue</p><p className="mt-2 text-2xl font-semibold text-slate-100">{overdueCount}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">Avg Completion Days</p><p className="mt-2 text-2xl font-semibold text-slate-100">{avgDays}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-500">SLA Breach Rate %</p><p className="mt-2 text-2xl font-semibold text-slate-100">{slaBreachRate}</p></article>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Tasks Completed per Member (This Month)</h2>
          <div className="mt-3 space-y-2">
            {completedByMember.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400"><span>{row.name}</span><span>{row.count}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.round((row.count / maxMember) * 100)}%` }} /></div>
              </div>
            ))}
            {completedByMember.length === 0 ? <p className="text-sm text-slate-500">No completed tasks this month.</p> : null}
          </div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Avg Days to Complete by Entity</h2>
          <div className="mt-3 space-y-2">
            {avgByEntity.map((row) => (
              <div key={row.entity}>
                <div className="mb-1 flex items-center justify-between text-xs text-slate-400"><span>{row.entity}</span><span>{row.avgDays}</span></div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.round((row.avgDays / maxEntity) * 100)}%` }} /></div>
              </div>
            ))}
            {avgByEntity.length === 0 ? <p className="text-sm text-slate-500">No completed tasks yet.</p> : null}
          </div>
        </article>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold text-slate-100">Top 5 Overdue Tasks</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="py-2 pr-3">Title</th>
                <th className="py-2 pr-3">Priority</th>
                <th className="py-2 pr-3">Entity</th>
                <th className="py-2 pr-3">Assigned To</th>
                <th className="py-2">Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              {topOverdue.map((row: any) => (
                <tr key={row.id} className="border-b border-slate-800/60">
                  <td className="py-2 pr-3 text-slate-200">{row.title}</td>
                  <td className="py-2 pr-3 text-slate-200">{row.priority}</td>
                  <td className="py-2 pr-3 text-slate-200">{row.entity_type}</td>
                  <td className="py-2 pr-3 text-slate-200">{profileMap.get(row.assigned_to) || '-'}</td>
                  <td className="py-2 text-rose-300 font-semibold">{row.overdueDays}</td>
                </tr>
              ))}
              {topOverdue.length === 0 ? <tr><td colSpan={5} className="py-4 text-center text-slate-500">No overdue tasks.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
