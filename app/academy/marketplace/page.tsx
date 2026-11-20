'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type ProgramCard = {
  id: string; title: string; category: string; mode: string; price: number;
  is_free: boolean; rating: number; enrolled: number; duration: string;
  level: string; trainer: string; cert: boolean;
};

const CATEGORIES  = ['All','Plastic Waste','E-Waste','Battery Waste','Tyre Waste','ESG','General'];
const MODES       = ['All','Online Live','Classroom','Hybrid','Self-Paced','Recorded'];
const LEVELS      = ['All','Beginner','Intermediate','Advanced'];
const PRICE_TYPES = ['All','Free','Paid'];

function Stars({ r }: { r: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`h-3 w-3 ${i <= Math.round(r) ? 'text-amber-400' : 'text-slate-700'}`} fill="currentColor">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="ml-1 text-[10px] text-slate-400">{r.toFixed(1)}</span>
    </span>
  );
}

export default function MarketplacePage() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramCard[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [catF,   setCatF]   = useState('All');
  const [modeF,  setModeF]  = useState('All');
  const [levelF, setLevelF] = useState('All');
  const [priceF, setPriceF] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/academy/programs?public=true')
      .then(r => r.json())
      .then(d => {
        setPrograms((d.programs ?? []).map((p: any) => ({
          id:       p.id,
          title:    p.title,
          category: p.waste_category || 'General',
          mode:     p.delivery_mode,
          price:    p.fee,
          is_free:  p.is_free,
          rating:   0,
          enrolled: p.registered,
          duration: '',
          level:    '',
          trainer:  p.trainer,
          cert:     p.certification_offered,
        })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = programs.filter(p => {
    const q = search.toLowerCase();
    if (q && !p.title.toLowerCase().includes(q)) return false;
    if (catF   !== 'All' && p.category !== catF)   return false;
    if (modeF  !== 'All' && p.mode     !== modeF)  return false;
    if (levelF !== 'All' && p.level    !== levelF) return false;
    if (priceF === 'Free' && !p.is_free)  return false;
    if (priceF === 'Paid' &&  p.is_free)  return false;
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
          <h1 className="text-xl font-semibold text-slate-100">Training Marketplace</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${filtered.length} programs available`}</p>
        </div>
        <button onClick={() => router.push('/academy/programs/create')} className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          Publish Program
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search programs…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        {sel(catF,   setCatF,   CATEGORIES)}
        {sel(modeF,  setModeF,  MODES)}
        {sel(levelF, setLevelF, LEVELS)}
        {sel(priceF, setPriceF, PRICE_TYPES)}
      </div>

      {/* Program Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">Loading programs…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No programs available yet.</div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="flex flex-col rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden hover:border-indigo-500/30 transition">
            {/* Color bar */}
            <div className={`h-1.5 w-full ${p.is_free ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
            <div className="flex-1 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-slate-800 text-slate-400">{p.category}</span>
                </div>
                {p.is_free
                  ? <span className="rounded-md px-2 py-0.5 text-[10px] font-bold bg-emerald-500/15 text-emerald-300">FREE</span>
                  : <span className="text-sm font-bold text-slate-200">₹{p.price.toLocaleString('en-IN')}</span>
                }
              </div>
              <p className="text-sm font-semibold text-slate-200 leading-snug line-clamp-2">{p.title}</p>
              <p className="text-[11px] text-slate-500">{p.trainer}</p>
              <Stars r={p.rating} />
              <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {p.duration}
                </span>
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {p.enrolled.toLocaleString()} enrolled
                </span>
                <span>{p.level}</span>
                <span>{p.mode}</span>
              </div>
              {p.cert && (
                <div className="flex items-center gap-1 text-[10px] text-violet-400">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Certificate included
                </div>
              )}
            </div>
            <div className="px-4 pb-4 flex gap-2">
              <button onClick={() => router.push('/academy/enrollment')} className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                {p.is_free ? 'Enroll Free' : 'Register'}
              </button>
              <button onClick={() => router.push(`/academy/content/${p.id}`)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
