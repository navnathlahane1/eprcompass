'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type Classification = {
  id: string;
  company_id: string;
  entity_type: string;
  confidence: number;
  detection_method: string;
  is_primary: boolean;
  is_operational: boolean;
  verified_at: string | null;
  detection_signals: Record<string, unknown> | null;
  intel_companies?: { canonical_name: string; state: string | null } | null;
};

const ENTITY_LABELS: Record<string, string> = {
  listed: 'Listed', mnc: 'MNC', public_limited: 'Public Ltd',
  private_limited: 'Private Ltd', llp: 'LLP', partnership: 'Partnership',
  proprietorship: 'Proprietorship', holding: 'Holding', subsidiary: 'Subsidiary',
  government: 'Govt', psu: 'PSU', ngo_trust_society: 'NGO/Trust',
  individual: 'Individual', foreign_company: 'Foreign',
};

export default function IntelClassificationsPage() {
  const [items, setItems] = useState<Classification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const BASE = getIntelApiBaseUrl();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const res = await fetch(`${BASE}/intel/admin/classifications/pending?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.classifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load classifications');
    } finally {
      setLoading(false);
    }
  }, [BASE]);

  useEffect(() => { load(); }, [load]);

  async function verifyClassification(item: Classification) {
    setActionBusy(item.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in.');
      const res = await fetch(
        `${BASE}/intel/companies/${item.company_id}/entity-classification/${item.id}`,
        {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ entity_type: item.entity_type, override_reason: 'verified by admin' }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setItems((prev) => prev.filter((c) => c.id !== item.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verify failed');
    } finally {
      setActionBusy(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/intel-enrichment" className="text-xs text-teal-400 hover:underline">
            ← Control Center
          </Link>
          <h1 className="mt-1 text-xl font-bold text-slate-100">Entity Classifications</h1>
          <p className="mt-0.5 text-sm text-slate-400">Unverified auto-classifications awaiting review</p>
        </div>
        <button onClick={load} className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-200 hover:border-teal-600">
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-sm text-red-300">{error}</div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/70">
        {loading ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-slate-500">No unverified classifications.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Entity Type</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Flags</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const company = item.intel_companies as any;
                  const busy = actionBusy === item.id;
                  return (
                    <tr key={item.id} className="border-b border-slate-800/40 hover:bg-slate-800/20">
                      <td className="px-4 py-2">
                        <Link href={`/intel/companies/${item.company_id}`} className="font-medium text-teal-300 hover:underline text-xs">
                          {company?.canonical_name || item.company_id.slice(0, 8)}
                        </Link>
                        {company?.state && <p className="text-[10px] text-slate-500">{company.state}</p>}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-slate-200 text-xs">
                            {ENTITY_LABELS[item.entity_type] || item.entity_type}
                          </span>
                          {item.is_primary && (
                            <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1 py-0.5 text-[9px] text-teal-300">P</span>
                          )}
                          {item.is_operational && (
                            <span className="rounded border border-blue-700/50 bg-blue-500/10 px-1 py-0.5 text-[9px] text-blue-300">O</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-400">{item.detection_method}</td>
                      <td className="px-4 py-2 text-xs">
                        <span className={item.confidence >= 0.8 ? 'text-emerald-300' : item.confidence >= 0.6 ? 'text-amber-300' : 'text-red-300'}>
                          {Math.round(item.confidence * 100)}%
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-500">
                        {item.detection_signals
                          ? Object.keys(item.detection_signals).slice(0, 3).join(', ')
                          : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <button
                          disabled={busy}
                          onClick={() => verifyClassification(item)}
                          className="rounded border border-teal-700/50 bg-teal-500/10 px-2 py-1 text-[10px] font-medium text-teal-300 hover:bg-teal-500/20 disabled:opacity-50"
                        >
                          {busy ? '…' : 'Verify'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
