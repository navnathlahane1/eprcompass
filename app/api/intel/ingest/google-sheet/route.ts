import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

// ─── Supabase service client ──────────────────────────────────────────────────
function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// ─── Intel auth guard ─────────────────────────────────────────────────────────
async function resolveIntelUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);

  const db = makeDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;

  const allowedId = process.env.INTEL_USER_ID || '';
  const allowedEmail = (process.env.INTEL_USER_EMAIL || '').toLowerCase().trim();

  if (allowedId && user.id === allowedId) return user;
  if (allowedEmail && (user.email || '').toLowerCase().trim() === allowedEmail) return user;
  return null;
}

async function readTcSetting(db: ReturnType<typeof makeDb>, key: string): Promise<string> {
  try {
    const { data, error } = await db.from('tc_settings').select('value').eq('key', key).maybeSingle();
    if (error) return '';
    return cleanText(data?.value || '');
  } catch {
    return '';
  }
}

async function resolveAnthropicRuntimeSettings(db: ReturnType<typeof makeDb>): Promise<{ apiKey: string; model: string }> {
  const settingsKey = await readTcSetting(db, 'anthropic_api_key');
  const settingsModel = await readTcSetting(db, 'anthropic_model');

  const apiKey = settingsKey || cleanText(process.env.ANTHROPIC_API_KEY || '');
  const model =
    cleanText(process.env.INTEL_ANTHROPIC_MODEL || '') ||
    cleanText(process.env.ANTHROPIC_MODEL || '') ||
    settingsModel ||
    'claude-3-5-sonnet-latest';

  return { apiKey, model };
}

