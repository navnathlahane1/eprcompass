import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function elapsedPct(task: any) {
  if (!task.sla_hours) return null;
  const start = new Date(task.created_at).getTime();
  const end = task.completed_at ? new Date(task.completed_at).getTime() : Date.now();
  const elapsedHours = Math.max(0, (end - start) / (1000 * 60 * 60));
  return Math.min(100, Math.round((elapsedHours / Number(task.sla_hours)) * 100));
}

function groupName(task: any) {
  if (task.status !== 'Done' && task.due_date && new Date(task.due_date).getTime() < Date.now()) return 'Overdue';
  if (!task.due_date) return 'Later';

  const due = new Date(task.due_date);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startTomorrow = startToday + (24 * 60 * 60 * 1000);
  const startWeek = startToday + (7 * 24 * 60 * 60 * 1000);

  if (due.getTime() >= startToday && due.getTime() < startTomorrow) return 'Today';
  if (due.getTime() >= startTomorrow && due.getTime() < startWeek) return 'This Week';
  return 'Later';
}

export default async function MyTasksPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return <div className="p-6 text-sm text-rose-300">Please sign in.</div>;

  const { data: tasks } = await (supabase as any)
    .from('tasks')
    .select('id, title, priority, status, due_date, sla_hours, created_at, completed_at')
    .eq('assigned_to', user.id)
    .neq('status', 'Cancelled')
    .order('due_date', { ascending: true });

  const groups: Record<string, any[]> = { Today: [], 'This Week': [], Overdue: [], Later: [] };
  (tasks || []).forEach((task: any) => {
    const key = groupName(task);
    groups[key].push(task);
  });

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-400">Grouped by due timeline with SLA indicators.</p>
      </div>

      {['Today', 'This Week', 'Overdue', 'Later'].map((group) => (
        <section key={group} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h2 className="text-sm font-semibold text-slate-100">{group}</h2>
          <div className="mt-3 space-y-3">
            {(groups[group] || []).map((task: any) => {
              const pct = elapsedPct(task);
              const red = pct != null && pct > 80 && task.status !== 'Done';
              return (
                <article key={task.id} className="rounded-lg border border-slate-800 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-100">{task.title}</p>
                    <span className="text-xs text-slate-400">{task.priority} · {task.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Due: {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : '-'}</p>

                  {pct != null ? (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
                        <span>SLA progress</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                        <div className={`h-full rounded-full ${red ? 'bg-red-600' : 'bg-blue-600'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
            {(groups[group] || []).length === 0 ? <p className="text-sm text-slate-500">No tasks in this group.</p> : null}
          </div>
        </section>
      ))}
    </div>
  );
}
