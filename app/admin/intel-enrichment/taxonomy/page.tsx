'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type TaxonomyNode = {
  id: string;
  name: string;
  level: number;
  parent_id: string | null;
  compliance_category_keys: string[] | null;
  hsn_codes: string[] | null;
  is_epr_relevant: boolean;
};

type Synonym = {
  id: string;
  term: string;
  synonyms: string[];
  is_active: boolean;
};

export default function IntelTaxonomyPage() {
  const [taxonomy, setTaxonomy] = useState<TaxonomyNode[]>([]);
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'taxonomy' | 'synonyms'>('taxonomy');
  const [newTerm, setNewTerm] = useState('');
  const [newSynonyms, setNewSynonyms] = useState('');
  const [synBusy, setSynBusy] = useState(false);
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const [taxRes, synRes] = await Promise.all([
        fetch(`${BASE}/intel/taxonomy`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${BASE}/intel/search/synonyms`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (taxRes.ok) {
        const data = await taxRes.json();
        setTaxonomy(data.taxonomy || []);
      }
      if (synRes.ok) {
        const data = await synRes.json();
        setSynonyms(data.synonyms || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load taxonomy');
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  async function addSynonym(e: React.FormEvent) {
    e.preventDefault();
    if (!newTerm.trim() || !newSynonyms.trim()) return;
    setSynBusy(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const synonymList = newSynonyms.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${BASE}/intel/search/synonyms`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: newTerm.trim().toLowerCase(), synonyms: synonymList }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setNewTerm('');
      setNewSynonyms('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add synonym');
    } finally {
      setSynBusy(false);
    }
  }

  const level1 = taxonomy.filter((t) => t.level === 1);

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/intel-enrichment" className="text-xs text-teal-400 hover:underline">
          ← Control Center
        </Link>
        <h1 className="mt-1 text-xl font-bold text-slate-100">Taxonomy & Search</h1>
        <p className="mt-0.5 text-sm text-slate-400">Product taxonomy categories and search synonym management</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['taxonomy', 'synonyms'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === tab
                ? 'border-teal-500/60 bg-teal-500/20 text-teal-200'
                : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:border-slate-500'
            }`}
          >
            {tab === 'taxonomy' ? 'Product Taxonomy' : 'Search Synonyms'}
          </button>
        ))}
      </div>

      {activeTab === 'taxonomy' && (
        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : level1.length === 0 ? (
            <p className="text-sm text-slate-500">No taxonomy nodes found.</p>
          ) : (
            level1.map((node) => {
              const children = taxonomy.filter((t) => t.parent_id === node.id);
              return (
                <div key={node.id} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-100">{node.name}</p>
                    {node.is_epr_relevant && (
                      <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1.5 py-0.5 text-[10px] text-teal-300">EPR</span>
                    )}
                    {(node.compliance_category_keys?.length ?? 0) > 0 && (
                      <span className="text-[10px] text-slate-500">
                        {node.compliance_category_keys!.join(', ')}
                      </span>
                    )}
                  </div>
                  {children.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {children.map((child) => (
                        <span key={child.id} className="rounded border border-slate-700 bg-slate-800/50 px-2 py-0.5 text-[11px] text-slate-300">
                          {child.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'synonyms' && (
        <div className="space-y-4">
          {/* Add synonym form */}
          <form onSubmit={addSynonym} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-sm font-semibold text-slate-300 mb-3">Add / Update Synonym</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Term</label>
                <input
                  type="text"
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g. battery"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400">Synonyms (comma-separated)</label>
                <input
                  type="text"
                  value={newSynonyms}
                  onChange={(e) => setNewSynonyms(e.target.value)}
                  placeholder="e.g. batteries, cell, cells"
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-teal-500 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={synBusy || !newTerm.trim() || !newSynonyms.trim()}
              className="mt-3 rounded-md border border-teal-600/50 bg-teal-500/10 px-4 py-2 text-xs font-semibold text-teal-200 hover:bg-teal-500/20 disabled:opacity-50"
            >
              {synBusy ? 'Saving…' : 'Save Synonym'}
            </button>
          </form>

          {/* Synonym list */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 overflow-hidden">
            {loading ? (
              <p className="px-4 py-6 text-sm text-slate-500">Loading…</p>
            ) : synonyms.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No synonyms configured.</p>
            ) : (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">Term</th>
                    <th className="px-4 py-3">Synonyms</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {synonyms.map((syn) => (
                    <tr key={syn.id} className="border-b border-slate-800/40">
                      <td className="px-4 py-2 font-medium text-slate-200 text-xs">{syn.term}</td>
                      <td className="px-4 py-2 text-xs text-slate-400">{syn.synonyms.join(', ')}</td>
                      <td className="px-4 py-2">
                        <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                          syn.is_active
                            ? 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300'
                            : 'border-slate-700 bg-slate-800/40 text-slate-400'
                        }`}>
                          {syn.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
