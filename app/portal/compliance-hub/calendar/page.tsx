'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FILING_TYPE_LABELS, URGENCY_CONFIG, getUrgency } from '@/lib/complianceKnowledge/constants';

type CalEvent = {
  id: string;
  type: 'deadline' | 'task';
  date: string;
  title: string;
  filing_type?: string;
  task_type?: string;
  filing_status?: string;
  task_status?: string;
  priority?: string;
  is_overdue?: boolean;
  days_remaining?: number;
  framework?: { name?: string; short_name?: string; compliance_countries?: { flag_emoji?: string } };
  cycle?: { cycle_label?: string };
};

type CalendarData = {
  events: CalEvent[];
  byDate: Record<string, CalEvent[]>;
  month: { year: number; month: number };
};

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function ComplianceCalendarPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calData, setCalData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
      const res = await fetch(`/api/portal/compliance-hub/calendar?year=${year}&month=${month}`, { signal: controller.signal });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || 'Calendar could not be loaded');
        if (!controller.signal.aborted) { setCalData(d); setError(''); }
      } catch (error) {
        if (!controller.signal.aborted) { setCalData(null); setError(error instanceof Error ? error.message : 'Calendar could not be loaded'); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [year, month, reload]);

  function prevMonth() {
    setLoading(true);
    setCalData(null);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
    setSelectedDate(null);
  }

  function nextMonth() {
    setLoading(true);
    setCalData(null);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
    setSelectedDate(null);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  const today = new Date().toISOString().split('T')[0];

  function dateStr(day: number) {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const selectedEvents = selectedDate ? (calData?.byDate?.[selectedDate] || []) : [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/portal/compliance-hub" className="text-sm text-slate-500 hover:text-slate-800 transition">
            ← Compliance Hub
          </Link>
        </div>
        <h1 className="text-xl font-bold text-slate-900">Compliance Calendar</h1>
        <div className="text-sm text-slate-400">{loading ? 'Loading...' : error ? 'Unavailable' : `${calData?.events.length || 0} events this month`}</div>
      </div>
      {error && !loading && <div role="alert" className="text-sm text-red-700">
        <p>{error}</p>
        <button onClick={() => { setLoading(true); setReload(value => value + 1); }} className="mt-2 underline">Retry</button>
      </div>}

      {!error && <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
        {/* Calendar */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {/* Month Nav */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <button
              onClick={prevMonth}
              className="rounded-lg p-2 hover:bg-slate-100 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <p className="font-semibold text-slate-900">{MONTHS[month - 1]} {year}</p>
            <button
              onClick={nextMonth}
              className="rounded-lg p-2 hover:bg-slate-100 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {DAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-400">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Empty cells for first week */}
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[80px] border-b border-r border-slate-50 p-1" />
              ))}
              {/* Days */}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const ds = dateStr(day);
                const events = calData?.byDate?.[ds] || [];
                const isToday = ds === today;
                const isSelected = ds === selectedDate;
                const hasOverdue = events.some(e => e.is_overdue);
                const hasCritical = events.some(e => e.type === 'deadline' && e.days_remaining !== undefined && e.days_remaining <= 7 && !e.is_overdue);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : ds)}
                    className={`relative min-h-[80px] border-b border-r border-slate-50 p-1.5 text-left transition hover:bg-slate-50 ${
                      isSelected ? 'bg-teal-50 border-teal-200' : ''
                    }`}
                  >
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                      isToday ? 'bg-teal-600 text-white' :
                      isSelected ? 'bg-teal-100 text-teal-700' :
                      'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    {/* Event dots */}
                    <div className="mt-1 space-y-0.5">
                      {events.slice(0, 3).map(ev => (
                        <div
                          key={ev.id}
                          className={`truncate rounded px-1 py-0.5 text-[9px] font-medium leading-tight ${
                            ev.type === 'deadline'
                              ? ev.is_overdue ? 'bg-red-100 text-red-700'
                              : ev.days_remaining !== undefined && ev.days_remaining <= 7 ? 'bg-red-100 text-red-700'
                              : ev.days_remaining !== undefined && ev.days_remaining <= 15 ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                              : ev.task_status === 'completed' ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {ev.framework?.compliance_countries?.flag_emoji}{' '}
                          {ev.title.length > 15 ? ev.title.substring(0, 15) + '…' : ev.title}
                        </div>
                      ))}
                      {events.length > 3 && (
                        <p className="text-[9px] text-slate-400 pl-1">+{events.length - 3} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Selected Date Details */}
        <div className="space-y-4">
          {/* Legend */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Legend</p>
            <div className="space-y-1.5">
              <LegendItem color="bg-red-100 text-red-700" label="Critical deadline (≤7 days)" />
              <LegendItem color="bg-orange-100 text-orange-700" label="Upcoming deadline (≤15 days)" />
              <LegendItem color="bg-blue-100 text-blue-700" label="Scheduled deadline" />
              <LegendItem color="bg-slate-100 text-slate-600" label="Task due" />
              <LegendItem color="bg-green-100 text-green-700" label="Completed / Filed" />
            </div>
          </div>

          {/* Selected date events */}
          {selectedDate ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900 mb-3">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              {selectedEvents.length === 0 ? (
                <p className="text-xs text-slate-400">No events on this date.</p>
              ) : (
                <div className="space-y-3">
                  {selectedEvents.map(ev => (
                    <EventDetail key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-400">Click a date to see events</p>
            </div>
          )}

          {/* Month Summary */}
          {calData && calData.events.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-3">Month Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total events</span>
                  <span className="font-medium">{calData.events.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deadlines</span>
                  <span className="font-medium">{calData.events.filter(e => e.type === 'deadline').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tasks</span>
                  <span className="font-medium">{calData.events.filter(e => e.type === 'task').length}</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>Overdue</span>
                  <span className="font-medium">{calData.events.filter(e => e.is_overdue).length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>}
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${color}`}>●</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

function EventDetail({ event }: { event: CalEvent }) {
  const isDeadline = event.type === 'deadline';
  const filed = ['submitted', 'approved'].includes(event.filing_status || '');
  const urgency = event.days_remaining !== undefined ? getUrgency(event.days_remaining) : 'low';
  const uc = URGENCY_CONFIG[urgency];

  return (
    <div className={`rounded-lg border p-3 text-xs ${
      filed ? 'border-green-100 bg-green-50' :
      event.is_overdue ? 'border-red-100 bg-red-50' :
      isDeadline ? uc.color :
      'border-slate-100 bg-slate-50'
    }`}>
      <div className="flex items-start justify-between gap-1">
        <div>
          <p className="font-semibold text-slate-800">{event.title}</p>
          {isDeadline && event.filing_type && (
            <p className="text-slate-500 mt-0.5">
              {FILING_TYPE_LABELS[event.filing_type as keyof typeof FILING_TYPE_LABELS] || event.filing_type}
            </p>
          )}
          {event.framework?.compliance_countries?.flag_emoji && (
            <p className="text-slate-400 mt-0.5">
              {event.framework.compliance_countries.flag_emoji}{' '}
              {event.framework.short_name || event.framework.name}
            </p>
          )}
          {event.cycle?.cycle_label && (
            <p className="text-slate-400">{event.cycle.cycle_label}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {filed && <span className="text-green-600 font-medium">Filed</span>}
          {event.is_overdue && !filed && <span className="text-red-600 font-medium">Overdue</span>}
          {!filed && !event.is_overdue && event.filing_status && (
            <span className="text-slate-500 capitalize">{event.filing_status}</span>
          )}
        </div>
      </div>
    </div>
  );
}
