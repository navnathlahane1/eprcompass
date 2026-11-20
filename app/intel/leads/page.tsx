'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string;
  company_id: string;
  company_name: string | null;
  state: string | null;
  website: string | null;
  waste_categories: string[];
  segment_tag: string | null;
  lead_score: number;
  tier: 'hot' | 'warm' | 'cold' | 'disqualified';
  size_score: number;
  compliance_urgency_score: number;
  enrichment_score: number;
  activity_score: number;
  epr_opportunity_score: number;
  insights: Array<{ type: string; label: string; confidence: number }>;
  ec_inr_cr: number | null;
  epr_target_mt: number | null;
  renewal_urgency: string | null;
  computed_at: string;
};

type TierCounts = { hot: number; warm: number; cold: number; disqualified: number };

type ContactRow = {
  id: string;
  company_id: string;
  company_name: string | null;
  company_state: string | null;
  company_industry: string | null;
  company_size: string | null;
  person_name: string;
  designation: string | null;
  department: string | null;
  management_level: string | null;
  seniority_level: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  source_platform: string | null;
  confidence_score: number | null;
  created_at: string;
};

type ContactStats = {
  total_contacts: number;
  by_platform: Array<{ label: string; count: number }>;
  by_mgmt_level: Array<{ label: string; count: number }>;
  by_department: Array<{ label: string; count: number }>;
};

// ─── Config ───────────────────────────────────────────────────────────────────

const TIER_CONFIG = {
  hot:  { color: 'border-rose-500/50 bg-rose-500/10 text-rose-200', bar: 'bg-rose-500', badge: 'border-rose-600/50 bg-rose-500/15 text-rose-200' },
  warm: { color: 'border-amber-500/50 bg-amber-500/10 text-amber-200', bar: 'bg-amber-500', badge: 'border-amber-600/50 bg-amber-500/15 text-amber-200' },
  cold: { color: 'border-slate-600 bg-slate-800/40 text-slate-300', bar: 'bg-slate-500', badge: 'border-slate-600 bg-slate-800/50 text-slate-400' },
  disqualified: { color: 'border-slate-700 bg-slate-900/40 text-slate-500', bar: 'bg-slate-700', badge: 'border-slate-700 bg-slate-900/40 text-slate-500' },
};

const MGMT_LEVEL_CONFIG: Record<string, { label: string; color: string }> = {
  c_suite:   { label: 'C-Suite',   color: 'border-amber-600/50 bg-amber-500/15 text-amber-200' },
  vp:        { label: 'VP',        color: 'border-violet-600/50 bg-violet-500/15 text-violet-200' },
  director:  { label: 'Director',  color: 'border-blue-600/50 bg-blue-500/15 text-blue-200' },
  manager:   { label: 'Manager',   color: 'border-teal-600/50 bg-teal-500/15 text-teal-200' },
  ic:        { label: 'IC',        color: 'border-slate-600 bg-slate-800/50 text-slate-400' },
  intern:    { label: 'Intern',    color: 'border-slate-700 bg-slate-900/50 text-slate-500' },
  unknown:   { label: '—',         color: 'border-slate-800 bg-slate-900 text-slate-600' },
};

const PLATFORM_COLORS: Record<string, string> = {
  apollo:            'border-violet-700/40 bg-violet-500/10 text-violet-200',
  zoominfo:          'border-blue-700/40 bg-blue-500/10 text-blue-200',
  lusha:             'border-pink-700/40 bg-pink-500/10 text-pink-200',
  crunchbase:        'border-green-700/40 bg-green-500/10 text-green-200',
  linkedin:          'border-sky-700/40 bg-sky-500/10 text-sky-200',
  leadrocks_bulk_csv:'border-cyan-700/40 bg-cyan-500/10 text-cyan-200',
  leadrocks:         'border-cyan-700/40 bg-cyan-500/10 text-cyan-200',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.round(Number(value || 0) * 100)}%` }} />
      </div>
      <span className="w-7 text-right text-[10px] tabular-nums text-slate-400">{Math.round(Number(value || 0) * 100)}%</span>
    </div>
  );
}

function formatInr(n: number | null | undefined) {
  const v = Number(n || 0);
  if (v >= 1_00_00_000) return `₹${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `₹${(v / 1_00_000).toFixed(1)}L`;
  return `₹${v.toLocaleString('en-IN')}`;
}

