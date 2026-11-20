'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Alumni {
  id: string;
  name: string;
  year: number;
  tier: 'CEPC' | 'EALP';
  specialisation: 'Plastic' | 'E-Waste' | 'Battery' | 'Tyre' | 'Multi-EPR';
  city: string;
  employer: string;
  role: string;
  linkedin: string;
  avatar: string;
}

const ALUMNI: Alumni[] = [];

const TIER_STYLE: Record<string, string> = {
  CEPC: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  EALP: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
};

const SPEC_STYLE: Record<string, string> = {
  Plastic: 'bg-blue-500/10 text-blue-300',
  'E-Waste': 'bg-orange-500/10 text-orange-300',
  Battery: 'bg-purple-500/10 text-purple-300',
  Tyre: 'bg-amber-500/10 text-amber-300',
  'Multi-EPR': 'bg-emerald-500/10 text-emerald-300',
};

const AVATAR_COLORS = ['bg-indigo-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-600', 'bg-amber-600', 'bg-teal-600', 'bg-blue-600', 'bg-pink-600'];

export default function AlumniDirectory() {
  const [search, setSearch] = useState('');
  const [tierF, setTierF] = useState('All');
  const [cityF, setCityF] = useState('All');
  const [specF, setSpecF] = useState('All');
  const [yearF, setYearF] = useState('All');

  const cities = ['All', ...Array.from(new Set(ALUMNI.map(a => a.city))).sort()];
  const years = ['All', '2024', '2023', '2022'];

  const filtered = ALUMNI.filter(a => {
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.employer.toLowerCase().includes(search.toLowerCase())) return false;
    if (tierF !== 'All' && a.tier !== tierF) return false;
    if (cityF !== 'All' && a.city !== cityF) return false;
    if (specF !== 'All' && a.specialisation !== specF) return false;
    if (yearF !== 'All' && a.year.toString() !== yearF) return false;
    return true;
  });

  const placed = ALUMNI.filter(a => !a.employer.includes('Self-Employed')).length;
  const consulting = ALUMNI.filter(a => a.employer.includes('Self-Employed')).length;

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alumni Directory</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR Academy Graduates · EPR Compass</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-sm font-medium rounded-lg transition">Update My Profile</button>
          <Link href="/academy/placement" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center">← Placement</Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Alumni', value: '0', color: 'text-slate-200' },
          { label: 'Placed in Jobs', value: '0', color: 'text-emerald-400' },
          { label: 'Running EPR Consulting', value: '0', color: 'text-indigo-400' },
          { label: 'Avg NPS (Alumni)', value: '0', color: 'text-violet-400' },
        ].map(k => (
          <div key={k.label} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{k.label}</p>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-4 flex flex-wrap gap-3 items-center">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or employer..."
          className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500 w-52" />
        {[
          { label: 'Tier', options: ['All', 'CEPC', 'EALP'], value: tierF, set: setTierF },
          { label: 'City', options: cities, value: cityF, set: setCityF },
          { label: 'Spec', options: ['All', 'Plastic', 'E-Waste', 'Battery', 'Tyre', 'Multi-EPR'], value: specF, set: setSpecF },
          { label: 'Year', options: years, value: yearF, set: setYearF },
        ].map(f => (
          <select key={f.label} value={f.value} onChange={e => f.set(e.target.value)}
            className="bg-[#0c1022] border border-slate-700 text-slate-300 text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500">
            {f.options.map(o => <option key={o} value={o}>{f.label}: {o}</option>)}
          </select>
        ))}
        <span className="text-xs text-slate-500">{filtered.length} alumni</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {filtered.map((a, i) => (
          <div key={a.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 hover:border-indigo-500/40 transition">
            <div className="flex items-start gap-3 mb-3">
              <div className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                {a.avatar}
              </div>
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">{a.name}</h3>
                <p className="text-[11px] text-slate-500">Class of {a.year}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${TIER_STYLE[a.tier]}`}>{a.tier}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${SPEC_STYLE[a.specialisation]}`}>{a.specialisation}</span>
            </div>
            <div className="space-y-1 text-xs text-slate-400">
              <p><span className="text-slate-600">Role:</span> {a.role}</p>
              <p><span className="text-slate-600">At:</span> {a.employer}</p>
              <p><span className="text-slate-600">City:</span> {a.city}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-800">
              <a href={`https://${a.linkedin}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-blue-400 hover:text-blue-300 transition">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
      )}
    </div>
  );
}

