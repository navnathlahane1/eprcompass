'use client';

/**
 * Intel Data Import — world-class XLSX / CSV ingestion wizard.
 *
 * Flow:
 *  1. Drop  — drag-and-drop or browse; client parses for instant preview
 *  2. Configure — sheet picker, import profile, waste category, source
 *  3. Preview  — data quality metrics + first-N rows
 *  4. Import   — sends raw file to /ingest/bulk-async, polls job status
 *  5. Done     — results card + enrichment trigger + history
 */

import Link from 'next/link';
import * as XLSX from 'xlsx';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 'drop' | 'configure' | 'mapping' | 'preview' | 'importing' | 'done';

type ColumnMapping = {
  sourceColumn: string;
  targetField: string;  // '' = skip
  confidence: number;   // 0-1
};

const KNOWN_FIELDS = [
  { value: '',                 label: '— Skip this column —',       pattern: null },
  // ── Company identity ──────────────────────────────────────────────────────
  { value: 'company_name',    label: 'Company Name',                pattern: /company|name|firm|enterprise|organization|org|account/i },
  { value: 'website',         label: 'Website / Domain',            pattern: /\bwebsite\b|\bweb\b|\burl\b|\bdomain\b|homepage/i },
  { value: 'company_linkedin',label: 'Company LinkedIn URL',        pattern: /company.*linkedin|linkedin.*company|organization.*linkedin/i },
  { value: 'state',           label: 'State / Province',            pattern: /\bstate\b|\bprovince\b|\bregion\b/i },
  { value: 'city',            label: 'City / District',             pattern: /\bcity\b|\btown\b|\bdistrict\b|metro/i },
  { value: 'address',         label: 'Address',                     pattern: /address|\blocation\b|\bloc\b|headquarters/i },
  // ── Company intelligence ──────────────────────────────────────────────────
  { value: 'industry',        label: 'Industry / Sector',           pattern: /\bindustry\b|\bsector\b|\bvertical\b|\bcategory\b/i },
  { value: 'sub_industry',    label: 'Sub-Industry',                pattern: /sub.?industry|industry.*sub|industry.*category|subindustry/i },
  { value: 'employee_count',  label: 'Employee Count / Band',       pattern: /employee|team.?size|staff|headcount|num.*employees?|#.*employees?/i },
  { value: 'revenue',         label: 'Annual Revenue / Range',      pattern: /revenue|turnover|annual.*rev|\binr\b.*cr|cr.*\binr\b/i },
  { value: 'founded_year',    label: 'Founded Year',                pattern: /founded|year.*founded|established.*year|incorporation.*year/i },
  // ── Compliance IDs ────────────────────────────────────────────────────────
  { value: 'cin',             label: 'CIN',                         pattern: /\bcin\b|corporate.*id|company.*id/i },
  { value: 'gstin',           label: 'GSTIN / GST',                 pattern: /\bgstin\b|\bgst\b/i },
  { value: 'pan',             label: 'PAN',                         pattern: /\bpan\b/i },
  { value: 'cpcb_reg',        label: 'CPCB Registration No.',       pattern: /cpcb.*reg|cpcb.*no/i },
  { value: 'registration_no', label: 'Registration No.',            pattern: /\breg(istration)?\b.*no?|auth.*no?/i },
  { value: 'authority',       label: 'Authority / Board',           pattern: /authority|board|\bspcb\b|\bmpcb\b|\bcpcb\b/i },
  { value: 'valid_upto',      label: 'Valid Upto / Expiry',         pattern: /valid.*upto|expir|valid.*till/i },
  // ── Contact / decision-maker ──────────────────────────────────────────────
  { value: 'contact_name',    label: 'Contact Name (Full)',         pattern: /^name$|full.?name|contact.?name|person.?name/i },
  { value: 'first_name',      label: 'First Name',                  pattern: /first.?name/i },
  { value: 'last_name',       label: 'Last Name',                   pattern: /last.?name/i },
  { value: 'designation',     label: 'Job Title / Designation',     pattern: /\btitle\b|job.?title|designation|headline|position/i },
  { value: 'department',      label: 'Department / Function',       pattern: /\bdepartment\b|\bfunction\b|\bdept\b/i },
  { value: 'management_level',label: 'Management Level / Seniority',pattern: /management.?level|seniority|level/i },
  { value: 'person_linkedin', label: 'Person LinkedIn URL',         pattern: /person.*linkedin|linkedin.*url|linkedin.*profile|^linkedin$/i },
  { value: 'email',           label: 'Email',                       pattern: /\bemail\b|\be[-_]mail\b|work.?email|business.?email/i },
  { value: 'phone',           label: 'Phone / Mobile',              pattern: /\bphone\b|\bmobile\b|\bcontact\b|\btel\b|direct.?phone/i },
  // ── Misc ──────────────────────────────────────────────────────────────────
  { value: 'category',        label: 'Waste Category',              pattern: /categor|waste.*type|type.*waste/i },
  { value: 'capacity_mt',     label: 'Capacity (MT)',               pattern: /capacity|\bmt\b|\btonne\b|\bton\b/i },
  { value: 'status',          label: 'Registration Status',         pattern: /\bstatus\b/i },
  { value: 'penalty',         label: 'Penalty (INR)',               pattern: /penalty|\bfine\b/i },
];

function autoDetectMapping(headers: string[]): ColumnMapping[] {
  return headers.map((h) => {
    const norm = h.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    let best: typeof KNOWN_FIELDS[0] | null = null;
    let bestScore = 0;
    for (const f of KNOWN_FIELDS) {
      if (!f.pattern) continue;
      if (f.pattern.test(norm)) {
        const score = norm.length < 20 ? 0.9 : 0.7;
        if (score > bestScore) { bestScore = score; best = f; }
      }
    }
    return { sourceColumn: h, targetField: best?.value || '', confidence: best ? bestScore : 0 };
  });
}

type SheetPreview = {
  name: string;
  rows: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
};

type ParsedFile = {
  file: File;
  sheets: SheetPreview[];
};

type IntelSourceRow = {
  id: string;
  source_name: string;
  source_type: string;
  vendor_name: string | null;
};

type ImportJob = {
  id: string;
  job_status: string;
  total_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  error_rows: number;
  error_log: Array<{ row_index: number; error: string }> | null;
  started_at: string | null;
  finished_at: string | null;
};

type ImportResult = {
  jobId: string;
  sourceDocumentId: string;
  totalRows: number;
};

type IngestReport = {
  import_summary: {
    total_rows: number;
    inserted_rows: number;
    updated_rows: number;
    skipped_rows: number;
    error_rows: number;
    raw_records_captured: number;
    success_rows: number;
  };
  duplicate_resolution_report: {
    total_rows_reviewed: number;
    matched_rows: number;
    created_rows: number;
    merged_rows: number;
    rows: Array<Record<string, unknown>>;
  };
  intelligence_enrichment_report: {
    sendpilot: Record<string, unknown> | null;
    enrichment_queue: Record<string, unknown> | null;
    inferred_industries: Array<{ label: string; count: number }>;
    compliance_flags: Array<{ label: string; count: number }>;
    probable_epr_applicable_rows: number;
    probable_company_matches: number;
  };
  error_report: {
    job_errors: Array<Record<string, unknown>>;
    total_error_rows: number;
    parse_status: string;
    job_error_log: unknown;
  };
};

type GoogleEnrichmentReport = {
  total_companies: number;
  google_matched_companies: number;
  google_verified_companies?: number;
  failed_matches: number;
  enrichment_freshness?: Record<string, number>;
  ai_provider_breakdown?: Record<string, number>;
};

const IMPORT_PROFILES = [
  { value: '',                  label: 'Auto-detect (recommended)',       group: 'General' },
  // ── Lead intelligence platforms ──────────────────────────────────────────
  { value: 'leadrocks_bulk_csv',label: 'LeadRocks Bulk Contacts CSV',     group: 'Lead Platforms' },
  { value: 'apollo',            label: 'Apollo.io Export',                group: 'Lead Platforms' },
  { value: 'zoominfo',          label: 'ZoomInfo Export',                 group: 'Lead Platforms' },
  { value: 'lusha',             label: 'Lusha Export',                    group: 'Lead Platforms' },
  { value: 'crunchbase',        label: 'Crunchbase Export',               group: 'Lead Platforms' },
  { value: 'linkedin',          label: 'LinkedIn Sales Navigator Export', group: 'Lead Platforms' },
  // ── Compliance / regulatory datasets ─────────────────────────────────────
  { value: 'recycler',          label: 'Recyclers / E-Waste / CPCB',      group: 'Regulatory' },
  { value: 'battery_producer',  label: 'Battery Producers (CPCB EPR)',    group: 'Regulatory' },
  { value: 'mpcb_recycler',     label: 'State PCB Recyclers',             group: 'Regulatory' },
  { value: 'cpcb_recycler',     label: 'CPCB Registered Recyclers',       group: 'Regulatory' },
  { value: 'producer',          label: 'Producers / PIBOs / Brand Owners',group: 'Regulatory' },
];

// Platform-specific hints shown in the configure step
const PLATFORM_HINTS: Record<string, { color: string; tip: string }> = {
  apollo:     { color: 'border-violet-700/40 bg-violet-950/20 text-violet-200', tip: 'Apollo exports: First Name, Last Name, Title, Company, LinkedIn URL are auto-mapped.' },
  zoominfo:   { color: 'border-blue-700/40 bg-blue-950/20 text-blue-200', tip: 'ZoomInfo exports: Management Level and Department columns are auto-detected.' },
  lusha:      { color: 'border-pink-700/40 bg-pink-950/20 text-pink-200', tip: 'Lusha: Verified Email and Company HQ Phone are auto-mapped.' },
  crunchbase: { color: 'border-green-700/40 bg-green-950/20 text-green-200', tip: 'Crunchbase: Organization Name, Headquarters, Funding Total and Founded Date are auto-mapped.' },
  linkedin:   { color: 'border-sky-700/40 bg-sky-950/20 text-sky-200', tip: 'LinkedIn Sales Nav: Position, Company and Connected On columns are handled automatically.' },
  leadrocks_bulk_csv: { color: 'border-cyan-700/40 bg-cyan-950/20 text-cyan-200', tip: 'LeadRocks: Company Name, Email, LinkedIn URL and Phone are detected automatically.' },
};

const WASTE_CATEGORIES = [
  { value: '', label: 'All / Not specified' },
  { value: 'Battery', label: 'Battery Waste' },
  { value: 'E-Waste', label: 'E-Waste' },
  { value: 'Plastic Packaging', label: 'Plastic Packaging' },
  { value: 'Tyre Waste', label: 'Tyre Waste' },
  { value: 'Used Oil', label: 'Used Oil' },
  { value: 'ELV', label: 'End-of-Life Vehicles (ELV)' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeHeader(v: unknown): string {
  return String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function scorePotentialHeaderRow(row: unknown[]): number {
  const nonEmpty = row.filter((c) => String(c ?? '').trim() !== '');
  if (nonEmpty.length < 2) return -1;
  const numericCount = nonEmpty.filter((c) => !Number.isNaN(Number(String(c).replace(/,/g, '')))).length;
  return nonEmpty.length - numericCount * 2;
}

function buildUniqueHeaders(row: unknown[]): string[] {
  const seen = new Map<string, number>();
  return row.map((cell) => {
    const base = normalizeHeader(cell).replace(/\s+/g, '_') || 'col';
    const count = (seen.get(base) || 0) + 1;
    seen.set(base, count);
    return count > 1 ? `${base}_${count}` : base;
  });
}

function parseSheet(sheet: XLSX.WorkSheet, name: string): SheetPreview {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1, defval: null, raw: false, blankrows: false,
  });

  if (!matrix.length) return { name, rows: [], headers: [], rowCount: 0 };

  // Find best header row in first 12 rows
  let headerIndex = 0;
  let bestScore = -1;
  const limit = Math.min(12, matrix.length);
  for (let i = 0; i < limit; i++) {
    const s = scorePotentialHeaderRow(matrix[i] || []);
    if (s > bestScore) { bestScore = s; headerIndex = i; }
  }

  const headers = buildUniqueHeaders(matrix[headerIndex] || []);
  const rows: Record<string, unknown>[] = [];

  for (let ri = headerIndex + 1; ri < matrix.length; ri++) {
    const vals = matrix[ri] || [];
    if (!vals.some((v) => String(v ?? '').trim() !== '')) continue;
    const row: Record<string, unknown> = { __sheet: name, __row: ri + 1 };
    headers.forEach((h, ci) => { row[h] = vals[ci] ?? null; });
    rows.push(row);
  }

  return { name, rows, headers, rowCount: rows.length };
}

function computeQuality(rows: Record<string, unknown>[], headers: string[]) {
  if (!rows.length || !headers.length) return { fillRate: 0, fieldCoverage: {} };
  const fieldCoverage: Record<string, number> = {};
  for (const h of headers) {
    const filled = rows.filter((r) => String(r[h] ?? '').trim() !== '').length;
    fieldCoverage[h] = Math.round((filled / rows.length) * 100);
  }
  const totalCells = rows.length * headers.length;
  const filledCells = Object.values(fieldCoverage).reduce((s, pct) => s + (pct * rows.length) / 100, 0);
  return { fillRate: Math.round((filledCells / totalCells) * 100), fieldCoverage };
}

/** Key fields we want to highlight in the quality check */
const KEY_FIELDS_RE = /company|name|state|city|email|phone|gstin|cin|address|capacity|category|status|registration/i;

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function buildSheetPreview(rows: Record<string, unknown>[], name: string): SheetPreview {
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).filter((key) => !key.startsWith('__'));
  return {
    name,
    headers,
    rows: rows.map((row, index) => ({ ...row, __sheet: name, __row: index + 1 })),
    rowCount: rows.length,
  };
}

async function parseFileForPreview(file: File): Promise<SheetPreview[]> {
  const extension = getFileExtension(file.name);

  if (extension === 'json') {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const rows = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.records)
        ? parsed.records
        : [parsed];
    return [buildSheetPreview(rows.map((row, index) => ({ ...(row && typeof row === 'object' ? row : { value: row }), __row: index + 1 })), 'JSON')];
  }

  if (extension === 'tsv' || extension === 'csv') {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string', FS: extension === 'tsv' ? '\t' : ',' });
    return workbook.SheetNames.map((name) => parseSheet(workbook.Sheets[name], name)).filter((sheet) => sheet.rowCount > 0);
  }

  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  return workbook.SheetNames.map((name) => parseSheet(workbook.Sheets[name], name)).filter((sheet) => sheet.rowCount > 0);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function IntelUploadPage() {
  const [step, setStep] = useState<Step>('drop');
  const [parsedFile, setParsedFile] = useState<ParsedFile | null>(null);
  const [selectedSheetIndex, setSelectedSheetIndex] = useState(0);
  const [importProfile, setImportProfile] = useState('');
  const [wasteCategory, setWasteCategory] = useState('');
  const [sources, setSources] = useState<IntelSourceRow[]>([]);
  const [sourceId, setSourceId] = useState('');
  const [showCreateSource, setShowCreateSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceType, setNewSourceType] = useState('bulk_upload');
  const [newSourceVendor, setNewSourceVendor] = useState('');
  const [creatingSource, setCreatingSource] = useState(false);
  const [triggerSendpilotAfterImport, setTriggerSendpilotAfterImport] = useState(true);
  const [sendpilotLimit, setSendpilotLimit] = useState(20);
  const [triggerQualityEnrichment, setTriggerQualityEnrichment] = useState(true);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [job, setJob] = useState<ImportJob | null>(null);
  const [jobReport, setJobReport] = useState<IngestReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [pollInterval, setPollInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [enriching, setEnriching] = useState(false);
  // ── Duplicate detection ──
  const [dedupChecking, setDedupChecking] = useState(false);
  type DedupResult = { total: number; existing: number; names: string[] };
  const [dedupResult, setDedupResult] = useState<DedupResult | null>(null);
  const [enrichResult, setEnrichResult] = useState<{ completed: number; failed: number } | null>(null);
  const [googleReport, setGoogleReport] = useState<GoogleEnrichmentReport | null>(null);
  const [recentJobs, setRecentJobs] = useState<ImportJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──
  const apiBase = useCallback(() => getIntelApiBaseUrl(), []);

  const authHeader = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? `Bearer ${session.access_token}` : null;
  }, []);

  // ── Load sources ──
  const loadSources = useCallback(async () => {
    const { data } = await supabase
      .from('intel_sources')
      .select('id, source_name, source_type, vendor_name')
      .eq('active', true)
      .order('source_name');
    const rows = (data || []) as IntelSourceRow[];
    setSources(rows);
    if (!sourceId && rows.length > 0) setSourceId(rows[0].id);
  }, [sourceId]);

  useEffect(() => { loadSources(); }, [loadSources]);

  // ── Load recent jobs ──
  const loadRecentJobs = useCallback(async () => {
    setJobsLoading(true);
    const token = await authHeader();
    if (!token) { setJobsLoading(false); return; }
    try {
      const res = await fetch(`${apiBase()}/api/intel/ingest/jobs?limit=10`, {
        headers: { Authorization: token },
      });
      if (res.ok) {
        const d = await res.json();
        setRecentJobs((d.jobs || []) as ImportJob[]);
      }
    } catch { /* silent */ }
    setJobsLoading(false);
  }, [apiBase, authHeader]);

  useEffect(() => { loadRecentJobs(); }, [loadRecentJobs]);


  const loadJobReport = useCallback(async (jobId: string) => {
    const token = await authHeader();
    if (!token) return;

    setReportLoading(true);
    setReportError('');
    try {
      const res = await fetch(`${apiBase()}/api/intel/ingest/jobs/${jobId}/report`, {
        headers: { Authorization: token },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
      setJobReport(payload as IngestReport);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Unable to load ingest report');
    } finally {
      setReportLoading(false);
    }
  }, [apiBase, authHeader]);
  // ── Parse file client-side ──
  async function processFile(file: File) {
    setError('');
    if (!file.name.match(/\.(xlsx|xls|csv|tsv|json)$/i)) {
      setError('Unsupported format. Please upload .xlsx, .xls, .csv, .tsv, or .json');
      return;
    }

    try {
      const sheets = await parseFileForPreview(file);
      if (!sheets.length) {
        setError('No data rows found in this file.');
        return;
      }
      setParsedFile({ file, sheets });
      setSelectedSheetIndex(0);
      setStep('configure');
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Cannot parse file.');
    }
  }

  // ── Drag-and-drop ──
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void processFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = '';
  }

  // ── Create source inline ──
  async function createSource() {
    if (!newSourceName.trim()) return;
    setCreatingSource(true);
    const { data, error: err } = await supabase
      .from('intel_sources')
      .insert({
        source_name: newSourceName.trim(),
        source_type: newSourceType,
        vendor_name: newSourceVendor.trim() || null,
        license_flag: 'internal-use-only',
        reliability_tier: 3,
        active: true,
      })
      .select('id, source_name, source_type, vendor_name')
      .single();
    if (err) { setError(err.message); setCreatingSource(false); return; }
    const newRow = data as IntelSourceRow;
    setSources((prev) => [...prev, newRow]);
    setSourceId(newRow.id);
    setNewSourceName('');
    setNewSourceVendor('');
    setShowCreateSource(false);
    setCreatingSource(false);
  }

  // ── Run import ──
  async function runImport() {
    if (!parsedFile || !sourceId) return;
    setError('');
    setStep('importing');
    setJob(null);
    setImportResult(null);
    setJobReport(null);
    setReportError('');

    const token = await authHeader();
    if (!token) { setError('Not signed in.'); setStep('preview'); return; }

    const formData = new FormData();
    formData.append('file', parsedFile.file, parsedFile.file.name);
    formData.append('source_id', sourceId);
    formData.append('source_document_ref', parsedFile.file.name);
    if (importProfile) formData.append('import_profile', importProfile);
    if (wasteCategory) formData.append('waste_category', wasteCategory);
    if (importProfile === 'leadrocks_bulk_csv') {
      formData.append('trigger_sendpilot', triggerSendpilotAfterImport ? 'true' : 'false');
      formData.append('sendpilot_limit', String(sendpilotLimit));
      formData.append('trigger_quality_enrichment', triggerQualityEnrichment ? 'true' : 'false');
    }

    try {
      const res = await fetch(`${apiBase()}/api/intel/ingest/bulk-async`, {
        method: 'POST',
        headers: { Authorization: token },
        body: formData,
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);

      const result: ImportResult = {
        jobId: payload.job_id,
        sourceDocumentId: payload.source_document_id,
        totalRows: payload.total_rows,
      };
      setImportResult(result);

      // Start polling
      const interval = setInterval(async () => {
        try {
          const jobRes = await fetch(`${apiBase()}/api/intel/ingest/jobs/${result.jobId}`, {
            headers: { Authorization: token },
          });
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            const j = jobData.job as ImportJob;
            setJob(j);
            if (j.job_status === 'completed' || j.job_status === 'completed_with_errors' || j.job_status === 'failed') {
              clearInterval(interval);
              setPollInterval(null);
              void loadJobReport(result.jobId);
              setStep('done');
              loadRecentJobs();
            }
          }
        } catch { /* silent poll failure */ }
      }, 2500);

      setPollInterval(interval);
    } catch (ex) {
      setError(ex instanceof Error ? ex.message : 'Import failed');
      setStep('preview');
    }
  }

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollInterval) clearInterval(pollInterval); };
  }, [pollInterval]);

  // ── Enrich after import ──
  async function triggerEnrichment() {
    setEnriching(true);
    setEnrichResult(null);
    setGoogleReport(null);
    const token = await authHeader();
    if (!token) { setEnriching(false); return; }
    try {
      const res = await fetch(`${apiBase()}/api/intel/companies/enrichment/google/run-batch`, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50, only_missing: true }),
      });
      if (res.ok) {
        const d = await res.json();
        setEnrichResult({ completed: d.completed || 0, failed: d.failed || 0 });

        const reportRes = await fetch(`${apiBase()}/api/intel/companies/enrichment/google/report`, {
          headers: { Authorization: token },
        });
        if (reportRes.ok) {
          const reportPayload = await reportRes.json();
          setGoogleReport((reportPayload?.report || null) as GoogleEnrichmentReport | null);
        }
      }
    } catch { /* silent */ }
    setEnriching(false);
  }

  // ── Derived state ──
  const activeSheet = parsedFile?.sheets[selectedSheetIndex];

  function downloadReportJson(fileName: string, payload: unknown) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const quality = useMemo(
    () => activeSheet ? computeQuality(activeSheet.rows, activeSheet.headers) : { fillRate: 0, fieldCoverage: {} },
    [activeSheet],
  );
  const keyFields = useMemo(
    () => activeSheet?.headers.filter((h) => KEY_FIELDS_RE.test(h)) ?? [],
    [activeSheet],
  );
  const previewRows = useMemo(() => activeSheet?.rows.slice(0, 6) ?? [], [activeSheet]);
  const previewHeaders = useMemo(() => activeSheet?.headers.slice(0, 10) ?? [], [activeSheet]);

  const jobDuration = useMemo(() => {
    if (!job?.started_at) return null;
    const end = job.finished_at ? new Date(job.finished_at) : new Date();
    return formatDuration(end.getTime() - new Date(job.started_at).getTime());
  }, [job]);

  const jobProgress = useMemo(() => {
    if (!job || !importResult?.totalRows) return 0;
    const done = (job.inserted_rows || 0) + (job.updated_rows || 0) + (job.skipped_rows || 0) + (job.error_rows || 0);
    return Math.min(100, Math.round((done / importResult.totalRows) * 100));
  }, [job, importResult]);

  // ── Reset ──
  function reset() {
    setStep('drop');
    setParsedFile(null);
    setImportResult(null);
    setJob(null);
    setJobReport(null);
    setReportError('');
    setError('');
    setEnrichResult(null);
    setGoogleReport(null);
    if (pollInterval) { clearInterval(pollInterval); setPollInterval(null); }
  }

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-60 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-500/5 blur-[130px]" />
      </div>
      <section className="mx-auto max-w-5xl px-6 py-8">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link href="/intel" className="text-[11px] text-slate-500 hover:text-slate-300 transition">Intel</Link>
              <svg className="h-3 w-3 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6"/></svg>
              <span className="text-[11px] text-slate-400">Upload</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-block h-1.5 w-7 rounded-full bg-teal-400" />
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Upload Companies</h1>
            </div>
            <p className="mt-1.5 max-w-xl text-sm text-slate-400">
              Drop any XLSX, CSV, TSV, or JSON file with company data. The system auto-detects formats, extracts structured fields with AI, and adds companies into Intel.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/intel/sources" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">Sources</Link>
            <Link href="/intel/companies" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">Companies</Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-lg border border-rose-800/60 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
            {error}
            <button type="button" onClick={() => setError('')} className="ml-3 text-rose-400 hover:text-rose-200">×</button>
          </div>
        ) : null}

        {/* ── Step indicator ──────────────────────────────────────── */}
        {step !== 'done' && (
          <div className="mb-6 flex items-center gap-2 text-xs">
            {(['drop', 'configure', 'mapping', 'preview', 'importing'] as const).map((s, i) => {
              const labels = ['1 Drop', '2 Configure', '3 Mapping', '4 Preview', '5 Import'];
              const isActive = s === step;
              const isPast = ['drop', 'configure', 'mapping', 'preview', 'importing'].indexOf(step) > i;
              return (
                <span key={s} className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-1 font-semibold transition ${
                    isActive ? 'bg-teal-500/20 text-teal-200 border border-teal-500/40' :
                    isPast ? 'bg-slate-800 text-slate-400 line-through' :
                    'bg-slate-900 text-slate-600 border border-slate-800'
                  }`}>{labels[i]}</span>
                  {i < 3 && <span className="text-slate-700">→</span>}
                </span>
              );
            })}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 1: DROP
        ══════════════════════════════════════════════════════════ */}
        {step === 'drop' && (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-16 text-center transition cursor-pointer select-none ${
              dragOver
                ? 'border-teal-400 bg-teal-500/10'
                : 'border-slate-700 bg-slate-900/50 hover:border-teal-500/60 hover:bg-teal-500/5'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.tsv,.json"
              className="sr-only"
              onChange={handleFileInput}
            />
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
              <svg className="h-7 w-7 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">
                {dragOver ? 'Release to upload' : 'Drop your file here'}
              </p>
              <p className="mt-1 text-sm text-slate-400">or click to browse — accepts .xlsx · .xls · .csv · .tsv · .json</p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[11px] text-slate-500">
              <span className="rounded border border-slate-800 px-2 py-1">State PCB recycler lists</span>
              <span className="rounded border border-slate-800 px-2 py-1">CPCB battery producer registry</span>
              <span className="rounded border border-slate-800 px-2 py-1">Custom vendor datasets</span>
              <span className="rounded border border-slate-800 px-2 py-1">Any company list</span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 2: CONFIGURE
        ══════════════════════════════════════════════════════════ */}
        {step === 'configure' && parsedFile && (
          <div className="space-y-4">
            {/* File info banner */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-teal-800/40 bg-teal-950/20 px-5 py-3">
              <svg className="h-5 w-5 text-teal-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-teal-100">{parsedFile.file.name}</p>
                <p className="text-xs text-slate-400">
                  {parsedFile.sheets.length} sheet{parsedFile.sheets.length !== 1 ? 's' : ''} ·{' '}
                  {parsedFile.sheets.reduce((s, sh) => s + sh.rowCount, 0).toLocaleString('en-IN')} total rows
                </p>
              </div>
              <button type="button" onClick={reset} className="ml-auto text-xs text-slate-500 hover:text-slate-300">Change file</button>
            </div>

            {/* Sheet selector */}
            {parsedFile.sheets.length > 1 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Select Sheet</p>
                <div className="flex flex-wrap gap-2">
                  {parsedFile.sheets.map((sh, i) => (
                    <button
                      key={sh.name}
                      type="button"
                      onClick={() => setSelectedSheetIndex(i)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        i === selectedSheetIndex
                          ? 'border-teal-400/50 bg-teal-500/15 text-teal-200'
                          : 'border-slate-700 text-slate-300 hover:border-teal-400/40 hover:text-teal-200'
                      }`}
                    >
                      {sh.name}
                      <span className="ml-1.5 text-slate-500">{sh.rowCount.toLocaleString('en-IN')}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Import profile & waste category */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">What kind of data is this?</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Import Profile</label>
                  <select
                    value={importProfile}
                    onChange={(e) => setImportProfile(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  >
                    {IMPORT_PROFILES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs text-slate-400">Waste Category</label>
                  <select
                    value={wasteCategory}
                    onChange={(e) => setWasteCategory(e.target.value)}
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                  >
                    {WASTE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {importProfile && PLATFORM_HINTS[importProfile] && (
                <div className={`mt-3 rounded-lg border px-4 py-2 text-xs ${PLATFORM_HINTS[importProfile].color}`}>
                  {PLATFORM_HINTS[importProfile].tip}
                </div>
              )}

              {importProfile === 'leadrocks_bulk_csv' && (
                <div className="mt-4 rounded-lg border border-cyan-800/40 bg-cyan-950/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">LeadRocks Workflow</p>
                  <p className="mt-1 text-xs text-slate-300">
                    This will import companies + contacts from LeadRocks CSV, then optionally trigger SendPilot to enrich LinkedIn profile-level people intelligence.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={triggerSendpilotAfterImport}
                        onChange={(e) => setTriggerSendpilotAfterImport(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900"
                      />
                      Auto-run SendPilot after import
                    </label>
                    <label className="flex items-center gap-2 text-xs text-slate-200">
                      <input
                        type="checkbox"
                        checked={triggerQualityEnrichment}
                        onChange={(e) => setTriggerQualityEnrichment(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-900"
                      />
                      Queue quality enrichment after import
                    </label>
                    <div>
                      <label className="mb-1 block text-xs text-slate-400">SendPilot company limit</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={sendpilotLimit}
                        onChange={(e) => setSendpilotLimit(Number(e.target.value) || 20)}
                        className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Source selection */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Data Source</p>
                <button type="button" onClick={() => setShowCreateSource((v) => !v)} className="text-xs text-teal-400 hover:text-teal-300">
                  {showCreateSource ? 'Cancel' : '+ New Source'}
                </button>
              </div>

              {showCreateSource ? (
                <div className="rounded-lg border border-teal-800/40 bg-teal-950/20 p-4">
                  <p className="mb-3 text-xs font-semibold text-teal-300">Create a new source</p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input
                      placeholder="Source name *"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                    <select
                      value={newSourceType}
                      onChange={(e) => setNewSourceType(e.target.value)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    >
                      <option value="bulk_upload">Bulk Upload</option>
                      <option value="vendor_dataset">Vendor Dataset</option>
                      <option value="government_order">Government Order</option>
                      <option value="portal_scrape">Portal Scrape</option>
                      <option value="manual_entry">Manual Entry</option>
                    </select>
                    <input
                      placeholder="Vendor / provider (optional)"
                      value={newSourceVendor}
                      onChange={(e) => setNewSourceVendor(e.target.value)}
                      className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={createSource}
                    disabled={creatingSource || !newSourceName.trim()}
                    className="mt-3 rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
                  >
                    {creatingSource ? 'Creating…' : 'Create & Select'}
                  </button>
                </div>
              ) : sources.length === 0 ? (
                <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-4 text-center">
                  <p className="text-sm text-amber-200">No sources found. Create one first.</p>
                  <button type="button" onClick={() => setShowCreateSource(true)} className="mt-2 text-xs text-teal-300 hover:underline">+ Create a source</button>
                </div>
              ) : (
                <select
                  value={sourceId}
                  onChange={(e) => setSourceId(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.source_name} ({s.source_type}{s.vendor_name ? ` · ${s.vendor_name}` : ''})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={reset} className="rounded-md border border-slate-700 px-4 py-2 text-xs font-semibold hover:border-slate-500">← Back</button>
              <button
                type="button"
                onClick={() => {
                  if (!activeSheet) return;
                  setColumnMappings(autoDetectMapping(activeSheet.headers));
                  setStep('mapping');
                }}
                disabled={!sourceId}
                className="rounded-md bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-50"
              >
                Map Columns →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 3: COLUMN MAPPING
        ══════════════════════════════════════════════════════════ */}
        {step === 'mapping' && activeSheet && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-base font-semibold text-teal-200">Column Mapping</h2>
              <p className="mt-1 text-xs text-slate-400">
                Review how your columns map to Intel fields. Auto-detected — correct any mismatches before importing.
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {columnMappings.map((cm, idx) => (
                  <div key={cm.sourceColumn} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold text-slate-200 truncate" title={cm.sourceColumn}>
                        {cm.sourceColumn}
                      </p>
                      {cm.confidence > 0 ? (
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${cm.confidence >= 0.8 ? 'bg-teal-900/40 text-teal-200' : 'bg-amber-900/40 text-amber-200'}`}>
                          {Math.round(cm.confidence * 100)}% match
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">No match</span>
                      )}
                    </div>
                    <select
                      value={cm.targetField}
                      onChange={(e) => {
                        setColumnMappings((prev) => prev.map((m, i) =>
                          i === idx ? { ...m, targetField: e.target.value, confidence: 1 } : m
                        ));
                      }}
                      className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 focus:border-teal-400 focus:outline-none"
                    >
                      {KNOWN_FIELDS.map((f) => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                    {/* Sample values from first 2 rows */}
                    <p className="mt-1.5 truncate text-[10px] text-slate-500" title="Sample values">
                      e.g.{' '}
                      {activeSheet.rows.slice(0, 2)
                        .map((r) => String(r[cm.sourceColumn] ?? '').trim())
                        .filter(Boolean)
                        .join(' · ')
                        || '(empty)'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            {/* ── Dedup result banner ─────────────────────────────────── */}
            {dedupResult && (
              <div className={[
                'mb-3 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
                dedupResult.existing > 0
                  ? 'border-amber-700/50 bg-amber-950/30 text-amber-200'
                  : 'border-emerald-700/50 bg-emerald-950/30 text-emerald-200',
              ].join(' ')}>
                <span className="text-lg mt-0.5">{dedupResult.existing > 0 ? '!' : '+'}</span>
                <div>
                  {dedupResult.existing > 0 ? (
                    <>
                      <p className="font-semibold">
                        {dedupResult.existing} of {dedupResult.total} company names already exist in Intel
                      </p>
                      <p className="mt-0.5 text-amber-300/70 text-xs">
                        Duplicates will be updated (not re-inserted) by the importer. You can still proceed.
                      </p>
                      {dedupResult.names.length > 0 && (
                        <p className="mt-1 text-xs text-amber-400/70 line-clamp-2">
                          e.g. {dedupResult.names.slice(0, 5).join(', ')}
                          {dedupResult.names.length > 5 && ` + ${dedupResult.names.length - 5} more`}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="font-semibold">All {dedupResult.total} companies are new — no duplicates detected</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('configure')} className="rounded-md border border-slate-700 px-4 py-2 text-xs font-semibold hover:border-slate-500">← Back</button>
              <button
                type="button"
                disabled={dedupChecking}
                onClick={async () => {
                  // Extract company names from current mapping
                  const nameMapping = columnMappings.find((cm) => cm.targetField === 'company_name');
                  if (!nameMapping || !activeSheet) { setStep('preview'); return; }
                  const names = activeSheet.rows
                    .map((r) => String(r[nameMapping.sourceColumn] ?? '').trim())
                    .filter(Boolean);
                  if (names.length === 0) { setStep('preview'); return; }

                  setDedupChecking(true);
                  setDedupResult(null);
                  try {
                    // Check in batches of 200 against intel_companies canonical_name
                    const batch = names.slice(0, 200);
                    const { data } = await supabase
                      .from('intel_companies')
                      .select('canonical_name')
                      .in('canonical_name', batch);
                    const existingNames = (data || []).map((r: { canonical_name: string }) => r.canonical_name as string);
                    setDedupResult({
                      total: names.length,
                      existing: existingNames.length,
                      names: existingNames,
                    });
                  } catch {
                    // dedup check failed — proceed anyway
                  } finally {
                    setDedupChecking(false);
                    setStep('preview');
                  }
                }}
                className="rounded-md bg-teal-600 px-5 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
              >
                {dedupChecking ? 'Checking…' : 'Preview Data →'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (activeSheet) setColumnMappings(autoDetectMapping(activeSheet.headers));
                }}
                className="ml-auto rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:border-teal-500 hover:text-teal-300"
              >
                ↺ Reset to Auto-detect
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 4: DATA PREVIEW
        ══════════════════════════════════════════════════════════ */}
        {step === 'preview' && activeSheet && (
          <div className="space-y-4">
            {/* Dedup summary carry-over */}
            {dedupResult && dedupResult.existing > 0 && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-700/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
                <svg className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                <p>
                  <span className="font-semibold">{dedupResult.existing}</span> of {dedupResult.total} companies already exist
                  in Intel and will be <span className="font-semibold">updated</span> (not duplicated).
                </p>
              </div>
            )}
            {/* Quality metrics */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
                <p className="text-2xl font-bold tabular-nums text-teal-200">{activeSheet.rowCount.toLocaleString('en-IN')}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Rows</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
                <p className="text-2xl font-bold tabular-nums text-slate-100">{activeSheet.headers.length}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Columns</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${quality.fillRate >= 70 ? 'border-teal-800/40 bg-teal-950/20' : 'border-amber-800/40 bg-amber-950/20'}`}>
                <p className={`text-2xl font-bold tabular-nums ${quality.fillRate >= 70 ? 'text-teal-200' : 'text-amber-200'}`}>{quality.fillRate}%</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Fill Rate</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-center">
                <p className="text-2xl font-bold tabular-nums text-slate-100">{keyFields.length}</p>
                <p className="mt-1 text-[11px] uppercase tracking-widest text-slate-400">Key Fields</p>
              </div>
            </div>

            {/* Key field coverage */}
            {keyFields.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Key field coverage</p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {keyFields.slice(0, 9).map((f) => {
                    const pct = quality.fieldCoverage[f] ?? 0;
                    const color = pct >= 70 ? 'bg-teal-400' : pct >= 30 ? 'bg-amber-400' : 'bg-rose-400';
                    return (
                      <div key={f} className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-slate-800">
                          <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-28 truncate text-[11px] text-slate-300" title={f}>{f}</span>
                        <span className="w-8 text-right text-[11px] tabular-nums text-slate-500">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Data preview table */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
                First {previewRows.length} rows (showing {previewHeaders.length} of {activeSheet.headers.length} columns)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase tracking-widest text-slate-400">
                      {previewHeaders.map((h) => <th key={h} className="py-2 pr-3">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className="border-b border-slate-900/60 hover:bg-slate-800/30 transition-colors">
                        {previewHeaders.map((h) => (
                          <td key={h} className="max-w-[180px] truncate py-2 pr-3 text-slate-300" title={String(row[h] ?? '')}>
                            {String(row[h] ?? '') || <span className="text-slate-700">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import profile summary */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-xs">
              <span className="font-semibold text-slate-300">Import config:</span>
              <span className="rounded bg-slate-800 px-2 py-1 text-slate-300">
                Profile: {importProfile || 'auto-detect'}
              </span>
              {wasteCategory && <span className="rounded bg-slate-800 px-2 py-1 text-slate-300">Category: {wasteCategory}</span>}
              <span className="rounded bg-slate-800 px-2 py-1 text-slate-300">
                Source: {sources.find((s) => s.id === sourceId)?.source_name || sourceId}
              </span>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep('configure')} className="rounded-md border border-slate-700 px-4 py-2 text-xs font-semibold hover:border-slate-500">← Back</button>
              <button
                type="button"
                onClick={runImport}
                className="rounded-md bg-emerald-600 px-6 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Import {activeSheet.rowCount.toLocaleString('en-IN')} rows
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 5: IMPORTING (polling)
        ══════════════════════════════════════════════════════════ */}
        {step === 'importing' && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-800/40 bg-slate-900/70 p-8">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-teal-500/30 bg-teal-500/10">
                  <svg className="h-5 w-5 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-teal-200">
                    {job ? 'Processing rows…' : 'Uploading file…'}
                  </p>
                  {importResult && (
                    <p className="mt-1 text-xs text-slate-400">
                      Job {importResult.jobId.slice(0, 8)}… · {importResult.totalRows} total rows · AI extraction active
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="mt-4 h-2 w-full rounded-full bg-slate-800">
                    <div
                      className="h-2 rounded-full bg-teal-500 transition-all duration-700"
                      style={{ width: job ? `${Math.max(5, jobProgress)}%` : '5%' }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{jobProgress}% complete</p>

                  {job && (
                    <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                      {[
                        { label: 'Created', value: job.inserted_rows, color: 'text-teal-300' },
                        { label: 'Updated', value: job.updated_rows, color: 'text-cyan-300' },
                        { label: 'Skipped', value: job.skipped_rows, color: 'text-slate-400' },
                        { label: 'Errors', value: job.error_rows, color: 'text-rose-300' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-lg border border-slate-800 bg-slate-950/50 p-2">
                          <p className={`text-lg font-bold tabular-nums ${s.color}`}>{s.value}</p>
                          <p className="text-[10px] uppercase tracking-widest text-slate-500">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-600">
                Runs AI extraction (Anthropic Claude) on each row to identify company fields, then upserts into Intel companies database. Large files may take several minutes.
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            STEP 6: DONE
        ══════════════════════════════════════════════════════════ */}
        {step === 'done' && job && (
          <div className="space-y-4">
            {/* Result summary */}
            <div className={`rounded-2xl border p-6 ${job.error_rows > 0 && job.inserted_rows === 0 ? 'border-rose-800/60 bg-rose-950/20' : 'border-emerald-800/40 bg-emerald-950/20'}`}>
              <div className="flex items-start gap-4">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${job.job_status === 'failed' ? 'border-rose-600 bg-rose-950/40' : job.error_rows > 0 ? 'border-amber-600 bg-amber-950/40' : 'border-emerald-600 bg-emerald-950/40'}`}>
                  {job.job_status === 'failed' ? (
                    <svg className="h-5 w-5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  ) : job.error_rows > 0 ? (
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                  ) : (
                    <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </span>
                <div>
                  <p className="text-lg font-bold text-slate-100">
                    {job.job_status === 'failed' ? 'Import Failed' : job.error_rows > 0 ? 'Import Completed with Errors' : 'Import Successful'}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {jobDuration ? `Finished in ${jobDuration}` : 'Completed'}
                    {importResult ? ` · Job ${importResult.jobId.slice(0, 8)}…` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'Created', value: job.inserted_rows, color: 'text-teal-200', bg: 'border-teal-800/40 bg-teal-950/20' },
                  { label: 'Updated', value: job.updated_rows, color: 'text-cyan-200', bg: 'border-cyan-800/40 bg-cyan-950/20' },
                  { label: 'Skipped', value: job.skipped_rows, color: 'text-slate-300', bg: 'border-slate-700 bg-slate-900/50' },
                  { label: 'Errors', value: job.error_rows, color: job.error_rows > 0 ? 'text-rose-300' : 'text-slate-500', bg: job.error_rows > 0 ? 'border-rose-800/40 bg-rose-950/20' : 'border-slate-700 bg-slate-900/50' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                    <p className={`text-3xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                    <p className="mt-1 text-[11px] text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Error details */}
              {Array.isArray(job.error_log) && job.error_log.length > 0 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-rose-400 hover:text-rose-300">
                    View {job.error_log.length} error{job.error_log.length !== 1 ? 's' : ''}
                  </summary>
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-rose-900/30 bg-slate-950 p-3">
                    {job.error_log.map((e, i) => (
                      <p key={i} className="text-[11px] text-rose-300">
                        Row {e.row_index}: {e.error}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>

            {/* Enrich card */}
            {(job.inserted_rows > 0 || job.updated_rows > 0) && (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-teal-300">Enrich with Google Maps</p>
                    <p className="mt-1 max-w-md text-xs text-slate-400">
                      Adds formatted addresses, phone numbers, geographic coordinates, and business status to new companies using Google Places API.
                    </p>
                  </div>
                  {enrichResult ? (
                    <div className="text-right text-xs">
                      <p className="text-emerald-300">{enrichResult.completed} enriched</p>
                      {enrichResult.failed > 0 && <p className="text-rose-400">{enrichResult.failed} failed</p>}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={triggerEnrichment}
                      disabled={enriching}
                      className="rounded-md bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 disabled:opacity-60"
                    >
                      {enriching ? 'Enriching…' : 'Enrich Companies (up to 50)'}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-[11px] text-slate-600">
                  Enrichment runs via the Google Maps Platform API. Make sure GOOGLE_MAPS_API_KEY is set on Render.
                </p>
                {googleReport && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-400">
                        <p>Total: {Number(googleReport.total_companies || 0).toLocaleString('en-IN')}</p>
                        <p>Matched: {Number(googleReport.google_matched_companies || 0).toLocaleString('en-IN')}</p>
                        <p>Failed: {Number(googleReport.failed_matches || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => downloadReportJson(`intel-google-enrichment-report-${importResult?.jobId || job.id}.json`, googleReport)}
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-[11px] font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300"
                      >
                        Download Google Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-teal-300">Download ingest reports</p>
                  <p className="mt-1 max-w-md text-xs text-slate-400">
                    Export the import summary, duplicate resolution details, enrichment signals, and error report for this job.
                  </p>
                </div>
                {reportLoading ? (
                  <p className="text-xs text-slate-500">Loading report…</p>
                ) : reportError ? (
                  <p className="text-xs text-rose-300">{reportError}</p>
                ) : null}
              </div>
              {jobReport ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => downloadReportJson(`intel-import-summary-${importResult?.jobId || job.id}.json`, jobReport.import_summary)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300"
                  >
                    Import Summary
                    <span className="mt-1 block text-[11px] font-normal text-slate-500">Counts, totals, and success rate</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadReportJson(`intel-duplicate-report-${importResult?.jobId || job.id}.json`, jobReport.duplicate_resolution_report)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300"
                  >
                    Duplicate Report
                    <span className="mt-1 block text-[11px] font-normal text-slate-500">Matched companies and merge actions</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadReportJson(`intel-enrichment-report-${importResult?.jobId || job.id}.json`, jobReport.intelligence_enrichment_report)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300"
                  >
                    Enrichment Report
                    <span className="mt-1 block text-[11px] font-normal text-slate-500">Industries and compliance signals</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadReportJson(`intel-error-report-${importResult?.jobId || job.id}.json`, jobReport.error_report)}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300"
                  >
                    Error Report
                    <span className="mt-1 block text-[11px] font-normal text-slate-500">Malformed rows and job errors</span>
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">Detailed reports are generated after the job finishes.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Link href="/intel/companies" className="rounded-md bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-500">
                View Companies →
              </Link>
              {(['leadrocks_bulk_csv','apollo','zoominfo','lusha','crunchbase','linkedin'] as const).includes(importProfile as any) && (
                <Link href="/intel/leads?tab=contacts" className="rounded-md border border-violet-600/60 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 hover:border-violet-400">
                  View Contacts →
                </Link>
              )}
              <button type="button" onClick={reset} className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
                Import Another File
              </button>
              <Link href="/intel" className="rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
                Intel Home
              </Link>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            IMPORT HISTORY (always visible below)
        ══════════════════════════════════════════════════════════ */}
        <div className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-teal-300">Recent Import Jobs</h2>
            <button type="button" onClick={loadRecentJobs} className="text-xs text-slate-400 hover:text-teal-300">↻ Refresh</button>
          </div>

          {jobsLoading ? (
            <div className="space-y-2 animate-pulse p-4">
              {Array.from({length:4}).map((_,i)=><div key={i} className="h-10 rounded-lg bg-slate-800/60"/>)}
            </div>
          ) : recentJobs.length === 0 ? (
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <svg className="mx-auto h-8 w-8 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <p className="mt-2 text-sm font-semibold text-slate-300">No import jobs yet</p>
              <p className="mt-1 text-xs text-slate-500">Your first import will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/70">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                    <th className="px-4 py-2">Job ID</th>
                    <th className="px-4 py-2">Path</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Rows</th>
                    <th className="px-4 py-2 text-right">Created</th>
                    <th className="px-4 py-2 text-right">Errors</th>
                    <th className="px-4 py-2">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {recentJobs.map((j) => {
                    const statusCls =
                      j.job_status === 'completed' ? 'text-emerald-300' :
                      j.job_status === 'completed_with_errors' ? 'text-amber-300' :
                      j.job_status === 'failed' ? 'text-rose-300' :
                      j.job_status === 'processing' ? 'text-teal-300 animate-pulse' :
                      'text-slate-400';
                    return (
                      <tr key={j.id} className="border-b border-slate-900/60 transition-colors hover:bg-slate-800/30">
                        <td className="px-4 py-2 font-mono text-slate-500">{j.id.slice(0, 8)}…</td>
                        <td className="px-4 py-2 text-slate-300">{(j as any).ingest_path || '—'}</td>
                        <td className={`px-4 py-2 font-semibold ${statusCls}`}>{j.job_status}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-slate-300">{j.total_rows?.toLocaleString('en-IN') ?? '—'}</td>
                        <td className="px-4 py-2 text-right tabular-nums text-teal-200">{j.inserted_rows?.toLocaleString('en-IN') ?? '—'}</td>
                        <td className={`px-4 py-2 text-right tabular-nums ${(j.error_rows || 0) > 0 ? 'text-rose-300' : 'text-slate-500'}`}>{j.error_rows ?? 0}</td>
                        <td className="px-4 py-2 text-slate-400">{j.started_at ? new Date(j.started_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 border-t border-slate-900 pt-6">
          <Link href="/intel" className="inline-flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-slate-300">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
            Back to Intel
          </Link>
        </div>
      </section>
    </div>
  );
}
