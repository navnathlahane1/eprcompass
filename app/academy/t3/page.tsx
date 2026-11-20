'use client';

import Link from 'next/link';

const T3_SESSIONS: { id: string; partner: string; partnerId: string; trainer: string; day1: string; day2: string; day3: string; day1Pass: boolean | null; day2Pass: boolean | null; day3Pass: boolean | null; overall: string; certId: string | null; issued: string | null; expiry: string | null }[] = [];

const RENEWALS: { partner: string; certId: string; expiry: string; daysLeft: number }[] = [];

const STATUS_STYLE: Record<string, string> = {
  Certified:   'bg-emerald-500/15 text-emerald-400',
  Scheduled:   'bg-blue-500/15 text-blue-300',
  'In Progress': 'bg-amber-500/15 text-amber-300',
  Failed:      'bg-red-500/15 text-red-400',
};

function DayDot({ pass }: { pass: boolean | null }) {
  if (pass === null) return <div className="h-2.5 w-2.5 rounded-full bg-slate-700" title="Pending" />;
  return <div className={`h-2.5 w-2.5 rounded-full ${pass ? 'bg-emerald-500' : 'bg-red-500'}`} title={pass ? 'Pass' : 'Fail'} />;
}

export default function T3Page() {
  const certified = T3_SESSIONS.filter(s => s.overall === 'Certified').length;
  const scheduled = T3_SESSIONS.filter(s => s.overall === 'Scheduled').length;
  const expiringSoon = RENEWALS.filter(r => r.daysLeft < 180).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">T3 Train-the-Trainer Certification</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage the 3-day T3 certification program for partner trainers.</p>
        </div>
        <Link href="/academy/t3/schedule"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Schedule T3 Program
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total T3 Sessions',    value: T3_SESSIONS.length, color: 'text-indigo-400'  },
          { label: 'Certified Partners',   value: certified,           color: 'text-emerald-400' },
          { label: 'Scheduled / In Queue', value: scheduled,           color: 'text-blue-400'    },
          { label: 'Expiring Within 6mo',  value: expiringSoon,        color: 'text-amber-400'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* What is T3 */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
        <h2 className="text-sm font-semibold text-indigo-300 mb-2">About the T3 Program</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs text-slate-400">
          <div>
            <p className="font-semibold text-slate-200 mb-1">Day 1 — EPR Mastery</p>
            <p>CPCB portal walkthrough, all 4 EPR regulatory categories (Plastic, E-Waste, Battery, Tyre), PRO ecosystem, annual returns. Assessment: 10-question test (pass ≥7/10).</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200 mb-1">Day 2 — Pedagogy & Delivery</p>
            <p>Adult learning principles, teaching the CPCB portal live, case study facilitation, learner Q&A management, 30-min microlesson delivery. Delivery Rubric scored by trainer.</p>
          </div>
          <div>
            <p className="font-semibold text-slate-200 mb-1">Day 3 — Platform & Assessment</p>
            <p>LMS orientation, assignment grading, first batch planning, final 20-question test (≥70%), 15-min live demo. Certificate issued within 24 hrs of pass.</p>
          </div>
        </div>
        <p className="mt-3 text-[10px] text-indigo-400">T3 certification is valid for 2 years. Free annual update workshop included. Fee: ₹4,999 (waived for first-time partners).</p>
      </div>

      {/* Sessions Table */}
      <div className="rounded-xl border border-slate-800/80 overflow-hidden">
        <div className="border-b border-slate-800/80 bg-slate-900/40 px-5 py-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">All T3 Sessions</h2>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60 bg-slate-900/20">
              {['Partner', 'Partner ID', 'Day 1', 'Day 2', 'Day 3', 'Days', 'Trainer', 'Status', 'Cert ID', 'Expiry', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {T3_SESSIONS.length === 0 ? (
              <tr><td colSpan={11} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : T3_SESSIONS.map(s => (
              <tr key={s.id} className="hover:bg-white/[0.015] transition">
                <td className="px-4 py-3 font-medium text-slate-200">{s.partner}</td>
                <td className="px-4 py-3 font-mono text-slate-500">{s.partnerId}</td>
                <td className="px-4 py-3 text-slate-500">{s.day1}</td>
                <td className="px-4 py-3 text-slate-500">{s.day2}</td>
                <td className="px-4 py-3 text-slate-500">{s.day3}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <DayDot pass={s.day1Pass} />
                    <DayDot pass={s.day2Pass} />
                    <DayDot pass={s.day3Pass} />
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-500">{s.trainer}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${STATUS_STYLE[s.overall] ?? 'bg-slate-700 text-slate-400'}`}>
                    {s.overall}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-slate-500 text-[10px]">{s.certId ?? '—'}</td>
                <td className="px-4 py-3 text-slate-500">{s.expiry ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/academy/t3/${s.id}`}
                    className="rounded px-2 py-1 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Renewal Alerts */}
      {RENEWALS.length > 0 && (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Upcoming Renewals</h2>
          {RENEWALS.map(r => (
            <div key={r.certId} className="flex items-center justify-between gap-4 rounded-lg border border-slate-800/60 bg-slate-900/30 px-4 py-2.5">
              <div>
                <p className="text-xs font-medium text-slate-200">{r.partner}</p>
                <p className="text-[10px] text-slate-500">{r.certId} · Expires {r.expiry}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${r.daysLeft < 90 ? 'text-red-400' : r.daysLeft < 180 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {r.daysLeft} days left
                </span>
                <button className="rounded px-2 py-1 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition">
                  Schedule Renewal
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
