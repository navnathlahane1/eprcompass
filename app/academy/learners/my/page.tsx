'use client';

import { useState } from 'react';

const LEARNER = {
  name: '',
  email: '',
  tier: 'Tier 1',
  tier1Complete: false,
  upgradeOfferDays: 0,
  programs: [] as { name: string; tier: string; progress: number; status: string; sessions: number; completedSessions: number }[],
  upcomingSessions: [] as { title: string; date: string; time: string; host: string; zoom: string }[],
  assignments: {
    pending: [] as { name: string; due: string; program: string }[],
    submitted: [] as { name: string; submittedDate: string; program: string }[],
    graded: [] as { name: string; grade: number; maxGrade: number; program: string; feedback: string }[],
  },
  certificates: [] as { name: string; issued: string; id: string }[],
  payments: [] as { date: string; description: string; amount: number; mode: string; receipt: string }[],
};

type AssignTab = 'pending' | 'submitted' | 'graded';

export default function MyLearnerDashboard() {
  const [assignTab, setAssignTab] = useState<AssignTab>('graded');

  return (
    <div className="space-y-6">
      {/* Upgrade Banner */}
      {LEARNER.tier1Complete && (
        <div className="flex items-center gap-4 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-900/20 to-indigo-900/20 px-5 py-4 flex-wrap">
          <span className="text-2xl">🎉</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-violet-200">You&apos;ve completed Tier 1!</p>
            <p className="text-xs text-violet-400/80">Upgrade to CEPC (Tier 2) at <span className="font-bold text-white">₹500 off</span> — offer expires in {LEARNER.upgradeOfferDays} days</p>
          </div>
          <button className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-sm font-bold text-white hover:bg-violet-500 transition">
            Upgrade to CEPC →
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] px-6 py-5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xl font-bold">
          {LEARNER.name.charAt(0)}
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Welcome back</p>
          <h1 className="text-xl font-bold text-slate-100">{LEARNER.name}</h1>
          <span className="inline-block mt-1 rounded-full border border-blue-500/30 bg-blue-500/15 px-2.5 py-0.5 text-xs font-bold text-blue-300">{LEARNER.tier} Learner</span>
        </div>
      </div>

      {/* Programs */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">My Enrolled Programs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {LEARNER.programs.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-10 text-center text-sm text-slate-600 col-span-2">No enrolled programs yet.</div>
          )}
          {LEARNER.programs.map((prog, i) => {
            const pct = prog.progress;
            const r = 36;
            const circ = 2 * Math.PI * r;
            const offset = circ - (pct / 100) * circ;
            return (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
                {/* Circular progress */}
                <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                  <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
                    <circle cx="40" cy="40" r={r} fill="none"
                      stroke={pct === 100 ? '#10b981' : '#6366f1'}
                      strokeWidth="6"
                      strokeDasharray={circ}
                      strokeDashoffset={offset}
                      strokeLinecap="round" />
                  </svg>
                  <span className={`text-sm font-bold ${pct === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{pct}%</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">{prog.name}</p>
                  <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[9px] font-bold ${prog.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'}`}>{prog.status}</span>
                  <p className="text-[10px] text-slate-500 mt-1">{prog.completedSessions}/{prog.sessions} sessions completed</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Upcoming Sessions</h2>
        <div className="space-y-3">
          {LEARNER.upcomingSessions.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-10 text-center text-sm text-slate-600">No upcoming sessions scheduled.</div>
          )}
          {LEARNER.upcomingSessions.map((s, i) => (
            <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] px-5 py-4 flex-wrap">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                <p className="text-xs text-slate-500">{new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.time} · Host: {s.host}</p>
              </div>
              <a href={s.zoom} target="_blank" rel="noopener noreferrer"
                className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 transition">
                Join Zoom
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Assignments */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">My Assignments</h2>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="flex border-b border-slate-800/80">
            {(['pending', 'submitted', 'graded'] as AssignTab[]).map(t => (
              <button key={t} onClick={() => setAssignTab(t)}
                className={`flex-1 py-3 text-xs font-semibold capitalize transition border-b-2 -mb-px ${assignTab === t ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
                {t} ({LEARNER.assignments[t].length})
              </button>
            ))}
          </div>
          <div className="p-4">
            {assignTab === 'pending' && (
              LEARNER.assignments.pending.length === 0
                ? <p className="text-center text-sm text-slate-600 py-6">No pending assignments. Great work!</p>
                : LEARNER.assignments.pending.map((a, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 mb-2">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{a.name}</p>
                        <p className="text-[10px] text-slate-500">{a.program} · Due: {a.due}</p>
                      </div>
                      <button className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition">Submit</button>
                    </div>
                  ))
            )}
            {assignTab === 'submitted' && (
              LEARNER.assignments.submitted.length === 0
                ? <p className="text-center text-sm text-slate-600 py-6">No submitted assignments.</p>
                : LEARNER.assignments.submitted.map((a, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{a.name}</p>
                    <p className="text-[10px] text-slate-500">{a.program} · Submitted: {new Date(a.submittedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                  </div>
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 text-[9px] font-semibold text-amber-300">Awaiting Grade</span>
                </div>
              ))
            )}
            {assignTab === 'graded' && (
              LEARNER.assignments.graded.length === 0
                ? <p className="text-center text-sm text-slate-600 py-6">No graded assignments yet.</p>
                : LEARNER.assignments.graded.map((a, i) => (
                <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-200">{a.name}</p>
                    <span className={`text-sm font-bold ${a.grade >= 7 ? 'text-emerald-400' : 'text-rose-400'}`}>{a.grade}/{a.maxGrade}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{a.program}</p>
                  <p className="text-xs text-slate-400 mt-1 italic">"{a.feedback}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Certificates */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">My Certificates</h2>
        {LEARNER.certificates.length === 0 && (
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-10 text-center text-sm text-slate-600">No certificates earned yet.</div>
        )}
        {LEARNER.certificates.map((cert, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-200">{cert.name}</p>
              <p className="text-xs text-emerald-500/70">Issued {new Date(cert.issued).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · {cert.id}</p>
            </div>
            <button className="rounded-lg border border-emerald-500/30 px-3 py-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10 transition">
              Download PDF
            </button>
          </div>
        ))}
      </div>

      {/* Payment Receipts */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Payment Receipts</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['Date', 'Description', 'Amount', 'Mode', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {LEARNER.payments.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {LEARNER.payments.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-xs text-slate-200">{p.description}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.mode}</td>
                  <td className="px-4 py-3">
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition">{p.receipt}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
