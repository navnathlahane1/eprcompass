'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

function badgeTier(tier: string) {
  if (tier === 'EALP') return 'bg-violet-900/30 text-purple-800';
  if (tier === 'CEPC') return 'bg-blue-900/30 text-blue-300';
  return 'bg-slate-100 text-slate-700';
}

function badgeStatus(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Certified') return 'bg-blue-900/30 text-blue-300';
  if (status === 'Suspended') return 'bg-amber-100 text-amber-800';
  if (status === 'Inactive') return 'bg-slate-100 text-slate-700';
  return 'bg-amber-900/30 text-amber-200';
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export default function CEPCDirectoryClient({ initialRows }: { initialRows: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ tier: 'All', status: 'All', state: 'All' });

  const options = useMemo(() => {
    const tier = Array.from(new Set((initialRows || []).map((r) => r.certification_tier).filter(Boolean))).sort();
    const status = Array.from(new Set((initialRows || []).map((r) => r.status).filter(Boolean))).sort();
    const state = Array.from(new Set((initialRows || []).map((r) => r.state).filter(Boolean))).sort();
    return { tier, status, state };
  }, [initialRows]);

  const rows = useMemo(() => {
    return (initialRows || []).filter((row) => {
      const tierOk = filters.tier === 'All' || row.certification_tier === filters.tier;
      const statusOk = filters.status === 'All' || row.status === filters.status;
      const stateOk = filters.state === 'All' || row.state === filters.state;
      return tierOk && statusOk && stateOk;
    });
  }, [initialRows, filters]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">CEPC Directory</h1>
        <p className="mt-1 text-sm text-slate-400">Consultants performance, territory assignment, and commission summary.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-3">
        <select value={filters.tier} onChange={(e) => setFilters((p) => ({ ...p, tier: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
          <option value="All">Tier: All</option>
          {options.tier.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={filters.status} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
          <option value="All">Status: All</option>
          {options.status.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>

        <select value={filters.state} onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value }))} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
          <option value="All">State: All</option>
          {options.state.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </div>

      <section className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Tier</th>
              <th className="px-4 py-3">States</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Leads Submitted</th>
              <th className="px-4 py-3">Converted</th>
              <th className="px-4 py-3">Revenue Generated</th>
              <th className="px-4 py-3">Commission Due</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const expanded = expandedId === row.id;
              return (
                <>
                  <tr key={row.id} className="cursor-pointer border-b border-slate-800/60 hover:bg-slate-950" onClick={() => setExpandedId((p) => (p === row.id ? null : row.id))}>
                    <td className="px-4 py-3 font-medium text-slate-100">
                      <Link href={`/admin/cepc/${row.id}`} className="hover:text-blue-300">{row.full_name}</Link>
                    </td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTier(row.certification_tier)}`}>{row.certification_tier}</span></td>
                    <td className="px-4 py-3 text-slate-200">{(row.territory_states || []).join(', ') || '-'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeStatus(row.status)}`}>{row.status}</span></td>
                    <td className="px-4 py-3 text-slate-200">{row.leadsSubmitted}</td>
                    <td className="px-4 py-3 text-slate-200">{row.converted}</td>
                    <td className="px-4 py-3 text-slate-200">{formatINR(row.revenueGenerated)}</td>
                    <td className="px-4 py-3 text-slate-200">{formatINR(row.commissionDue)}</td>
                  </tr>
                  {expanded ? (
                    <tr>
                      <td className="px-4 py-3" colSpan={8}>
                        <div className="grid grid-cols-1 gap-4 rounded-lg border border-slate-800 bg-slate-950 p-3 lg:grid-cols-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Territory</p>
                            <p className="mt-2 text-sm text-slate-200">States: {(row.territory_states || []).join(', ') || '-'}</p>
                            <p className="mt-1 text-sm text-slate-200">Cities: {(row.territory_cities || []).join(', ') || '-'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Earnings Summary</p>
                            <p className="mt-2 text-sm text-slate-200">Revenue: {formatINR(row.revenueGenerated)}</p>
                            <p className="mt-1 text-sm text-slate-200">Commission Due: {formatINR(row.commissionDue)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Last 5 Leads</p>
                            <ul className="mt-2 space-y-1 text-sm text-slate-200">
                              {(row.recentLeads || []).length === 0 ? <li>No recent leads</li> : null}
                              {(row.recentLeads || []).slice(0, 5).map((lead: any) => (
                                <li key={lead.id}>{lead.client_company} · {lead.stage}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between gap-2">
              <Link href={`/admin/cepc/${row.id}`} className="text-sm font-semibold text-slate-100 hover:text-blue-300">{row.full_name}</Link>
              <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTier(row.certification_tier)}`}>{row.certification_tier}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">State: {row.state || '-'}</p>
            <p className="text-xs text-slate-400">Status: {row.status}</p>
            <p className="text-xs text-slate-400">Leads: {row.leadsSubmitted} · Converted: {row.converted}</p>
            <p className="text-xs text-slate-400">Revenue: {formatINR(row.revenueGenerated)}</p>
            <p className="text-xs text-slate-400">Commission Due: {formatINR(row.commissionDue)}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