// ─── Google Sheet helpers ─────────────────────────────────────────────────────
function parseGoogleSheetLink(inputUrl: string): { spreadsheetId: string; gid: string | null } {
  const raw = String(inputUrl || '').trim();
  if (!raw) throw new Error('google_sheet_url is required');

  let parsed: URL;
  try { parsed = new URL(raw); } catch { throw new Error('Invalid google_sheet_url'); }

  const host = parsed.hostname.toLowerCase();
  if (!host.includes('docs.google.com') && !host.includes('drive.google.com')) {
    throw new Error('URL must be a Google Sheets URL');
  }

  const pathMatch = parsed.pathname.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
  const queryId = parsed.searchParams.get('id');
  const spreadsheetId = pathMatch?.[1] || queryId || '';
  if (!spreadsheetId) throw new Error('Could not detect spreadsheet ID from URL');

  let gid: string | null = parsed.searchParams.get('gid');
  if (!gid && parsed.hash) {
    const hashParams = new URLSearchParams(parsed.hash.replace(/^#/, ''));
    gid = hashParams.get('gid');
  }
  return { spreadsheetId, gid };
}

async function downloadSheetAsBuffer(spreadsheetId: string, gid: string | null): Promise<Buffer> {
  const exportUrl = new URL(`https://docs.google.com/spreadsheets/d/${encodeURIComponent(spreadsheetId)}/export`);
  exportUrl.searchParams.set('format', 'xlsx');
  if (gid) exportUrl.searchParams.set('gid', gid);

  const resp = await fetch(exportUrl.toString(), { redirect: 'follow' });
  if (!resp.ok) {
    throw new Error(
      `Google Sheet download failed (HTTP ${resp.status}). ` +
      `Ensure the sheet is shared as "Anyone with the link can view".`
    );
  }
  const ab = await resp.arrayBuffer();
  const buf = Buffer.from(ab);
  if (!buf.length) throw new Error('Downloaded file is empty');
  if (buf.length > 25 * 1024 * 1024) throw new Error('Sheet export exceeds 25MB limit');
  return buf;
}

// ─── Row helpers ──────────────────────────────────────────────────────────────
function cleanText(v: unknown): string {
  return String(v ?? '')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\ufeff]/g, ' ')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeHeader(h: unknown): string {
  return cleanText(h).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function toNumberOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

function toDateOnlyOrNull(value: unknown): string | null {
  const raw = cleanText(value || '');
  if (!raw) return null;

  const normalized = raw.replace(/\./g, '/').replace(/-/g, '/');
  const parts = normalized.split('/').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (/^\d{4}$/.test(a)) {
      const iso = `${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`;
      const date = new Date(`${iso}T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) return iso;
    }

    if (/^\d{4}$/.test(c)) {
      const day = a.padStart(2, '0');
      const month = b.padStart(2, '0');
      const iso = `${c}-${month}-${day}`;
      const date = new Date(`${iso}T00:00:00Z`);
      if (!Number.isNaN(date.getTime())) return iso;
    }
  }

  const directDate = new Date(raw);
  if (Number.isNaN(directDate.getTime())) return null;
  return directDate.toISOString().slice(0, 10);
}

function inferWebsiteFromEmail(email: string | null): string | null {
  const raw = cleanText(email || '').toLowerCase();
  if (!raw || !raw.includes('@')) return null;
  const domain = raw.split('@')[1]?.trim() || '';
  if (!domain || /(gmail\.com|yahoo\.|hotmail\.|outlook\.|rediffmail\.|live\.)/.test(domain)) return null;
  return `https://${domain}`;
}

async function fetchWebsiteMetadata(websiteUrl: string | null): Promise<{ url: string; domain: string; title: string | null; description: string | null } | null> {
  const url = cleanText(websiteUrl || '');
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  } catch {
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try {
    const resp = await fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; IntelSPCBEnrichment/1.0)' }
    });
    if (!resp.ok) return null;
    const html = await resp.text();
    if (!html) return null;
    const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').replace(/\s+/g, ' ').trim() || null;
    const description = (
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([\s\S]*?)["'][^>]*>/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([\s\S]*?)["'][^>]+name=["']description["'][^>]*>/i)?.[1] ||
      ''
    ).replace(/\s+/g, ' ').trim() || null;

    return {
      url: parsed.toString(),
      domain: parsed.hostname,
      title,
      description
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function runAnthropicSpcbEnrichment(
  db: ReturnType<typeof makeDb>,
  fields: RowFields,
  row: Record<string, unknown>,
  websiteMetadata: { url: string; domain: string; title: string | null; description: string | null } | null
) {
  const anthropic = await resolveAnthropicRuntimeSettings(db);
  const apiKey = anthropic.apiKey;
  if (!apiKey) return null;
  const modelsToTry = Array.from(new Set([
    anthropic.model,
    'claude-sonnet-4-6',
    'claude-3-7-sonnet-latest',
    'claude-3-5-sonnet-latest',
  ].filter(Boolean)));
  const prompt = [
    'You are enriching State Pollution Control Board recycler records for an EPR intelligence CRM.',
    'Return strict JSON only with keys: summary, epr_categories, keywords, confidence.',
    'Rules:',
    '- summary: max 280 chars, business-focused',
    '- epr_categories: array from ["Battery","E-Waste","Plastic","Tyre","Used Oil"]',
    '- keywords: array of up to 8 concise strings',
    '- confidence: number between 0 and 1',
    'Input:',
    JSON.stringify({
      company_name: fields.companyName,
      mpcb_status: fields.mpcbStatus,
      cpcb_status: fields.mpcbCpcbStatus,
      regional_office: fields.mpcbRegionalOffice,
      mpcb_type: fields.mpcbTypeAtMpcb,
      cpcb_type: fields.mpcbTypeAtCpcb,
      capacity_allotted_mt: fields.mpcbCapacityAllottedMt,
      consent_ref: fields.mpcbConsentRef,
      consent_validity: fields.mpcbConsentValidity,
      email: fields.email,
      phone: fields.phone,
      address: fields.addressFull,
      remark: fields.mpcbRemark,
      website: websiteMetadata?.url || fields.website,
      website_title: websiteMetadata?.title || null,
      website_description: websiteMetadata?.description || null,
      raw_row: row
    })
  ].join('\n');

  let payload: any = null;
  let modelUsed: string | null = null;
  for (const model of modelsToTry) {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 350,
        temperature: 0.1,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!resp.ok) continue;
    payload = await resp.json();
    modelUsed = model;
    break;
  }

  if (!payload || !modelUsed) return null;
  const text = Array.isArray(payload?.content)
    ? payload.content.filter((item: any) => item?.type === 'text').map((item: any) => item.text).join('\n').trim()
    : '';
  if (!text) return null;

  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    const candidate = text.match(/\{[\s\S]*\}/)?.[0] || '';
    if (!candidate) return null;
    try {
      parsed = JSON.parse(candidate);
    } catch {
      return null;
    }
  }

  const normalizeList = (value: unknown) => Array.isArray(value)
    ? [...new Set(value.map(item => cleanText(item)).filter(Boolean))]
    : [];

  return {
    provider: 'anthropic',
    model: modelUsed,
    summary: cleanText(parsed?.summary || '') || null,
    eprCategories: normalizeList(parsed?.epr_categories),
    keywords: normalizeList(parsed?.keywords),
    confidence: toNumberOrNull(parsed?.confidence)
  };
}

function scorePotentialHeaderRow(row: unknown[]): number {
  const textCells = row.filter(c => c !== null && c !== undefined && String(c).trim() !== '');
  if (textCells.length < 2) return -1;
  const numeric = textCells.filter(c => !Number.isNaN(Number(String(c).replace(/,/g, '')))).length;
  return textCells.length - numeric * 2;
}

function buildUniqueHeaders(row: unknown[]): string[] {
  const seen = new Map<string, number>();
  return row.map(cell => {
    const base = normalizeHeader(cell) || 'col';
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count > 1 ? `${base}_${count}` : base;
  });
}

function parseWorkbookRows(ws: XLSX.WorkSheet, sheetName: string): Record<string, unknown>[] {
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: null, raw: false, blankrows: false });
  if (!Array.isArray(matrix) || matrix.length === 0) return [];

  let headerIndex = 0;
  let bestScore = -1;
  const searchLimit = Math.min(matrix.length, 12);
  for (let i = 0; i < searchLimit; i++) {
    const score = scorePotentialHeaderRow(matrix[i] as unknown[]);
    if (score > bestScore) { bestScore = score; headerIndex = i; }
  }

  const headers = buildUniqueHeaders(matrix[headerIndex] as unknown[]);
  const records: Record<string, unknown>[] = [];

  for (let ri = headerIndex + 1; ri < matrix.length; ri++) {
    const values = (matrix[ri] as unknown[]) || [];
    if (!values.some(v => cleanText(v) !== '')) continue;
    const row: Record<string, unknown> = { __sheet_name: sheetName, __row_index: ri + 1 };
    for (let ci = 0; ci < headers.length; ci++) row[headers[ci]] = values[ci] ?? null;
    records.push(row);
  }
  return records;
}

function fieldCompleteness(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (Array.isArray(value)) return value.filter(Boolean).length;
  const text = cleanText(value);
  return text ? 1 : 0;
}

function mergeFieldValues<T>(currentValue: T, nextValue: T): T {
  if (Array.isArray(currentValue) || Array.isArray(nextValue)) {
    return [...new Set([...(Array.isArray(currentValue) ? currentValue : []), ...(Array.isArray(nextValue) ? nextValue : [])].filter(Boolean))] as T;
  }

  if (fieldCompleteness(nextValue) > fieldCompleteness(currentValue)) return nextValue;
  return currentValue;
}

function mergeRows(currentRow: Record<string, unknown>, nextRow: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...currentRow };
  for (const [key, value] of Object.entries(nextRow)) {
    if (key.startsWith('__')) {
      if (!(key in merged)) merged[key] = value;
      continue;
    }
    merged[key] = mergeFieldValues(merged[key], value);
  }
  return merged;
}

