'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useRef } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import { normalizeState, INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { IntelPageHeader } from '@/app/intel/_components/IntelPageHeader';

// ── Saved-filter helpers ─────────────────────────────────────────────────────

type FilterSnapshot = {
  searchText: string; stateFilter: string; cityFilter: string; segmentTagFilter: string;
  registrationAuthorityFilter: string; registrationStatusFilter: string; registrationWasteCategoryFilter: string;
  minRegistrationCountFilter: string; spcbBoardFilter: string; spcbStateFilter: string;
  recyclerTypeFilter: string; expiredRegistrationsFilter: boolean; multiStateRecyclerFilter: boolean;
  recyclerCategoryFilter: string; cpcbStatusFilter: string; verificationStatus: string;
  googleVerifiedFilter: string; activeStatusFilter: string; minRating: string;
  originLat: string; originLng: string; radiusKm: string; minBatteryCapacityMt: string;
  linkedinIndustryFilter: string; linkedinSubindustryFilter: string;
};
type SavedFilter = { name: string; filters: FilterSnapshot };
const SAVED_FILTERS_KEY = 'intel_saved_filters_v1';

function loadSavedFilters(): SavedFilter[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_FILTERS_KEY) || '[]') as SavedFilter[];
  } catch { return []; }
}
function persistSavedFilters(list: SavedFilter[]) {
  try { localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

// ── Completeness score ───────────────────────────────────────────────────────
function completenessScore(c: IntelCompany): number {
  let score = 0;
  if (c.state) score += 15;
  if (c.city || c.district) score += 10;
  if (c.website) score += 20;
  if (c.cin || c.gstin || c.pan) score += 20;
  if (c.enrichment_status === 'enriched') score += 20;
  if (c.google_place_id) score += 15;
  return score;
}
function completenessColor(score: number): string {
  if (score >= 70) return 'bg-teal-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-rose-500';
}

function isHotLead(company: IntelCompany): boolean {
  if (typeof company.hot_lead === 'boolean') return company.hot_lead;
  const relevanceScore = Number(company.relevance_score || 0);
  const penalty = Number(company.penalty_inr || 0);
  const highCompliancePressure = Number(company.notices || 0) >= 2 || penalty >= 500000;
  const highReadiness =
    company.verification_status === 'verified' &&
    company.enrichment_status === 'enriched' &&
    Number(company.registration_count || 0) >= 3;

  return relevanceScore >= 80 || highCompliancePressure || highReadiness;
}

function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

type IntelCompany = {
  id: string;
  canonical_name: string;
  is_recycler?: boolean;
  state_pollution_control_board?: {
    board_name: string;
    board_code: string;
    state: string;
    registrations: Array<Record<string, unknown>>;
  } | null;
  spcb_registrations?: Array<{
    state: string;
    board_code: string;
    board_name: string;
    registrations: Array<Record<string, unknown>>;
  }>;
  location_count: number;
  registration_count: number;
  primary_registration_id?: string | null;
  registration_authorities?: string[];
  registration_statuses?: string[];
  registration_waste_categories?: string[];
  primary_location_type?: string | null;
  primary_location_city?: string | null;
  primary_location_state?: string | null;
  cin: string | null;
  gstin: string | null;
  pan: string | null;
  website: string | null;
  state: string | null;
  city: string | null;
  district: string | null;
  waste_categories?: string[];
  notices: number;
  penalty_inr: number;
  segment_tag: string | null;
  relevance_score: number | null;
  battery_categories: string[];
  annual_processing_capacity_mt: number | null;
  battery_compliance_status: string | null;
  cpcb_registration_status: string | null;
  recycler_category: string | null;
  material_categories: string[];
  enrichment_confidence: number | null;
  enrichment_status: 'enriched' | 'pending';
  verification_status: 'verified' | 'unverified';
  google_place_id: string | null;
  google_match_confidence: number | null;
  google_match_type: string | null;
  google_verified_status: 'verified' | 'needs_review' | 'not_matched';
  active_status: string | null;
  validation_confidence: number | null;
  rating: number | null;
  review_count: number | null;
  latitude: number | null;
  longitude: number | null;
  geo_hash: string | null;
  geo_accuracy_level: string | null;
  standardized_address: string | null;
  duplicate_indicator: boolean;
  duplicate_cluster_count: number;
  merged_record_type: 'merged_source' | 'merged_survivor' | 'duplicate_candidate' | 'none';
  updated_at: string;
  hot_lead?: boolean;
  classification?: string | null;
  linkedin_industry?: string | null;
  linkedin_subindustry?: string | null;
  sendpilot_last_status?: string | null;
  sendpilot_last_results_count?: number | null;
  sendpilot_last_completed_at?: string | null;
  associated_people_count?: number;
  sendpilot_contacts_count?: number;
  manual_contacts_count?: number;
  highest_contact_confidence?: number | null;
  last_contact_verified_at?: string | null;
  cpcb_capacity_mt?: number | null;
  material_category_count?: number;
};

type PagedResponse = {
  ok: boolean;
  page: number;
  page_size: number;
  total_rows: number;
  total_pages: number;
  rows: IntelCompany[];
};

type EditableCompany = {
  id: string;
  canonical_name: string;
  website: string;
  state: string;
  district: string;
};

type AddCompanyForm = {
  name: string; website: string; state: string; city: string; district: string;
  segment_tag: string; cin: string; gstin: string; pan: string;
};

type DedupState = 'idle' | 'checking' | 'exists' | 'clear';

type TradeSignalsListSummary = {
  summary: {
    importer_signals: number;
    exporter_signals: number;
    trade_records: number;
    latest_trade_date: string | null;
  };
  iec_codes: string[];
  hs_codes: string[];
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
      total: number;
      completed: number;
      queued: number;
      processing: number;
      failed: number;
    };
    lead_verification: {
      total: number;
      valid: number;
    };
    outbound: {
      total: number;
      pending_approval: number;
      sent: number;
    };
  };
};

