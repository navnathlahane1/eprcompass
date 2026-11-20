'use client';

import { useState } from 'react';

const DAYS_OF_WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENTS: { date: string; title: string; mode: string; color: string }[] = [];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CalendarPage() {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view,  setView]  = useState<'month' | 'agenda'>('month');

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDayOfMonth(year, month);
  const monthLabel  = new Date(year, month).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  function eventsOnDay(day: number) {
    const d = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    return EVENTS.filter(e => e.date === d);
  }

  function prevMonth() { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); }

  const agendaEvents = EVENTS
    .filter(e => {
      const d = new Date(e.date);
      return d.getFullYear() === year && d.getMonth() === month;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Training Calendar</h1>
          <p className="mt-0.5 text-sm text-slate-500">{EVENTS.length} events this month</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {(['month','agenda'] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-2 text-xs font-medium capitalize transition ${view === v ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                {v}
              </button>
            ))}
          </div>
          <button onClick={prevMonth} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-slate-200">{monthLabel}</span>
          <button onClick={nextMonth} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:bg-slate-800 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {view === 'month' ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-slate-800/80">
            {DAYS_OF_WEEK.map(d => (
              <div key={d} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">{d}</div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {[...Array(firstDay)].map((_, i) => (
              <div key={`e${i}`} className="min-h-[90px] border-b border-r border-slate-800/40 bg-slate-900/20" />
            ))}
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayEvents = eventsOnDay(day);
              return (
                <div key={day} className="min-h-[90px] border-b border-r border-slate-800/40 p-1.5">
                  <div className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
                    {day}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((ev, idx) => (
                      <div key={idx} className={`truncate rounded border px-1 py-0.5 text-[9px] font-medium ${ev.color}`}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-600 pl-1">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {agendaEvents.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-16 text-center">
              <p className="text-sm text-slate-500">No sessions scheduled.</p>
            </div>
          ) : agendaEvents.map((ev, i) => {
            const d = new Date(ev.date);
            return (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
                <div className="flex flex-col items-center justify-center w-12 h-12 shrink-0 rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                  <p className="text-[10px] font-semibold text-indigo-400 uppercase">{d.toLocaleString('en-IN', { month: 'short' })}</p>
                  <p className="text-xl font-bold text-indigo-300 leading-tight">{d.getDate()}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{ev.title}</p>
                  <p className="text-[11px] text-slate-500">{ev.mode}</p>
                </div>
                <div className={`rounded border px-2 py-1 text-[10px] font-medium ${ev.color}`}>{ev.mode}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { label: 'Online Live', color: 'bg-blue-500' },
          { label: 'Classroom',   color: 'bg-amber-500' },
          { label: 'Hybrid',      color: 'bg-violet-500' },
          { label: 'Conference',  color: 'bg-rose-500' },
          { label: 'Educational', color: 'bg-teal-500' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className={`h-2 w-2 rounded-full ${l.color}`} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}