function mergeExtractedFields(currentFields: RowFields, nextFields: RowFields): RowFields {
  const merged = { ...currentFields } as Record<string, unknown>;
  for (const [key, value] of Object.entries(nextFields)) {
    merged[key] = mergeFieldValues(merged[key], value);
  }
  return merged as unknown as RowFields;
}

function findValue(row: Record<string, unknown>, patterns: RegExp[]): string | null {
  for (const [k, v] of Object.entries(row)) {
    if (k.startsWith('__')) continue;
    if (v === null || v === undefined || cleanText(v) === '') continue;
    const nk = normalizeHeader(k);
    if (patterns.some(p => p.test(nk))) return cleanText(v);
  }
  return null;
}

function normalizeCompanyName(name: string): string {
  return name.toLowerCase().replace(/\s+(pvt|private|ltd|limited|llp|inc|corp|llc|plc)\.?\s*$/i, '').replace(/[^\w\s]/g, '').trim();
}

interface RowFields {
  companyName: string | null;
  state: string | null;
  city: string | null;
  gstin: string | null;
  cin: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  batteryCategories: string[];
  annualCapacityMt: number | null;
  complianceStatus: string | null;
  cpcbRegNumber: string | null;
  segmentTag: string | null;
  relevanceScore: number | null;
  contactPerson: string | null;
  addressFull: string | null;
  postalCode: string | null;
  companyType: string | null;
  scaleIndicator: string | null;
  specialization: string | null;
  contactStatus: string | null;
  liCreditsMt: number | null;
  mgCreditsMt: number | null;
  feCreditsMt: number | null;
  creditTier: string | null;
  certIssueDate: string | null;
  estNextRenewal: string | null;
  renewalUrgency: string | null;
  partnershipPriority: string | null;
  outreachAngle: string | null;
  suggestedChannel: string | null;
  contactName: string | null;
  emailVariant: string | null;
  partnerRegion: string | null;
  geoTier: string | null;
  outreachStatus: string | null;
  subjectUsed: string | null;
  variantUsed: string | null;
  mpcbCpcbStatus: string | null;
  mpcbSerialNumber: string | null;
  mpcbRegionalOffice: string | null;
  mpcbTypeAtMpcb: string | null;
  mpcbTypeAtCpcb: string | null;
  mpcbCapacityAllottedMt: number | null;
  mpcbConsentRef: string | null;
  mpcbConsentValidity: string | null;
  mpcbStatus: string | null;
  mpcbRemark: string | null;
  // BD-enriched dataset fields
  bdPriority: string | null;
  bdAction: string | null;
  eprPlatformFit: string | null;
  prospectType: string | null;
  noOfWasteCategories: number | null;
  catIvLargeScale: string | null;
  emailDomainType: string | null;
}

