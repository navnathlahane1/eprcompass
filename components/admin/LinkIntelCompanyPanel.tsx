'use client';

/**
 * LinkIntelCompanyPanel
 * Lets an admin link a client record to its intel_companies row.
 * Once linked, client_contacts sync automatically to intel_company_associated_people.
 */

import { useState, useCallback } from 'react';

interface IntelMatch {
  id: string;
  canonical_name: string;
  gstin: string | null;
  state: string | null;
  company_type: string | null;
}

interface Props {
  clientId: string;
  current: IntelMatch | null;   // currently linked intel company (null if none)
}

export default function LinkIntelCompanyPanel({ clientId, current }: Props) {
  const [linked,    setLinked]    = useState<IntelMatch | null>(current);
  const [search,    setSearch]    = useState('');
  const [results,   setResults]   = useState<IntelMatch[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [open,      setOpen]      = useState(false);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/admin/intel-companies/search?q=${encodeURIComponent(q)}&limit=8`);
    if (res.ok) { const d = await res.json(); setResults(d.companies ?? []); }
    setSearching(false);
  }, []);

  async function link(company: IntelMatch | null) {
    setSaving(true); setMsg(null);
    const res = await fetch(`/api/admin/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intel_company_id: company?.id ?? null }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      setLinked(company);
      setMsg({ ok: true, text: company ? `Linked to "${company.canonical_name}"` : 'Intel company unlinked.' });
      setOpen(false); setSearch(''); setResults([]);
    } else {
      setMsg({ ok: false, text: d.error ?? 'Failed to save.' });
    }
    setSaving(false);
  }

  return (
    <section className="admin-card">
      <div className="admin-card-header flex items-center justify-between">
        <span>Intel Company Link</span>
        {!open && (
          <button onClick={() => setOpen(true)}
            className="text-xs text-teal-400 hover:text-teal-300 transition font-medium">
            {linked ? 'Change' : '+ Link'}
          </button>
        )}
      </div>

      <div className="admin-card-body space-y-3">
        {/* Current link */}
        {linked ? (
          <div className="flex items-center justify-between rounded-lg border border-teal-500/20 bg-teal-500/5 px-3 py-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-teal-300 truncate">{linked.canonical_name}</p>
              <p className="text-[11px] text-slate-500">
                {[linked.gstin, linked.state, linked.company_type].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex items-center gap-2 ml-3 shrink-0">
              <a
                href={`/intel/companies/${linked.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 hover:text-teal-300 transition"
              >
                View ↗
              </a>
              <button
                onClick={() => link(null)}
                disabled={saving}
                className="text-[11px] text-slate-500 hover:text-rose-400 transition disabled:opacity-40"
              >
                Unlink
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-500">
            No intel company linked. Contacts won&apos;t sync to the Intel panel until you link one.
          </p>
        )}

        {/* Search panel */}
        {open && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); doSearch(e.target.value); }}
                placeholder="Search by company name or GSTIN…"
                className="flex-1 h-8 rounded-lg border border-slate-700/60 bg-slate-800 px-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                autoFocus
              />
              <button
                onClick={() => { setOpen(false); setSearch(''); setResults([]); }}
                className="h-8 px-3 rounded-lg border border-slate-700/40 text-sm text-slate-500 hover:text-slate-300 transition"
              >
                Cancel
              </button>
            </div>

            {searching && <p className="text-xs text-slate-500 pl-1">Searching…</p>}

            {results.length > 0 && (
              <div className="rounded-lg border border-slate-700/60 bg-slate-900 divide-y divide-slate-800/60 overflow-hidden">
                {results.map(c => (
                  <button
                    key={c.id}
                    onClick={() => link(c)}
                    disabled={saving}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-800/60 transition disabled:opacity-50"
                  >
                    <p className="text-sm font-medium text-slate-200">{c.canonical_name}</p>
                    <p className="text-[11px] text-slate-500">
                      {[c.gstin, c.state, c.company_type].filter(Boolean).join(' · ')}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {!searching && search.trim() && results.length === 0 && (
              <p className="text-xs text-slate-500 pl-1">No intel companies found for &ldquo;{search}&rdquo;</p>
            )}
          </div>
        )}

        {msg && (
          <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>
        )}

        <p className="text-[11px] text-slate-600">
          When linked, any contacts added in the client&apos;s Team tab automatically appear as Associated People in the Intel panel for this company.
        </p>
      </div>
    </section>
  );
}
