'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const PROGRAM_TYPES = ['All',
  // Certification tiers (EPR Compass core programs)
  'Tier 1 — EPR Awareness Bootcamp',
  'Tier 2 — Certified EPR Consultant (CEPC)',
  'Tier 3 — EPR Agency Launch Program (EALP)',
  // Other program types
  'Webinar','Workshop','Awareness Session','Corporate Training','Certification Course',
  'Employee Induction','Vendor Training','Dealer Training','Customer Awareness Program','Public Awareness Program',
  'Refresher Program','Educational Program','Sustainability Program','ESG Program','Circular Economy Program',
  'Consulting Programme'];

const DELIVERY_MODES = ['All','Online Live','Classroom','Hybrid','Self-Paced','Recorded'];

const STATUSES = ['All','Draft','Review','Approval','Scheduling','Registration','Delivery','Assessment','Certification','Closure'];

const VISIBILITY = ['All','Internal Only','Client Only','Invite Only','Public','Educational Partner Only','Hybrid Visibility'];

type ProgramRow = {
  id: string; title: string; type: string; mode: string; status: string; visibility: string;
  sessions: number; registered: number; capacity: number; trainer: string; revenue: number;
  start_date: string; waste_cat: string; price: number;
};

const STATUS_META: Record<string, { badge: string; dot: string }> = {
  Draft:        { badge: 'bg-slate-700/60 text-slate-400',    dot: 'bg-slate-500'   },
  Review:       { badge: 'bg-blue-500/15 text-blue-300',      dot: 'bg-blue-500'    },
  Approval:     { badge: 'bg-amber-500/15 text-amber-300',    dot: 'bg-amber-500'   },
  Scheduling:   { badge: 'bg-violet-500/15 text-violet-300',  dot: 'bg-violet-500'  },
  Registration: { badge: 'bg-indigo-500/15 text-indigo-300',  dot: 'bg-indigo-500'  },
  Delivery:     { badge: 'bg-emerald-500/15 text-emerald-300',dot: 'bg-emerald-500' },
  Assessment:   { badge: 'bg-teal-500/15 text-teal-300',      dot: 'bg-teal-500'    },
  Certification:{ badge: 'bg-yellow-500/15 text-yellow-300',  dot: 'bg-yellow-500'  },
  Closure:      { badge: 'bg-slate-500/15 text-slate-400',    dot: 'bg-slate-500'   },
};

const VIS_META: Record<string, { badge: string }> = {
  'Internal Only':         { badge: 'bg-slate-700/60 text-slate-400'    },
  'Client Only':           { badge: 'bg-blue-500/15 text-blue-300'      },
  'Invite Only':           { badge: 'bg-violet-500/15 text-violet-300'  },
  'Public':                { badge: 'bg-emerald-500/15 text-emerald-300'},
  'Educational Partner Only':{ badge: 'bg-teal-500/15 text-teal-300'    },
  'Hybrid Visibility':     { badge: 'bg-amber-500/15 text-amber-300'    },
};