function extractRowFields(row: Record<string, unknown>): RowFields {
  const companyName =
    findValue(row, [/company_legal_name/, /legal_name/, /company_name/, /name_of_company/, /recycler_name/, /entity_name/, /name_of_pibo/, /^name$/]) ||
    null;

  const state = findValue(row, [/^state$/, /state_of_operation/, /registered_state/]);
  const city = findValue(row, [/^city$/, /^district$/, /headquarters_city/]);
  const gstin = findValue(row, [/^gstin$/, /gst_number/, /gst_no/]);
  const cin = findValue(row, [/^cin$/, /company_identification_number/]);
  const email = findValue(row, [/^email$/, /e_mail/, /email_address/, /contact_email/, /email_direct/, /email_clean/]);
  const phone = findValue(row, [/^phone$/, /^mobile$/, /phone_number/, /contact_number/, /contact_no/]);
  const website = findValue(row, [/^website$/, /web_url/, /company_url/]);
  const contactPerson = findValue(row, [/contact_person/, /contact_name/, /key_contact/, /sales_contact/, /primary_contact/]);
  const addressFull = findValue(row, [/address_full/, /registered_address/, /full_address/, /office_address/, /^address$/]);
  const postalCode = findValue(row, [/pin_code/, /pincode/, /postal_code/]);
  const companyType = findValue(row, [/company_type/, /industry_classification/, /entity_type/, /^prospect_type$/]);
  const scaleIndicator = findValue(row, [/scale_indicator/, /employee_count_band/, /scale_of_operation/]);
  const specialization = findValue(row, [/recycler_specialisation/, /speciali[sz]ation/, /processing_capabilit/]);
  const contactStatus = findValue(row, [/contact_status/]);
  const emailVariant = findValue(row, [/email_variant/]);
  const partnerRegion = findValue(row, [/partner_region/, /region/]);
  const geoTier = findValue(row, [/geo_tier/]);
  const outreachStatus = findValue(row, [/^status$/, /outreach_status/, /campaign_status/]) || contactStatus;

  // BD-enriched dataset specific fields (exact key matches to avoid cross-column pollution)
  const bdPriority = findValue(row, [/^bd_priority$/]);
  const bdAction = findValue(row, [/^bd_action$/]);
  const eprPlatformFit = findValue(row, [/^epr_platform_fit$/]);
  const prospectType = findValue(row, [/^prospect_type$/]);
  const noOfWasteCategories = toNumberOrNull(findValue(row, [/^no_of_waste_categories$/]));
  const catIvLargeScale = findValue(row, [/^cat_iv_large_scale/]);
  const emailDomainType = findValue(row, [/^email_domain_type$/]);

  const batteryCategoriesRaw = findValue(row, [/battery_categor/, /battery_type/, /recycler_specialisation/, /speciali[sz]ation/, /waste_category/, /^category$/]);
  const batteryCategories = batteryCategoriesRaw
    ? [...new Set(batteryCategoriesRaw.split(/[,;|]/).map(s => s.trim()).filter(Boolean))]
    : [];

  const annualCapacityMt = toNumberOrNull(findValue(row, [/annual_processing_capacity/, /processing_capacity/, /capacity_mt/, /total_credits/, /authorized_capacity/]));
  const liCreditsMt = toNumberOrNull(findValue(row, [/li_credits/, /lithium_credits/, /li\s*credits/]));
  const mgCreditsMt = toNumberOrNull(findValue(row, [/mg_credits/, /mg\s*credits/]));
  const feCreditsMt = toNumberOrNull(findValue(row, [/fe_credits/, /fe\s*credits/]));
  const complianceStatus = findValue(row, [/compliance_status/, /registration_status/, /authorization_status/]);
  const cpcbRegNumber = findValue(row, [/cpcb.*reg/, /registration_number/, /authorization_number/]);
  const creditTier = findValue(row, [/credit_tier/]);
  // Use exact-match first for BD priority to avoid matching bd_priority_score
  const partnershipPriority = bdPriority || findValue(row, [/^partnership_priority$/, /^priority$/]);
  const segmentTag = eprPlatformFit || findValue(row, [/segment_tag/, /segment/, /recycler_segment/]) || partnershipPriority || creditTier;
  const relevanceScore = toNumberOrNull(findValue(row, [/relevance_score/, /^bd_priority_score$/, /priority_score/, /score/]));
  const certIssueDate = toDateOnlyOrNull(findValue(row, [/cert_issue_date/, /issue_date/]));
  const estNextRenewal = toDateOnlyOrNull(findValue(row, [/est_next_renewal/, /next_renewal/]));
  const renewalUrgency = findValue(row, [/renewal_urgency/]);
  const outreachAngle = bdAction || findValue(row, [/outreach_angle/, /personalization_hook/]);
  const suggestedChannel = findValue(row, [/suggested_channel/, /recommended_channel/, /channel/]);
  const subjectUsed = findValue(row, [/subject_used/, /email_subject/, /subject_line/]);
  const variantUsed = findValue(row, [/variant_used/, /campaign_variant/, /template_variant/]);
  const mpcbCpcbStatus = findValue(row, [/^cpcb_status$/, /cpcb_status/]);
  const mpcbSerialNumber = findValue(row, [/^sr_no$/, /^serial_no$/, /sr_no/]);
  const mpcbRegionalOffice = findValue(row, [/regional_office/]);
  const mpcbTypeAtMpcb = findValue(row, [/type_at_mpcb/, /mpcb_type/]);
  const mpcbTypeAtCpcb = findValue(row, [/type_at_cpcb/, /cpcb_type/]);
  const mpcbCapacityAllottedMt = toNumberOrNull(findValue(row, [/capacity_allotted/, /consent.*capacity/, /mt_a/])) || annualCapacityMt;
  const mpcbConsentRef = findValue(row, [/consent_authorization_no_issue_date/, /consent.*authorization/, /authorization_no/, /authorisation_no/]);
  const mpcbConsentValidity = toDateOnlyOrNull(findValue(row, [/validity_of_consent_authorization/, /^validity$/, /consent.*validity/]));
  const mpcbStatus = findValue(row, [/^mpcb_status$/, /mpcb_status/]);
  const mpcbRemark = findValue(row, [/^remark$/, /^remarks$/, /remark_/]);

  return {
    companyName,
    state,
    city,
    gstin,
    cin,
    email,
    phone,
    website,
    batteryCategories,
    annualCapacityMt,
    complianceStatus,
    cpcbRegNumber,
    segmentTag,
    relevanceScore,
    contactPerson,
    addressFull,
    postalCode,
    companyType,
    scaleIndicator,
    specialization,
    contactStatus,
    liCreditsMt,
    mgCreditsMt,
    feCreditsMt,
    creditTier,
    certIssueDate,
    estNextRenewal,
    renewalUrgency,
    partnershipPriority,
    outreachAngle,
    suggestedChannel,
    contactName: contactPerson,
    emailVariant,
    partnerRegion,
    geoTier,
    outreachStatus,
    subjectUsed,
    variantUsed,
    mpcbCpcbStatus,
    mpcbSerialNumber,
    mpcbRegionalOffice,
    mpcbTypeAtMpcb,
    mpcbTypeAtCpcb,
    mpcbCapacityAllottedMt,
    mpcbConsentRef,
    mpcbConsentValidity,
    mpcbStatus,
    mpcbRemark,
    bdPriority,
    bdAction,
    eprPlatformFit,
    prospectType,
    noOfWasteCategories,
    catIvLargeScale,
    emailDomainType,
  };
}

