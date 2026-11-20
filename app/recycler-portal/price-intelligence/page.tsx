'use client';

import { useEffect, useState } from 'react';

interface TrendPoint { month: string; rate: number | null; }
interface CategoryIntel {
  category: string;
  market_ask_avg: number | null;
  trade_avg: number | null;
  my_issued_avg: number | null;
  target_avg: number | null;
  supply_mt: number;
  demand_mt: number;
  supply_demand: 'demand_high' | 'supply_high' | 'balanced';
  trend: TrendPoint[];
  direction: 'up' | 'down' | 'stable';
  changePct: number;
}
interface Meta { active_listings: number; recent_trades: number; open_requirements: number; }

function fmtINR(n: number | null) { return n != null ? '₹' + n.toLocaleString('en-IN') : '—'; }
function monthShort(m: string) { const [y, mo] = m.split('-'); return new Date(Number(y), Number(mo) - 1).toLocaleDateString('en-IN', { month: 'short' }); }

function Sparkline({ points }: { points: TrendPoint[] }) {
  const vals = points.map(p => p.rate);
  const nums = vals.filter((n): n is number => n != null);
  if (nums.length < 2) return <div className="h-12 flex items-center text-xs text-gray-300">Not enough data</div>;
  const min = Math.min(...nums), max = Math.max(...nums);
  const range = max - min || 1;
  const w = 200, h = 48;
  const step = w / (points.length - 1);
  const coords = points.map((p, i) => {
    const y = p.rate == null ? null : h - ((p.rate - min) / range) * (h - 8) - 4;
    return { x: i * step, y };
  }).filter(c => c.y != null) as { x: number; y: number }[];
  const path = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12">
      <path d={path} fill="none" stroke="#07875f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={2} fill="#07875f" />)}
    </svg>
  );
}

const DIR_STYLE: Record<string, { color: string; icon: string; label: string }> = {
  up: { color: 'text-green-600', icon: 'M5 10l7-7m0 0l7 7m-7-7v18', label: 'Rising' },
  down: { color: 'text-red-600', icon: 'M19 14l-7 7m0 0l-7-7m7 7V3', label: 'Falling' },
  stable: { color: 'text-gray-500', icon: 'M5 12h14', label: 'Stable' },
};

const SD_STYLE: Record<string, { color: string; label: string }> = {
  demand_high: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Demand > Supply — favorable' },
  supply_high: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Supply > Demand — competitive' },
  balanced: { color: 'bg-gray-100 text-gray-600 border-gray-200', label: 'Balanced' },
};

export default function PriceIntelligencePage() {
  const [categories, setCategories] = useState<CategoryIntel[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recycler-portal/price-intelligence').then(r => r.json())
      .then(d => { setCategories(d.categories ?? []); setMeta(d.meta ?? null); })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Price Intelligence</h1>
        <p className="text-sm text-gray-500 mt-1">EPR credit price trends, market rates, and supply–demand signals per category.</p>
      </div>

      {meta && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Active Listings</p><p className="text-2xl font-bold text-gray-900 mt-1">{meta.active_listings}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Recent Trades (90d)</p><p className="text-2xl font-bold text-gray-900 mt-1">{meta.recent_trades}</p></div>
          <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500 uppercase tracking-wide">Open Requirements</p><p className="text-2xl font-bold text-gray-900 mt-1">{meta.open_requirements}</p></div>
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">{[1,2,3,4].map(i => <div key={i} className="h-56 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No price data yet</p>
          <p className="text-xs text-gray-400 mt-1">Once credits are issued, listed, or traded, market intelligence will populate here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(c => {
            const dir = DIR_STYLE[c.direction];
            const sd = SD_STYLE[c.supply_demand];
            return (
              <div key={c.category} className="rounded-2xl border border-gray-200 bg-white p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{c.category}</h3>
                    <p className="text-xs text-gray-400">avg issue rate trend (6 mo)</p>
                  </div>
                  <div className={`flex items-center gap-1 ${dir.color}`}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={dir.icon} /></svg>
                    <span className="text-xs font-semibold">{dir.label}{c.changePct ? ` ${c.changePct > 0 ? '+' : ''}${c.changePct}%` : ''}</span>
                  </div>
                </div>

                <Sparkline points={c.trend} />
                <div className="flex justify-between text-[10px] text-gray-400">
                  {c.trend.map((t, i) => <span key={i}>{monthShort(t.month)}</span>)}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <Stat label="Market Ask" value={c.market_ask_avg} suffix="/MT" />
                  <Stat label="Trade Avg (90d)" value={c.trade_avg} suffix="/MT" />
                  <Stat label="Your Avg Rate" value={c.my_issued_avg} suffix="/MT" highlight />
                  <Stat label="Buyer Target" value={c.target_avg} suffix="/MT" />
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Supply <strong className="text-gray-700">{c.supply_mt} MT</strong> · Demand <strong className="text-gray-700">{c.demand_mt} MT</strong>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${sd.color}`}>{sd.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-400 text-center">Indicative figures aggregated from platform listings, trades &amp; issued credits. For guidance, not a guaranteed price.</p>
    </div>
  );
}

function Stat({ label, value, suffix, highlight }: { label: string; value: number | null; suffix?: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`text-sm font-bold ${highlight ? 'text-teal-700' : 'text-gray-900'}`}>
        {value != null ? '₹' + value.toLocaleString('en-IN') : '—'}<span className="text-[10px] font-normal text-gray-400">{value != null ? suffix : ''}</span>
      </p>
    </div>
  );
}