function isRecyclerCompany(company: IntelCompany): boolean {
  if (company.is_recycler) return true;
  const blob = [
    company.segment_tag,
    company.classification,
    company.recycler_category,
    company.cpcb_registration_status,
    ...(company.battery_categories || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /recycler|recycling|dismantler|refurbisher/.test(blob) || Number(company.annual_processing_capacity_mt || 0) > 0;
}

function segmentTagColor(tag: string | null | undefined): string {
  const t = (tag || '').toLowerCase();
  if (/recycler|recycling/.test(t)) return 'bg-teal-900/40 text-teal-200 border border-teal-700/40';
  if (/producer|pibo|brand/.test(t)) return 'bg-amber-900/40 text-amber-200 border border-amber-700/40';
  if (/dismantler/.test(t)) return 'bg-purple-900/40 text-purple-200 border border-purple-700/40';
  if (/refurbisher/.test(t)) return 'bg-blue-900/40 text-blue-200 border border-blue-700/40';
  if (/battery/.test(t)) return 'bg-cyan-900/40 text-cyan-200 border border-cyan-700/40';
  if (/importer/.test(t)) return 'bg-fuchsia-900/40 text-fuchsia-200 border border-fuchsia-700/40';
  if (/logistics|transport/.test(t)) return 'bg-orange-900/40 text-orange-200 border border-orange-700/40';
  return 'bg-slate-800/60 text-slate-300 border border-slate-700';
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L8 20l-5 1 1-5 12.5-12.5Z" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export default function IntelCompaniesPage() {
  const DEFAULT_NEAR_ME_RADIUS_KM = 25;
  const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
  const router = useRouter();
  const urlSearchParams = useSearchParams();
  const urlSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [rows, setRows] = useState<IntelCompany[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [companies, setCompanies] = useState<IntelCompany[]>([]);
  const [searchText, setSearchText] = useState(() => urlSearchParams.get('search') || '');
  const [stateFilter, setStateFilter] = useState(() => urlSearchParams.get('state') || '');
  const [cityFilter, setCityFilter] = useState(() => urlSearchParams.get('city') || '');
  const [segmentTagFilter, setSegmentTagFilter] = useState(() => urlSearchParams.get('segment') || '');
  const [registrationAuthorityFilter, setRegistrationAuthorityFilter] = useState('');
  const [registrationStatusFilter, setRegistrationStatusFilter] = useState('');
  const [registrationWasteCategoryFilter, setRegistrationWasteCategoryFilter] = useState('');
  const [minRegistrationCountFilter, setMinRegistrationCountFilter] = useState('');
  const [spcbBoardFilter, setSpcbBoardFilter] = useState('');
  const [spcbStateFilter, setSpcbStateFilter] = useState('');
  const [recyclerTypeFilter, setRecyclerTypeFilter] = useState('');
  const [expiredRegistrationsFilter, setExpiredRegistrationsFilter] = useState(false);
  const [multiStateRecyclerFilter, setMultiStateRecyclerFilter] = useState(false);
  const [recyclerCategoryFilter, setRecyclerCategoryFilter] = useState('');
  const [cpcbStatusFilter, setCpcbStatusFilter] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [googleVerifiedFilter, setGoogleVerifiedFilter] = useState('');
  const [activeStatusFilter, setActiveStatusFilter] = useState('');
  const [minRating, setMinRating] = useState('');
  const [originLat, setOriginLat] = useState('');
  const [originLng, setOriginLng] = useState('');
  const [radiusKm, setRadiusKm] = useState('');
  const [minBatteryCapacityMt, setMinBatteryCapacityMt] = useState('');
  const [entityView, setEntityView] = useState<'all' | 'recyclers' | 'pibos'>('all');
  const [sortBy, setSortBy] = useState<'updated_at' | 'canonical_name' | 'state'>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [hotLeadsOnly, setHotLeadsOnly] = useState(false);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [nearMeEnabled, setNearMeEnabled] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingCompany, setEditingCompany] = useState<EditableCompany | null>(null);
  const [savingCompany, setSavingCompany] = useState(false);
  const [deletingCompanyId, setDeletingCompanyId] = useState<string | null>(null);
  const [tradeSignalsByCompany, setTradeSignalsByCompany] = useState<Record<string, TradeSignalsListSummary>>({});
  const [tradeSignalsLoading, setTradeSignalsLoading] = useState(false);
  const [linkedinIndustryFilter, setLinkedinIndustryFilter] = useState(() => urlSearchParams.get('linkedin_industry') || '');
  const [linkedinSubindustryFilter, setLinkedinSubindustryFilter] = useState(() => urlSearchParams.get('linkedin_subindustry') || '');
  const [platformPulse, setPlatformPulse] = useState<PlatformPulse | null>(null);
  const [bulkSendPilotRunning, setBulkSendPilotRunning] = useState(false);
  const [enrichingCompanyId, setEnrichingCompanyId] = useState<string | null>(null);
  const [sendPilotDiscoveringCompanyId, setSendPilotDiscoveringCompanyId] = useState<string | null>(null);

  // ── Add Company modal ────────────────────────────────────────────────────────
  const [showAddCompany, setShowAddCompany] = useState(false);
  const DEFAULT_ADD_FORM: AddCompanyForm = {
    name: '', website: '', state: '', city: '', district: '',
    segment_tag: '', cin: '', gstin: '', pan: '',
  };
  const [addForm, setAddForm] = useState<AddCompanyForm>(DEFAULT_ADD_FORM);
  const [addDedup, setAddDedup] = useState<DedupState>('idle');
  const [addDedupMatch, setAddDedupMatch] = useState<{ id: string; canonical_name: string } | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const addDedupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── FTS search suggestions ───────────────────────────────────────────────────
  type SearchSuggestion = { id: string; canonical_name: string; state: string | null; tier: string | null; lead_score: number | null };
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    const q = searchText.trim();
    if (q.length < 3) { setSuggestions([]); setSuggestionsOpen(false); return; }
    suggestTimer.current = setTimeout(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch(`${getIntelApiBaseUrl()}/api/intel/search?q=${encodeURIComponent(q)}&limit=8`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.results || []);
          setSuggestionsOpen((data.results || []).length > 0);
        }
      } catch { /* silent */ }
    }, 280);
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [searchText]);

  // ── Bulk selection ───────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPushing, setBulkPushing] = useState(false);
  const [quickPushingId, setQuickPushingId] = useState<string | null>(null);
  const [quickPushDoneIds, setQuickPushDoneIds] = useState<Set<string>>(new Set());

  // ── Saved filter sets ────────────────────────────────────────────────────────
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => loadSavedFilters());

  // ── DNC modal ────────────────────────────────────────────────────────────────
  type DncHit = { companyName: string; phone: string; reason: string };
  const [dncHits, setDncHits] = useState<DncHit[]>([]);
  const [showDncModal, setShowDncModal] = useState(false);
  const [pendingPushTargets, setPendingPushTargets] = useState<typeof rows>([]);

  async function fetchIntelCompanies(path: string, token: string) {
    const headers = { authorization: `Bearer ${token}` };
    const apiBaseUrl = getIntelApiBaseUrl();

    try {
      return await fetch(`${apiBaseUrl}${path}`, { headers });
    } catch (primaryError) {
      if (!apiBaseUrl) {
        throw primaryError;
      }

      if (path.startsWith('/api/intel/')) {
        throw new Error(
          `Intel API unreachable at ${apiBaseUrl}. Start backend server or set NEXT_PUBLIC_API_URL correctly.`
        );
      }

      // Fallback to same-origin route for non-Intel paths.
      return fetch(path, { headers });
    }
  }

  async function fetchIntelMutation(path: string, init: RequestInit) {
    const apiBaseUrl = getIntelApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;

    try {
      return await fetch(`${apiBaseUrl}${normalizedPath}`, init);
    } catch (primaryError) {
      if (!apiBaseUrl) {
        throw primaryError;
      }

      if (normalizedPath.startsWith('/api/intel/')) {
        throw new Error(
          `Intel API unreachable at ${apiBaseUrl}. Start backend server or set NEXT_PUBLIC_API_URL correctly.`
        );
      }

      return fetch(normalizedPath, init);
    }
  }

  async function loadData() {
    setLoading(true);
    setError('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        setError('Unable to load companies: missing session token.');
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set('page', String(currentPage));
      params.set('page_size', String(pageSize));
      params.set('sort_by', sortBy);
      params.set('sort_direction', sortDirection);
      if (searchText.trim()) params.set('search', searchText.trim());
      if (stateFilter.trim()) params.set('state', stateFilter.trim());
      if (cityFilter.trim()) params.set('city', cityFilter.trim());
      if (segmentTagFilter.trim()) params.set('segment_tag', segmentTagFilter.trim());
      if (registrationAuthorityFilter.trim()) params.set('registration_authority', registrationAuthorityFilter.trim());
      if (registrationStatusFilter.trim()) params.set('registration_status', registrationStatusFilter.trim());
      if (registrationWasteCategoryFilter.trim()) params.set('registration_waste_category', registrationWasteCategoryFilter.trim());
      if (minRegistrationCountFilter.trim()) params.set('min_registration_count', minRegistrationCountFilter.trim());
      if (spcbBoardFilter.trim()) params.set('spcb_board', spcbBoardFilter.trim());
      if (spcbStateFilter.trim()) params.set('spcb_state', spcbStateFilter.trim());
      if (recyclerTypeFilter.trim()) params.set('recycler_type', recyclerTypeFilter.trim());
      if (expiredRegistrationsFilter) params.set('expired_registrations', 'true');
      if (multiStateRecyclerFilter) params.set('multi_state_recycler', 'true');
      if (recyclerCategoryFilter.trim()) params.set('recycler_category', recyclerCategoryFilter.trim());
      if (cpcbStatusFilter.trim()) params.set('cpcb_status', cpcbStatusFilter.trim());
      if (verificationStatus) params.set('verification_status', verificationStatus);
      if (googleVerifiedFilter) params.set('google_verified', googleVerifiedFilter);
      if (activeStatusFilter.trim()) params.set('active_status', activeStatusFilter.trim());
      if (minRating.trim()) params.set('min_rating', minRating.trim());
      if (originLat.trim()) params.set('origin_lat', originLat.trim());
      if (originLng.trim()) params.set('origin_lng', originLng.trim());
      if (radiusKm.trim()) params.set('radius_km', radiusKm.trim());
      if (minBatteryCapacityMt.trim()) params.set('min_capacity_mt', minBatteryCapacityMt.trim());

      const response = await fetchIntelCompanies(`/api/intel/companies?${params.toString()}`, token);

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Failed to load companies');
      }

      const payload = (await response.json()) as PagedResponse;
      setRows(payload.rows || []);
      setCompanies(payload.rows || []);
      setTotalRows(Number(payload.total_rows || 0));
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }

  // ── Capture / apply saved filter sets ──────────────────────────────────────
  function captureFilters(): FilterSnapshot {
    return {
      searchText, stateFilter, cityFilter, segmentTagFilter,
      registrationAuthorityFilter, registrationStatusFilter, registrationWasteCategoryFilter,
      minRegistrationCountFilter, spcbBoardFilter, spcbStateFilter, recyclerTypeFilter,
      expiredRegistrationsFilter, multiStateRecyclerFilter, recyclerCategoryFilter,
      cpcbStatusFilter, verificationStatus, googleVerifiedFilter, activeStatusFilter,
      minRating, originLat, originLng, radiusKm, minBatteryCapacityMt,
      linkedinIndustryFilter, linkedinSubindustryFilter,
    };
  }

  function saveCurrentFilters() {
    const name = window.prompt('Name this filter set:');
    if (!name?.trim()) return;
    const next = [{ name: name.trim(), filters: captureFilters() }, ...savedFilters.filter((s) => s.name !== name.trim())];
    setSavedFilters(next);
    persistSavedFilters(next);
    setSuccess(`Saved filter set "${name.trim()}"`);
  }

  function applyFilterSet(sf: SavedFilter) {
    const f = sf.filters;
    setSearchText(f.searchText); setStateFilter(f.stateFilter); setCityFilter(f.cityFilter);
    setSegmentTagFilter(f.segmentTagFilter); setRegistrationAuthorityFilter(f.registrationAuthorityFilter);
    setRegistrationStatusFilter(f.registrationStatusFilter); setRegistrationWasteCategoryFilter(f.registrationWasteCategoryFilter);
    setMinRegistrationCountFilter(f.minRegistrationCountFilter); setSpcbBoardFilter(f.spcbBoardFilter);
    setSpcbStateFilter(f.spcbStateFilter); setRecyclerTypeFilter(f.recyclerTypeFilter);
    setExpiredRegistrationsFilter(f.expiredRegistrationsFilter); setMultiStateRecyclerFilter(f.multiStateRecyclerFilter);
    setRecyclerCategoryFilter(f.recyclerCategoryFilter); setCpcbStatusFilter(f.cpcbStatusFilter);
    setVerificationStatus(f.verificationStatus); setGoogleVerifiedFilter(f.googleVerifiedFilter);
    setActiveStatusFilter(f.activeStatusFilter); setMinRating(f.minRating);
    setOriginLat(f.originLat); setOriginLng(f.originLng); setRadiusKm(f.radiusKm);
    setMinBatteryCapacityMt(f.minBatteryCapacityMt);
  }

  function deleteFilterSet(name: string) {
    const next = savedFilters.filter((s) => s.name !== name);
    setSavedFilters(next);
    persistSavedFilters(next);
  }

  // ── Quick single-row push to telecalling ──────────────────────────────────
  async function quickPushSingle(company: IntelCompany) {
    if (quickPushingId === company.id) return;
    setQuickPushingId(company.id);
    try {
      const { error: err } = await supabase.from('leads').insert({
        company_name: company.canonical_name,
        name: company.canonical_name,
        state: company.state || null,
        source: 'intel',
        stage: 'New',
        tc_status: 'New',
        tags: company.segment_tag ? [company.segment_tag] : [],
        description: [
          `Quick push from Intel Companies — ${new Date().toLocaleDateString('en-IN')}`,
          company.segment_tag ? `Segment: ${company.segment_tag}` : null,
        ].filter(Boolean).join('\n'),
      });
      if (err) setError(err.message);
      else {
        setQuickPushDoneIds((prev) => new Set([...prev, company.id]));
        setSuccess(`${company.canonical_name} pushed to Telecalling queue.`);
      }
    } catch {
      setError('Failed to push to Telecalling');
    } finally {
      setQuickPushingId(null);
    }
  }

  // ── Bulk push to telecalling (with DNC pre-check) ──────────────────────────
  async function doPush(targets: typeof rows) {
    setBulkPushing(true);
    setError('');
    const records = targets.map((c) => ({
      company_name: c.canonical_name,
      name: c.canonical_name,
      state: c.state || null,
      source: 'intel',
      stage: 'New',
      tc_status: 'New',
      tags: c.segment_tag ? [c.segment_tag] : [],
      description: [
        `Bulk push from Intel Companies — ${new Date().toLocaleDateString('en-IN')}`,
        c.segment_tag ? `Segment: ${c.segment_tag}` : null,
      ].filter(Boolean).join('\n'),
    }));
    const { error: err } = await supabase.from('leads').insert(records);
    if (err) setError(err.message);
    else {
      setSuccess(`${targets.length} companies pushed to Telecalling queue.`);
      setSelectedIds(new Set());
    }
    setBulkPushing(false);
  }

  const bulkPushToTelecalling = useCallback(async () => {
    if (selectedIds.size === 0) return;
    const targets = rows.filter((r) => selectedIds.has(r.id));

    // ── DNC pre-check ─────────────────────────────────────────────────────
    // Collect phone numbers from selected companies and check against tc_dnc_registry.
    // (intel_companies doesn't store phone directly at the company level, but
    //  the leads table might already have it; we use the company name as a proxy
    //  and also check any existing leads for those companies.)
    try {
      const companyNames = targets.map((t) => t.canonical_name);
      // Check if any of these companies already have a lead with a phone in DNC
      const { data: existingLeads } = await supabase
        .from('leads')
        .select('company_name, phone')
        .in('company_name', companyNames)
        .not('phone', 'is', null);

      const phones = (existingLeads || []).map((l) => l.phone as string).filter(Boolean);

      if (phones.length > 0) {
        const { data: dncRows } = await supabase
          .from('tc_dnc_registry')
          .select('phone, reason')
          .in('phone', phones);

        if (dncRows && dncRows.length > 0) {
          const dncPhoneSet = new Set(dncRows.map((d) => d.phone as string));
          const hits: DncHit[] = [];
          for (const lead of existingLeads || []) {
            if (dncPhoneSet.has(lead.phone as string)) {
              const dnc = dncRows.find((d) => d.phone === lead.phone);
              hits.push({
                companyName: lead.company_name as string,
                phone: lead.phone as string,
                reason: (dnc?.reason as string) || 'DNC',
              });
            }
          }
          if (hits.length > 0) {
            setDncHits(hits);
            setPendingPushTargets(targets);
            setShowDncModal(true);
            return; // pause; user decides in modal
          }
        }
      }
    } catch {
      // DNC check failed silently — don't block the push
    }

    await doPush(targets);
  }, [selectedIds, rows]);

  // ── SendPilot per-company discovery ─────────────────────────────────────────
  async function runSendPilotDiscover(company: IntelCompany) {
    setSendPilotDiscoveringCompanyId(company.id);
    setError('');
    setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Unable to run SendPilot discovery: missing session token.');
      const response = await fetchIntelMutation(`/api/intel/companies/${company.id}/sendpilot/discover`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
        body: JSON.stringify({ force: false, limit: 15 })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Failed to trigger SendPilot discovery');
      if (payload?.skipped) {
        setSuccess(`SendPilot skipped for ${company.canonical_name}: ${payload.reason || 'recently enriched'}`);
      } else {
        const discovered = Number(payload?.discovered || 0);
        if (Boolean(payload?.pending)) {
          setSuccess(`SendPilot started for ${company.canonical_name}. Job is processing.`);
        } else {
          setSuccess(`SendPilot completed for ${company.canonical_name}. Contacts discovered: ${discovered}.`);
        }
      }
    } catch (discoverError) {
      setError(discoverError instanceof Error ? discoverError.message : 'Failed to run SendPilot discovery');
    } finally {
      setSendPilotDiscoveringCompanyId(null);
    }
  }

  // ── Bulk SendPilot discovery ─────────────────────────────────────────────────
  const bulkRunSendPilotDiscovery = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkSendPilotRunning(true);
    setError('');
    setSuccess('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Unable to run SendPilot discovery: missing session token.');
      const targets = rows.filter((row) => selectedIds.has(row.id));
      let completed = 0; let pending = 0; let skipped = 0; let discoveredTotal = 0; let failed = 0;
      const failureMessages: string[] = [];
      for (const company of targets) {
        try {
          const response = await fetchIntelMutation(`/api/intel/companies/${company.id}/sendpilot/discover`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
            body: JSON.stringify({ force: false, limit: 15 })
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            failed += 1;
            if (failureMessages.length < 3) failureMessages.push(`${company.canonical_name}: ${payload.error || `HTTP ${response.status}`}`);
            continue;
          }
          if (payload?.skipped) { skipped += 1; continue; }
          if (payload?.pending) { pending += 1; } else { completed += 1; discoveredTotal += Number(payload?.discovered || 0); }
        } catch (runError) {
          failed += 1;
          if (failureMessages.length < 3) failureMessages.push(`${company.canonical_name}: ${runError instanceof Error ? runError.message : 'Request failed'}`);
        }
      }
      setSuccess([`SendPilot bulk run: ${targets.length} selected`, `completed ${completed}`, `pending ${pending}`, `skipped ${skipped}`, `failed ${failed}`, `contacts ${discoveredTotal}`].join(' · '));
      if (failureMessages.length > 0) setError(`Some jobs failed: ${failureMessages.join(' | ')}`);
      setSelectedIds(new Set());
    } catch (bulkError) {
      setError(bulkError instanceof Error ? bulkError.message : 'Failed to run bulk SendPilot discovery');
    } finally {
      setBulkSendPilotRunning(false);
    }
  }, [selectedIds, rows]);

  // ── Platform Pulse loader ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadPlatformPulse() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) { if (!cancelled) setPlatformPulse(null); return; }
        const response = await fetchIntelCompanies('/api/intel/dashboard/platform-intelligence', token);
        if (!response.ok) { if (!cancelled) setPlatformPulse(null); return; }
        const payload = await response.json();
        if (!cancelled) setPlatformPulse((payload.platform_intelligence || null) as PlatformPulse | null);
      } catch {
        if (!cancelled) setPlatformPulse(null);
      }
    }
    void loadPlatformPulse();
    return () => { cancelled = true; };
  }, []);

  // ── Targeting summary ────────────────────────────────────────────────────────
  const targetingSummary = useMemo(() => ({
    visibleCompanies: rows.length,
    hotLeads: rows.filter((c) => isHotLead(c)).length,
    needsEnrichment: rows.filter((c) => c.enrichment_status !== 'enriched' || completenessScore(c) < 40).length,
    complianceHeavy: rows.filter((c) => Number(c.registration_count || 0) > 0 || Number(c.notices || 0) > 0).length,
  }), [rows]);

  // ── URL filter sync (debounced 400 ms) ──────────────────────────────────────
  useEffect(() => {
    if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current);
    urlSyncTimer.current = setTimeout(() => {
      const p = new URLSearchParams();
      if (searchText.trim())      p.set('search',  searchText.trim());
      if (stateFilter.trim())     p.set('state',   stateFilter.trim());
      if (cityFilter.trim())      p.set('city',    cityFilter.trim());
      if (segmentTagFilter.trim()) p.set('segment', segmentTagFilter.trim());
      const qs = p.toString();
      const next = qs ? `/intel/companies?${qs}` : '/intel/companies';
      router.replace(next, { scroll: false });
    }, 400);
    return () => { if (urlSyncTimer.current) clearTimeout(urlSyncTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchText, stateFilter, cityFilter, segmentTagFilter]);

  async function updateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCompany) return;

    setSavingCompany(true);
    setError('');
    setSuccess('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        throw new Error('Unable to update company: missing session token.');
      }

      const response = await fetchIntelMutation(`/api/intel/companies/${editingCompany.id}`, {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingCompany)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to update company');
      }

      setRows((currentRows) => currentRows.map((row) => (row.id === editingCompany.id ? {
        ...row,
        canonical_name: editingCompany.canonical_name,
        website: editingCompany.website || null,
        state: editingCompany.state || null,
        district: editingCompany.district || null,
        updated_at: payload.company?.updated_at || row.updated_at
      } : row)));
      setCompanies((currentRows) => currentRows.map((row) => (row.id === editingCompany.id ? {
        ...row,
        canonical_name: editingCompany.canonical_name,
        website: editingCompany.website || null,
        state: editingCompany.state || null,
        district: editingCompany.district || null,
        updated_at: payload.company?.updated_at || row.updated_at
      } : row)));
      setSuccess(`Updated ${editingCompany.canonical_name}`);
      setEditingCompany(null);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Failed to update company');
    } finally {
      setSavingCompany(false);
    }
  }

  // ── Add Company ─────────────────────────────────────────────────────────────
  function handleAddNameChange(value: string) {
    setAddForm((f) => ({ ...f, name: value }));
    setAddDedup('idle');
    setAddDedupMatch(null);
    if (addDedupTimer.current) clearTimeout(addDedupTimer.current);
    if (!value.trim()) return;
    setAddDedup('checking');
    addDedupTimer.current = setTimeout(async () => {
      const { data } = await supabase
        .from('intel_companies')
        .select('id, canonical_name')
        .ilike('canonical_name', value.trim())
        .limit(1);
      if (data && data.length > 0) {
        setAddDedup('exists');
        setAddDedupMatch(data[0] as { id: string; canonical_name: string });
      } else {
        setAddDedup('clear');
      }
    }, 400);
  }

  async function saveNewCompany(e: React.FormEvent) {
    e.preventDefault();
    if (addDedup === 'exists') return;
    if (!addForm.name.trim()) return;
    setAddSaving(true);
    setError('');
    try {
      // Insert base company record
      const { data, error: insertError } = await supabase
        .from('intel_companies')
        .insert({
          canonical_name: addForm.name.trim(),
          website: addForm.website.trim() || null,
          state: addForm.state.trim() || null,
          district: addForm.district.trim() || null,
          cin: addForm.cin.trim() || null,
          gstin: addForm.gstin.trim() || null,
          pan: addForm.pan.trim() || null,
        })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      // Insert fact sheet for city + segment_tag
      if (data?.id && (addForm.city.trim() || addForm.segment_tag.trim())) {
        await supabase.from('intel_company_fact_sheets').insert({
          company_id: data.id,
          city: addForm.city.trim() || null,
          segment_tag: addForm.segment_tag.trim() || null,
        });
      }

      if (data) {
        setRows((r) => [data as IntelCompany, ...r]);
        setCompanies((c) => [data as IntelCompany, ...c]);
      }
      setSuccess(`Company "${addForm.name.trim()}" created successfully`);
      setShowAddCompany(false);
      setAddForm(DEFAULT_ADD_FORM);
      setAddDedup('idle');
      setAddDedupMatch(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create company');
    } finally {
      setAddSaving(false);
    }
  }

  async function deleteCompany(company: IntelCompany) {
    const confirmed = window.confirm(`Delete ${company.canonical_name}? This will remove the Intel company and its linked records.`);
    if (!confirmed) return;

    setDeletingCompanyId(company.id);
    setError('');
    setSuccess('');

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      const token = session?.access_token;
      if (!token) {
        throw new Error('Unable to delete company: missing session token.');
      }

      const response = await fetchIntelMutation(`/api/intel/companies/${company.id}`, {
        method: 'DELETE',
        headers: {
          authorization: `Bearer ${token}`
        }
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Failed to delete company');
      }

      setRows((currentRows) => currentRows.filter((row) => row.id !== company.id));
      setCompanies((currentRows) => currentRows.filter((row) => row.id !== company.id));
      setTotalRows((currentTotal) => Math.max(0, currentTotal - 1));
      setSuccess(`Deleted ${company.canonical_name}`);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete company');
    } finally {
      setDeletingCompanyId(null);
    }
  }

  useEffect(() => {
    loadData();
  }, [
    currentPage,
    pageSize,
    searchText,
    stateFilter,
    cityFilter,
    segmentTagFilter,
    registrationAuthorityFilter,
    registrationStatusFilter,
    registrationWasteCategoryFilter,
    minRegistrationCountFilter,
    spcbBoardFilter,
    spcbStateFilter,
    recyclerTypeFilter,
    expiredRegistrationsFilter,
    multiStateRecyclerFilter,
    recyclerCategoryFilter,
    cpcbStatusFilter,
    verificationStatus,
    googleVerifiedFilter,
    activeStatusFilter,
    minRating,
    originLat,
    originLng,
    radiusKm,
    minBatteryCapacityMt,
    sortBy,
    sortDirection
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadTradeSignalsForPage() {
      if (!rows.length) {
        setTradeSignalsByCompany({});
        return;
      }

      setTradeSignalsLoading(true);

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();

        const token = session?.access_token;
        if (!token) {
          if (!cancelled) setTradeSignalsByCompany({});
          return;
        }

        const results = await Promise.allSettled(
          rows.map(async (company) => {
            const response = await fetchIntelCompanies(`/api/intel/companies/${company.id}/trade-signals`, token);
            if (!response.ok) {
              throw new Error(`Failed to load trade signals for ${company.id}`);
            }

            const payload = await response.json() as TradeSignalsListSummary;
            return [company.id, payload] as const;
          })
        );

        if (cancelled) return;

        const next: Record<string, TradeSignalsListSummary> = {};
        for (const result of results) {
          if (result.status !== 'fulfilled') continue;
          const [companyId, payload] = result.value;
          next[companyId] = payload;
        }
        setTradeSignalsByCompany(next);
      } finally {
        if (!cancelled) setTradeSignalsLoading(false);
      }
    }

    loadTradeSignalsForPage();

    return () => {
      cancelled = true;
    };
  }, [rows]);

  async function enableNearMeSort() {
    if (typeof window === 'undefined') return;
    if (!window.navigator?.geolocation) {
      setError('Geolocation is not supported in this browser.');
      return;
    }

    const confirmed = window.confirm('Allow location access to sort companies nearest to you?');
    if (!confirmed) return;

    setNearMeLoading(true);
    setError('');

    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);

        setUserCoords({ lat, lng });
        setOriginLat(lat.toFixed(6));
        setOriginLng(lng.toFixed(6));
        setRadiusKm(String(DEFAULT_NEAR_ME_RADIUS_KM));
        setNearMeEnabled(true);
        setSuccess(`Near Me enabled. Showing companies within ${DEFAULT_NEAR_ME_RADIUS_KM} km, nearest first.`);
        setNearMeLoading(false);
      },
      (geoError) => {
        setNearMeLoading(false);
        if (geoError.code === geoError.PERMISSION_DENIED) {
          setError('Location permission denied. Enable location access and try again.');
          return;
        }
        if (geoError.code === geoError.TIMEOUT) {
          setError('Location request timed out. Please try again.');
          return;
        }
        setError('Unable to get your location right now.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 30000
      }
    );
  }

  function disableNearMeSort() {
    setNearMeEnabled(false);
    setUserCoords(null);
    setOriginLat('');
    setOriginLng('');
    setRadiusKm('');
    setSuccess('Near Me sorting cleared.');
  }

  const companyDistanceMap = useMemo(() => {
    if (!nearMeEnabled || !userCoords) return {} as Record<string, number>;
    const next: Record<string, number> = {};
    for (const company of rows) {
      if (typeof company.latitude !== 'number' || typeof company.longitude !== 'number') continue;
      next[company.id] = haversineDistanceKm(userCoords.lat, userCoords.lng, company.latitude, company.longitude);
    }
    return next;
  }, [nearMeEnabled, rows, userCoords]);

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const pageStart = totalRows === 0 ? 0 : (currentPageSafe - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPageSafe * pageSize, totalRows);
  const pagedCompanies = useMemo(() => {
    const typed = rows.filter((company) => {
      if (entityView === 'recyclers') return isRecyclerCompany(company);
      if (entityView === 'pibos') return !isRecyclerCompany(company);
      return true;
    });
    const baseRows = hotLeadsOnly ? typed.filter((company) => isHotLead(company)) : typed;
    if (!nearMeEnabled || !userCoords) return baseRows;
    return [...baseRows].sort((left, right) => {
      const leftDistance = companyDistanceMap[left.id];
      const rightDistance = companyDistanceMap[right.id];
      const leftKnown = Number.isFinite(leftDistance);
      const rightKnown = Number.isFinite(rightDistance);

      if (leftKnown && rightKnown) return leftDistance - rightDistance;
      if (leftKnown) return -1;
      if (rightKnown) return 1;
      return left.canonical_name.localeCompare(right.canonical_name);
    });
  }, [entityView, hotLeadsOnly, nearMeEnabled, userCoords, rows, companyDistanceMap]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchText,
    stateFilter,
    cityFilter,
    segmentTagFilter,
    registrationAuthorityFilter,
    registrationStatusFilter,
    registrationWasteCategoryFilter,
    minRegistrationCountFilter,
    spcbBoardFilter,
    spcbStateFilter,
    recyclerTypeFilter,
    expiredRegistrationsFilter,
    multiStateRecyclerFilter,
    recyclerCategoryFilter,
    cpcbStatusFilter,
    verificationStatus,
    googleVerifiedFilter,
    activeStatusFilter,
    minRating,
    originLat,
    originLng,
    radiusKm,
    minBatteryCapacityMt,
    sortBy,
    sortDirection,
    pageSize
  ]);

  const stateOptions = useMemo(() => {
    const opts = new Set<string>();
    for (const row of companies) {
      if (row.state) opts.add(row.state);
    }
    return [...opts].sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const segmentOptions = useMemo(() => {
    const opts = new Set<string>(['Battery Producer']);
    for (const row of companies) {
      if (row.segment_tag) opts.add(row.segment_tag);
    }
    return [...opts].sort((a, b) => a.localeCompare(b));
  }, [companies]);

  const registrationAuthorityOptions = useMemo(() => {
    const opts = new Set<string>();
    for (const row of companies) {
      for (const authority of row.registration_authorities || []) {
        const normalized = String(authority || '').trim();
        if (normalized) opts.add(normalized);
      }
    }
    if (registrationAuthorityFilter.trim()) opts.add(registrationAuthorityFilter.trim());
    return [...opts].sort((a, b) => a.localeCompare(b));
  }, [companies, registrationAuthorityFilter]);

  const registrationStatusOptions = useMemo(() => {
    const opts = new Set<string>();
    for (const row of companies) {
      for (const status of row.registration_statuses || []) {
        const normalized = String(status || '').trim();
        if (normalized) opts.add(normalized);
      }
    }
    if (registrationStatusFilter.trim()) opts.add(registrationStatusFilter.trim());
    return [...opts].sort((a, b) => a.localeCompare(b));
  }, [companies, registrationStatusFilter]);

  const registrationWasteCategoryOptions = useMemo(() => {
    const opts = new Set<string>();
    for (const row of companies) {
      for (const category of row.registration_waste_categories || []) {
        const normalized = String(category || '').trim();
        if (normalized) opts.add(normalized);
      }
    }
    if (registrationWasteCategoryFilter.trim()) opts.add(registrationWasteCategoryFilter.trim());
    return [...opts].sort((a, b) => a.localeCompare(b));
  }, [companies, registrationWasteCategoryFilter]);

  // ── Enrichment queue banner count ───────────────────────────────────────────
  const needsEnrichmentCount = useMemo(
    () => rows.filter((r) => r.enrichment_status !== 'enriched' || completenessScore(r) < 40).length,
    [rows],
  );

  const registrationSummary = useMemo(() => {
    const totalRegistrations = rows.reduce((sum, row) => sum + Number(row.registration_count || 0), 0);
    const companiesWithRegistrations = rows.filter((row) => Number(row.registration_count || 0) > 0).length;
    const withPrimaryRegistration = rows.filter((row) => Boolean(row.primary_registration_id)).length;
    return {
      totalRegistrations,
      companiesWithRegistrations,
      withPrimaryRegistration
    };
  }, [rows]);

  return (
    <div className="min-h-screen text-slate-100">
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>

      <section className="relative mx-auto max-w-7xl px-6 py-8">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Companies</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Target Accounts</h1>
            </div>
            <p className="mt-1.5 text-sm text-slate-400">Browse unified entities ranked by fit, urgency, and compliance footprint.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                ['all', 'All companies'],
                ['recyclers', 'Recyclers / PROs'],
                ['pibos', 'Producers / PIBOs'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEntityView(key)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                    entityView === key
                      ? 'border-teal-500/60 bg-teal-500/15 text-teal-200'
                      : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[
                { href: '/intel/field-explainer#company-core',                  label: 'Company fields' },
                { href: '/intel/field-explainer#registration-compliance',        label: 'Registration fields' },
                { href: '/intel/field-explainer#google-verification-geo-quality', label: 'Geo quality' },
              ].map((chip) => (
                <Link key={chip.href} href={chip.href}
                  className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-slate-900/60 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-teal-500/40 hover:text-teal-300">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  {chip.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => { setShowAddCompany(true); setAddForm(DEFAULT_ADD_FORM); setAddDedup('idle'); setAddDedupMatch(null); }}
              className="flex items-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-semibold text-teal-300 transition hover:border-teal-400 hover:bg-teal-500/20"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Company
            </button>
            {[
              { href: '/intel',           label: 'Intel Home' },
              { href: '/intel/discovery', label: 'Discovery Ops' },
              { href: '/intel/sources',   label: 'Source Registry' },
            ].map((link) => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-1.5 rounded-xl border border-white/8 bg-slate-900/50 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:border-teal-500/30 hover:text-teal-300">
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Saved filter chips ───────────────────────────────────────────── */}
        {savedFilters.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-slate-500">Saved:</span>
            {savedFilters.map((sf) => (
              <div key={sf.name} className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => applyFilterSet(sf)}
                  className="rounded-l-full border border-teal-700/50 bg-teal-900/20 px-3 py-1 text-xs font-medium text-teal-300 transition hover:bg-teal-900/40"
                >
                  {sf.name}
                </button>
                <button
                  type="button"
                  onClick={() => deleteFilterSet(sf.name)}
                  aria-label={`Delete saved filter "${sf.name}"`}
                  className="rounded-r-full border border-l-0 border-teal-700/50 bg-teal-900/20 px-2 py-1 text-teal-500 transition hover:bg-rose-900/30 hover:text-rose-300"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-3.5 w-3.5 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Filters</span>
          </div>
          <label className="mb-1 block text-xs text-slate-400">Search</label>
          <div className="relative">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              onBlur={() => setTimeout(() => setSuggestionsOpen(false), 150)}
              onFocus={() => suggestions.length > 0 && setSuggestionsOpen(true)}
              placeholder="Company / CIN / GSTIN / State"
              className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
            />
            {suggestionsOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 top-full z-30 mt-1 w-full rounded-md border border-slate-700 bg-slate-950 shadow-xl">
                {suggestions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-800"
                      onMouseDown={() => {
                        setSearchText(s.canonical_name);
                        setSuggestionsOpen(false);
                      }}
                    >
                      <span>
                        <span className="font-medium text-slate-100">{s.canonical_name}</span>
                        {s.state && <span className="ml-2 text-[11px] text-slate-500">{s.state}</span>}
                      </span>
                      {s.tier && (
                        <span className={`rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                          s.tier === 'hot' ? 'border-red-600/40 bg-red-500/10 text-red-300'
                          : s.tier === 'warm' ? 'border-amber-600/40 bg-amber-500/10 text-amber-300'
                          : 'border-slate-700 text-slate-500'
                        }`}>
                          {s.tier}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div>
              <label className="mb-1 block text-xs text-slate-400">State</label>
              <select
                value={stateFilter}
                onChange={(event) => setStateFilter(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">All states</option>
                {stateOptions.map((stateOption) => (
                  <option key={stateOption} value={stateOption}>
                    {stateOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">City</label>
              <input
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                placeholder="e.g. Mumbai"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Segment</label>
              <select
                value={segmentTagFilter}
                onChange={(event) => setSegmentTagFilter(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">All segments</option>
                {segmentOptions.map((segmentOption) => (
                  <option key={segmentOption} value={segmentOption}>
                    {segmentOption}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Verification</label>
              <select
                value={verificationStatus}
                onChange={(event) => setVerificationStatus(event.target.value)}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="">All</option>
                <option value="verified">Verified</option>
                <option value="unverified">Unverified</option>
                <option value="enriched">Enriched</option>
                <option value="pending">Pending Enrichment</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Sort By</label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'updated_at' | 'canonical_name' | 'state')}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="updated_at">Updated</option>
                <option value="canonical_name">Company Name</option>
                <option value="state">State</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-400">Order</label>
              <select
                value={sortDirection}
                onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                <option value="desc">Desc</option>
                <option value="asc">Asc</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enableNearMeSort}
              disabled={nearMeLoading}
              className="rounded border border-cyan-700 bg-cyan-900/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-900/35 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {nearMeLoading ? 'Locating...' : 'Near Me'}
            </button>
            {nearMeEnabled && userCoords ? (
              <>
                <span className="rounded border border-teal-700/50 bg-teal-900/20 px-2 py-1 text-[11px] text-teal-200">
                  GPS: {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
                </span>
                <span className="rounded border border-cyan-700/50 bg-cyan-900/20 px-2 py-1 text-[11px] text-cyan-200">
                  Radius: {radiusKm || DEFAULT_NEAR_ME_RADIUS_KM} km
                </span>
                <button
                  type="button"
                  onClick={disableNearMeSort}
                  className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-300 transition hover:border-slate-500"
                >
                  Clear Near Me
                </button>
              </>
            ) : null}
          </div>

          <details className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <summary className="cursor-pointer text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
              Advanced Filters
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs text-slate-400">Registration Authority</label>
                <select
                  value={registrationAuthorityFilter}
                  onChange={(event) => setRegistrationAuthorityFilter(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">All authorities</option>
                  {registrationAuthorityOptions.map((authorityOption) => (
                    <option key={authorityOption} value={authorityOption}>
                      {authorityOption}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Registration Status</label>
                <select
                  value={registrationStatusFilter}
                  onChange={(event) => setRegistrationStatusFilter(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">All statuses</option>
                  {registrationStatusOptions.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Registration Category</label>
                <select
                  value={registrationWasteCategoryFilter}
                  onChange={(event) => setRegistrationWasteCategoryFilter(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">All categories</option>
                  {registrationWasteCategoryOptions.map((categoryOption) => (
                    <option key={categoryOption} value={categoryOption}>
                      {categoryOption}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-400">Google Verified</label>
                <select
                  value={googleVerifiedFilter}
                  onChange={(event) => setGoogleVerifiedFilter(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Needs Review</option>
                </select>
              </div>
            </div>
          </details>
        </div>

        {error ? <p className="mb-4 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mb-4 text-sm text-emerald-300">{success}</p> : null}

        {/* ── Enrichment queue banner ─────────────────────────────────────── */}
        {needsEnrichmentCount > 0 && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0 text-amber-400" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <p className="text-sm text-amber-200">
                <span className="font-semibold">{needsEnrichmentCount}</span>
                {' '}compan{needsEnrichmentCount === 1 ? 'y' : 'ies'} in view {needsEnrichmentCount === 1 ? 'needs' : 'need'} enrichment
                <span className="ml-1 text-amber-400/70">(completeness &lt; 40 % or not yet enriched)</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setVerificationStatus('pending')}
              className="shrink-0 rounded-lg border border-amber-700 bg-amber-900/30 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-900/50 transition"
            >
              Show all →
            </button>
          </div>
        )}

        {/* ── DNC warning modal ───────────────────────────────────────────── */}
        {showDncModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
            <div className="w-full max-w-md rounded-2xl border border-rose-700/50 bg-slate-900 p-6 shadow-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-rose-300 mb-1">Do Not Call Registry</p>
              <h2 className="text-lg font-semibold text-slate-100 mb-1">
                {dncHits.length} DNC hit{dncHits.length > 1 ? 's' : ''} detected
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                The following companies have phone numbers on the Do Not Call list. You can skip them or push all anyway.
              </p>
              <ul className="mb-5 space-y-2 max-h-48 overflow-y-auto">
                {dncHits.map((h, i) => (
                  <li key={i} className="flex items-start gap-2 rounded-lg border border-rose-800/40 bg-rose-950/30 px-3 py-2">
                    <svg className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m10.29 3.86-8.28 14.33a2 2 0 0 0 1.71 3h16.56a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{h.companyName}</p>
                      <p className="text-xs text-slate-400">{h.phone} · {h.reason}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowDncModal(false); setDncHits([]); setPendingPushTargets([]); }}
                  className="flex-1 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500"
                >
                  Cancel push
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowDncModal(false);
                    const dncNames = new Set(dncHits.map((h) => h.companyName));
                    const filtered = pendingPushTargets.filter((t) => !dncNames.has(t.canonical_name));
                    await doPush(filtered);
                    setDncHits([]); setPendingPushTargets([]);
                  }}
                  className="flex-1 rounded-lg border border-amber-600 bg-amber-600/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-600/20"
                >
                  Skip DNC · push rest
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowDncModal(false);
                    await doPush(pendingPushTargets);
                    setDncHits([]); setPendingPushTargets([]);
                  }}
                  className="flex-1 rounded-lg border border-rose-600 bg-rose-600/10 px-3 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-600/20"
                >
                  Push all anyway
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3 text-xs text-slate-300">
          <p>
            Showing {pageStart}-{pageEnd} of {totalRows}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSegmentTagFilter('Battery Producer')}
              className="rounded border border-cyan-800 bg-cyan-950/60 px-2 py-1 text-xs text-cyan-200 hover:border-cyan-500 hover:text-cyan-100"
            >
              Battery Producers
            </button>
            <button
              type="button"
              onClick={() => setVerificationStatus('pending')}
              className="rounded border border-amber-800 bg-amber-950/40 px-2 py-1 text-xs text-amber-200 hover:border-amber-500 hover:text-amber-100"
            >
              Needs Enrichment
            </button>
            <button
              type="button"
              onClick={() => setHotLeadsOnly((current) => !current)}
              className={`rounded border px-2 py-1 text-xs transition ${hotLeadsOnly
                ? 'border-rose-500 bg-rose-900/30 text-rose-200 hover:border-rose-400'
                : 'border-rose-800 bg-rose-950/30 text-rose-200 hover:border-rose-500 hover:text-rose-100'
              }`}
            >
              {hotLeadsOnly ? 'Hot Leads: ON' : 'Hot Leads'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (nearMeEnabled) disableNearMeSort();
                else void enableNearMeSort();
              }}
              disabled={nearMeLoading}
              className="rounded border border-cyan-800 bg-cyan-950/40 px-2 py-1 text-xs text-cyan-200 hover:border-cyan-500 hover:text-cyan-100 disabled:opacity-60"
            >
              {nearMeEnabled ? 'Clear Near Me' : (nearMeLoading ? 'Locating...' : 'Near Me')}
            </button>
            <button
              type="button"
              onClick={saveCurrentFilters}
              className="inline-flex items-center gap-1 rounded border border-teal-800 bg-teal-950/30 px-2 py-1 text-xs text-teal-300 hover:border-teal-500 hover:text-teal-100"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Save Filters
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchText('');
                setStateFilter('');
                setCityFilter('');
                setSegmentTagFilter('');
                setRegistrationAuthorityFilter('');
                setRegistrationStatusFilter('');
                setRegistrationWasteCategoryFilter('');
                setMinRegistrationCountFilter('');
                setSpcbBoardFilter('');
                setSpcbStateFilter('');
                setRecyclerTypeFilter('');
                setExpiredRegistrationsFilter(false);
                setMultiStateRecyclerFilter(false);
                setRecyclerCategoryFilter('');
                setCpcbStatusFilter('');
                setVerificationStatus('');
                setGoogleVerifiedFilter('');
                setActiveStatusFilter('');
                setMinRating('');
                setOriginLat('');
                setOriginLng('');
                setRadiusKm('');
                setMinBatteryCapacityMt('');
                setHotLeadsOnly(false);
              }}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300"
            >
              Reset Filters
            </button>
            <label htmlFor="companies-page-size" className="text-slate-400">
              Rows
            </label>
            <select
              id="companies-page-size"
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
              className="rounded-md border border-slate-700 bg-slate-950 px-2 py-1 text-xs outline-none focus:border-teal-400"
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPageSafe <= 1}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPageSafe} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPageSafe >= totalPages}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/70">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 px-4 py-3 text-xs">
            <div className="flex items-center gap-1.5 rounded-md border border-cyan-800/60 bg-cyan-950/40 px-2.5 py-1 text-cyan-300">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              {registrationSummary.totalRegistrations.toLocaleString('en-IN')} registrations
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-emerald-300">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              {registrationSummary.companiesWithRegistrations.toLocaleString('en-IN')} with registrations
            </div>
            <div className="flex items-center gap-1.5 rounded-md border border-amber-800/60 bg-amber-950/40 px-2.5 py-1 text-amber-300">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
              {registrationSummary.withPrimaryRegistration.toLocaleString('en-IN')} with primary reg
            </div>
          </div>
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-3 py-2 w-8">
                  <input
                    type="checkbox"
                    aria-label="Select all on page"
                    checked={rows.length > 0 && rows.every((r) => selectedIds.has(r.id))}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(rows.map((r) => r.id)));
                      else setSelectedIds(new Set());
                    }}
                    className="rounded border-slate-600 bg-slate-800 accent-teal-500"
                  />
                </th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">State</th>
                <th className="px-3 py-2">City</th>
                <th className="px-3 py-2">Registrations</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Segment</th>
                {entityView !== 'pibos' ? <th className="px-3 py-2">Capacity</th> : null}
                <th className="px-3 py-2">Enrichment</th>
                <th className="px-3 py-2">Distance</th>
                <th className="px-3 py-2">Updated</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-900 animate-pulse">
                    <td className="px-3 py-3"><div className="h-3 w-3 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="space-y-1.5"><div className="h-3 w-40 rounded bg-slate-800" /><div className="h-2.5 w-20 rounded bg-slate-800/60" /></div></td>
                    <td className="px-3 py-3"><div className="h-3 w-20 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-5 w-20 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-5 w-16 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-3 w-10 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="h-3 w-16 rounded bg-slate-800" /></td>
                    <td className="px-3 py-3"><div className="flex gap-1.5"><div className="h-7 w-7 rounded bg-slate-800" /><div className="h-7 w-7 rounded bg-slate-800" /><div className="h-7 w-7 rounded bg-slate-800" /></div></td>
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={entityView === 'pibos' ? 10 : 11} className="px-4 py-12 text-center">
                    <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <p className="mt-3 text-sm font-semibold text-slate-300">No companies match your filters</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try broadening your search, clearing filters, or{' '}
                      <a href="/intel/upload" className="text-teal-300 hover:underline">uploading new data</a>.
                    </p>
                  </td>
                </tr>
              ) : (
                pagedCompanies.map((company) => {
                  return (
                    <tr key={company.id} className={`border-b border-slate-900 transition hover:bg-slate-800/30 ${selectedIds.has(company.id) ? 'bg-teal-950/20 hover:bg-teal-950/30' : ''}`}>
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`Select ${company.canonical_name}`}
                          checked={selectedIds.has(company.id)}
                          onChange={(e) => {
                            setSelectedIds((prev) => {
                              const next = new Set(prev);
                              if (e.target.checked) next.add(company.id);
                              else next.delete(company.id);
                              return next;
                            });
                          }}
                          className="rounded border-slate-600 bg-slate-800 accent-teal-500"
                        />
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-100">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex items-center gap-1.5">
                            {isHotLead(company) ? (
                              <span
                                aria-label="Hot lead"
                                title="Hot lead"
                                className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-1.5 py-0.5 text-[10px] leading-none text-rose-300"
                              >
                                <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C9.8 4.2 9 7 9.5 9.5 7.4 8.2 6.5 5.8 6.5 5.8 4.5 8.2 4 11 5 13.5c.8 2 2.3 3.5 4 4.3V20h6v-2.2c1.7-.8 3.2-2.3 4-4.3 1-2.5.5-5.3-1.5-7.7 0 0-.9 2.4-3 3.7C15 7 14.2 4.2 12 2z"/></svg>
                                Hot
                              </span>
                            ) : null}
                            <span>{company.canonical_name}</span>
                          </span>
                          <span className="inline-flex w-fit rounded bg-cyan-900/35 px-2 py-0.5 text-[11px] font-medium text-cyan-200">
                            {(company.location_count || 0).toLocaleString('en-IN')} Locations
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-slate-300">{company.state || '-'}</td>
                      <td className="px-3 py-2 text-slate-300">{company.city || '-'}</td>
                      <td className="px-3 py-2 text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span className="inline-flex w-fit rounded bg-emerald-900/40 px-2 py-0.5 text-[11px] text-emerald-200">
                            {(company.registration_count || 0).toLocaleString('en-IN')} Total
                          </span>
                          <span className="text-xs text-slate-400">{company.primary_registration_id || '-'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${isRecyclerCompany(company) ? 'border border-teal-700/40 bg-teal-900/40 text-teal-200' : 'border border-blue-700/40 bg-blue-900/40 text-blue-200'}`}>
                          {isRecyclerCompany(company) ? 'Recycler' : 'PIBO'}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {company.segment_tag ? (
                          <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${segmentTagColor(company.segment_tag)}`}>
                            {company.segment_tag}
                          </span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      {entityView !== 'pibos' ? (
                        <td className="px-3 py-2 text-slate-300">
                          {isRecyclerCompany(company) ? (
                            <div className="flex flex-col gap-0.5">
                              <span className="tabular-nums">{company.annual_processing_capacity_mt ?? company.cpcb_capacity_mt ?? '—'} MT</span>
                              <span className="text-[11px] text-slate-500">{company.cpcb_registration_status || company.recycler_category || ''}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                      ) : null}
                      <td className="px-3 py-2 text-slate-300">
                        <span className={`rounded px-2 py-1 text-xs ${company.enrichment_status === 'enriched' ? 'bg-cyan-900/40 text-cyan-300' : 'bg-slate-800 text-slate-300'}`}>
                          {company.enrichment_status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {nearMeEnabled ? (
                          Number.isFinite(companyDistanceMap[company.id])
                            ? `${companyDistanceMap[company.id].toFixed(1)} km`
                            : <span className="text-slate-500">No GPS</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-400">{new Date(company.updated_at).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/intel/companies/${company.id}?from=companies`}
                            aria-label={`View ${company.canonical_name}`}
                            title="View"
                            className="rounded border border-slate-700 p-2 text-slate-200 hover:border-teal-400 hover:text-teal-300"
                          >
                            <ViewIcon />
                          </Link>
                          <button
                            type="button"
                            aria-label={`Edit ${company.canonical_name}`}
                            title="Edit"
                            onClick={() => setEditingCompany({
                              id: company.id,
                              canonical_name: company.canonical_name,
                              website: company.website || '',
                              state: company.state || '',
                              district: company.district || ''
                            })}
                            className="rounded border border-slate-700 p-2 text-slate-200 hover:border-amber-400 hover:text-amber-300"
                          >
                            <EditIcon />
                          </button>
                          {/* Quick push to Telecalling */}
                          <button
                            type="button"
                            aria-label={`Send ${company.canonical_name} to Telecalling`}
                            title={quickPushDoneIds.has(company.id) ? 'Already pushed' : 'Send to Telecalling'}
                            onClick={() => quickPushSingle(company)}
                            disabled={quickPushingId === company.id || quickPushDoneIds.has(company.id)}
                            className={`rounded border p-2 transition disabled:opacity-40 ${
                              quickPushDoneIds.has(company.id)
                                ? 'border-teal-600/50 text-teal-400'
                                : 'border-slate-700 text-slate-200 hover:border-teal-500 hover:text-teal-300'
                            }`}
                          >
                            {quickPushDoneIds.has(company.id) ? (
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            ) : quickPushingId === company.id ? (
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                            ) : (
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                            )}
                          </button>
                          <button
                            type="button"
                            aria-label={`Delete ${company.canonical_name}`}
                            title="Delete"
                            onClick={() => deleteCompany(company)}
                            disabled={deletingCompanyId === company.id}
                            className="rounded border border-slate-700 p-2 text-slate-200 hover:border-rose-400 hover:text-rose-300 disabled:opacity-50"
                          >
                            <DeleteIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Bulk action bar ─────────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-teal-700/60 bg-slate-900 px-5 py-3 shadow-2xl shadow-black/60">
            <span className="text-sm font-semibold text-teal-300">{selectedIds.size} selected</span>
            <div className="h-4 w-px bg-slate-700" />
            <button
              type="button"
              onClick={bulkPushToTelecalling}
              disabled={bulkPushing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/50 bg-teal-500/15 px-4 py-1.5 text-xs font-semibold text-teal-200 transition hover:bg-teal-500/25 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              {bulkPushing ? 'Pushing…' : 'Push to Telecalling'}
            </button>
            <button
              type="button"
              onClick={() => {
                const selected = rows.filter((r) => selectedIds.has(r.id));
                const csv = ['Company,State,City,Segment,Enrichment Status']
                  .concat(selected.map((c) => [c.canonical_name, c.state || '', c.city || '', c.segment_tag || '', c.enrichment_status].map((v) => `"${v}"`).join(',')))
                  .join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'intel_companies_export.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/60 px-4 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-slate-500 hover:text-slate-100"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 transition hover:text-slate-200"
            >
              Clear
            </button>
          </div>
        )}

        {/* ── Add Company Modal ──────────────────────────────────────────────── */}
        {showAddCompany && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/80 px-4 py-8">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Intel</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-100">Add Company</h2>
                  <p className="mt-1 text-xs text-slate-500">Manually register a company in the Intel database.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddCompany(false)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100"
                >
                  Close
                </button>
              </div>

              <form className="space-y-4" onSubmit={saveNewCompany}>
                {/* Company Name + dedup */}
                <div>
                  <label className="mb-1 block text-xs text-slate-400">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    required
                    value={addForm.name}
                    onChange={(e) => handleAddNameChange(e.target.value)}
                    placeholder="Exact canonical name"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                  />
                  {addDedup === 'checking' && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      Checking for duplicates…
                    </p>
                  )}
                  {addDedup === 'exists' && addDedupMatch && (
                    <p className="mt-1 text-xs text-amber-400">
                      ⚠ Company already exists as &ldquo;{addDedupMatch.canonical_name}&rdquo;. Search for it above to edit.
                    </p>
                  )}
                  {addDedup === 'clear' && (
                    <p className="mt-1 text-xs text-teal-400">✓ Name is available</p>
                  )}
                </div>

                {/* Website */}
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Website</label>
                  <input
                    value={addForm.website}
                    onChange={(e) => setAddForm((f) => ({ ...f, website: e.target.value }))}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                  />
                </div>

                {/* State / City / District */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">State</label>
                    <select
                      value={addForm.state}
                      onChange={(e) => setAddForm((f) => ({ ...f, state: e.target.value }))}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    >
                      <option value="">Select State / UT</option>
                      {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">City</label>
                    <input
                      value={addForm.city}
                      onChange={(e) => setAddForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Mumbai"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">District</label>
                    <input
                      value={addForm.district}
                      onChange={(e) => setAddForm((f) => ({ ...f, district: e.target.value }))}
                      placeholder="Mumbai City"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                {/* Segment Tag */}
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Segment Tag</label>
                  <input
                    value={addForm.segment_tag}
                    onChange={(e) => setAddForm((f) => ({ ...f, segment_tag: e.target.value }))}
                    placeholder="e.g. MSME, Enterprise, Startup"
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                  />
                </div>

                {/* CIN / GSTIN / PAN */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">CIN</label>
                    <input
                      value={addForm.cin}
                      onChange={(e) => setAddForm((f) => ({ ...f, cin: e.target.value }))}
                      placeholder="U12345MH2000PLC123456"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">GSTIN</label>
                    <input
                      value={addForm.gstin}
                      onChange={(e) => setAddForm((f) => ({ ...f, gstin: e.target.value }))}
                      placeholder="27AAAAA0000A1Z5"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">PAN</label>
                    <input
                      value={addForm.pan}
                      onChange={(e) => setAddForm((f) => ({ ...f, pan: e.target.value }))}
                      placeholder="AAAAA0000A"
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-teal-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCompany(false)}
                    className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addSaving || addDedup === 'exists' || addDedup === 'checking' || !addForm.name.trim()}
                    className="rounded border border-teal-500 bg-teal-500/10 px-4 py-2 text-sm font-semibold text-teal-200 hover:bg-teal-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {addSaving ? 'Creating…' : 'Create Company'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingCompany ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
            <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-300">Intel Company</p>
                  <h2 className="mt-1 text-xl font-semibold text-slate-100">Edit Company</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCompany(null)}
                  className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500 hover:text-slate-100"
                >
                  Close
                </button>
              </div>

              <form className="space-y-4" onSubmit={updateCompany}>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Company Name</label>
                  <input
                    required
                    value={editingCompany.canonical_name}
                    onChange={(event) => setEditingCompany((current) => current ? { ...current, canonical_name: event.target.value } : current)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-slate-400">Website</label>
                  <input
                    value={editingCompany.website}
                    onChange={(event) => setEditingCompany((current) => current ? { ...current, website: event.target.value } : current)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">State</label>
                    <select
                      value={editingCompany.state}
                      onChange={(event) => setEditingCompany((current) => current ? { ...current, state: event.target.value } : current)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    >
                      <option value="">Select State / UT</option>
                      {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">District</label>
                    <input
                      value={editingCompany.district}
                      onChange={(event) => setEditingCompany((current) => current ? { ...current, district: event.target.value } : current)}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCompany(null)}
                    className="rounded border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:border-slate-500 hover:text-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingCompany}
                    className="rounded border border-amber-500 bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-200 hover:bg-amber-500/20 disabled:opacity-50"
                  >
                    {savingCompany ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </section>

      {/* ── Targeting Summary ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 pb-10">
        <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Accounts In View', value: loading ? '…' : targetingSummary.visibleCompanies.toLocaleString('en-IN'), accent: 'bg-teal-400',    text: 'text-slate-100' },
            { label: 'Hot Leads',         value: loading ? '…' : targetingSummary.hotLeads.toLocaleString('en-IN'),         accent: 'bg-rose-400',    text: 'text-rose-200' },
            { label: 'Needs Enrichment',  value: loading ? '…' : targetingSummary.needsEnrichment.toLocaleString('en-IN'),  accent: 'bg-violet-400',  text: 'text-violet-200' },
            { label: 'Compliance Heavy',  value: loading ? '…' : targetingSummary.complianceHeavy.toLocaleString('en-IN'),  accent: 'bg-amber-400',   text: 'text-amber-200' },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <div className={`mb-2.5 h-0.5 w-7 rounded-full ${kpi.accent}`} />
              <p className="text-[11px] uppercase tracking-widest text-slate-500">{kpi.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${kpi.text}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Platform Pulse */}
        {platformPulse && (
          <div className="mb-4 rounded-xl border border-teal-900/40 bg-gradient-to-br from-teal-950/20 via-slate-900/70 to-slate-900/70 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300">Market Pulse</p>
                <p className="mt-1 text-sm text-slate-300">
                  {platformPulse.metrics.total_insights.toLocaleString('en-IN')} AI signal{platformPulse.metrics.total_insights === 1 ? '' : 's'} active across Intel services.
                </p>
                {platformPulse.insights[0]?.title ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Top signal: <span className="text-slate-200">{platformPulse.insights[0].title}</span>
                  </p>
                ) : null}
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                  Queue {platformPulse.service_health.enrichment.completed}/{platformPulse.service_health.enrichment.total}
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
                  Verify {platformPulse.service_health.lead_verification.valid}/{platformPulse.service_health.lead_verification.total}
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 sm:col-span-1 col-span-2">
                  Outbound pending {platformPulse.service_health.outbound.pending_approval} · sent {platformPulse.service_health.outbound.sent}
                </div>
              </div>
            </div>
            {platformPulse.insights[0]?.recommended_action ? (
              <p className="mt-3 rounded-lg border border-teal-800/40 bg-teal-950/20 px-3 py-2 text-xs text-teal-200">
                Next action: {platformPulse.insights[0].recommended_action}
              </p>
            ) : null}
          </div>
        )}

        {/* LinkedIn Industry Filters */}
        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">LinkedIn Industry Filters</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-slate-400">LinkedIn Industry</label>
              <input
                value={linkedinIndustryFilter}
                onChange={(e) => setLinkedinIndustryFilter(e.target.value)}
                placeholder="e.g. Information Technology"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">LinkedIn Sub-Industry</label>
              <input
                value={linkedinSubindustryFilter}
                onChange={(e) => setLinkedinSubindustryFilter(e.target.value)}
                placeholder="e.g. IT Consulting"
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
              />
            </div>
          </div>
        </div>

        {/* Bulk SendPilot */}
        {selectedIds.size > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-900/40 bg-cyan-950/20 p-4">
            <p className="text-sm text-cyan-200">{selectedIds.size} account{selectedIds.size === 1 ? '' : 's'} selected</p>
            <button
              type="button"
              onClick={bulkRunSendPilotDiscovery}
              disabled={bulkSendPilotRunning}
              className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-600/50 bg-cyan-500/15 px-4 py-1.5 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 disabled:opacity-50"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              {bulkSendPilotRunning ? 'Running…' : 'Run SendPilot'}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-2 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>
    </div>
  );
}
