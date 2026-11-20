/**
 * Upload Clean_Data.xlsx (Gujarat Environmental Consultants) → Intel Portal (Supabase)
 *
 * These environmental consultants are potential channel partners for EPR work.
 * Creates intel_sources + intel_source_documents + intel_ingestion_jobs, then
 * upserts intel_companies + intel_company_fact_sheets (deduped by canonical_name).
 *
 * Default is a DRY RUN (no writes). Pass --commit to write to the live DB.
 *
 * Usage:
 *   node scripts/upload_env_consultants_to_intel.mjs            # dry run (preview)
 *   node scripts/upload_env_consultants_to_intel.mjs --commit   # live write
 *   node scripts/upload_env_consultants_to_intel.mjs --file=/path/to.xlsx --commit
 */

import XLSX from 'xlsx';

// ── Config ────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.');
}
const args = process.argv.slice(2);
const COMMIT = args.includes('--commit');
const fileArg = args.find((a) => a.startsWith('--file='));
const EXCEL_PATH = (fileArg && fileArg.slice('--file='.length)) || process.env.PLASTIC_BD_EXCEL_PATH;
if (!EXCEL_PATH) {
  throw new Error('Provide --file=... or set PLASTIC_BD_EXCEL_PATH.');
}
const SHEET_NAME = 'Clean Data';

const SOURCE_NAME = 'Environmental Consultants - Gujarat (Clean_Data)';
const SOURCE_FILE = 'Clean_Data.xlsx';
const ENTITY_LABEL = 'Environmental Consultant';
const NOW = new Date().toISOString();

const HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// ── PostgREST helpers ─────────────────────────────────────────────────────────
async function pgGet(table, params = '') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`GET ${table} ${r.status}: ${await r.text()}`);
  return r.json();
}
async function pgPost(table, payload, prefer = 'return=representation') {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: prefer },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`POST ${table} ${r.status}: ${await r.text()}`);
  const txt = await r.text();
  return txt ? JSON.parse(txt) : null;
}
async function pgPatch(table, params, payload) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`PATCH ${table} ${r.status}: ${await r.text()}`);
}

