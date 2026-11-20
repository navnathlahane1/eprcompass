'use client';

import { useState, useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Client {
  id: string;
  company_name: string;
  waste_categories: string[];
  industry?: string;
}

interface Recommendation {
  title: string;
  type: string;
  priority: 'Mandatory' | 'Recommended' | 'Optional';
  reason: string;
}

const PRIORITY_META: Record<string, string> = {
  Mandatory:   'bg-rose-500/15 text-rose-300',
  Recommended: 'bg-amber-500/15 text-amber-300',
  Optional:    'bg-slate-700/60 text-slate-400',
};

export default function AIRecommenderPage() {
  const [clients, setClients]     = useState<Client[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string | null>(null);
  const [recs, setRecs]           = useState<Recommendation[]>([]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetch('/api/admin/clients/list')
      .then(r => r.json())
      .then(d => {
        const list: Client[] = d.clients ?? [];
        setClients(list);
        if (list.length > 0) setSelected(list[0].id);
      })
      .catch(() => setClients([]))
      .finally(() => setLoading(false));
  }, []);

  async function generateRecs() {
    if (!selected) return;
    setGenerating(true);
    setRecs([]);
    try {
      const res = await fetch('/api/academy/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: selected }),
      });
      const data = await res.json();
      trackEvent('AI Recommendations Generated', { client_id: selected });
      setRecs(data.recommendations ?? []);
    } catch {
      setRecs([]);
    } finally {
      setGenerating(false);
    }
  }

  const client = clients.find(c => c.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"/>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-100">AI Training Recommendations</h1>
        </div>
        <p className="text-sm text-slate-500">Personalized training recommendations for each client based on EPR obligations and compliance gaps.</p>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-16 text-center px-6">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/></svg>
          <p className="text-sm font-semibold text-slate-400">No clients found</p>
          <p className="text-xs text-slate-600 mt-1">Add clients from the Admin panel to generate AI training recommendations.</p>
        </div>
      ) : (
        <>
          {/* Client Selector */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {clients.slice(0, 8).map(c => (
              <button key={c.id} onClick={() => { setSelected(c.id); setRecs([]); }}
                className={`text-left rounded-xl border p-4 transition ${selected === c.id ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800/80 bg-[#0c1022] hover:border-slate-700'}`}>
                <p className="text-xs font-bold text-slate-200 truncate">{c.company_name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{c.industry || 'Client'}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(c.waste_categories ?? []).slice(0, 2).map(w => (
                    <span key={w} className="rounded bg-indigo-500/10 px-1 py-0.5 text-[9px] text-indigo-400">{w.replace(' Waste', '')}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          {/* Client Profile + Recommendations */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* Client Summary */}
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-200">{client?.company_name ?? '—'}</h2>
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] text-slate-500">EPR Categories</span>
                  <span className="text-[11px] font-medium text-slate-300 text-right max-w-[160px]">
                    {(client?.waste_categories ?? []).join(', ') || 'Not set'}
                  </span>
                </div>
              </div>
              <button
                onClick={generateRecs}
                disabled={generating}
                className="w-full rounded-lg bg-indigo-600 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition disabled:opacity-50">
                {generating ? 'Analysing…' : 'Generate Recommendations'}
              </button>
            </div>

            {/* Recommendations */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-slate-200">
                {recs.length > 0 ? `Recommendations for ${client?.company_name}` : 'AI Recommendations'}
              </h2>

              {generating && (
                <div className="flex items-center gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent"/>
                  <p className="text-sm text-indigo-300">Analysing EPR obligations and compliance gaps…</p>
                </div>
              )}

              {!generating && recs.length === 0 && (
                <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center">
                  <p className="text-sm text-slate-600">Select a client and click "Generate Recommendations" to see AI-powered training suggestions.</p>
                </div>
              )}

              {recs.map((r, i) => (
                <div key={i} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500/30 to-violet-500/30 text-indigo-300 text-xs font-bold">
                      #{i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-200">{r.title}</p>
                        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_META[r.priority]}`}>{r.priority}</span>
                      </div>
                      <p className="text-[11px] text-indigo-400 mt-0.5">{r.type}</p>
                      <p className="text-[11px] text-slate-500 mt-1">{r.reason}</p>
                    </div>
                    <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition shrink-0">Schedule</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
