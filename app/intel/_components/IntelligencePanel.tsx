'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type EnrichmentQueueItem = {
  enrichment_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  retry_count: number;
};

type EnrichmentStatus = {
  overall_pct: number;
  by_type: Record<string, EnrichmentQueueItem>;
  last_version: { version_number: number; triggered_by: string; created_at: string } | null;
};

type EntityClassification = {
  entity_type: string;
  confidence: number;
  detection_method: string;
  is_primary: boolean;
  is_operational: boolean;
  detection_signals: Record<string, unknown> | null;
};

type Product = {
  id: string;
  product_name: string;
  activity_type: string;
  brand_name: string | null;
  confidence: number;
  extraction_source: string;
  is_verified: boolean;
  is_flagged: boolean;
  taxonomy?: { name: string; is_epr_relevant: boolean } | null;
};

type ComplianceItem = {
  compliance_type_key: string;
  compliance_type_name: string;
  applicability: string;
  opportunity_score: number;
  detection_method: string;
  detection_signals: Record<string, unknown> | null;
};

type SalesScore = {
  lead_score: number;
  tier: string;
  size_score: number;
  compliance_urgency_score: number;
  enrichment_score: number;
  activity_score: number;
  epr_opportunity_score: number;
  insights: Array<{ type: string; label: string; confidence: number }>;
  computed_at: string;
};

type Brief = {
  brief_text: string;
  word_count: number;
  confidence: number;
  generation_model: string;
  hallucination_flags: Array<{ flag_type: string; description: string }>;
  review_status: string;
  is_active: boolean;
  grounding_facts: Array<{ fact: string; confidence: number }>;
};

type Contact = {
  id: string;
  person_name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  headline: string | null;
  location: string | null;
  experience_years: number | null;
  source: string;
};

type PlatformPulse = {
  metrics: {
    total_insights: number;
  };
  insights: Array<{
    type: string;
    title: string;
    confidence: number;
    recommended_action?: string | null;
  }>;
  service_health: {
    enrichment: {
      queued: number;
      processing: number;
      failed: number;
    };
    lead_verification: {
      valid: number;
      total: number;
    };
  };
};

type IntelData = {
  enrichmentStatus: EnrichmentStatus | null;
  classifications: EntityClassification[];
  products: Product[];
  compliance: ComplianceItem[];
  salesScore: SalesScore | null;
  brief: Brief | null;
  contacts: Contact[];
  platformPulse: PlatformPulse | null;
};

function ConfidenceBar({ value, className = '' }: { value: number; className?: string }) {
  const pct = Math.round(value * 100);
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-[10px] text-slate-400">{pct}%</span>
    </div>
  );
}

function ConfidenceChip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const cls = pct >= 80 ? 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300'
    : pct >= 60 ? 'border-amber-700/50 bg-amber-500/10 text-amber-300'
    : 'border-red-700/50 bg-red-500/10 text-red-300';
  return (
    <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${cls}`}>
      {pct}%
    </span>
  );
}

function TierBadge({ tier }: { tier: string }) {
  const cls = tier === 'hot' ? 'border-red-600/50 bg-red-500/10 text-red-300'
    : tier === 'warm' ? 'border-amber-600/50 bg-amber-500/10 text-amber-300'
    : 'border-slate-600 bg-slate-800/50 text-slate-400';
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase ${cls}`}>
      {tier}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'completed' ? 'bg-emerald-400'
    : status === 'processing' ? 'bg-amber-400 animate-pulse'
    : status === 'failed' ? 'bg-red-400'
    : status === 'skipped' ? 'bg-slate-500'
    : 'bg-slate-600';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

const ENRICHMENT_LABELS: Record<string, string> = {
  entity_classification: 'Entity Type',
  web_crawl: 'Web Crawl',
  ai_product_extraction: 'Product AI',
  compliance_prediction: 'Compliance',
  brief_generation: 'Brief',
  sales_scoring: 'Sales Score',
  sendpilot_contact_discovery: 'Contacts',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  listed: 'Listed Company', mnc: 'MNC', public_limited: 'Public Limited',
  private_limited: 'Private Limited', llp: 'LLP', partnership: 'Partnership',
  proprietorship: 'Proprietorship', holding: 'Holding Company', subsidiary: 'Subsidiary',
  government: 'Government', psu: 'PSU', ngo_trust_society: 'NGO/Trust/Society',
  individual: 'Individual', foreign_company: 'Foreign Company',
};

const APPLICABILITY_COLORS: Record<string, string> = {
  applicable: 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300',
  probable: 'border-amber-700/50 bg-amber-500/10 text-amber-300',
  not_applicable: 'border-slate-700 bg-slate-800/40 text-slate-400',
  unknown: 'border-slate-700 bg-slate-800/20 text-slate-500',
};