// ─── DB helpers ───────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();

async function upsertCompany(db: ReturnType<typeof makeDb>, fields: RowFields): Promise<string | null> {
  if (!fields.companyName) return null;

  // Try exact identifiers first
  for (const [col, val] of [['gstin', fields.gstin], ['cin', fields.cin]] as [string, string | null][]) {
    if (!val) continue;
    const { data } = await db.from('intel_companies').select('id').eq(col, val).maybeSingle();
    if (data?.id) {
      await db.from('intel_companies').update({
        website: fields.website || null,
        company_type: fields.companyType || null,
        state: fields.state || null,
        district: fields.city || null,
        updated_at: nowIso(),
      }).eq('id', data.id);
      return data.id;
    }
  }

  // Fuzzy name match
  const normalized = normalizeCompanyName(fields.companyName).replace(/\s+/g, '%');
  const { data: fuzzy } = await db
    .from('intel_companies')
    .select('id')
    .ilike('canonical_name', `%${normalized}%`)
    .limit(1)
    .maybeSingle();
  if (fuzzy?.id) {
    await db.from('intel_companies').update({
      website: fields.website || null,
      company_type: fields.companyType || null,
      state: fields.state || null,
      district: fields.city || null,
      updated_at: nowIso(),
    }).eq('id', fuzzy.id);
    return fuzzy.id;
  }

  // Insert new
  const { data: inserted, error } = await db
    .from('intel_companies')
    .insert({
      canonical_name: fields.companyName,
      gstin: fields.gstin || null,
      cin: fields.cin || null,
      website: fields.website || null,
      company_type: fields.companyType || null,
      state: fields.state || null,
      district: fields.city || null,
      updated_at: nowIso(),
    })
    .select('id')
    .single();

  if (error) throw new Error(`Company upsert failed: ${error.message}`);
  return inserted.id;
}

async function upsertFactSheet(
  db: ReturnType<typeof makeDb>,
  companyId: string,
  sourceDocumentId: string,
  fields: RowFields,
  rawRow: Record<string, unknown>,
  ingestedBy: string,
) {
  const payload = {
    company_id: companyId,
    website: fields.website || null,
    city: fields.city || null,
    state: fields.state || null,
    contact_person: fields.contactPerson || null,
    email_direct: fields.email || null,
    phone: fields.phone || null,
    address_full: fields.addressFull || null,
    postal_code: fields.postalCode || null,
    industry_classification: fields.companyType || null,
    employee_count_band: fields.scaleIndicator || null,
    contact_status: fields.outreachStatus || fields.contactStatus || null,
    credit_tier: fields.creditTier || null,
    partnership_priority: fields.partnershipPriority || null,
    outreach_angle: fields.outreachAngle || null,
    cert_issue_date: fields.certIssueDate || null,
    est_next_renewal: fields.estNextRenewal || null,
    renewal_urgency: fields.renewalUrgency || null,
    segment_tag: fields.segmentTag || null,
    relevance_score: fields.relevanceScore,
    personalization_hook: fields.outreachAngle || null,
    recommended_channel: fields.suggestedChannel || null,
    notes: [fields.contactStatus, fields.specialization, fields.prospectType].filter(Boolean).join(' | ') || null,
    epr_target_mt: fields.annualCapacityMt,
    raw_payload: {
      ...rawRow,
      parsed_fields: fields,
      bd_enrichment: {
        bd_priority: fields.bdPriority,
        bd_action: fields.bdAction,
        epr_platform_fit: fields.eprPlatformFit,
        prospect_type: fields.prospectType,
        no_of_waste_categories: fields.noOfWasteCategories,
        cat_iv_large_scale: fields.catIvLargeScale,
        email_domain_type: fields.emailDomainType,
      },
    },
    source_document_id: sourceDocumentId,
    updated_by: ingestedBy,
    updated_at: nowIso(),
  };
  const { error } = await db
    .from('intel_company_fact_sheets')
    .upsert(payload, { onConflict: 'company_id' });
  if (error) throw new Error(`Fact sheet upsert failed: ${error.message}`);
}

async function upsertPartnershipProfile(
  db: ReturnType<typeof makeDb>,
  companyId: string,
  sourceDocumentId: string,
  fields: RowFields,
  rawRow: Record<string, unknown>,
  ingestedBy: string,
) {
  const { data: existing } = await db
    .from('intel_recycler_partnership_profiles')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  const coalesce = <T,>(incoming: T, current: T): T => {
    if (Array.isArray(incoming)) return (incoming.length > 0 ? incoming : current) as T;
    if (incoming === null || incoming === undefined) return current;
    if (typeof incoming === 'string') return (incoming.trim() ? incoming : current) as T;
    return incoming;
  };

  const payload = {
    company_id: companyId,
    primary_contact_name: coalesce(fields.contactName, existing?.primary_contact_name) || null,
    email_variant: coalesce(fields.emailVariant, existing?.email_variant) || null,
    partner_region: coalesce(fields.partnerRegion, existing?.partner_region) || null,
    geo_tier: coalesce(fields.geoTier, existing?.geo_tier) || null,
    outreach_status: coalesce(fields.outreachStatus || fields.contactStatus, existing?.outreach_status) || null,
    subject_used: coalesce(fields.subjectUsed, existing?.subject_used) || null,
    variant_used: coalesce(fields.variantUsed, existing?.variant_used) || null,
    partnership_score: coalesce(fields.relevanceScore, existing?.partnership_score) ?? null,
    partnership_priority: coalesce(fields.partnershipPriority, existing?.partnership_priority) || null,
    outreach_angle: coalesce(fields.outreachAngle, existing?.outreach_angle) || null,
    suggested_channel: coalesce(fields.suggestedChannel, existing?.suggested_channel) || null,
    recycler_specialization: coalesce(fields.specialization, existing?.recycler_specialization) || null,
    company_type: coalesce(fields.companyType, existing?.company_type) || null,
    scale_indicator: coalesce(fields.scaleIndicator, existing?.scale_indicator) || null,
    total_credits_mt: coalesce(fields.annualCapacityMt, existing?.total_credits_mt) ?? null,
    source_document_id: sourceDocumentId,
    raw_payload: { ...(existing?.raw_payload || {}), ...rawRow, parsed_fields: { ...(existing?.raw_payload?.parsed_fields || {}), ...fields } },
    updated_by: ingestedBy,
    updated_at: nowIso(),
  };
  const { error } = await db
    .from('intel_recycler_partnership_profiles')
    .upsert(payload, { onConflict: 'company_id' });
  if (error) throw new Error(`Partnership profile upsert failed: ${error.message}`);
}

