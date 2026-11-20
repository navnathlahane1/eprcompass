'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Job {
  id: string;
  company: string;
  role: string;
  location: string;
  ctcMin: number;
  ctcMax: number;
  category: 'Plastic' | 'E-Waste' | 'Battery' | 'Tyre' | 'Multi';
  type: 'Full-time' | 'Contract' | 'Consulting';
  posted: string;
  color: string;
}

const JOBS: Job[] = [];

const CAT_STYLE: Record<string, string> = {
  Plastic: 'bg-blue-500/15 text-blue-300',
  'E-Waste': 'bg-orange-500/15 text-orange-300',
  Battery: 'bg-purple-500/15 text-purple-300',
  Tyre: 'bg-amber-500/15 text-amber-300',
  Multi: 'bg-emerald-500/15 text-emerald-300',
};

const TYPE_STYLE: Record<string, string> = {
  'Full-time': 'bg-indigo-500/10 text-indigo-400',
  Contract: 'bg-violet-500/10 text-violet-400',
  Consulting: 'bg-teal-500/10 text-teal-400',
};

function daysAgo(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
  return diff === 0 ? 'Today' : `${diff}d ago`;
}

export default function JobBoard() {
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [catF, setCatF] = useState('All');
  const [locF, setLocF] = useState('All');
  const [typeF, setTypeF] = useState('All');
  const [ctcF, setCtcF] = useState('All');

  const cats = ['All', 'Plastic', 'E-Waste', 'Battery', 'Tyre', 'Multi'];
  const locs = ['All', 'Mumbai', 'Pune', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai', 'Noida', 'Kolkata', 'Ahmedabad', 'Remote'];
  const types = ['All', 'Full-time', 'Contract', 'Consulting'];
  const ctcs = ['All', '0–5 LPA', '5–10 LPA', '10+ LPA'];

  const visible = JOBS.filter(j => {
    if (catF !== 'All' && j.category !== catF) return false;
    if (locF !== 'All' && j.location !== locF) return false;
    if (typeF !== 'All' && j.type !== typeF) return false;
    if (ctcF === '0–5 LPA' && j.ctcMax > 5) return false;
    if (ctcF === '5–10 LPA' && (j.ctcMin < 5 || j.ctcMax > 10)) return false;
    if (ctcF === '10+ LPA' && j.ctcMin < 10) return false;
    return true;
  });

  function toggleApply(id: string) {
    setApplied(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function Sel({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <select value={value} onChange={e => onChange(e.target.value)}
        className="bg-[#0c1022] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
        {options.map(o => <option key={o} value={o}>{label}: {o}</option>)}
      </select>
    );
  }

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Job Board</h1>
          <p className="text-sm text-slate-400 mt-0.5">{visible.length} EPR roles available · EPR Compass</p>
        </div>
        <Link href="/academy/placement" className="text-sm text-indigo-400 hover:text-indigo-300">← Placement Dashboard</Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <span className="text-xs text-slate-500 uppercase font-medium">Filter:</span>
        <Sel label="Category" options={cats} value={catF} onChange={setCatF} />
        <Sel label="Location" options={locs} value={locF} onChange={setLocF} />
        <Sel label="Type" options={types} value={typeF} onChange={setTypeF} />
        <Sel label="CTC" options={ctcs} value={ctcF} onChange={setCtcF} />
        {(catF !== 'All' || locF !== 'All' || typeF !== 'All' || ctcF !== 'All') && (
          <button onClick={() => { setCatF('All'); setLocF('All'); setTypeF('All'); setCtcF('All'); }}
            className="text-xs text-rose-400 hover:text-rose-300 underline">Clear</button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.map(j => (
          <div key={j.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 hover:border-indigo-500/40 transition flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className={`${j.color} w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0`}>
                {j.company[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-100 text-sm leading-snug">{j.role}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{j.company}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${CAT_STYLE[j.category]}`}>{j.category}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${TYPE_STYLE[j.type]}`}>{j.type}</span>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                {j.location}
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                ₹{j.ctcMin}–{j.ctcMax} LPA
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-600">{daysAgo(j.posted)}</span>
              <button onClick={() => toggleApply(j.id)}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition ${applied.has(j.id) ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>
                {applied.has(j.id) ? '✓ Applied' : 'Apply'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="col-span-full py-16 text-center text-slate-500">No job listings yet.</div>
      )}
    </div>
  );
}

