type ActivityRow = {
  id: string;
  entity_type: string;
  entity_name: string;
  type: string;
  summary: string;
  time_ago: string;
};

function dotClass(type: string) {
  if (type === 'Call') return 'bg-blue-500';
  if (type === 'Email') return 'bg-indigo-500';
  if (type === 'WhatsApp') return 'bg-green-500';
  if (type === 'Meeting') return 'bg-purple-500';
  if (type === 'Contract') return 'bg-amber-500';
  return 'bg-slate-600';
}

export default function ActivityFeed({ rows }: { rows: ActivityRow[] }) {
  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <h2 className="mb-4 text-sm font-semibold text-zinc-900">Recent activity</h2>
      {!rows.length && <p className="py-10 text-center text-xs text-zinc-500">No recent activity to display.</p>}
      <ul className="max-h-96 space-y-1 overflow-y-auto">
        {rows.slice(0, 15).map((row) => (
          <li key={row.id} className="flex items-start gap-3 border-b border-zinc-100 py-3">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${dotClass(row.type)}`} />
            <span className="min-w-0 flex-1 break-words text-xs leading-5 text-zinc-700">
              <span className="font-semibold text-zinc-900">{row.entity_name}</span>
              {' '}· {row.summary}
            </span>
            <span className="shrink-0 pt-0.5 text-[11px] text-zinc-500">{row.time_ago}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