async function upsertSpcbProfile(
  db: ReturnType<typeof makeDb>,
  companyId: string,
  sourceDocumentId: string,
  fields: RowFields,
  rawRow: Record<string, unknown>,
  ingestedBy: string,
) {
  const { data: existing } = await db
    .from('intel_mpcb_recycler_profiles')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  const inferredWebsite = fields.website || inferWebsiteFromEmail(fields.email) || existing?.inferred_website || null;
  const websiteMetadata = await fetchWebsiteMetadata(inferredWebsite);
  const enrichment = await runAnthropicSpcbEnrichment(db, fields, rawRow, websiteMetadata);

  const coalesce = <T,>(incoming: T, current: T): T => {
    if (Array.isArray(incoming)) return (incoming.length > 0 ? incoming : current) as T;
    if (incoming === null || incoming === undefined) return current;
    if (typeof incoming === 'string') return (incoming.trim() ? incoming : current) as T;
    return incoming;
  };

  const payload = {
    company_id: companyId,
    company_name_as_per_mpcb: coalesce(fields.companyName, existing?.company_name_as_per_mpcb) || null,
    mpcb_serial_number: coalesce(fields.mpcbSerialNumber, existing?.mpcb_serial_number) || null,
    cpcb_status: coalesce(fields.mpcbCpcbStatus, existing?.cpcb_status) || null,
    mpcb_status: coalesce(fields.mpcbStatus, existing?.mpcb_status) || null,
    regional_office: coalesce(fields.mpcbRegionalOffice, existing?.regional_office) || null,
    mpcb_type: coalesce(fields.mpcbTypeAtMpcb, existing?.mpcb_type) || null,
    cpcb_type: coalesce(fields.mpcbTypeAtCpcb, existing?.cpcb_type) || null,
    capacity_allotted_mt: coalesce(fields.mpcbCapacityAllottedMt, existing?.capacity_allotted_mt) ?? null,
    consent_authorization_ref: coalesce(fields.mpcbConsentRef, existing?.consent_authorization_ref) || null,
    consent_valid_upto: coalesce(fields.mpcbConsentValidity, existing?.consent_valid_upto) || null,
    contact_email: coalesce(fields.email, existing?.contact_email) || null,
    contact_phone: coalesce(fields.phone, existing?.contact_phone) || null,
    remarks: coalesce(fields.mpcbRemark, existing?.remarks) || null,
    inferred_website: coalesce(websiteMetadata?.url || inferredWebsite, existing?.inferred_website) || null,
    inferred_domain: coalesce(websiteMetadata?.domain, existing?.inferred_domain) || null,
    website_title: coalesce(websiteMetadata?.title, existing?.website_title) || null,
    website_description: coalesce(websiteMetadata?.description, existing?.website_description) || null,
    enrichment_provider: coalesce(enrichment?.provider, existing?.enrichment_provider) || null,
    enrichment_model: coalesce(enrichment?.model, existing?.enrichment_model) || null,
    enrichment_summary: coalesce(enrichment?.summary, existing?.enrichment_summary) || null,
    enrichment_epr_categories: coalesce(enrichment?.eprCategories || [], existing?.enrichment_epr_categories || []),
    enrichment_keywords: coalesce(enrichment?.keywords || [], existing?.enrichment_keywords || []),
    enrichment_confidence: coalesce(enrichment?.confidence, existing?.enrichment_confidence) ?? null,
    enrichment_last_run_at: enrichment ? nowIso() : existing?.enrichment_last_run_at || null,
    source_document_id: sourceDocumentId,
    raw_payload: {
      ...(existing?.raw_payload || {}),
      ...rawRow,
      parsed_fields: fields,
      website_metadata: websiteMetadata || null,
      enrichment: enrichment || null,
    },
    updated_by: ingestedBy,
    updated_at: nowIso(),
  };

  const { error } = await db
    .from('intel_mpcb_recycler_profiles')
    .upsert(payload, { onConflict: 'company_id' });
  if (error) throw new Error(`SPCB profile upsert failed: ${error.message}`);
}

