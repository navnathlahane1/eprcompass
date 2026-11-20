import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

type Props = {
  entityType: 'client' | 'lead' | 'partner' | 'recycler' | 'cepc' | 'general';
  entityId: string;
};

function priorityScore(priority: string) {
  if (priority === 'Urgent') return 4;
  if (priority === 'High') return 3;
  if (priority === 'Medium') return 2;
  return 1;
}

export default async function TaskWidget({ entityType, entityId }: Props) {
  const supabase = await createServerComponentClient();

  const { data: tasks } = await (supabase as any)
    .from('tasks')
    .select('id, title, priority, due_date, status')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .neq('status', 'Done')
    .neq('status', 'Cancelled')
    .order('due_date', { ascending: true })
    .limit(100);

  const sorted = [...(tasks || [])].sort((a: any, b: any) => {
    const score = priorityScore(b.priority) - priorityScore(a.priority);
    if (score !== 0) return score;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  const topThree = sorted.slice(0, 3);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Tasks</h3>
          <p className="text-xs text-gray-600">Open: {(tasks || []).length}</p>
        </div>
        <Link href={`/admin/tasks?entityType=${entityType}&entityId=${entityId}`} className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50">
          Add Task
        </Link>
      </div>

      <div className="mt-3 space-y-2">
        {topThree.map((task: any) => (
          <article key={task.id} className="rounded-md border border-gray-200 p-2 text-xs">
            <p className="font-semibold text-gray-900">{task.title}</p>
            <p className="mt-1 text-gray-600">{task.priority} · {task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'No due date'}</p>
          </article>
        ))}
        {topThree.length === 0 ? <p className="text-xs text-gray-500">No open tasks for this entity.</p> : null}
      </div>
    </section>
  );
}
