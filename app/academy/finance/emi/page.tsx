'use client';

import { useState } from 'react';
import Link from 'next/link';

type InstStatus = 'Paid' | 'Pending' | 'Overdue';

interface Installment {
  status: InstStatus;
  date: string;
  amount: number;
}

interface EMIRecord {
  id: string;
  learner: string;
  program: string;
  totalFee: number;
  inst1: Installment;
  inst2: Installment;
  inst3: Installment;
  daysOverdue?: number;
  lmsBlocked: boolean;
}

const RECORDS: EMIRecord[] = [];

const INST_STYLE: Record<InstStatus, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  Overdue: 'bg-rose-500/15 text-rose-400',
};

function remaining(r: EMIRecord) {
  return [r.inst1, r.inst2, r.inst3].filter(i => i.status !== 'Paid').reduce((s, i) => s + i.amount, 0);
}

export default function EMITracker() {
  const [records, setRecords] = useState<EMIRecord[]>(RECORDS);
  const [overdueOnly, setOverdueOnly] = useState(false);

  function toggleBlock(id: string) {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, lmsBlocked: !r.lmsBlocked } : r));
  }

  const overdue = records.filter(r => [r.inst1, r.inst2, r.inst3].some(i => i.status === 'Overdue'));
  const visible = overdueOnly ? overdue : records;

  const totalCollected = records.flatMap(r => [r.inst1, r.inst2, r.inst3]).filter(i => i.status === 'Paid' && i.date.startsWith('2026-05')).reduce((s, i) => s + i.amount, 0);
  const totalOverdue = records.flatMap(r => [r.inst1, r.inst2, r.inst3]).filter(i => i.status === 'Overdue').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">EMI Tracker</h1>
          <p className="text-sm text-slate-400 mt-0.5">Installment payment monitoring · EPR Compass</p>
        </div>
        <Link href="/academy/finance" className="text-sm text-indigo-400 hover:text-indigo-300">← Finance</Link>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">On EMI Plan</p>
          <p className="text-2xl font-bold text-slate-200">{records.length} learners</p>
        </div>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Collected This Month</p>
          <p className="text-2xl font-bold text-emerald-400">₹{totalCollected.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Overdue Amount</p>
          <p className="text-2xl font-bold text-rose-400">₹{totalOverdue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <div onClick={() => setOverdueOnly(p => !p)}
            className={`w-10 h-5 rounded-full transition relative ${overdueOnly ? 'bg-rose-600' : 'bg-slate-700'}`}>
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${overdueOnly ? 'left-5' : 'left-0.5'}`} />
          </div>
          <span className="text-sm text-slate-400">Show overdue only</span>
        </label>
        {overdueOnly && <span className="text-xs text-rose-400">{overdue.length} records</span>}
      </div>

      {/* Table */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {['Learner', 'Program', 'Total Fee', 'Inst 1', 'Inst 2', 'Inst 3', 'Remaining', 'Days Overdue', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] text-slate-500 uppercase py-3 px-4 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {visible.length === 0 ? (
                <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              ) : visible.map(r => {
                const isSignificantlyOverdue = (r.daysOverdue ?? 0) > 30;
                const rem = remaining(r);
                return (
                  <tr key={r.id} className={`hover:bg-slate-800/20 transition ${isSignificantlyOverdue ? 'border-l-2 border-rose-600' : ''}`}>
                    <td className="py-3 px-4 font-medium text-slate-200 whitespace-nowrap">{r.learner}</td>
                    <td className="py-3 px-4 text-slate-400 text-xs whitespace-nowrap">{r.program}</td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">₹{r.totalFee.toLocaleString('en-IN')}</td>
                    {[r.inst1, r.inst2, r.inst3].map((inst, idx) => (
                      <td key={idx} className="py-3 px-4">
                        <div>
                          <span className={`text-[11px] px-2 py-0.5 rounded-full ${INST_STYLE[inst.status]}`}>{inst.status}</span>
                          <p className="text-[10px] text-slate-600 mt-0.5">{inst.date}</p>
                          <p className="text-[10px] text-slate-500">₹{inst.amount.toLocaleString('en-IN')}</p>
                        </div>
                      </td>
                    ))}
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${rem > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {rem > 0 ? `₹${rem.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {r.daysOverdue ? (
                        <span className={`text-sm font-semibold ${r.daysOverdue > 30 ? 'text-rose-500' : 'text-amber-400'}`}>{r.daysOverdue}d</span>
                      ) : <span className="text-slate-600">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1.5">
                        {r.daysOverdue && (
                          <button className="text-[11px] bg-amber-600/20 text-amber-400 border border-amber-700 px-2.5 py-1 rounded-lg hover:bg-amber-600/30 transition whitespace-nowrap">
                            Send Reminder
                          </button>
                        )}
                        {isSignificantlyOverdue && (
                          <button onClick={() => toggleBlock(r.id)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition whitespace-nowrap ${r.lmsBlocked ? 'bg-slate-700 text-slate-400 border-slate-600' : 'bg-rose-600/20 text-rose-400 border-rose-700 hover:bg-rose-600/30'}`}>
                            {r.lmsBlocked ? '⚠ LMS Blocked' : 'Block LMS'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

