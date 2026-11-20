'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Cert = { id: string; learner: string; program: string; tier: string; type: string; issued: string; expires: string; url: string | null };
type Kpis = { total: number; thisMonth: number; t3Trainer: number; cepc: number; ealp: number; attendance: number };

const TIER_COLOR: Record<string, string> = {
  'Tier 1':    'bg-blue-500/15 text-blue-300',
  'Tier 2':    'bg-violet-500/15 text-violet-300',
  'Tier 3':    'bg-amber-500/15 text-amber-300',
  'T3 Trainer':'bg-rose-500/15 text-rose-300',
};

const TYPE_COLOR: Record<string, string> = {
  'Attendance': 'bg-sky-500/15 text-sky-300',
  'CEPC':       'bg-violet-500/15 text-violet-300',
  'EALP':       'bg-amber-500/15 text-amber-300',
  'T3 Trainer': 'bg-rose-500/15 text-rose-300',
};

export default function CertificatesPage() {
  const router = useRouter();
  const [certs, setCerts]     = useState<Cert[]>([]);
  const [kpis, setKpis]       = useState<Kpis>({ total: 0, thisMonth: 0, t3Trainer: 0, cepc: 0, ealp: 0, attendance: 0 });
  const [loading, setLoading] = useState(true);
  const [programF, setProgramF] = useState('All');
  const [tierF, setTierF]       = useState('All');
  const [copied, setCopied]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/academy/certificates')
      .then(r => r.json())
      .then(d => {
        setCerts(d.certs ?? []);
        if (d.kpis) setKpis(d.kpis);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const programs = ['All', ...Array.from(new Set(certs.map(c => c.type)))];
  const tiers    = ['All', 'Tier 1', 'Tier 2', 'Tier 3', 'T3 Trainer'];

  const filtered = certs.filter(c => {
    if (programF !== 'All' && c.type !== programF) return false;
    if (tierF    !== 'All' && c.tier !== tierF)    return false;
    return true;
  });

  function copyUrl(id: string) {
    navigator.clipboard?.writeText(`${window.location.origin}/academy/certificates/verify/${id}`).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Certificate Registry</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${filtered.length} certificates`} · All certificates issued by EPR Compass</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => router.push('/academy/enrollment/bulk')} className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Bulk Issue
          </button>
          <Link href="/academy/certificates/issue"
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
            Issue Certificate
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Issued',      value: loading ? '—' : String(kpis.total),      color: 'text-indigo-400'  },
          { label: 'Issued This Month', value: loading ? '—' : String(kpis.thisMonth),  color: 'text-emerald-400' },
          { label: 'T3 Trainer Certs',  value: loading ? '—' : String(kpis.t3Trainer),  color: 'text-rose-400'    },
          { label: 'CEPC Certificates', value: loading ? '—' : String(kpis.cepc),        color: 'text-violet-400'  },
          { label: 'EALP Certificates', value: loading ? '—' : String(kpis.ealp),        color: 'text-amber-400'   },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={programF} onChange={e => setProgramF(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {programs.map(p => <option key={p}>{p}</option>)}
        </select>
        <select value={tierF} onChange={e => setTierF(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          {tiers.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Cert ID','Learner','Program','Tier','Type','Issued','Expires','Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">Loading certificates…</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">No certificates issued yet.</td></tr>
            )}
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition">
                <td className="px-4 py-3 font-mono text-xs text-indigo-400 whitespace-nowrap">{c.id.slice(0, 8)}…</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-200 whitespace-nowrap">{c.learner}</td>
                <td className="px-4 py-3 text-xs text-slate-400 max-w-[160px] truncate">{c.program}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TIER_COLOR[c.tier] ?? 'bg-slate-700 text-slate-400'}`}>{c.tier}</span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${TYPE_COLOR[c.type] ?? 'bg-slate-700 text-slate-400'}`}>{c.type}</span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.issued ? new Date(c.issued).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</td>
                <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{c.expires ? new Date(c.expires).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => copyUrl(c.id)}
                      className="flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium text-slate-400 border border-slate-700 hover:border-indigo-500/50 hover:text-indigo-300 transition whitespace-nowrap">
                      {copied === c.id ? (
                        <><svg viewBox="0 0 24 24" className="h-3 w-3 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>Copied</>
                      ) : 'Copy URL'}
                    </button>
                    <Link href={`/academy/certificates/verify/${c.id}`}
                      className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition whitespace-nowrap">Verify</Link>
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

