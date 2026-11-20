'use client';

import React from 'react';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import TourTarget from '@/components/portal/tour/TourTarget';

type DashboardSummary = {
  total_pipeline_value_inr: number;
  hot_leads: number;
  total_penalty_inr: number;
  enrichment_coverage_pct: number;
  active_sources: number;
  total_companies: number;
};

type OpportunityRow = {
  state: string;
  category: string;
  penalty_inr: number;
  notices: number;
};

type SchemaChangeSummary = {
  queued: number;
  applied: number;
  failed: number;
  total: number;
};

type CertificateBreakdownRow = {
  certificate_type: string;
  companies: number;
};

type WasteCategoryBreakdownRow = {
  waste_category: string;
  total_companies: number;
  certificate_breakdown: CertificateBreakdownRow[];
};

function formatInr(value: number | null | undefined): string {
  const n = Number(value || 0);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)}Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

type Module = { href: string; icon: React.ReactNode; iconBg: string; label: string; description: string; color: string; badge: string | null };
const MODULES: Module[] = [
  {
    href: '/intel/companies',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5h6v5"/>
      </svg>
    ),
    iconBg: 'border-teal-700/30 bg-teal-500/10 text-teal-400',
    label: 'Companies',
    description: 'Browse, filter, and enrich the full entity database',
    color: 'border-slate-800 hover:border-teal-500/40',
    badge: null,
  },
  {
    href: '/intel/cockpit',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
    iconBg: 'border-amber-700/30 bg-amber-500/10 text-amber-400',
    label: 'Strategy Cockpit',
    description: '5-canvas executive view: market share, risk, plays, scenarios',
    color: 'border-slate-800 hover:border-amber-500/40',
    badge: 'HOT',
  },
  {
    href: '/intel/discovery',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
      </svg>
    ),
    iconBg: 'border-cyan-700/30 bg-cyan-500/10 text-cyan-400',
    label: 'Discovery Ops',
    description: 'Run scraper jobs and review raw signals from the web',
    color: 'border-slate-800 hover:border-cyan-500/40',
    badge: null,
  },
  {
    href: '/intel/sources',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/>
      </svg>
    ),
    iconBg: 'border-violet-700/30 bg-violet-500/10 text-violet-400',
    label: 'Source Registry',
    description: 'Manage data providers, license flags, and document uploads',
    color: 'border-slate-800 hover:border-violet-500/40',
    badge: null,
  },
  {
    href: '/intel/export',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
    iconBg: 'border-slate-700/40 bg-slate-700/20 text-slate-400',
    label: 'Export',
    description: 'Download filtered company lists and pipeline reports as CSV/XLSX',
    color: 'border-slate-800 hover:border-slate-600',
    badge: null,
  },
  {
    href: '/intel/dynamic-columns',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20z"/><path d="M12 8v4m0 4h.01"/>
      </svg>
    ),
    iconBg: 'border-slate-700/40 bg-slate-700/20 text-slate-400',
    label: 'Dynamic Columns',
    description: 'Manage schema evolution queue — add/track custom company fields',
    color: 'border-slate-800 hover:border-slate-600',
    badge: null,
  },
  {
    href: '/intel/templates',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    iconBg: 'border-slate-700/40 bg-slate-700/20 text-slate-400',
    label: 'Mapping Templates',
    description: 'Define column mappings for ingesting workbook uploads',
    color: 'border-slate-800 hover:border-slate-600',
    badge: null,
  },
  {
    href: '/intel/upload',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    iconBg: 'border-slate-700/40 bg-slate-700/20 text-slate-400',
    label: 'Upload & Map',
    description: 'Import company data via Excel/CSV with template-guided field mapping',
    color: 'border-slate-800 hover:border-slate-600',
    badge: null,
  },
];