async function upsertCpcbProfile(
  db: ReturnType<typeof makeDb>,
  companyId: string,
  sourceDocumentId: string,
  fields: RowFields,
  rawRow: Record<string, unknown>,
  ingestedBy: string,
) {
  const { data: existing } = await db
    .from('intel_cpcb_recycler_profiles')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  const coalesce = <T,>(incoming: T, current: T): T => {
    if (Array.isArray(incoming)) return (incoming.length > 0 ? incoming : current) as T;
    if (incoming === null || incoming === undefined) return current;
    if (typeof incoming === 'string') return (incoming.trim() ? incoming : current) as T;
    return incoming;
  };

  const payload = {
    company_id: companyId,
    company_name_as_per_cpcb: coalesce(fields.companyName, existing?.company_name_as_per_cpcb) || null,
    cpcb_registration_number: coalesce(fields.cpcbRegNumber, existing?.cpcb_registration_number) || null,
    cpcb_registration_status: coalesce(fields.complianceStatus || fields.contactStatus, existing?.cpcb_registration_status) || null,
    authorization_type: coalesce(fields.companyType, existing?.authorization_type) || null,
    recycler_category: coalesce(fields.specialization || fields.segmentTag, existing?.recycler_category) || null,
    capacity_mt: coalesce(fields.annualCapacityMt, existing?.capacity_mt) ?? null,
    material_categories: coalesce(fields.batteryCategories || [], existing?.material_categories || []),
    registration_valid_from: coalesce(fields.certIssueDate, existing?.registration_valid_from) || null,
    registration_valid_upto: coalesce(fields.estNextRenewal, existing?.registration_valid_upto) || null,
    contact_person: coalesce(fields.contactPerson, existing?.contact_person) || null,
    contact_email: coalesce(fields.email, existing?.contact_email) || null,
    contact_phone: coalesce(fields.phone, existing?.contact_phone) || null,
    website: coalesce(fields.website, existing?.website) || null,
    linkedin_url: coalesce(existing?.linkedin_url, null),
    state: coalesce(fields.state, existing?.state) || null,
    city: coalesce(fields.city, existing?.city) || null,
    address_line: coalesce(fields.addressFull, existing?.address_line) || null,
    gstin: coalesce(fields.gstin, existing?.gstin) || null,
    cin: coalesce(fields.cin, existing?.cin) || null,
    pan: coalesce(existing?.pan, null),
    source_label: 'CPCB',
    source_document_id: sourceDocumentId,
    verified_fields: {
      ...(existing?.verified_fields || {}),
      company_name_as_per_cpcb: fields.companyName,
      cpcb_registration_number: fields.cpcbRegNumber,
      cpcb_registration_status: fields.complianceStatus || fields.contactStatus,
      recycler_category: fields.specialization || fields.segmentTag,
      capacity_mt: fields.annualCapacityMt,
      material_categories: fields.batteryCategories,
    },
    raw_payload: {
      ...(existing?.raw_payload || {}),
      ...rawRow,
      parsed_fields: fields,
    },
    updated_by: ingestedBy,
    updated_at: nowIso(),
  };

  const { error } = await db
    .from('intel_cpcb_recycler_profiles')
    .upsert(payload, { onConflict: 'company_id' });
  if (error) throw new Error(`CPCB profile upsert failed: ${error.message}`);
}

async function upsertBatteryProfile(
  db: ReturnType<typeof makeDb>,
  companyId: string,
  sourceDocumentId: string,
  fields: RowFields,
  rawRow: Record<string, unknown>,
  ingestedBy: string,
) {
  if (!fields.batteryCategories.length && !fields.annualCapacityMt && !fields.cpcbRegNumber) return;
  const payload = {
    company_id: companyId,
    recycler_name: fields.companyName || null,
    battery_categories: fields.batteryCategories,
    recycler_specialization: fields.specialization || null,
    scale_indicator: fields.scaleIndicator || null,
    li_credits_mt: fields.liCreditsMt,
    mg_credits_mt: fields.mgCreditsMt,
    fe_credits_mt: fields.feCreditsMt,
    annual_processing_capacity_mt: fields.annualCapacityMt,
    compliance_status: fields.contactStatus || fields.renewalUrgency || fields.complianceStatus || null,
    cpcb_registration_number: fields.cpcbRegNumber || null,
    cpcb_registration_valid_upto: fields.estNextRenewal || null,
    source_document_id: sourceDocumentId,
    raw_payload: { ...rawRow, parsed_fields: fields },
    updated_by: ingestedBy,
    updated_at: nowIso(),
  };
  const { error } = await db
    .from('intel_battery_recycler_profiles')
    .upsert(payload, { onConflict: 'company_id' });
  if (error) throw new Error(`Battery profile upsert failed: ${error.message}`);
}