// ── Field helpers ─────────────────────────────────────────────────────────────
const clean = (v) => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  return s === 'nan' || s === 'undefined' ? '' : s;
};
const digits = (v) => clean(v).replace(/\D/g, '');
const normName = (name) =>
  clean(name)
    .toLowerCase()
    .replace(/\s+(pvt|private|ltd|limited|llp|inc|corp|llc|plc)\.?\s*/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
function fmtDate(v) {
  const s = clean(v);
  if (!s) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  // ISO-ish string already
  const m = s.match(/^\d{4}-\d{2}-\d{2}/);
  if (m) return m[0];
  return s;
}

// ── Source setup ──────────────────────────────────────────────────────────────
async function getOrCreateSource() {
  const existing = await pgGet(
    'intel_sources',
    `source_name=eq.${encodeURIComponent(SOURCE_NAME)}&select=id`,
  );
  if (existing.length) {
    console.log(`  Existing source: ${existing[0].id}`);
    return existing[0].id;
  }
  if (!COMMIT) {
    console.log('  [dry-run] would create intel_sources row');
    return '00000000-0000-0000-0000-000000000000';
  }
  const row = await pgPost('intel_sources', {
    source_name: SOURCE_NAME,
    source_type: 'bulk_upload',
    vendor_name: 'Internal BD (WhatsApp share)',
    license_terms: 'Internal use only',
    license_flag: 'internal-use-only',
    reliability_tier: 3,
    refresh_cadence: 'ad-hoc',
    cost_amount: 0.0,
    cost_currency: 'INR',
    active: true,
    metadata: {
      dataset_type: 'environmental_consultants',
      entity: 'environmental_consultant',
      role: 'potential_partner',
      region: 'Gujarat',
      source_file: SOURCE_FILE,
      total_rows: 83,
    },
    created_at: NOW,
    updated_at: NOW,
  });
  const id = Array.isArray(row) ? row[0].id : row.id;
  console.log(`  Created source: ${id}`);
  return id;
}
async function createSourceDocument(sourceId) {
  if (!COMMIT) return '00000000-0000-0000-0000-000000000000';
  const row = await pgPost('intel_source_documents', {
    source_id: sourceId,
    source_document_ref: `upload:${SOURCE_FILE}`,
    vendor_batch_id: SOURCE_FILE,
    document_type: 'xlsx',
    parse_status: 'processing',
    ingested_at: NOW,
  });
  return Array.isArray(row) ? row[0].id : row.id;
}
async function createIngestionJob(sourceId, docId, total) {
  if (!COMMIT) return '00000000-0000-0000-0000-000000000000';
  const row = await pgPost('intel_ingestion_jobs', {
    ingest_path: 'bulk_csv_excel',
    source_id: sourceId,
    source_document_id: docId,
    job_status: 'processing',
    total_rows: total,
    started_at: NOW,
  });
  return Array.isArray(row) ? row[0].id : row.id;
}

// ── Row → payloads ────────────────────────────────────────────────────────────
function buildCompanyPayload(row) {
  const name = clean(row.Company_Name);
  const city = clean(row.City);
  return {
    canonical_name: name,
    entity_type: ENTITY_LABEL,
    company_type: ENTITY_LABEL,
    sector: 'Environmental Consulting',
    primary_industry: 'Environmental Consulting',
    state: clean(row.State) || 'Gujarat',
    district: city || null,
    email: clean(row.Email) || null,
    phone: clean(row.Mobile) || null,
    normalized_phone: digits(row.Mobile) || null,
    normalized_company_name: normName(name) || null,
    source: SOURCE_NAME,
    notes: 'Potential channel partner — environmental consultant (Gujarat). Imported from Clean_Data.xlsx.',
    updated_at: NOW,
  };
}
function buildFactSheetPayload(companyId, docId, row) {
  const city = clean(row.City);
  return {
    company_id: companyId,
    contact_person: clean(row.Contact_Person) || null,
    phone: clean(row.Mobile) || null,
    email_direct: clean(row.Email) || null,
    address_full: clean(row.Address) || null,
    city: city || null,
    state: clean(row.State) || 'Gujarat',
    country: 'India',
    postal_code: clean(row.Pincode) || null,
    industry_classification: ENTITY_LABEL,
    segment_tag: ENTITY_LABEL,
    partnership_priority: 'prospect',
    source_platform: SOURCE_FILE,
    notes: 'Potential EPR channel partner (environmental consultant).',
    raw_payload: {
      consultant_accreditation_validity: fmtDate(row.Validity_Date),
      validation_status: clean(row.Validation_Status) || null,
      source_file: SOURCE_FILE,
      original_city: city || null,
      original_pincode: clean(row.Pincode) || null,
    },
    source_document_id: docId !== '00000000-0000-0000-0000-000000000000' ? docId : null,
    updated_at: NOW,
  };
}

// ── Upsert one company ────────────────────────────────────────────────────────
async function findExisting(name) {
  const norm = normName(name);
  if (!norm) return null;
  // exact canonical match (case-insensitive)
  const rows = await pgGet(
    'intel_companies',
    `canonical_name=ilike.${encodeURIComponent(name)}&select=id,canonical_name&limit=1`,
  );
  return rows.length ? rows[0] : null;
}

async function main() {
  console.log(`\n=== Intel Portal Upload: Environmental Consultants (Gujarat) ===`);
  console.log(`Mode: ${COMMIT ? 'COMMIT (live write)' : 'DRY RUN (no writes)'}`);
  console.log(`File: ${EXCEL_PATH}\n`);

  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[SHEET_NAME] || wb.Sheets[wb.SheetNames[0]];
  let rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  rows = rows.filter((r) => clean(r.Company_Name));
  console.log(`Loaded ${rows.length} consultant rows.\n`);

  console.log('1. Source records...');
  const sourceId = await getOrCreateSource();
  const docId = await createSourceDocument(sourceId);
  const jobId = await createIngestionJob(sourceId, docId, rows.length);

  let inserted = 0,
    updated = 0,
    skipped = 0,
    errors = 0;

  // Dry-run: show 3 sample payloads for inspection
  if (!COMMIT) {
    console.log('\n── Sample mapped payloads (first 3) ──');
    for (const r of rows.slice(0, 3)) {
      console.log('\nintel_companies   :', JSON.stringify(buildCompanyPayload(r)));
      console.log('intel_fact_sheets :', JSON.stringify(buildFactSheetPayload('<company_id>', docId, r)));
    }
  }

  console.log(`\n2. Processing ${rows.length} companies...`);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const name = clean(row.Company_Name);
    try {
      let existing = null;
      if (COMMIT) existing = await findExisting(name);

      if (!COMMIT) {
        inserted++; // assume new in dry-run (validated: all net-new)
        continue;
      }

      let companyId;
      const companyPayload = buildCompanyPayload(row);
      if (existing) {
        companyId = existing.id;
        await pgPatch('intel_companies', `id=eq.${companyId}`, companyPayload);
        updated++;
      } else {
        const ins = await pgPost('intel_companies', { ...companyPayload, created_at: NOW });
        companyId = Array.isArray(ins) ? ins[0].id : ins.id;
        inserted++;
      }

      // Fact sheet upsert (PK = company_id)
      await pgPost(
        'intel_company_fact_sheets',
        buildFactSheetPayload(companyId, docId, row),
        'resolution=merge-duplicates,return=minimal',
      );
    } catch (e) {
      errors++;
      if (errors <= 8) console.log(`   Row ${i + 1} error (${name}): ${e.message}`);
    }
  }

  if (COMMIT && jobId !== '00000000-0000-0000-0000-000000000000') {
    await pgPatch('intel_ingestion_jobs', `id=eq.${jobId}`, {
      job_status: 'completed',
      processed_rows: inserted + updated,
      completed_at: new Date().toISOString(),
    }).catch(() => {});
  }

  console.log('\n=== Summary ===');
  console.log(`  inserted: ${inserted}`);
  console.log(`  updated : ${updated}`);
  console.log(`  skipped : ${skipped}`);
  console.log(`  errors  : ${errors}`);
  if (!COMMIT) console.log('\n(DRY RUN — nothing written. Re-run with --commit to write.)');
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
