'use client';

import { useState } from 'react';
import MessageAcademyClientButton from '@/components/inbox/MessageAcademyClientButton';

const REGS: { id: string; participant: string; org: string; program: string; type: string; date: string; status: string; paid: boolean; amount: number }[] = [];

const TYPE_META: Record<string, string> = {
  Individual:  'bg-blue-500/15 text-blue-300',
  Corporate:   'bg-violet-500/15 text-violet-300',
  Team:        'bg-amber-500/15 text-amber-300',
  Institution: 'bg-teal-500/15 text-teal-300',
};

const STATUS_META: Record<string, string> = {
  Confirmed: 'bg-emerald-500/15 text-emerald-300',
  Pending:   'bg-amber-500/15 text-amber-300',
  Cancelled: 'bg-rose-500/15 text-rose-300',
  Waitlisted:'bg-slate-500/15 text-slate-400',
};

function fmtCur(n: number) {
  if (!n) return 'Free';
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function RegistrationsPage() {
  const [statusF, setStatusF] = useState('All');
  const [typeF,   setTypeF]   = useState('All');
  const [search,  setSearch]  = useState('');

  const filtered = REGS.filter(r => {
    if (statusF !== 'All' && r.status !== statusF) return false;
    if (typeF   !== 'All' && r.type   !== typeF)   return false;
    if (search && !r.participant.toLowerCase().includes(search.toLowerCase()) && !r.program.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = REGS.filter(r => r.paid && r.status !== 'Cancelled').reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Registrations</h1>
          <p className="mt-0.5 text-sm text-slate-500">{REGS.length} total · ₹{(totalRevenue / 1000).toFixed(0)}K collected</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          + Register Participant
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participant, program…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All','Confirmed','Pending','Cancelled','Waitlisted'].map(f => (
            <button key={f} onClick={() => setStatusF(f)}
              className={`px-3 py-2 text-xs font-medium transition ${statusF === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
        <select value={typeF} onChange={e => setTypeF(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {['All','Individual','Corporate','Team','Institution'].map(o => <option key={o}>{o}</option>)}
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Reg. ID','Participant','Organization','Program','Type','Date','Status','Amount','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : filtered.map(r => (
              <tr key={r.id} className="border-b border-slate-800/40 transition hover:bg-slate-800/20">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{r.id}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-200">{r.participant}</td>
                <td className="px-4 py-3 text-xs text-slate-400">{r.org}</td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate">{r.program}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_META[r.type]}`}>{r.type}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                  {new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_META[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <p className={`text-xs font-semibold ${r.amount > 0 ? (r.paid ? 'text-emerald-400' : 'text-amber-400') : 'text-slate-500'}`}>
                    {fmtCur(r.amount)}
                  </p>
                  {r.amount > 0 && (
                    <p className="text-[10px] text-slate-600">{r.paid ? 'Paid' : 'Due'}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 flex-wrap">
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">View</button>
                    {r.status === 'Confirmed' && (
                      <button className="rounded px-2 py-1 text-[10px] font-medium bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 transition">Certificate</button>
                    )}
                    {r.status === 'Pending' && (
                      <button className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition">Confirm</button>
                    )}
                    {(r.type === 'Corporate' || r.type === 'Team') && (
                      <MessageAcademyClientButton clientId={r.id} clientName={r.participant} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