function fmtRev(n: number) {
  if (!n) return '—';
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<ProgramRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [typeF,    setTypeF]    = useState('All');
  const [modeF,    setModeF]    = useState('All');
  const [statusF,  setStatusF]  = useState('All');
  const [visF,     setVisF]     = useState('All');

  useEffect(() => {
    fetch('/api/academy/programs')
      .then(r => r.json())
      .then(d => {
        setPrograms((d.programs ?? []).map((p: any) => ({
          id:         p.id,
          title:      p.title,
          type:       p.program_type,
          mode:       p.delivery_mode,
          status:     p.status,
          visibility: p.visibility,
          sessions:   p.sessions,
          registered: p.registered,
          capacity:   p.capacity,
          trainer:    p.trainer,
          revenue:    p.revenue,
          start_date: p.start_date,
          waste_cat:  p.waste_category,
          price:      p.fee,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = programs.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q) && !p.trainer.toLowerCase().includes(q)) return false;
    if (typeF   !== 'All' && p.type       !== typeF)   return false;
    if (modeF   !== 'All' && p.mode       !== modeF)   return false;
    if (statusF !== 'All' && p.status     !== statusF) return false;
    if (visF    !== 'All' && p.visibility !== visF)    return false;
    return true;
  });

  const sel = (val: string, set: (v: string) => void, opts: string[]) => (
    <select value={val} onChange={e => set(e.target.value)}
      className="rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Training Programs</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${filtered.length} programs found`}</p>
        </div>
        <Link href="/academy/programs/create"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Program
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs, trainers…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {sel(typeF,   setTypeF,   PROGRAM_TYPES)}
        {sel(modeF,   setModeF,   DELIVERY_MODES)}
        {sel(statusF, setStatusF, STATUSES)}
        {sel(visF,    setVisF,    VISIBILITY)}
      </div>

      {/* Public Training Workshops banner — links to /trainings */}
      <div className="rounded-xl border border-slate-700/60 bg-[#0c1022] p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Public Website</p>
            <p className="text-sm font-semibold text-slate-200">Standalone Workshops at <span className="text-indigo-400">EPR Compass/trainings</span></p>
            <p className="text-xs text-slate-500 mt-1">4 short-format public workshops (PWM Rules, EPR Portal, Plastic Waste, Compliance Reporting) run independently from the academy certification tiers.</p>
          </div>
          <div className="flex gap-2 flex-wrap shrink-0">
            <a href="/trainings" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white transition">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              View Workshops Page
            </a>
            <Link href="/academy/content/tier-1"
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-500/10 transition">
              Tier 1 Curriculum →
            </Link>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-4 gap-2">
          {[
            { label: 'PWM Rules 2016 & 2022', tier: 'Tier 1', href: '/trainings#pwm-rules' },
            { label: 'EPR Portal Navigation & Filing', tier: 'Tier 1', href: '/trainings#epr-portal' },
            { label: 'Plastic Waste Accounting & Targets', tier: 'Tier 1', href: '/trainings#plastic-waste-accounting' },
            { label: 'Compliance Reporting & EPR Credit Trading', tier: 'Tier 2', href: '/trainings#compliance-reporting' },
          ].map(w => (
            <a key={w.href} href={w.href} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2 hover:border-slate-600 transition group">
              <span className="text-xs text-slate-400 group-hover:text-slate-200 transition line-clamp-2">{w.label}</span>
              <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded shrink-0">{w.tier}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800/80">
              {['Program','Type','Mode','Status','Visibility','Registered','Revenue','Date','Trainer'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-600">Loading programs…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-600">No programs found. Create the first one.</td></tr>
            ) : filtered.map(p => {
              const sm = STATUS_META[p.status] ?? STATUS_META.Draft;
              const vm = VIS_META[p.visibility] ?? { badge: 'bg-slate-700 text-slate-400' };
              const fillPct = p.capacity > 0 ? Math.round((p.registered / p.capacity) * 100) : 0;
              return (
                <tr key={p.id} className="border-b border-slate-800/40 transition hover:bg-slate-800/20">
                  <td className="px-4 py-3">
                    <Link href={`/academy/programs/${p.id}`} className="font-semibold text-slate-200 hover:text-indigo-300 transition line-clamp-2 max-w-[220px]">
                      {p.title}
                    </Link>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.waste_cat} · {p.sessions} sessions</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{p.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400">{p.mode}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${sm.badge}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${vm.badge}`}>{p.visibility}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-200">{p.registered}/{p.capacity}</p>
                    <div className="mt-1 h-1 w-20 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full rounded-full ${fillPct >= 90 ? 'bg-rose-500' : 'bg-indigo-500'}`} style={{ width: `${fillPct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-emerald-400 whitespace-nowrap">{fmtRev(p.revenue)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.trainer}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

