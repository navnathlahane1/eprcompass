'use client';

import { useState, useEffect } from 'react';

type Session = { id: string; program: string; date: string; trainer: string; registered: number; present: number; absent: number; mode: string; marked: boolean };
type Participant = { id: string; name: string; org: string; present: boolean };

export default function AttendancePage() {
  const [sessions, setSessions]     = useState<Session[]>([]);
  const [loading, setLoading]       = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [mode, setMode]             = useState<'manual' | 'qr' | 'otp'>('manual');
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  useEffect(() => {
    fetch('/api/academy/sessions')
      .then(r => r.json())
      .then(d => {
        const rows = (d.sessions ?? []).map((s: any) => ({
          id:         s.id,
          program:    s.program,
          date:       s.date,
          trainer:    s.trainer,
          registered: s.registered,
          present:    0,
          absent:     0,
          mode:       s.mode,
          marked:     s.attendance_marked ?? false,
        }));
        setSessions(rows);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  function selectSession(id: string) {
    if (selectedSession === id) { setSelectedSession(null); return; }
    setSelectedSession(id);
    setLoadingParticipants(true);
    fetch(`/api/academy/attendance?sessionId=${id}`)
      .then(r => r.json())
      .then(d => {
        const parts: Participant[] = d.participants ?? [];
        setParticipants(parts);
        setAttendance(Object.fromEntries(parts.map(p => [p.id, p.present])));
        setLoadingParticipants(false);
      })
      .catch(() => setLoadingParticipants(false));
  }

  const toggleP = (id: string) => setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  const presentCount = Object.values(attendance).filter(Boolean).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Attendance Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">Mark and track session attendance</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={mode} onChange={e => setMode(e.target.value as any)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="manual">Manual</option>
            <option value="qr">QR Scan</option>
            <option value="otp">OTP</option>
          </select>
        </div>
      </div>

      {/* Sessions List */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {loading && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">Loading sessions…</div>
        )}
        {!loading && sessions.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No sessions found.</div>
        )}
        {sessions.map(s => {
          const rate = s.registered > 0 && s.marked ? Math.round((s.present / s.registered) * 100) : null;
          return (
            <button key={s.id} onClick={() => selectSession(s.id)}
              className={`text-left rounded-xl border p-4 transition ${selectedSession === s.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/80 bg-[#0c1022] hover:border-slate-700'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-200">{s.program}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{s.date ? new Date(s.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} · {s.trainer} · {s.mode}</p>
                </div>
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${s.marked ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {s.marked ? 'Marked' : 'Pending'}
                </span>
              </div>
              {s.marked ? (
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate ?? 0}%` }} />
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">{s.present}/{s.registered} present {rate !== null ? `(${rate}%)` : ''}</span>
                </div>
              ) : (
                <p className="mt-2 text-[11px] text-amber-400">{s.registered} participants registered — mark attendance</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Attendance Marking Panel */}
      {selectedSession && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Mark Attendance</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {presentCount}/{participants.length} present{participants.length > 0 ? ` · ${Math.round((presentCount / participants.length) * 100)}%` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setAttendance(Object.fromEntries(participants.map(p => [p.id, true])))}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20 transition">
                Mark All Present
              </button>
              <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 transition">
                Save & Generate Evidence
              </button>
            </div>
          </div>

          {mode === 'qr' && (
            <div className="flex items-center justify-center py-8 border-b border-slate-800/60">
              <div className="text-center">
                <div className="mx-auto h-32 w-32 rounded-xl border-2 border-dashed border-indigo-500/30 flex items-center justify-center bg-indigo-500/5">
                  <svg viewBox="0 0 24 24" className="h-12 w-12 text-indigo-500/30" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" /></svg>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-300">QR Code Scanner</p>
                <p className="text-[11px] text-slate-500">Participants scan to mark attendance</p>
                <button className="mt-3 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition">
                  Generate QR Code
                </button>
              </div>
            </div>
          )}

          {loadingParticipants ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading participants…</div>
          ) : participants.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">No registered participants for this session.</div>
          ) : (
            <div className="divide-y divide-slate-800/60">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-bold text-slate-400">
                    {p.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200">{p.name}</p>
                    <p className="text-[11px] text-slate-500">{p.org}</p>
                  </div>
                  <button onClick={() => toggleP(p.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${attendance[p.id] ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'border-slate-700 bg-slate-800/60 text-slate-500 hover:bg-slate-700'}`}>
                    {attendance[p.id] ? (
                      <><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>Present</>
                    ) : 'Absent'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
