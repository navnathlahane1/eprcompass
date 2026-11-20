'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import EnrichmentBadge from '@/components/telecalling/EnrichmentBadge';
import CallLogModal from '@/components/telecalling/CallLogModal';
import AddCompanyModal from '@/components/telecalling/AddCompanyModal';
import IntelSyncBadge from '@/components/telecalling/IntelSyncBadge';
import { trackEvent } from '@/lib/analytics';

const TC_STATUSES = ['All', 'New', 'Contacted', 'Interested', 'Not Interested', 'DNC', 'Converted'];

const BULK_ACTIONS = [
  { value: 'reassign', label: 'Re-assign agent' },
  { value: 'assign_campaign', label: 'Assign to campaign' },
  { value: 'mark_dnc', label: 'Mark DNC' },
  { value: 'reset_status', label: 'Reset to New' },
];

export default function LeadsClient() {
  const [leads, setLeads] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [callTarget, setCallTarget] = useState<any>(null);
  const [showAddCompany, setShowAddCompany] = useState(false);

  // Feature 6: Bulk select
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('reassign');
  const [bulkInput, setBulkInput] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (search) params.set('search', search);
    if (statusFilter !== 'All') params.set('tc_status', statusFilter);
    const res = await fetch(`/api/admin/telecalling/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotal(data.total || 0);
    setLoading(false);
    setSelected(new Set());
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function handleEnrich(leadId: string) {
    await fetch(`/api/admin/telecalling/leads/${leadId}/enrich`, { method: 'POST' });
    trackEvent('Telecalling Lead Enriched', {});
    load();
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === leads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(leads.map(l => l.id)));
    }
  }

  async function executeBulk() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setBulkMsg('');
    const body: Record<string, any> = { lead_ids: Array.from(selected), action: bulkAction };
    if (bulkAction === 'reassign') body.agent_id = bulkInput;
    if (bulkAction === 'assign_campaign') body.campaign_id = bulkInput;
    const res = await fetch('/api/admin/telecalling/leads/bulk', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    const d = await res.json();
    setBulkLoading(false);
    setBulkMsg(d.error ? `Error: ${d.error}` : `✓ Updated ${d.updated} leads`);
    if (!d.error) {
      trackEvent('Telecalling Bulk Lead Action', { action: bulkAction, lead_count: body.lead_ids.length });
      setSelected(new Set()); load();
    }
  }

  const anySelected = selected.size > 0;
  const needsInput = bulkAction === 'reassign' || bulkAction === 'assign_campaign';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">
          Leads <span className="text-sm font-normal text-slate-500">({total})</span>
        </h1>
        <button
          onClick={() => setShowAddCompany(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-200 rounded-lg text-sm font-semibold hover:bg-teal-500/30 transition-colors"
        >
          <span className="text-lg leading-none">+</span> Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search company or contact..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100 w-64"
        />
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        >
          {TC_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Feature 6: Bulk action toolbar */}
      {anySelected && (
        <div className="flex flex-wrap items-center gap-2 mb-4 px-4 py-3 bg-teal-500/10 border border-teal-500/20 rounded-xl">
          <span className="text-sm font-semibold text-teal-200">{selected.size} selected</span>
          <select
            value={bulkAction}
            onChange={e => { setBulkAction(e.target.value); setBulkInput(''); setBulkMsg(''); }}
            className="border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100"
          >
            {BULK_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          {needsInput && (
            <input
              type="text"
              placeholder={bulkAction === 'reassign' ? 'Agent ID…' : 'Campaign ID…'}
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              className="border border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-slate-900/60 text-slate-100 w-48"
            />
          )}
          <button
            onClick={executeBulk}
            disabled={bulkLoading || (needsInput && !bulkInput.trim())}
            className="px-4 py-1.5 bg-teal-500/20 border border-teal-500/40 text-teal-200 rounded-lg text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40"
          >
            {bulkLoading ? 'Applying…' : 'Apply'}
          </button>
          {bulkMsg && <span className="text-xs text-slate-400">{bulkMsg}</span>}
          <button
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300"
          >
            Clear
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No leads found</div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === leads.length && leads.length > 0}
                    onChange={toggleAll}
                    className="rounded border-slate-600 bg-slate-800"
                  />
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Company</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Phone</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">AI</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Intel</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Calls</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Last Remark</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead: any) => (
                <tr
                  key={lead.id}
                  className={`border-b border-slate-800 last:border-0 hover:bg-slate-800/40 ${selected.has(lead.id) ? 'bg-teal-500/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleSelect(lead.id)}
                      className="rounded border-slate-600 bg-slate-800"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/telecalling/leads/${lead.id}`} className="font-medium text-slate-200 hover:text-teal-400">
                      {lead.company_name || lead.name || '—'}
                    </Link>
                    {(lead.city || lead.state) && (
                      <div className="text-xs text-slate-500">{[lead.city, lead.state].filter(Boolean).join(', ')}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {lead.contact_name || '—'}
                    {lead.email && <div className="text-xs text-slate-500">{lead.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{lead.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
                      {lead.tc_status || 'New'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <EnrichmentBadge
                      status={lead.tc_enrichment_status || 'none'}
                      score={lead.enrichment?.epr_applicability_score}
                      onClick={() => handleEnrich(lead.id)}
                    />
                  </td>
                  {/* Feature 7: Intel sync badge */}
                  <td className="px-4 py-3">
                    <IntelSyncBadge
                      intelCompanyId={lead.intel_company_id}
                      enrichmentLevel={lead.intel_enrichment_level}
                      compact
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{lead.tc_call_count || 0}</td>
                  <td className="px-4 py-3 max-w-[220px]">
                    {lead.last_call ? (
                      <div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          lead.last_call.disposition === 'Interested'     ? 'bg-green-900/40 text-green-400' :
                          lead.last_call.disposition === 'Not Interested' ? 'bg-red-900/30 text-red-400' :
                          lead.last_call.disposition === 'Call Back'      ? 'bg-amber-900/30 text-amber-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {lead.last_call.disposition}
                        </span>
                        {lead.last_call.notes && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-tight">{lead.last_call.notes}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">No calls yet</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setCallTarget(lead)}
                      className="px-3 py-1 bg-teal-500/15 border border-teal-500/30 text-white rounded-lg text-xs font-medium hover:bg-teal-500/20"
                    >
                      Log Call
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 text-sm text-slate-400">
        <span>{total} total</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Next</button>
        </div>
      </div>

      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSaved={() => { setShowAddCompany(false); load(); }}
        />
      )}

      {callTarget && (
        <CallLogModal
          leadId={callTarget.id}
          leadName={callTarget.contact_name || callTarget.company_name || ''}
          onClose={() => setCallTarget(null)}
          onSaved={() => { setCallTarget(null); load(); }}
        />
      )}
    </div>
  );
}
