'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const EVENTS: { id: string; title: string; type: string; date: string; venue: string; mode: string; registered: number; capacity: number; fee: number; status: string; speakers: number; sponsors: number }[] = [];

const TYPE_COLORS: Record<string, string> = {
  Summit:       'bg-rose-500/15 text-rose-300',
  Conference:   'bg-violet-500/15 text-violet-300',
  Workshop:     'bg-indigo-500/15 text-indigo-300',
  Webinar:      'bg-blue-500/15 text-blue-300',
  'Awareness Drive': 'bg-emerald-500/15 text-emerald-300',
};

const STATUS_COLORS: Record<string, string> = {
  'Registration Open': 'bg-emerald-500/15 text-emerald-300',
  'Coming Soon':       'bg-amber-500/15 text-amber-300',
  Completed:           'bg-slate-500/15 text-slate-400',
  Cancelled:           'bg-rose-500/15 text-rose-300',
};

export default function EventsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? EVENTS : EVENTS.filter(e => e.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Events & Conferences</h1>
          <p className="mt-0.5 text-sm text-slate-500">{filtered.length} events</p>
        </div>
        <button onClick={() => router.push('/academy/calendar')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Event
        </button>
      </div>

      <div className="flex rounded-lg border border-slate-700 overflow-hidden w-fit">
        {['All','Registration Open','Coming Soon','Completed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-2 text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {filtered.map(ev => {
          const fillPct = ev.capacity > 0 ? Math.round((ev.registered / ev.capacity) * 100) : 0;
          const d = new Date(ev.date);
          return (
            <div key={ev.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
              <div className="flex items-start gap-5">
                {/* Date block */}
                <div className="flex flex-col items-center justify-center w-16 h-16 shrink-0 rounded-xl border border-rose-500/20 bg-rose-500/10">
                  <p className="text-[10px] font-semibold text-rose-400 uppercase">{d.toLocaleString('en-IN', { month: 'short' })}</p>
                  <p className="text-2xl font-bold text-rose-300 leading-tight">{d.getDate()}</p>
                  <p className="text-[9px] text-rose-400/70">{d.getFullYear()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-semibold text-slate-200">{ev.title}</h2>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_COLORS[ev.type] ?? 'bg-slate-700 text-slate-400'}`}>{ev.type}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_COLORS[ev.status]}`}>{ev.status}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {ev.venue}
                    </span>
                    <span>{ev.mode}</span>
                    <span>{ev.speakers} speakers</span>
                    <span>{ev.sponsors} sponsors</span>
                    {ev.fee > 0 ? <span className="text-amber-400 font-semibold">₹{ev.fee.toLocaleString('en-IN')}</span> : <span className="text-emerald-400 font-semibold">Free</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 w-48 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-500">{ev.registered}/{ev.capacity} registered</span>
                    {fillPct >= 90 && <span className="text-[10px] font-bold text-rose-400">Almost full!</span>}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  {ev.status === 'Registration Open' && (
                    <button onClick={() => router.push('/academy/enrollment')} className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">Register</button>
                  )}
                  <button onClick={() => router.push(`/academy/sessions`)} className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Manage</button>
                  {ev.status === 'Completed' && (
                    <button onClick={() => router.push('/academy/certificates/issue')} className="rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-2 text-xs font-medium text-violet-300 hover:bg-violet-500/20 transition">Certificates</button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