function MgmtBadge({ level }: { level: string | null }) {
  if (!level) return null;
  const cfg = MGMT_LEVEL_CONFIG[level] || MGMT_LEVEL_CONFIG.unknown;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string | null }) {
  if (!platform) return null;
  const cls = PLATFORM_COLORS[platform] || 'border-slate-700 bg-slate-900 text-slate-400';
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${cls}`}>
      {platform.replace('_bulk_csv', '').replace('leadrocks', 'LeadRocks')}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LeadsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialTab = searchParams.get('tab') === 'contacts' ? 'contacts' : 'leads';
  const [activeTab, setActiveTab] = useState<'leads' | 'contacts'>(initialTab as 'leads' | 'contacts');

  // ── Company leads state ──────────────────────────────────────────────────
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [tierCounts, setTierCounts] = useState<TierCounts>({ hot: 0, warm: 0, cold: 0, disqualified: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTier, setFilterTier] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // ── Contacts state ───────────────────────────────────────────────────────
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [contactTotal, setContactTotal] = useState(0);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState<string | null>(null);
  const [contactStats, setContactStats] = useState<ContactStats | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [contactPlatform, setContactPlatform] = useState('');
  const [contactMgmtLevel, setContactMgmtLevel] = useState('');
  const [contactDept, setContactDept] = useState('');

  const apiBase = () => getIntelApiBaseUrl();
  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : null;
  }, []);

  // ── Load company leads ───────────────────────────────────────────────────
  const loadLeads = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = await authHeader();
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const params = new URLSearchParams({ limit: '200', min_score: String(minScore) });
      if (filterTier) params.set('tier', filterTier);
      const res = await fetch(`${apiBase()}/api/intel/leads?${params}`, { headers: { Authorization: token } });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
      const data = await res.json();
      setRows(data.rows || []);
      setTierCounts(data.tier_counts || {});
      setTotal(data.total || 0);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [filterTier, minScore, authHeader]);

  useEffect(() => { if (activeTab === 'leads') loadLeads(); }, [activeTab, loadLeads]);

  // ── Load contacts ────────────────────────────────────────────────────────
  const loadContacts = useCallback(async () => {
    setContactsLoading(true); setContactsError(null);
    try {
      const token = await authHeader();
      if (!token) { setContactsError('Not signed in.'); setContactsLoading(false); return; }
      const params = new URLSearchParams({ limit: '200', no_placeholders: 'true' });
      if (contactSearch) params.set('search', contactSearch);
      if (contactPlatform) params.set('source_platform', contactPlatform);
      if (contactMgmtLevel) params.set('management_level', contactMgmtLevel);
      if (contactDept) params.set('department', contactDept);

      const [contactRes, statsRes] = await Promise.all([
        fetch(`${apiBase()}/api/intel/contacts?${params}`, { headers: { Authorization: token } }),
        fetch(`${apiBase()}/api/intel/contacts/stats`, { headers: { Authorization: token } }),
      ]);

      if (!contactRes.ok) throw new Error((await contactRes.json().catch(() => ({}))).error || `HTTP ${contactRes.status}`);
      const cData = await contactRes.json();
      setContacts(cData.rows || []);
      setContactTotal(cData.total || 0);

      if (statsRes.ok) {
        const sData = await statsRes.json();
        setContactStats(sData);
      }
    } catch (err) { setContactsError(err instanceof Error ? err.message : 'Failed to load contacts'); }
    finally { setContactsLoading(false); }
  }, [contactSearch, contactPlatform, contactMgmtLevel, contactDept, authHeader]);

  useEffect(() => { if (activeTab === 'contacts') loadContacts(); }, [activeTab, loadContacts]);

  function switchTab(tab: 'leads' | 'contacts') {
    setActiveTab(tab);
    router.replace(`/intel/leads${tab === 'contacts' ? '?tab=contacts' : ''}`);
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const displayed = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => (r.company_name || '').toLowerCase().includes(q) || (r.state || '').toLowerCase().includes(q) || (r.waste_categories || []).some(w => w.toLowerCase().includes(q)));
  }, [rows, search]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <div className="mx-auto max-w-7xl px-6 py-6">

        {/* Header */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Leads</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-rose-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Lead Intelligence Center</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">
              Company leads ranked by 6-signal AI score, plus a searchable directory of decision-maker contacts from all imported datasets.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/intel/upload" className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
              Import Data ↑
            </Link>
            <button type="button" onClick={() => activeTab === 'leads' ? loadLeads() : loadContacts()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Refresh
            </button>
          </div>
        </div>
        {error && <p className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-2 text-sm text-rose-300">{error}</p>}

        {/* Tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
          {[
            { key: 'leads',    label: 'Company Leads',    desc: `${total || 0} scored` },
            { key: 'contacts', label: 'Contacts',          desc: `${contactStats?.total_contacts ?? contactTotal} people` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key as 'leads' | 'contacts')}
              className={`flex-1 rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition ${
                activeTab === t.key
                  ? 'bg-slate-800 text-slate-100 shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
              <span className="ml-2 text-[10px] font-normal text-slate-500">{t.desc}</span>
            </button>
          ))}
        </div>

        {/* ══ TAB: COMPANY LEADS ══════════════════════════════════════════════ */}
        {activeTab === 'leads' && (
          <>
            {/* Tier KPIs */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(Object.keys(TIER_CONFIG) as Array<keyof typeof TIER_CONFIG>).map(t => (
                <button key={t} onClick={() => setFilterTier(filterTier === t ? '' : t)}
                  className={`rounded-xl border p-4 text-left transition ${filterTier === t ? TIER_CONFIG[t].color : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'}`}>
                  <div className={`mb-2.5 h-0.5 w-7 rounded-full ${TIER_CONFIG[t].bar}`} />
                  <p className="text-2xl font-bold tabular-nums">{loading ? '—' : tierCounts[t] ?? 0}</p>
                  <p className="mt-0.5 text-xs font-semibold capitalize text-slate-400">{t}</p>
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search company…"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-400 focus:outline-none" />
              <label className="flex items-center gap-2 text-xs text-slate-400">
                Min score
                <input type="number" min={0} max={100} value={minScore} onChange={e => setMinScore(Number(e.target.value))}
                  className="w-16 rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:border-rose-400 focus:outline-none" />
              </label>
              <span className="ml-auto text-xs text-slate-500">{displayed.length} of {total} leads</span>
            </div>

            {/* Lead cards */}
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : displayed.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">No leads scored yet</p>
                <p className="mt-1 text-xs text-slate-500">Run AI enrichment on companies to generate lead scores.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {displayed.map((row, idx) => {
                  const cfg = TIER_CONFIG[row.tier] || TIER_CONFIG.cold;
                  const isOpen = expanded === row.id;
                  return (
                    <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/70">
                      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                        <span className="w-6 text-center font-mono text-[11px] text-slate-500">#{idx + 1}</span>
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-700 bg-slate-950">
                          <span className="text-sm font-bold tabular-nums text-slate-100">{row.lead_score}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Link href={`/intel/companies/${row.company_id}`} className="font-semibold text-slate-100 hover:text-rose-300">
                              {row.company_name || row.company_id.slice(0, 8)}
                            </Link>
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.badge}`}>{row.tier}</span>
                            {row.segment_tag && (
                              <span className="rounded border border-slate-700 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-400">{row.segment_tag}</span>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                            {row.state && <span>{row.state}</span>}
                            {row.waste_categories.slice(0, 2).map(w => <span key={w} className="rounded bg-slate-800/60 px-1">·{w}</span>)}
                            {row.epr_target_mt && <span>EPR: {Number(row.epr_target_mt).toFixed(0)} MT</span>}
                            {row.ec_inr_cr && <span>EC: {formatInr(Number(row.ec_inr_cr) * 1e7)}</span>}
                          </div>
                        </div>
                        <div className="hidden gap-1 sm:flex sm:flex-col">
                          {[
                            { label: 'Compliance', value: row.compliance_urgency_score },
                            { label: 'EPR Opp', value: row.epr_opportunity_score },
                            { label: 'Size', value: row.size_score },
                          ].map(s => (
                            <div key={s.label} className="flex items-center gap-2">
                              <span className="w-20 text-right text-[9px] uppercase tracking-widest text-slate-500">{s.label}</span>
                              <ScoreBar value={s.value} color={cfg.bar} />
                            </div>
                          ))}
                        </div>
                        <button onClick={() => setExpanded(isOpen ? null : row.id)}
                          className="ml-2 text-[10px] font-semibold text-slate-500 hover:text-slate-300">
                          {isOpen ? '▲ Less' : '▼ More'}
                        </button>
                      </div>
                      {isOpen && (
                        <div className="border-t border-slate-800 px-4 py-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Score Breakdown</p>
                              <div className="space-y-1.5">
                                {[
                                  { label: 'Size', value: row.size_score },
                                  { label: 'Compliance Urgency', value: row.compliance_urgency_score },
                                  { label: 'EPR Opportunity', value: row.epr_opportunity_score },
                                  { label: 'Enrichment', value: row.enrichment_score },
                                  { label: 'Activity', value: row.activity_score },
                                ].map(s => (
                                  <div key={s.label} className="flex items-center gap-2">
                                    <span className="w-36 text-[10px] text-slate-400">{s.label}</span>
                                    <ScoreBar value={s.value} color={cfg.bar} />
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Why This Lead</p>
                              {row.insights.length > 0 ? (
                                <div className="space-y-1.5">
                                  {row.insights.map((ins, i) => (
                                    <div key={i} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
                                      <span className="text-xs text-slate-200">{ins.label}</span>
                                      <span className="text-[10px] tabular-nums text-slate-400">{Math.round(ins.confidence * 100)}%</span>
                                    </div>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-500">No insights generated yet.</p>}
                              {row.renewal_urgency && (
                                <p className="mt-2 text-[11px] text-amber-300">Renewal urgency: {row.renewal_urgency}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Link href={`/intel/companies/${row.company_id}`}
                              className="rounded-md border border-rose-600/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20">
                              Open company →
                            </Link>
                            {row.website && (
                              <a href={row.website} target="_blank" rel="noopener noreferrer"
                                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:border-slate-500">
                                Website ↗
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══ TAB: CONTACTS DIRECTORY ════════════════════════════════════════ */}
        {activeTab === 'contacts' && (
          <>
            {/* Stats row */}
            {contactStats && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
                  <p className="text-3xl font-bold tabular-nums text-violet-300">{contactStats.total_contacts.toLocaleString('en-IN')}</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">Total Contacts</p>
                </div>
                {contactStats.by_mgmt_level.slice(0, 3).map(({ label, count }) => {
                  const cfg = MGMT_LEVEL_CONFIG[label] || MGMT_LEVEL_CONFIG.unknown;
                  return (
                    <div key={label} className={`rounded-xl border p-4 text-center ${cfg.color.split(' ')[0]} ${cfg.color.split(' ')[1]}`}>
                      <p className="text-3xl font-bold tabular-nums">{count.toLocaleString('en-IN')}</p>
                      <p className="mt-1 text-[10px] uppercase tracking-widest opacity-70">{cfg.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Platform distribution */}
            {contactStats && contactStats.by_platform.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {contactStats.by_platform.map(({ label, count }) => (
                  <button
                    key={label}
                    onClick={() => setContactPlatform(contactPlatform === label ? '' : label)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      contactPlatform === label
                        ? (PLATFORM_COLORS[label] || 'border-slate-600 bg-slate-800 text-slate-200')
                        : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {label.replace('_bulk_csv', '')} <span className="ml-1 opacity-60">{count}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <input
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search name, email, title…"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-400 focus:outline-none"
              />
              <select
                value={contactMgmtLevel}
                onChange={e => setContactMgmtLevel(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-violet-400 focus:outline-none"
              >
                <option value="">All levels</option>
                {Object.entries(MGMT_LEVEL_CONFIG).filter(([k]) => k !== 'unknown').map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                value={contactDept}
                onChange={e => setContactDept(e.target.value)}
                placeholder="Filter by department…"
                className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-violet-400 focus:outline-none"
              />
              <span className="ml-auto text-xs text-slate-500">{contacts.length} of {contactTotal}</span>
            </div>

            {/* Contact table */}
            {contactsError ? (
              <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 px-4 py-3 text-sm text-rose-300">
                {contactsError}
              </div>
            ) : contactsLoading ? (
              <div className="space-y-2 animate-pulse p-4">
                {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
              </div>
            ) : contacts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-700 p-10 text-center">
                <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <p className="mt-2 text-sm font-semibold text-slate-300">No contacts yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  Import a LeadRocks, Apollo, ZoomInfo, or Lusha CSV to populate the contacts directory.
                </p>
                <Link href="/intel/upload" className="mt-4 inline-block rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500">
                  Import Data ↑
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                      <th className="px-4 py-2.5">Contact</th>
                      <th className="px-4 py-2.5">Company</th>
                      <th className="px-4 py-2.5">Role</th>
                      <th className="px-4 py-2.5">Email / Phone</th>
                      <th className="px-4 py-2.5">Source</th>
                      <th className="px-4 py-2.5">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map(c => (
                      <tr key={c.id} className="border-b border-slate-900/60 hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold uppercase text-slate-300">
                              {(c.person_name || '?')[0]}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-100">{c.person_name}</p>
                              {c.linkedin_url && (
                                <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer"
                                  className="text-[10px] text-sky-400 hover:underline">LinkedIn ↗</a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/intel/companies/${c.company_id}`} className="font-medium text-slate-200 hover:text-teal-300">
                            {c.company_name || c.company_id.slice(0, 8)}
                          </Link>
                          {c.company_industry && (
                            <p className="mt-0.5 text-[10px] text-slate-500 truncate max-w-[160px]">{c.company_industry}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {c.designation && <p className="text-slate-200 line-clamp-1">{c.designation}</p>}
                            <div className="flex flex-wrap gap-1">
                              <MgmtBadge level={c.management_level} />
                              {c.department && (
                                <span className="rounded border border-slate-700 bg-slate-800/50 px-1.5 py-0.5 text-[9px] text-slate-400">
                                  {c.department}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {c.email ? (
                            <a href={`mailto:${c.email}`} className="block text-teal-300 hover:underline truncate max-w-[200px]">{c.email}</a>
                          ) : <span className="text-slate-600">—</span>}
                          {c.phone && <p className="mt-0.5 text-slate-400">{c.phone}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <PlatformBadge platform={c.source_platform} />
                          {c.confidence_score != null && (
                            <p className="mt-1 text-[10px] text-slate-500">{Math.round(c.confidence_score * 100)}% conf</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {[c.company_state].filter(Boolean).join(', ') || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </div>
    </div>
  );
}