export default function IntelHomePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [opportunityRows, setOpportunityRows] = useState<OpportunityRow[]>([]);
  const [schemaSummary, setSchemaSummary] = useState<SchemaChangeSummary | null>(null);
  const [categoryCertificateRows, setCategoryCertificateRows] = useState<WasteCategoryBreakdownRow[]>([]);

  const authHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return null;
    return { Authorization: `Bearer ${token}` };
  }, []);

  const fetchIntelApi = useCallback(async (path: string, init?: RequestInit) => {
    const apiBaseUrl = getIntelApiBaseUrl();
    try {
      return await fetch(`${apiBaseUrl}${path}`, init);
    } catch (primaryError) {
      if (!apiBaseUrl) throw primaryError;
      return fetch(path, init);
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    const loadSchemaSummaryFromSupabase = async () => {
      const { data: schemaQueueRows } = await supabase
        .from('intel_schema_change_queue')
        .select('id, status')
        .limit(200);

      const schemaQueue = schemaQueueRows || [];
      setSchemaSummary({
        queued: schemaQueue.filter((r: any) => r.status === 'queued').length,
        applied: schemaQueue.filter((r: any) => r.status === 'applied').length,
        failed: schemaQueue.filter((r: any) => r.status === 'failed').length,
        total: schemaQueue.length,
      });
    };

    const loadCategoryCertificateBreakdownFromSupabase = async () => {
      const pageSize = 5000;
      const maxRowsToScan = 300000;
      let from = 0;
      const categoryCompanySets = new Map<string, Set<string>>();
      const comboCompanySets = new Map<string, Set<string>>();

      while (from < maxRowsToScan) {
        const { data, error } = await supabase
          .from('intel_company_registrations')
          .select('company_id, waste_category, registration_type')
          .order('company_id', { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          if (String(error.message || '').includes('intel_company_registrations')) {
            setCategoryCertificateRows([]);
            return;
          }
          throw error;
        }

        const rows = data || [];
        for (const row of rows as any[]) {
          const companyId = String(row.company_id || '').trim();
          if (!companyId) continue;

          const wasteCategory = String(row.waste_category || '').trim() || 'Unknown';
          const certificateType = String(row.registration_type || '').trim() || 'Unknown';

          if (!categoryCompanySets.has(wasteCategory)) categoryCompanySets.set(wasteCategory, new Set<string>());
          categoryCompanySets.get(wasteCategory)?.add(companyId);

          const comboKey = `${wasteCategory}__${certificateType}`;
          if (!comboCompanySets.has(comboKey)) comboCompanySets.set(comboKey, new Set<string>());
          comboCompanySets.get(comboKey)?.add(companyId);
        }

        if (rows.length < pageSize) break;
        from += pageSize;
      }

      const categoryRows = Array.from(categoryCompanySets.entries())
        .map(([wasteCategory, companySet]) => {
          const certificateBreakdown = Array.from(comboCompanySets.entries())
            .filter(([key]) => key.startsWith(`${wasteCategory}__`))
            .map(([key, companyIds]) => ({
              certificate_type: key.slice((`${wasteCategory}__`).length) || 'Unknown',
              companies: companyIds.size,
            }))
            .sort((a, b) => b.companies - a.companies);

          return {
            waste_category: wasteCategory,
            total_companies: companySet.size,
            certificate_breakdown: certificateBreakdown,
          };
        })
        .sort((a, b) => b.total_companies - a.total_companies);

      setCategoryCertificateRows(categoryRows);
    };

    const loadFromSupabase = async () => {
      const [
        { data: pipelineRows },
        { data: noticeRows },
        { count: totalCompaniesCount },
        { count: enrichedCompaniesCount },
        { count: activeSourcesCount },
        { data: companyRows },
      ] = await Promise.all([
        supabase.from('intel_pipeline_records').select('estimated_deal_size_inr, urgency_tier'),
        supabase.from('intel_notices').select('company_id, waste_category, penalty_inr'),
        supabase.from('intel_companies').select('id', { count: 'exact', head: true }),
        supabase.from('intel_companies').select('id', { count: 'exact', head: true }).not('website', 'is', null),
        supabase.from('intel_sources').select('id', { count: 'exact', head: true }).eq('active', true),
        supabase.from('intel_companies').select('id, state').limit(50000),
      ]);

      const pipeline = pipelineRows || [];
      const notices = noticeRows || [];
      const companies = companyRows || [];
      const totalCompanies = Number(totalCompaniesCount || 0);
      const enrichedCompanies = Number(enrichedCompaniesCount || 0);

      const totalPipelineValue = pipeline.reduce((sum: number, row: any) => sum + Number(row.estimated_deal_size_inr || 0), 0);
      const hotLeads = pipeline.filter((row: any) => row.urgency_tier === 'hot').length;
      const totalPenalty = notices.reduce((sum: number, row: any) => sum + Number(row.penalty_inr || 0), 0);
      const enrichmentCoveragePct = totalCompanies ? Number(((enrichedCompanies / totalCompanies) * 100).toFixed(1)) : 0;

      const companyStateMap = new Map<string, string>();
      for (const company of companies as any[]) companyStateMap.set(company.id, company.state || 'Unknown');

      const oppMap = new Map<string, OpportunityRow>();
      for (const notice of notices as any[]) {
        const state = companyStateMap.get(notice.company_id) || 'Unknown';
        const category = notice.waste_category || 'Unknown';
        const key = `${state}__${category}`;
        const cur = oppMap.get(key) || { state, category, penalty_inr: 0, notices: 0 };
        cur.penalty_inr += Number(notice.penalty_inr || 0);
        cur.notices += 1;
        oppMap.set(key, cur);
      }

      setSummary({
        total_pipeline_value_inr: totalPipelineValue,
        hot_leads: hotLeads,
        total_penalty_inr: totalPenalty,
        enrichment_coverage_pct: enrichmentCoveragePct,
        active_sources: Number(activeSourcesCount || 0),
        total_companies: totalCompanies,
      });
      setOpportunityRows([...oppMap.values()].sort((a, b) => b.penalty_inr - a.penalty_inr).slice(0, 5));
      await Promise.all([
        loadSchemaSummaryFromSupabase(),
        loadCategoryCertificateBreakdownFromSupabase(),
      ]);
    };

    try {
      const headers = await authHeaders();
      if (headers) {
        const [summaryResp, oppResp, categoryBreakdownResp] = await Promise.all([
          fetchIntelApi('/api/intel/dashboard/summary', { headers }),
          fetchIntelApi('/api/intel/dashboard/opportunity-by-state', { headers }),
          fetchIntelApi('/api/intel/dashboard/category-certificate-breakdown', { headers }),
        ]);
        if (summaryResp.ok && oppResp.ok) {
          const sp = await summaryResp.json();
          const op = await oppResp.json();
          setSummary(sp.summary || null);
          setOpportunityRows((op.rows || []).slice(0, 5));
          if (categoryBreakdownResp.ok) {
            const cb = await categoryBreakdownResp.json();
            setCategoryCertificateRows(cb.rows || []);
          } else {
            await loadCategoryCertificateBreakdownFromSupabase();
          }
          await loadSchemaSummaryFromSupabase(); // only fill schema queue cards
          return;
        }
      }
      await loadFromSupabase();
    } catch {
      try { await loadFromSupabase(); } catch { setError('Dashboard load failed. Check your connection.'); }
    } finally {
      setLoading(false);
    }
  }, [authHeaders, fetchIntelApi]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  const maxPenalty = useMemo(
    () => Math.max(1, ...opportunityRows.map((r) => Number(r.penalty_inr || 0))),
    [opportunityRows],
  );

  return (
    <div className="min-h-screen text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[140px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-cyan-500/4 blur-[120px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 py-8">

        {/* ─── Hero ──────────────────────────────────────────────── */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-slate-900 via-slate-900/90 to-teal-950/25 px-7 py-7 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-400">EPR Market Intelligence</p>
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Intel Workspace</h1>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">
                Unified pipeline — companies, penalties, recycler capacity, and strategy canvases.
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 transition duration-200 hover:border-teal-500/40 hover:bg-teal-500/10 hover:text-teal-300"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-rose-700/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        ) : null}

        {/* ─── KPI Strip ─────────────────────────────────────────── */}
        <TourTarget id="dash-kpi-strip" className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: 'Companies',    value: loading ? '…' : Number(summary?.total_companies || 0).toLocaleString('en-IN'), color: 'text-slate-100',   bar: 'bg-slate-500',   border: 'border-slate-700/50' },
            { label: 'Pipeline',     value: loading ? '…' : formatInr(summary?.total_pipeline_value_inr),                  color: 'text-teal-300',   bar: 'bg-teal-400',    border: 'border-teal-700/30' },
            { label: 'Hot Leads',    value: loading ? '…' : String(Number(summary?.hot_leads || 0)),                       color: 'text-amber-300',  bar: 'bg-amber-400',   border: 'border-amber-700/30' },
            { label: 'Penalty Opp.', value: loading ? '…' : formatInr(summary?.total_penalty_inr),                        color: 'text-rose-300',   bar: 'bg-rose-400',    border: 'border-rose-700/30' },
            { label: 'Sources',      value: loading ? '…' : String(Number(summary?.active_sources || 0)),                  color: 'text-cyan-300',   bar: 'bg-cyan-400',    border: 'border-cyan-700/30' },
            { label: 'Enrichment',   value: loading ? '…' : `${Number(summary?.enrichment_coverage_pct || 0)}%`,           color: 'text-violet-300', bar: 'bg-violet-400',  border: 'border-violet-700/30' },
          ].map((kpi) => (
            <div key={kpi.label} className={`rounded-xl border ${kpi.border} bg-slate-900/60 p-4 transition duration-200 hover:bg-slate-900/90`}>
              <div className={`mb-2.5 h-0.5 w-7 rounded-full opacity-70 ${kpi.bar}`} />
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">{kpi.label}</p>
              <p className={`mt-1.5 text-xl font-bold tabular-nums ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </TourTarget>

        {/* ─── Module Cards ──────────────────────────────────────── */}
        <TourTarget id="dash-modules" className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MODULES.map((mod) => (
            <Link
              key={mod.href}
              href={mod.href}
              className={`group relative flex flex-col gap-3 rounded-2xl border bg-slate-900/50 p-5 transition duration-200 ${mod.color}`}
            >
              {mod.badge && (
                <span className="absolute right-3.5 top-3.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-300">
                  {mod.badge}
                </span>
              )}
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${mod.iconBg}`}>
                {mod.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100 transition group-hover:text-white">{mod.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 transition group-hover:text-slate-400">{mod.description}</p>
              </div>
              <div className="mt-auto flex items-center gap-1 text-[11px] font-semibold text-teal-400 opacity-0 transition duration-150 group-hover:opacity-100">
                Open
                <svg className="h-3 w-3 transition-transform duration-150 group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14m-7-7 7 7-7 7"/>
                </svg>
              </div>
            </Link>
          ))}
        </TourTarget>

        {/* ─── Insights ────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">

          {/* Penalty heat */}
          <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                <h2 className="text-sm font-semibold text-slate-200">Top Penalty Segments</h2>
              </div>
              <Link href="/intel/companies" className="flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-teal-400">
                View all
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              </Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-slate-800/60" />)}
              </div>
            ) : opportunityRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/60">
                  <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-300">No penalty data yet</p>
                <p className="mt-1 text-xs text-slate-500">Ingest sources to populate opportunity signals.</p>
                <Link href="/intel/sources" className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-teal-700/40 px-3 py-1.5 text-xs text-teal-400 transition hover:border-teal-500/60">
                  Add sources
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunityRows.map((row, i) => {
                  const widthPct = Math.max(4, Math.round((Number(row.penalty_inr || 0) / maxPenalty) * 100));
                  return (
                    <div key={`${row.state}-${row.category}-${i}`}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                        <p className="truncate font-medium text-slate-300">{row.state} · {row.category}</p>
                        <p className="shrink-0 tabular-nums text-slate-400">{formatInr(row.penalty_inr)}</p>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 transition-all duration-700" style={{ width: `${widthPct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Schema queue */}
            <div className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <h2 className="text-sm font-semibold text-slate-200">Schema Change Queue</h2>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { href: '/intel/dynamic-columns?queueStatus=queued',  val: loading ? '…' : Number(schemaSummary?.queued || 0),  label: 'Queued',  cn: 'border-amber-700/30 bg-amber-500/8 hover:bg-amber-500/14 text-amber-300 label-color: text-amber-500' },
                  { href: '/intel/dynamic-columns?queueStatus=applied', val: loading ? '…' : Number(schemaSummary?.applied || 0), label: 'Applied', cn: 'border-emerald-700/30 bg-emerald-500/8 hover:bg-emerald-500/14 text-emerald-300' },
                  { href: '/intel/dynamic-columns?queueStatus=failed',  val: loading ? '…' : Number(schemaSummary?.failed || 0),  label: 'Failed',  cn: Number(schemaSummary?.failed || 0) > 0 ? 'border-rose-700/30 bg-rose-500/8 hover:bg-rose-500/14 text-rose-300' : 'border-slate-700/30 bg-slate-800/40 hover:bg-slate-800/60 text-slate-500' },
                ].map((item) => (
                  <Link key={item.label} href={item.href} className={`rounded-xl border p-3 text-center transition duration-150 ${item.cn}`}>
                    <p className="text-xl font-bold tabular-nums">{item.val}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-widest opacity-70">{item.label}</p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <TourTarget id="dash-quick-actions" className="rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5">
              <div className="mb-4 flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-violet-400" />
                <h2 className="text-sm font-semibold text-slate-200">Quick Actions</h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { href: '/intel/cockpit/standing', label: 'Market Share', cn: 'border-teal-700/30 bg-teal-500/5 text-teal-300 hover:bg-teal-500/10',     icon: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
                  { href: '/intel/cockpit/plays',    label: 'Best Plays',   cn: 'border-amber-700/30 bg-amber-500/5 text-amber-300 hover:bg-amber-500/10', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> },
                  { href: '/intel/cockpit/risk',     label: 'Risk View',    cn: 'border-rose-700/30 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10',     icon: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> },
                  { href: '/intel/cockpit/memo',     label: 'AI Memo',      cn: 'border-violet-700/30 bg-violet-500/5 text-violet-300 hover:bg-violet-500/10', icon: <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> },
                ].map((action) => (
                  <Link key={action.href} href={action.href} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition duration-150 ${action.cn}`}>
                    {action.icon}
                    {action.label}
                  </Link>
                ))}
              </div>
            </TourTarget>
          </div>
        </div>

        {/* ─── Waste Category × Certificate ───────────────────────── */}
        <TourTarget id="dash-waste-breakdown" className="mt-5 rounded-2xl border border-white/[0.06] bg-slate-900/60 p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Companies by Waste Category & Certificate Type</h2>
                <p className="mt-0.5 text-xs text-slate-500">Unique company counts grouped by category and certificate.</p>
              </div>
            </div>
            <Link href="/intel/companies" className="flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-teal-400">
              Explore
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-800/60" />)}
            </div>
          ) : categoryCertificateRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center">
              <p className="text-sm font-semibold text-slate-300">No breakdown data yet</p>
              <p className="mt-1 text-xs text-slate-500">Upload or sync company registrations to populate.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/70">
                    <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Waste Category</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Total</th>
                    <th className="px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Certificate Split</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {categoryCertificateRows.map((row) => (
                    <tr key={row.waste_category} className="align-top transition duration-100 hover:bg-slate-800/30">
                      <td className="px-3 py-3 font-medium text-slate-200">{row.waste_category}</td>
                      <td className="px-3 py-3 font-bold tabular-nums text-teal-300">{row.total_companies.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {row.certificate_breakdown.map((entry) => (
                            <span key={`${row.waste_category}-${entry.certificate_type}`} className="rounded-md border border-slate-700/60 bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-300">
                              {entry.certificate_type} <span className="text-teal-400">{entry.companies.toLocaleString('en-IN')}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TourTarget>

        {/* ─── Footer ──────────────────────────────────────────────── */}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800/60 pt-5">
          <Link href="/intel/cockpit" className="flex items-center gap-1.5 rounded-xl border border-teal-700/30 bg-teal-500/5 px-4 py-2 text-xs font-semibold text-teal-400 transition hover:bg-teal-500/10">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            Strategy Cockpit
          </Link>
          <Link href="/intel/companies" className="flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:text-slate-200">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5h6v5"/></svg>
            Browse Companies
          </Link>
          <Link href="/intel/leads" className="flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-slate-900/50 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:border-slate-600 hover:text-slate-200">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
            Lead Scoring
          </Link>
          <span className="ml-auto text-[10px] text-slate-700">EPR Intel Platform</span>
        </div>
      </section>
    </div>
  );
}
