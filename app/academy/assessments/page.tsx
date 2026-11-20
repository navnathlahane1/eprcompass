'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type AssessType = 'MCQ' | 'Assignment' | 'Final Exam' | 'Day Assessment';

interface Assessment {
  id: string;
  title: string;
  program: 'Tier 1' | 'Tier 2' | 'Tier 3';
  type: AssessType;
  created: string;
  submissions: number;
  passRate: number;
  status: 'Published' | 'Draft';
}

const ASSESSMENTS: Assessment[] = [];

const TYPE_STYLE: Record<AssessType, string> = {
  'MCQ':            'bg-blue-500/15 text-blue-300',
  'Assignment':     'bg-violet-500/15 text-violet-300',
  'Final Exam':     'bg-rose-500/15 text-rose-300',
  'Day Assessment': 'bg-amber-500/15 text-amber-300',
};

const PROGRAM_STYLE: Record<string, string> = {
  'Tier 1': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  'Tier 2': 'bg-violet-500/10 text-violet-400 border-violet-500/30',
  'Tier 3': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

function FilterBar({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-slate-600 uppercase">{label}:</span>
      <div className="flex rounded-lg border border-slate-700 overflow-hidden">
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)}
            className={`px-2.5 py-1.5 text-[10px] font-medium transition ${value === o ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function AssessmentsPage() {
  const router = useRouter();
  const [programF, setProgramF] = useState('All');
  const [typeF, setTypeF] = useState('All');

  const filtered = ASSESSMENTS.filter(a => {
    if (programF !== 'All' && a.program !== programF) return false;
    if (typeF !== 'All' && a.type !== typeF) return false;
    return true;
  });

  const published = ASSESSMENTS.filter(a => a.status === 'Published');
  const avgPassRate = published.length > 0 ? Math.round(published.reduce((s, a) => s + a.passRate, 0) / published.length) : 0;
  const pendingGrading = 0;
  const dueThisWeek = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Assessment Dashboard</h1>
          <p className="mt-0.5 text-sm text-slate-500">{ASSESSMENTS.length} assessments across Tier 1, 2 & 3</p>
        </div>
        <Link href="/academy/assessments/create"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Assessment
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Assessments',  value: '0',                 sub: 'across all tiers',        color: 'text-indigo-400'  },
          { label: 'Due This Week',       value: '0',                sub: 'deadlines approaching', color: 'text-amber-400'   },
          { label: 'Pending Grading',     value: '0',                sub: 'awaiting review',   color: 'text-rose-400'    },
          { label: 'Avg Pass Rate',       value: `${avgPassRate}%`,   sub: 'across published tests',  color: 'text-emerald-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="flex gap-2 flex-wrap">
        <Link href="/academy/assessments/grades"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
          Grade Book Matrix
        </Link>
        <button onClick={() => router.push('/academy/assessments/grades')} className="flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/15 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          Grade Pending ({pendingGrading})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterBar label="Program" options={['All', 'Tier 1', 'Tier 2', 'Tier 3']} value={programF} onChange={setProgramF} />
        <FilterBar label="Type" options={['All', 'MCQ', 'Assignment', 'Final Exam', 'Day Assessment']} value={typeF} onChange={setTypeF} />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Assessment Title', 'Program', 'Type', 'Created', 'Submissions', 'Pass Rate', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            )}
            {filtered.map(a => (
              <tr key={a.id} className="hover:bg-white/[0.02] transition">
                <td className="px-4 py-3 text-xs font-semibold text-slate-200 max-w-[220px] truncate">{a.title}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${PROGRAM_STYLE[a.program]}`}>{a.program}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${TYPE_STYLE[a.type]}`}>{a.type}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(a.created).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</td>
                <td className="px-4 py-3 text-xs text-slate-300 text-center">{a.submissions}</td>
                <td className="px-4 py-3">
                  {a.submissions > 0 ? (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-14 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${a.passRate >= 75 ? 'bg-emerald-500' : a.passRate >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          style={{ width: `${a.passRate}%` }} />
                      </div>
                      <span className={`text-[10px] font-semibold ${a.passRate >= 75 ? 'text-emerald-400' : a.passRate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{a.passRate}%</span>
                    </div>
                  ) : <span className="text-[10px] text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${a.status === 'Published' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700 text-slate-500'}`}>{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  <Link href={`/academy/assessments/${a.id}`}
                    className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