// ─── Main handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const user = await resolveIntelUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Forbidden: Intel access restricted' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const sourceId = String(body.source_id || '').trim();
  const googleSheetUrl = String(body.google_sheet_url || '').trim();
  const uploadedRows = Array.isArray(body.rows)
    ? body.rows.filter((row) => row && typeof row === 'object') as Record<string, unknown>[]
    : [];
  const uploadedFileName = cleanText(body.file_name || 'uploaded-file');
  const ingestMode = uploadedRows.length > 0 ? 'uploaded_rows' : 'google_sheet';

  if (!sourceId) return NextResponse.json({ error: 'source_id is required' }, { status: 400 });
  if (ingestMode === 'google_sheet' && !googleSheetUrl) {
    return NextResponse.json({ error: 'google_sheet_url is required' }, { status: 400 });
  }

  let spreadsheetId: string | null = null;
  let gid: string | null = null;
  if (ingestMode === 'google_sheet') {
    try {
      ({ spreadsheetId, gid } = parseGoogleSheetLink(googleSheetUrl));
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }
  }

  const db = makeDb();

  // Verify source exists
  const { data: sourceRow, error: sourceError } = await db
    .from('intel_sources')
    .select('id, source_name')
    .eq('id', sourceId)
    .maybeSingle();
  if (sourceError || !sourceRow) {
    return NextResponse.json({ error: 'Source not found' }, { status: 404 });
  }

  // Download sheet when ingesting directly from Google Sheets.
  let buffer: Buffer | null = null;
  if (ingestMode === 'google_sheet') {
    try {
      buffer = await downloadSheetAsBuffer(spreadsheetId as string, gid);
    } catch (err: unknown) {
      return NextResponse.json({ error: (err as Error).message }, { status: 502 });
    }
  }

  // Create ingestion job
  const sourceDocRef = ingestMode === 'google_sheet'
    ? `google-sheet:${spreadsheetId}${gid ? `:gid:${gid}` : ''}`
    : `upload:${uploadedFileName}`;
  const { data: docRow, error: docError } = await db
    .from('intel_source_documents')
    .insert({
      source_id: sourceId,
      source_document_ref: sourceDocRef,
      document_type: ingestMode === 'google_sheet'
        ? 'xlsx'
        : (uploadedFileName.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx'),
      parse_status: 'processing',
      ingested_at: nowIso(),
      ingested_by: user.id,
    })
    .select('id')
    .single();
  if (docError) {
    return NextResponse.json({ error: `Could not create source document: ${docError.message}` }, { status: 500 });
  }
  const sourceDocumentId: string = docRow.id;

  // Parse workbook for Google Sheets or directly use uploaded mapped rows.
  const allRows: Record<string, unknown>[] =
    ingestMode === 'google_sheet'
      ? (() => {
          const workbook = XLSX.read(buffer as Buffer, { type: 'buffer' });
          const parsedRows: Record<string, unknown>[] = [];
          for (const sheetName of workbook.SheetNames) {
            const rows = parseWorkbookRows(workbook.Sheets[sheetName], sheetName);
            parsedRows.push(...rows);
          }
          return parsedRows;
        })()
      : uploadedRows;

  // Deduplicate by company name (keep row with most fields filled)
  const deduped = new Map<string, Record<string, unknown>>();
  for (const row of allRows) {
    const f = extractRowFields(row);
    if (!f.companyName) continue;
    const key = normalizeCompanyName(f.companyName);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, row);
      continue;
    }
    deduped.set(key, mergeRows(existing, row));
  }

  const uniqueRows = Array.from(deduped.values());

  // Create ingestion job record
  const { data: jobRow } = await db
    .from('intel_ingestion_jobs')
    .insert({
      ingest_path: 'bulk_csv_excel',
      source_id: sourceId,
      source_document_id: sourceDocumentId,
      job_status: 'processing',
      total_rows: uniqueRows.length,
      started_at: nowIso(),
    })
    .select('id')
    .single();
  const jobId: string = jobRow?.id;

  let insertedRows = 0;
  let updatedRows = 0;
  let skippedRows = 0;
  let errorRows = 0;
  const errorLog: string[] = [];

  for (const row of uniqueRows) {
    const fields = extractRowFields(row);
    if (!fields.companyName) { skippedRows++; continue; }

    try {
      const existingId = await (async () => {
        for (const [col, val] of [['gstin', fields.gstin], ['cin', fields.cin]] as [string, string | null][]) {
          if (!val) continue;
          const { data } = await db.from('intel_companies').select('id').eq(col, val).maybeSingle();
          if (data?.id) return data.id;
        }
        const nm = normalizeCompanyName(fields.companyName!).replace(/\s+/g, '%');
        const { data } = await db.from('intel_companies').select('id').ilike('canonical_name', `%${nm}%`).limit(1).maybeSingle();
        return data?.id || null;
      })();

      const companyId = await upsertCompany(db, fields);
      if (!companyId) { skippedRows++; continue; }

      await upsertFactSheet(db, companyId, sourceDocumentId, fields, row, user.id);
      await upsertBatteryProfile(db, companyId, sourceDocumentId, fields, row, user.id);
      await upsertPartnershipProfile(db, companyId, sourceDocumentId, fields, row, user.id);
      await upsertSpcbProfile(db, companyId, sourceDocumentId, fields, row, user.id);
      await upsertCpcbProfile(db, companyId, sourceDocumentId, fields, row, user.id);

      if (existingId) updatedRows++;
      else insertedRows++;
    } catch (err: unknown) {
      errorRows++;
      errorLog.push(String((err as Error).message || err).slice(0, 500));
    }
  }

  // Finish job
  const completed = errorRows === 0;
  await db.from('intel_ingestion_jobs').update({
    job_status: completed ? 'completed' : 'failed',
    inserted_rows: insertedRows,
    updated_rows: updatedRows,
    skipped_rows: skippedRows,
    error_rows: errorRows,
    error_log: errorLog,
    finished_at: nowIso(),
    updated_at: nowIso(),
  }).eq('id', jobId);

  await db.from('intel_source_documents').update({
    parse_status: completed ? 'completed' : 'failed',
    parse_error: completed ? null : `${errorRows} row error(s)`,
  }).eq('id', sourceDocumentId);

  return NextResponse.json({
    ok: true,
    mode: ingestMode,
    job_id: jobId,
    source_document_id: sourceDocumentId,
    spreadsheet_id: spreadsheetId,
    gid: gid || null,
    counts: { insertedRows, updatedRows, skippedRows, errorRows, totalRows: uniqueRows.length },
  }, { status: 201 });
}
