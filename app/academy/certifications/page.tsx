'use client';

import { useState } from 'react';

const CERTS: { id: string; participant: string; program: string; issued: string | null; expires: string | null; type: string; status: string; qr: boolean }[] = [];

const TYPE_META: Record<string, string> = {
  Certification: 'bg-violet-500/15 text-violet-300',
  Awareness:     'bg-blue-500/15 text-blue-300',
  Completion:    'bg-emerald-500/15 text-emerald-300',
  Participation: 'bg-amber-500/15 text-amber-300',
};

const STATUS_META: Record<string, string> = {
  Issued:  'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  Revoked: 'bg-rose-500/15 text-rose-300',
};

export default function CertificationsPage() {
  const [statusF, setStatusF] = useState('All');
  const [search,  setSearch]  = useState('');

  const filtered = CERTS.filter(c => {
    if (statusF !== 'All' && c.status !== statusF) return false;
    if (search && !c.participant.toLowerCase().includes(search.toLowerCase()) && !c.program.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pending = CERTS.filter(c => c.status === 'Pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Certifications</h1>
          <p className="mt-0.5 text-sm text-slate-500">{CERTS.filter(c => c.status === 'Issued').length} issued · {pending} pending</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Issue Certificate
        </button>
      </div>

      {pending > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
          <p className="text-sm font-semibold text-amber-300">{pending} certificates awaiting issuance</p>
          <button className="ml-auto shrink-0 rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/10 transition">
            Issue All
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search participant, program…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All','Issued','Pending','Revoked'].map(f => (
            <button key={f} onClick={() => setStatusF(f)}
              className={`px-3 py-2 text-xs font-medium transition ${statusF === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Certificate ID','Participant','Program','Type','Status','Issued','Expires','QR','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={9} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-800/40 transition hover:bg-slate-800/20">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400">{c.id}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-200">{c.participant}</td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[180px] truncate">{c.program}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_META[c.type]}`}>{c.type}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_META[c.status]}`}>{c.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.issued ? new Date(c.issued).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.expires ? new Date(c.expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : 'No expiry'}</td>
                <td className="px-4 py-3">
                  {c.qr ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Enabled
                    </span>
                  ) : <span className="text-[10px] text-slate-600">—</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {c.status === 'Issued' && (
                      <button className="rounded px-2 py-1 text-[10px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition">Download</button>
                    )}
                    {c.status === 'Pending' && (
                      <button className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition">Issue</button>
                    )}
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">View</button>
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
