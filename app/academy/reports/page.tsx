'use client';

import { useState } from 'react';

const REPORT_TYPES = [
  { id: 'training',   title: 'Training Report',          desc: 'Programs conducted, sessions, attendance, completion rates',  icon: '📚', color: 'border-indigo-500/30 bg-indigo-500/5' },
  { id: 'compliance', title: 'EPR Compliance Report',    desc: 'Awareness activities by waste category, stakeholder coverage', icon: '🛡️', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'institution',title: 'Institution Report',       desc: 'Student participation, academic collaborations, certifications',icon: '🏫', color: 'border-teal-500/30 bg-teal-500/5' },
  { id: 'corporate',  title: 'Corporate Training Report',desc: 'Employee training, compliance readiness by organization',      icon: '🏢', color: 'border-violet-500/30 bg-violet-500/5' },
  { id: 'revenue',    title: 'Revenue Report',           desc: 'Training revenue by program, client, and geography',          icon: '💰', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'certificate',title: 'Certification Report',     desc: 'Certificates issued, pending, expiring, by category',        icon: '🏆', color: 'border-yellow-500/30 bg-yellow-500/5' },
];

const METRICS = [
  { label: 'Programs Conducted', value: '0',  change: '—', up: true,  color: 'text-indigo-400'  },
  { label: 'Total Participants', value: '0',  change: '—', up: true,  color: 'text-emerald-400' },
  { label: 'Certs Issued',       value: '0',  change: '—', up: true,  color: 'text-violet-400'  },
  { label: 'Stakeholders Reached',value: '0', change: '—', up: true,  color: 'text-teal-400'    },
  { label: 'Total Revenue',      value: '₹0', change: '—', up: true,  color: 'text-amber-400'   },
  { label: 'Cancelled Programs', value: '0',  change: '—', up: false, color: 'text-rose-400'    },
];

const RECENT_REPORTS: { title: string; generated: string; by: string; type: string; pages: number }[] = [];

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('2026-01-01');
  const [dateTo,   setDateTo]   = useState('2026-06-30');
  const [generating, setGenerating] = useState<string | null>(null);

  async function generate(id: string) {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 1500));
    setGenerating(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Reports & Analytics</h1>
          <p className="mt-0.5 text-sm text-slate-500">Generate compliance evidence and performance reports</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          <span className="text-slate-600 text-xs">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {METRICS.map(m => (
          <div key={m.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className={`text-2xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
            <p className="mt-0.5 text-[10px] text-slate-600 leading-tight">{m.label}</p>
            <p className={`mt-1 text-[10px] font-semibold ${m.up ? 'text-emerald-400' : 'text-rose-400'}`}>
              {m.change} vs prev period
            </p>
          </div>
        ))}
      </div>

      {/* Report Type Cards */}
      <div>
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Generate Report</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REPORT_TYPES.map(rt => (
            <div key={rt.id} className={`rounded-xl border p-5 ${rt.color} transition hover:brightness-110`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{rt.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200">{rt.title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{rt.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => generate(rt.id)} disabled={generating === rt.id}
                  className="flex-1 rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
                  {generating === rt.id ? 'Generating…' : 'Generate PDF'}
                </button>
                <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                  CSV
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800/80 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Recent Reports</h2>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 transition">View all</button>
        </div>
        <div className="divide-y divide-slate-800/60">
          {RECENT_REPORTS.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
          )}
          {RECENT_REPORTS.map(r => (
            <div key={r.title} className="flex items-center gap-4 px-5 py-3 transition hover:bg-slate-800/20">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{r.type} · {r.pages} pages · Generated by {r.by}</p>
              </div>
              <p className="text-[11px] text-slate-500 shrink-0">
                {new Date(r.generated).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
              <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition shrink-0">
                Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
