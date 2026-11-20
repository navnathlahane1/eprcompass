'use client';

import { useState, useEffect } from 'react';

interface ServicePrice {
  id: string;
  name: string;
  category: string;
  description: string | null;
  base_price_inr: number;
  gst_rate: number;
  unit: string;
  is_active: boolean;
  notes: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_COLORS: Record<string, string> = {
  Registration:  'bg-blue-900/40 text-blue-300 border-blue-700/30',
  'Annual Plan': 'bg-purple-900/40 text-purple-300 border-purple-700/30',
  Advisory:      'bg-amber-900/40 text-amber-300 border-amber-700/30',
  Filing:        'bg-teal-900/40 text-teal-300 border-teal-700/30',
  Renewal:       'bg-emerald-900/40 text-emerald-300 border-emerald-700/30',
  Network:       'bg-cyan-900/40 text-cyan-300 border-cyan-700/30',
  Compliance:    'bg-indigo-900/40 text-indigo-300 border-indigo-700/30',
  General:       'bg-slate-800 text-slate-400 border-slate-700/30',
};

export default function PricingReferenceClient() {
  const [services, setServices]   = useState<ServicePrice[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [copied, setCopied]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/finance/pricing')
      .then(r => r.json())
      .then(j => setServices((j.services ?? []).filter((s: ServicePrice) => s.is_active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category))).sort()];

  const filtered = services.filter(s => {
    if (catFilter !== 'all' && s.category !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
    }
    return true;
  });

  function copyPrice(s: ServicePrice) {
    const total = s.base_price_inr * (1 + s.gst_rate / 100);
    const text = `${s.name}: ₹${total.toLocaleString('en-IN')} (incl. ${s.gst_rate}% GST) — ${s.unit}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(s.id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  // Group by category for display
  const grouped: Record<string, ServicePrice[]> = {};
  for (const s of filtered) {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100">Pricing Reference</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Standard service prices — use this when quoting customers or preparing proposals.
        </p>
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services…"
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                catFilter === cat
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 text-sm">Loading pricing…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-slate-500 text-sm">No services match your search.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => {
            const clr = CATEGORY_COLORS[cat] ?? 'bg-slate-800 text-slate-400 border-slate-700/30';
            return (
              <div key={cat}>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${clr}`}>
                  {cat}
                </div>
                <div className="space-y-2">
                  {items.map(s => {
                    const gstAmt = (s.base_price_inr * s.gst_rate) / 100;
                    const total  = s.base_price_inr + gstAmt;
                    return (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 rounded-xl bg-slate-900/60 border border-slate-700/40 px-4 py-3 hover:border-slate-600/60 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-200 text-sm">{s.name}</p>
                          {s.description && <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>}
                          {s.notes && <p className="text-xs text-slate-600 italic mt-0.5">{s.notes}</p>}
                          <p className="text-xs text-slate-500 mt-1">{s.unit}</p>
                        </div>

                        <div className="text-right shrink-0 space-y-0.5">
                          <p className="text-xs text-slate-500">Base: {fmt(s.base_price_inr)}</p>
                          <p className="text-xs text-slate-500">GST ({s.gst_rate}%): +{fmt(gstAmt)}</p>
                          <p className="text-base font-bold text-teal-300">{fmt(total)}</p>
                        </div>

                        <button
                          onClick={() => copyPrice(s)}
                          title="Copy price to clipboard"
                          className="shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                        >
                          {copied === s.id ? (
                            <>
                              <svg className="h-3.5 w-3.5 text-teal-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Copied
                            </>
                          ) : (
                            <>
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-slate-600 pt-2">
        Prices managed by CFO. Last updated prices are always shown here. Contact your manager for custom quotes.
      </p>
    </div>
  );
}
