'use client';

import { useState } from 'react';
import Link from 'next/link';
import TourTarget from '@/components/portal/tour/TourTarget';

interface CalendarEvent {
  clientName: string;
  category: string;
  serviceType: string;
  dueDate: string;
  status: string;
  clientId: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function eventColor(dueDate: string, status: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dueDate);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);
  if (diff < 0 && !['approved', 'completed', 'Certificate Issued'].includes(status?.toLowerCase())) return 'bg-rose-500 text-white';
  if (diff <= 7) return 'bg-amber-400 text-white';
  return 'bg-indigo-500 text-white';
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarClient({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [popover, setPopover] = useState<CalendarEvent | null>(null);

  function prev() {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const e of events) {
    const d = e.dueDate.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(e);
  }

  // Upcoming 60 days
  const cutoff = new Date(today.getTime() + 60 * 86400000);
  const upcoming = events
    .filter(e => {
      const d = new Date(e.dueDate);
      return d >= today && d <= cutoff;
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-slate-900">Deadline Calendar</h1>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition">←</button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-slate-900">{MONTH_NAMES[month]} {year}</span>
          <button onClick={next} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 transition">→</button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Calendar grid */}
        <TourTarget id="calendar-grid" className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-200">
            {DAY_NAMES.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-100 bg-slate-50/50" />;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = eventsByDate[dateStr] || [];
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              return (
                <div key={day} className="min-h-[80px] border-b border-r border-slate-100 p-1">
                  <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-700'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((e, idx) => (
                      <button
                        key={idx}
                        onClick={() => setPopover(e)}
                        className={`w-full rounded px-1 py-0.5 text-left text-[10px] truncate font-medium ${eventColor(e.dueDate, e.status)}`}
                      >
                        {e.clientName}
                      </button>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TourTarget>

        {/* Upcoming sidebar */}
        <TourTarget id="calendar-upcoming" className="w-full lg:w-72 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Upcoming (60 days)</h2>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {upcoming.length === 0 ? (
              <p className="px-4 py-6 text-xs text-slate-400 text-center">No upcoming deadlines.</p>
            ) : (
              upcoming.map((e, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-900 truncate">{e.clientName}</p>
                      <p className="text-[11px] text-slate-500">{e.category}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 shrink-0">{formatDate(e.dueDate)}</span>
                  </div>
                  <Link
                    href={`/partner/clients/${e.clientId}`}
                    className="mt-1 inline-block text-[11px] text-indigo-600 hover:underline"
                  >
                    View →
                  </Link>
                </div>
              ))
            )}
          </div>
        </TourTarget>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-rose-500" /> Overdue</div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-amber-400" /> Due within 7 days</div>
        <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-indigo-500" /> Upcoming</div>
      </div>

      {/* Popover */}
      {popover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setPopover(null)}>
          <div className="w-80 rounded-xl border border-slate-200 bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-900">{popover.clientName}</h3>
              <button onClick={() => setPopover(null)} className="text-slate-400 hover:text-slate-700 text-lg leading-none">×</button>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex gap-2"><dt className="w-24 text-slate-500">Category</dt><dd className="font-medium text-slate-900">{popover.category}</dd></div>
              <div className="flex gap-2"><dt className="w-24 text-slate-500">Service</dt><dd className="font-medium text-slate-900">{popover.serviceType}</dd></div>
              <div className="flex gap-2"><dt className="w-24 text-slate-500">Status</dt><dd className="font-medium text-slate-900">{popover.status}</dd></div>
              <div className="flex gap-2"><dt className="w-24 text-slate-500">Due Date</dt><dd className="font-medium text-slate-900">{formatDate(popover.dueDate)}</dd></div>
            </dl>
            <Link
              href={`/partner/clients/${popover.clientId}`}
              className="mt-4 block w-full rounded-lg bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700 transition"
            >
              View Client
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
