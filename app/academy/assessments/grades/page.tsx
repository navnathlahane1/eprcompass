'use client';

import { useState } from 'react';

const LEARNERS: string[] = [];

const ASSESSMENTS: { id: string; title: string; program: string; short: string }[] = [];

type CellValue = number | null | 'pending';

const GRADES: CellValue[][] = [];

function CellBg(value: CellValue, passMark = 7): string {
  if (value === null) return 'bg-slate-800/40 text-slate-700';
  if (value === 'pending') return 'bg-amber-500/20 text-amber-300';
  if (typeof value === 'number') {
    if (value >= passMark) return 'bg-emerald-500/20 text-emerald-300';
    return 'bg-rose-500/20 text-rose-300';
  }
  return '';
}

function CellDisplay(value: CellValue): string {
  if (value === null) return '—';
  if (value === 'pending') return '···';
  return value.toString();
}

export default function GradeBookPage() {
  const [cohortF, setCohortF] = useState('All');
  const [programF, setProgramF] = useState('All');

  const visibleAssessments = ASSESSMENTS.filter(a => {
    if (programF !== 'All' && a.program !== programF) return false;
    return true;
  });

  const visibleCols = ASSESSMENTS.map((a, i) => visibleAssessments.includes(a) ? i : -1).filter(i => i >= 0);

  const passCount = (row: CellValue[]) => row.filter(v => typeof v === 'number' && v >= 7).length;
  const failCount = (row: CellValue[]) => row.filter(v => typeof v === 'number' && v < 7).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Grade Book</h1>
          <p className="mt-0.5 text-sm text-slate-500">Matrix view — {LEARNERS.length} learners × {ASSESSMENTS.length} assessments</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-xs text-slate-500 font-medium">Legend:</p>
        {[
          { color: 'bg-emerald-500/20 text-emerald-300', label: 'Pass (≥7)' },
          { color: 'bg-rose-500/20 text-rose-300',      label: 'Fail (<7)'  },
          { color: 'bg-amber-500/20 text-amber-300',    label: 'Pending'    },
          { color: 'bg-slate-800/40 text-slate-700',    label: 'Not Submitted' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={`h-5 w-7 rounded text-center text-[10px] flex items-center justify-center font-bold ${l.color}`}>—</div>
            <span className="text-[10px] text-slate-500">{l.label}</span>
          </div>
        ))}
        <p className="text-[10px] text-slate-600 ml-2">Pass mark: 7/10</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-600 uppercase">Program:</span>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {['All', 'Tier 1', 'Tier 2', 'Tier 3'].map(o => (
              <button key={o} onClick={() => setProgramF(o)}
                className={`px-2.5 py-1.5 text-[10px] font-medium transition ${programF === o ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-600 uppercase">Cohort:</span>
          <div className="flex rounded-lg border border-slate-700 overflow-hidden">
            {['All', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'].map(o => (
              <button key={o} onClick={() => setCohortF(o)}
                className={`px-2.5 py-1.5 text-[10px] font-medium transition ${cohortF === o ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                {o}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/80">
              <th className="sticky left-0 z-10 bg-[#0c1022] px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 min-w-[160px]">
                Learner
              </th>
              {visibleAssessments.map(a => (
                <th key={a.id} className="px-3 py-3 text-center text-[10px] font-semibold text-slate-500 min-w-[60px]">
                  <div className="font-mono text-indigo-400">{a.short}</div>
                  <div className={`mt-0.5 text-[8px] ${a.program === 'Tier 1' ? 'text-blue-500' : a.program === 'Tier 2' ? 'text-violet-500' : 'text-amber-500'}`}>{a.program}</div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-[10px] font-semibold text-slate-500">Pass</th>
              <th className="px-3 py-3 text-center text-[10px] font-semibold text-slate-500">Fail</th>
            </tr>
            <tr className="border-b border-slate-800/40">
              <td className="sticky left-0 z-10 bg-[#0c1022] px-4 py-2 text-[10px] text-slate-600 italic">Assessment →</td>
              {visibleAssessments.map(a => (
                <td key={a.id} className="px-3 py-2 text-[10px] text-slate-600 text-center truncate max-w-[80px]">{a.title}</td>
              ))}
              <td /><td />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {LEARNERS.length === 0 && (
              <tr><td colSpan={visibleAssessments.length + 3} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            )}
            {LEARNERS.map((learner, li) => (
              <tr key={li} className="hover:bg-white/[0.02] transition">
                <td className="sticky left-0 z-10 bg-[#0c1022] px-4 py-3 font-medium text-slate-300 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      {learner.charAt(0)}
                    </div>
                    {learner}
                  </div>
                </td>
                {visibleCols.map(ci => {
                  const val = GRADES[li][ci];
                  return (
                    <td key={ci} className="px-3 py-3 text-center">
                      <div className={`inline-flex h-7 w-10 items-center justify-center rounded text-[11px] font-bold ${CellBg(val)}`}>
                        {CellDisplay(val)}
                      </div>
                    </td>
                  );
                })}
                <td className="px-3 py-3 text-center">
                  <span className="text-xs font-bold text-emerald-400">{passCount(GRADES[li])}</span>
                </td>
                <td className="px-3 py-3 text-center">
                  <span className="text-xs font-bold text-rose-400">{failCount(GRADES[li]) || '—'}</span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-800">
              <td className="sticky left-0 z-10 bg-[#0c1022] px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase">Pass Rate</td>
              {visibleCols.map(ci => {
                const col = GRADES.map(row => row[ci]);
                const graded = col.filter(v => typeof v === 'number') as number[];
                const passed = graded.filter(v => v >= 7).length;
                const rate = graded.length > 0 ? Math.round((passed / graded.length) * 100) : null;
                return (
                  <td key={ci} className="px-3 py-3 text-center">
                    {rate !== null
                      ? <span className={`text-xs font-bold ${rate >= 75 ? 'text-emerald-400' : rate >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>{rate}%</span>
                      : <span className="text-[10px] text-slate-600">—</span>}
                  </td>
                );
              })}
              <td /><td />
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-slate-600 text-center">
        Short codes — M1-Q: Module 1 Quiz · PW-Q: Plastic Waste MCQ · CS-A: Case Study · FE-1: Final Exam Tier 1 · CC-Q: CEPC MCQ · EP-A: EPR Report · EW-A: E-Waste Audit · FE-2: CEPC Final
      </p>
    </div>
  );
}
