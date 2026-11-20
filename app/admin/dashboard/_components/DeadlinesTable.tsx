import Link from 'next/link';
import { ArrowUpRight, CalendarDays } from 'lucide-react';

type DeadlineRow = {
  id: string;
  client_name: string;
  service_type: string;
  waste_category: string;
  due_date: string;
  days_left: number;
  assigned_to: string;
};

function daysClass(daysLeft: number) {
  if (daysLeft < 3) return 'bg-rose-50 text-rose-700';
  if (daysLeft <= 7) return 'bg-amber-50 text-amber-800';
  return 'bg-amber-50 text-amber-800';
}

export default function DeadlinesTable({ rows }: { rows: DeadlineRow[] }) {
  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-sm font-semibold text-zinc-900">Upcoming deadlines</h2><p className="mt-1 text-xs text-zinc-500">Next 14 days</p></div>
        <Link href="/admin/service-requests" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">All requests<ArrowUpRight className="h-3.5 w-3.5" /></Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-xs">
          <caption className="sr-only">Client service deadlines in the next fourteen days</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-left text-zinc-500">
              <th className="px-2 py-2">Client</th>
              <th className="px-2 py-2">Service</th>
              <th className="px-2 py-2">Category</th>
              <th className="px-2 py-2">Due Date</th>
              <th className="px-2 py-2">Days Left</th>
              <th className="px-2 py-2">Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {!rows.length && <tr><td colSpan={6} className="py-10 text-center text-zinc-500"><CalendarDays className="mx-auto mb-2 h-6 w-6 text-zinc-400" />No upcoming deadlines to display.</td></tr>}
            {rows.slice(0, 10).map((row) => (
              <tr key={row.id} className="border-b border-zinc-100 transition hover:bg-white">
                <td className="px-2 py-2 text-zinc-900">{row.client_name}</td>
                <td className="px-2 py-2 text-zinc-700">{row.service_type}</td>
                <td className="px-2 py-2 text-zinc-700">{row.waste_category}</td>
                <td className="px-2 py-2 text-zinc-700">{row.due_date}</td>
                <td className="px-2 py-2">
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${daysClass(Number(row.days_left || 0))}`}>
                    {row.days_left < 0 ? `${Math.abs(row.days_left)}d overdue` : row.days_left === 0 ? 'Today' : `${row.days_left}d`}
                  </span>
                </td>
                <td className="px-2 py-2 text-zinc-700">{row.assigned_to}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
