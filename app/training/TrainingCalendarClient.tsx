'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function formatTimeRange(start: string, end: string) {
  const s = start?.slice(0, 5) || '--:--';
  const e = end?.slice(0, 5) || '--:--';
  return `${s} - ${e}`;
}

function monthKey(dateString: string) {
  return (dateString || '').slice(0, 7);
}

export default function TrainingCalendarClient({ initialRows }: { initialRows: any[] }) {
  const [filters, setFilters] = useState({ category: 'All', delivery: 'All', month: 'All' });

  const options = useMemo(() => {
    const categories = Array.from(new Set((initialRows || []).map((r) => r.program?.category).filter(Boolean))).sort();
    const deliveries = Array.from(new Set((initialRows || []).map((r) => r.program?.delivery).filter(Boolean))).sort();
    const months = Array.from(new Set((initialRows || []).map((r) => monthKey(r.session_date)).filter(Boolean))).sort();
    return { categories, deliveries, months };
  }, [initialRows]);

  const rows = useMemo(() => {
    return (initialRows || []).filter((row) => {
      const categoryOk = filters.category === 'All' || row.program?.category === filters.category;
      const deliveryOk = filters.delivery === 'All' || row.program?.delivery === filters.delivery;
      const monthOk = filters.month === 'All' || monthKey(row.session_date) === filters.month;
      return categoryOk && deliveryOk && monthOk;
    });
  }, [initialRows, filters]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h1 className="text-2xl font-semibold text-gray-900">Training Calendar</h1>
        <p className="mt-1 text-sm text-gray-600">Upcoming academy sessions for the next 60 days.</p>
      </div>

      <section className="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 md:grid-cols-3">
        <select value={filters.category} onChange={(e) => setFilters((p) => ({ ...p, category: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Category: All</option>
          {options.categories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select value={filters.delivery} onChange={(e) => setFilters((p) => ({ ...p, delivery: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Delivery: All</option>
          {options.deliveries.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <select value={filters.month} onChange={(e) => setFilters((p) => ({ ...p, month: e.target.value }))} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="All">Month: All</option>
          {options.months.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const seatsLeft = Math.max(0, Number(row.seats_total || 0) - Number(row.seats_booked || 0));

          return (
            <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{row.program?.category}</p>
              <h3 className="mt-1 text-lg font-semibold text-gray-900">{row.program?.title}</h3>
              <p className="mt-2 text-sm text-gray-700">{row.session_date} | {formatTimeRange(row.start_time, row.end_time)}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">{row.program?.delivery}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{row.platform}</span>
              </div>

              <p className="mt-3 text-sm text-gray-700">Fee: <span className="font-semibold">{formatINR(Number(row.program?.fee_inr || 0))}</span></p>
              <p className="text-sm text-gray-700">Seats Left: <span className="font-semibold">{seatsLeft}</span></p>

              <div className="mt-4 flex items-center gap-2">
                <Link href={`/training/${row.program?.slug}?session=${row.id}#register`} className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                  Register
                </Link>
                <a href={`/api/calendar/${row.id}`} className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Sync to Calendar
                </a>
              </div>
            </article>
          );
        })}
      </section>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
          No sessions found for the selected filters.
        </div>
      ) : null}
    </main>
  );
}
