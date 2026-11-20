'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type Session = { id: string; program: string; date: string; time: string; trainer: string; mode: string; platform: string; registered: number; capacity: number; status: string; link: string };

const STATUS_META: Record<string, string> = {
  scheduled: 'bg-indigo-500/15 text-indigo-300',
  ongoing:   'bg-amber-500/15 text-amber-300',
  completed: 'bg-emerald-500/15 text-emerald-300',
  cancelled: 'bg-rose-500/15 text-rose-300',
};

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('All');

  useEffect(() => {
    fetch('/api/academy/sessions')
      .then(r => r.json())
      .then(d => { setSessions(d.sessions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter === 'All' ? sessions : sessions.filter(s => s.status === filter.toLowerCase());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Training Sessions</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${filtered.length} sessions`}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {['All','Scheduled','Ongoing','Completed','Cancelled'].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium transition ${filter === s ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading && (
          <div className="py-12 text-center text-slate-500 text-sm">Loading sessions…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-slate-500 text-sm">No sessions found.</div>
        )}
        {filtered.map(s => {
          const fillPct = s.capacity > 0 ? Math.round((s.registered / s.capacity) * 100) : 0;
          const sessionDate = s.date ? new Date(s.date) : null;
          const statusLabel = s.status.charAt(0).toUpperCase() + s.status.slice(1);
          return (
            <div key={s.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
              <div className="flex items-start gap-4">
                {/* Date block */}
                <div className="flex flex-col items-center justify-center w-14 h-14 shrink-0 rounded-xl border border-indigo-500/20 bg-indigo-500/10">
                  {sessionDate ? (
                    <>
                      <p className="text-[10px] font-semibold text-indigo-400 uppercase">{sessionDate.toLocaleString('en-IN', { month: 'short' })}</p>
                      <p className="text-2xl font-bold text-indigo-300 leading-tight">{sessionDate.getDate()}</p>
                    </>
                  ) : (
                    <p className="text-[10px] text-slate-500">—</p>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-200">{s.program}</p>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_META[s.status] ?? 'bg-slate-700 text-slate-400'}`}>{statusLabel}</span>
                    <span className="rounded px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400">{s.mode}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 flex-wrap text-[11px] text-slate-500">
                    {s.time && <><span>{s.time} IST</span><span>·</span></>}
                    <span>{s.trainer}</span>
                    {s.platform && <><span>·</span><span>{s.platform}</span></>}
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden max-w-[200px]">
                      <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400">{s.registered}/{s.capacity} registered</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {s.status === 'scheduled' && s.link && (
                    <a href={s.link} target="_blank" rel="noopener noreferrer"
                      className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition hover:bg-indigo-500/20">
                      Join Link
                    </a>
                  )}
                  {s.status === 'scheduled' && (
                    <button className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                      Mark Attendance
                    </button>
                  )}
                  {s.status === 'completed' && (
                    <button className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-semibold text-violet-300 transition hover:bg-violet-500/20">
                      Issue Certificates
                    </button>
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