export default function IntelligencePanel({ companyId }: { companyId: string }) {
  const [data, setData] = useState<IntelData>({
    enrichmentStatus: null,
    classifications: [],
    products: [],
    compliance: [],
    salesScore: null,
    brief: null,
    contacts: [],
    platformPulse: null,
  });
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const BASE = getIntelApiBaseUrl();

  const fetchAll = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) { setError('Not signed in.'); setLoading(false); return; }
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
      const [statusRes, classRes, prodRes, compRes, scoreRes, briefRes, contactsRes, pulseRes] = await Promise.all([
        fetch(`${BASE}/api/intel/enrichment/status/${companyId}`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/entity-classification`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/products`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/compliance`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/sales-score`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/brief`, { headers }),
        fetch(`${BASE}/api/intel/companies/${companyId}/sendpilot/contacts`, { headers }),
        fetch(`${BASE}/api/intel/dashboard/platform-intelligence`, { headers }),
      ]);

      const [statusData, classData, prodData, compData, scoreData, briefData, contactsData, pulseData] = await Promise.all([
        statusRes.ok ? statusRes.json() : null,
        classRes.ok ? classRes.json() : null,
        prodRes.ok ? prodRes.json() : null,
        compRes.ok ? compRes.json() : null,
        scoreRes.ok ? scoreRes.json() : null,
        briefRes.ok ? briefRes.json() : null,
        contactsRes.ok ? contactsRes.json() : null,
        pulseRes.ok ? pulseRes.json() : null,
      ]);

      setData({
        enrichmentStatus: statusData || null,
        classifications: classData?.classifications || [],
        products: prodData?.products || [],
        compliance: compData?.compliance || [],
        salesScore: scoreData?.sales_score || null,
        brief: briefData?.active || null,
        contacts: contactsData?.contacts || [],
        platformPulse: pulseData?.platform_intelligence || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load intelligence data');
    } finally {
      setLoading(false);
    }
  }, [BASE, companyId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Poll while any item is processing
  useEffect(() => {
    const status = data.enrichmentStatus;
    const isProcessing = status
      ? Object.values(status.by_type).some((i) => i.status === 'processing' || i.status === 'queued')
      : false;

    if (isProcessing) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => { fetchAll(); }, 5000);
      }
    } else {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      setEnriching(false);
    }

    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };
  }, [data.enrichmentStatus, fetchAll]);

  async function handleEnrich() {
    setEnriching(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`${BASE}/api/intel/enrichment/initialize/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ triggered_by: 'manual' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrich failed');
      setEnriching(false);
    }
  }

  const { enrichmentStatus, classifications, products, compliance, salesScore, brief, contacts, platformPulse } = data;
  const primaryEntity = classifications.find((c) => c.is_primary);
  const triggerSignals = salesScore?.insights.slice(0, 3) || [];
  const isProcessing = enrichmentStatus
    ? Object.values(enrichmentStatus.by_type).some((i) => i.status === 'processing' || i.status === 'queued')
    : false;

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl border border-slate-800 bg-slate-900/60" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header: status bar + enrich button */}
      <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-teal-300">AI Enrichment</span>
          {enrichmentStatus ? (
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-teal-500 transition-all"
                  style={{ width: `${enrichmentStatus.overall_pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-400">{enrichmentStatus.overall_pct}%</span>
              {enrichmentStatus.last_version && (
                <span className="text-[10px] text-slate-500">
                  v{enrichmentStatus.last_version.version_number}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-slate-500">Not enriched</span>
          )}
        </div>
        <button
          type="button"
          onClick={handleEnrich}
          disabled={enriching || isProcessing}
          className="rounded-md border border-teal-600/50 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isProcessing ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-teal-400" />
              Processing…
            </span>
          ) : enriching ? 'Queuing…' : 'Enrich Now'}
        </button>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Company Snapshot</p>
            <p className="mt-1 text-sm text-slate-300">Decision-oriented view of fit, urgency, and buying signals.</p>
          </div>
          {salesScore && (
            <TierBadge tier={salesScore.tier} />
          )}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Target Fit</p>
            <p className="mt-1 text-sm font-medium text-slate-100">
              {primaryEntity ? ENTITY_TYPE_LABELS[primaryEntity.entity_type] || primaryEntity.entity_type.replace(/_/g, ' ') : 'Unknown'}
            </p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Decision Makers</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{contacts.length.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Compliance Signals</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{compliance.length.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-md border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Why Now</p>
            <p className="mt-1 text-sm font-medium text-slate-100">{triggerSignals[0]?.label || 'No trigger signal yet'}</p>
          </div>
        </div>
      </div>

      {platformPulse && (
        <div className="rounded-xl border border-teal-900/40 bg-gradient-to-br from-teal-950/20 via-slate-900/70 to-slate-900/70 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">Platform Pulse</p>
              <p className="mt-1 text-sm text-slate-300">
                {platformPulse.metrics.total_insights.toLocaleString('en-IN')} active cross-market signals shaping outreach timing.
              </p>
              {platformPulse.insights[0]?.title ? (
                <p className="mt-2 text-xs text-slate-400">
                  Top signal: <span className="text-slate-200">{platformPulse.insights[0].title}</span>
                </p>
              ) : null}
            </div>
            <div className="grid gap-2 text-[11px] text-slate-300 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                Queue {platformPulse.service_health.enrichment.queued} · Processing {platformPulse.service_health.enrichment.processing}
              </div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                Verification {platformPulse.service_health.lead_verification.valid}/{platformPulse.service_health.lead_verification.total}
              </div>
            </div>
          </div>
          {platformPulse.insights[0]?.recommended_action ? (
            <p className="mt-3 rounded-lg border border-teal-800/40 bg-teal-950/20 px-3 py-2 text-xs text-teal-200">
              Action cue: {platformPulse.insights[0].recommended_action}
            </p>
          ) : null}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800/50 bg-red-900/20 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Queue progress pills */}
      {enrichmentStatus && Object.keys(enrichmentStatus.by_type).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(enrichmentStatus.by_type).map(([type, item]) => (
            <div
              key={type}
              className="flex items-center gap-1.5 rounded-full border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-[11px]"
            >
              <StatusDot status={item.status} />
              <span className="text-slate-300">{ENRICHMENT_LABELS[type] || type}</span>
              {item.status === 'failed' && item.error_message && (
                <span className="text-red-400" title={item.error_message}>!</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Entity Classification Block */}
      {classifications.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Company Overview Block</p>
          <div className="mt-3 space-y-2">
            {classifications.map((c, i) => (
              <div key={i} className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
                <div className="flex items-center gap-2">
                  {c.is_primary && (
                    <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
                      Primary
                    </span>
                  )}
                  {c.is_operational && (
                    <span className="rounded border border-blue-700/50 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-bold text-blue-300">
                      Operational
                    </span>
                  )}
                  <span className="text-sm font-medium text-slate-100">
                    {ENTITY_TYPE_LABELS[c.entity_type] || c.entity_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500">{c.detection_method}</span>
                </div>
                <ConfidenceChip value={c.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Brief Block */}
      {brief && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">AI Recommendation Block</p>
            <div className="flex items-center gap-2">
              <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${
                brief.review_status === 'approved' ? 'border-emerald-700/50 bg-emerald-500/10 text-emerald-300'
                : brief.review_status === 'rejected' ? 'border-red-700/50 bg-red-500/10 text-red-300'
                : 'border-amber-700/50 bg-amber-500/10 text-amber-300'
              }`}>
                {brief.review_status}
              </span>
              {brief.is_active && (
                <span className="rounded border border-teal-700/50 bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
                  Active
                </span>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{brief.brief_text}</p>
          <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500">
            <span>{brief.word_count} words</span>
            <span>Model: {brief.generation_model}</span>
            <span>Confidence: {Math.round(brief.confidence * 100)}%</span>
          </div>
          {brief.hallucination_flags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {brief.hallucination_flags.map((f, i) => (
                <span key={i} className="rounded border border-orange-700/50 bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-300">
                  {f.flag_type}: {f.description}
                </span>
              ))}
            </div>
          )}
          {brief.grounding_facts.length > 0 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-[10px] text-slate-500 hover:text-slate-300">
                {brief.grounding_facts.length} grounding facts
              </summary>
              <ul className="mt-1 space-y-1">
                {brief.grounding_facts.map((f, i) => (
                  <li key={i} className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{f.fact}</span>
                    <ConfidenceChip value={f.confidence} />
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {/* Product Intelligence Block */}
      {products.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">What to Sell Block</p>
            <span className="text-[11px] text-slate-500">{products.length} products</span>
          </div>
          <div className="mt-3 space-y-2">
            {products.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center gap-3 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-100 truncate">{p.product_name}</span>
                    {p.brand_name && (
                      <span className="text-[11px] text-slate-400">({p.brand_name})</span>
                    )}
                    {p.is_verified && (
                      <span className="rounded border border-emerald-700/50 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-300">
                        Verified
                      </span>
                    )}
                    {p.is_flagged && (
                      <span className="rounded border border-orange-700/50 bg-orange-500/10 px-1.5 py-0.5 text-[10px] text-orange-300">
                        Flagged
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="text-[10px] capitalize text-slate-500">{p.activity_type}</span>
                    {p.taxonomy && (
                      <>
                        <span className="text-[10px] text-slate-600">·</span>
                        <span className={`text-[10px] ${p.taxonomy.is_epr_relevant ? 'text-teal-400' : 'text-slate-500'}`}>
                          {p.taxonomy.name}
                          {p.taxonomy.is_epr_relevant && ' (EPR)'}
                        </span>
                      </>
                    )}
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] text-slate-500">{p.extraction_source}</span>
                  </div>
                </div>
                <ConfidenceChip value={p.confidence} />
              </div>
            ))}
            {products.length > 10 && (
              <p className="text-center text-[11px] text-slate-500">+{products.length - 10} more products</p>
            )}
          </div>
        </div>
      )}

      {/* Compliance Applicability Block */}
      {compliance.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Compliance Applicability Engine</p>
          <div className="mt-3 space-y-2">
            {compliance.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-slate-100">{c.compliance_type_name}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{c.detection_method}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${APPLICABILITY_COLORS[c.applicability] || APPLICABILITY_COLORS.unknown}`}>
                    {c.applicability}
                  </span>
                  {c.opportunity_score > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">Opp</span>
                      <ConfidenceChip value={c.opportunity_score} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Score Block */}
      {salesScore && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lead Prioritization Dashboard</p>
            <TierBadge tier={salesScore.tier} />
          </div>
          <div className="mt-3 flex items-end gap-4">
            <div>
              <p className="text-3xl font-bold text-slate-100">{salesScore.lead_score}</p>
              <p className="text-[10px] text-slate-500">Lead Score / 100</p>
            </div>
            <div className="flex-1 space-y-1.5 pb-0.5">
              {[
                { label: 'Size', value: salesScore.size_score },
                { label: 'Compliance Urgency', value: salesScore.compliance_urgency_score },
                { label: 'EPR Opportunity', value: salesScore.epr_opportunity_score },
                { label: 'Enrichment', value: salesScore.enrichment_score },
                { label: 'Activity', value: salesScore.activity_score },
              ].map((m) => (
                <div key={m.label} className="flex items-center gap-2">
                  <span className="w-28 shrink-0 text-[10px] text-slate-500">{m.label}</span>
                  <ConfidenceBar value={m.value} className="flex-1" />
                </div>
              ))}
            </div>
          </div>
          {salesScore.insights.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {salesScore.insights.map((ins, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-slate-800 bg-slate-950/50 px-2.5 py-1.5">
                  <span className="text-xs text-slate-200">{ins.label}</span>
                  <ConfidenceChip value={ins.confidence} />
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-right text-[10px] text-slate-600">
            Computed {new Date(salesScore.computed_at).toLocaleDateString('en-IN')}
          </p>
        </div>
      )}

      {/* Contacts Block */}
      {contacts.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Decision Makers & Stakeholders</p>
            <span className="text-[11px] text-slate-500">{contacts.length} discovered</span>
          </div>
          <div className="mt-3 space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{c.person_name}</p>
                    {c.designation && (
                      <p className="mt-0.5 text-[11px] text-slate-400">{c.designation}</p>
                    )}
                    {c.headline && c.headline !== c.designation && (
                      <p className="mt-0.5 text-[10px] text-slate-500 truncate">{c.headline}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {c.location && (
                      <span className="text-[10px] text-slate-500">{c.location}</span>
                    )}
                    {c.experience_years != null && (
                      <span className="rounded border border-slate-700 bg-slate-800/50 px-1.5 py-0.5 text-[10px] text-slate-400">
                        {c.experience_years}y exp
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {c.email && (
                    <a
                      href={`mailto:${c.email}`}
                      className="text-[11px] text-teal-400 hover:text-teal-300 truncate max-w-[200px]"
                    >
                      {c.email}
                    </a>
                  )}
                  {c.phone && (
                    <span className="text-[11px] text-slate-400">{c.phone}</span>
                  )}
                  {c.linkedin_url && (
                    <a
                      href={c.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-400 hover:text-blue-300"
                    >
                      LinkedIn
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && classifications.length === 0 && products.length === 0 && compliance.length === 0 && !salesScore && !brief && (
        <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-sm font-medium text-slate-300">No decision-oriented intelligence yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Click <span className="text-teal-400">Enrich Now</span> to run AI enrichment for this company.
          </p>
        </div>
      )}
    </div>
  );
}
