import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const runtime = 'nodejs';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function normalizePhone(p: string): string {
  return String(p || '').replace(/\D/g, '').slice(-10);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  const { data, count, error } = await db.from('tc_lead_imports')
    .select('*, created_by_profile:profiles!tc_lead_imports_created_by_fkey(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ imports: data, total: count, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { rows, filename, column_mapping } = body;
  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'rows array is required and must not be empty' }, { status: 400 });
  }

  const db = makeServiceClient();

  // Create import record
  const { data: importJob, error: importErr } = await db.from('tc_lead_imports').insert({
    filename: filename || 'import.csv',
    total_rows: rows.length,
    processed_rows: 0,
    valid_rows: 0,
    duplicate_rows: 0,
    error_rows: 0,
    status: 'processing',
    column_mapping: column_mapping || null,
    created_by: actor.userId,
  }).select().single();

  if (importErr) return NextResponse.json({ error: importErr.message }, { status: 500 });
  const importId = importJob.id;

  // Load DNC phones and emails into Sets for O(1) lookup
  const { data: dncRows } = await db.from('tc_dnc_registry')
    .select('phone, email')
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  const dncPhones = new Set<string>();
  const dncEmails = new Set<string>();
  for (const d of dncRows || []) {
    if (d.phone) dncPhones.add(normalizePhone(d.phone));
    if (d.email) dncEmails.add(String(d.email).toLowerCase().trim());
  }

  // Load existing lead phones, emails, and company names for dedup
  const { data: existingLeads } = await db.from('leads').select('phone, mobile, email, company_name, name');
  const existingPhones = new Set<string>();
  const existingEmails = new Set<string>();
  const existingCompanies = new Set<string>();
  for (const l of existingLeads || []) {
    if (l.phone) existingPhones.add(normalizePhone(l.phone));
    if (l.mobile) existingPhones.add(normalizePhone(l.mobile));
    if (l.email) existingEmails.add(String(l.email).toLowerCase().trim());
    if (l.company_name) existingCompanies.add(String(l.company_name).toLowerCase().trim());
  }

  let validRows: Record<string, any>[] = [];
  let duplicateCount = 0;
  let errorCount = 0;
  const importRowRecords: Record<string, any>[] = [];
  // importRowRecords entries for valid rows, in the same order as validRows
  const validRowRecords: Record<string, any>[] = [];

  for (const row of rows) {
    const phone = String(row.phone || row.phone_numbers || row.mobile || row.mobile_no || '').trim();
    const email = String(row.email || row.email_primary || row.email_id || '').trim().toLowerCase();
    const company = String(row.company || row.company_name || row.organization || '').trim();
    // Contact name is optional: accept common aliases, fall back to
    // first/last name columns, and import the row even when it's absent.
    const contactName = String(
      row.contact_name || row.contact_person || row.contact || row.full_name || row.name ||
      [row.first_name, row.last_name].filter(Boolean).join(' ')
    ).trim();

    if (!company && !phone && !email) {
      errorCount++;
      importRowRecords.push({ import_id: importId, row_data: row, status: 'error', error_message: 'Missing company, phone, and email — at least one is required' });
      continue;
    }

    const normPhone = normalizePhone(phone);
    const isDNC = (normPhone && dncPhones.has(normPhone)) || (email && dncEmails.has(email));
    if (isDNC) {
      errorCount++;
      importRowRecords.push({ import_id: importId, row_data: row, status: 'error', error_message: 'Phone or email is on DNC registry' });
      continue;
    }

    const normCompany = company.toLowerCase().trim();
    const isDuplicate =
      (normPhone && existingPhones.has(normPhone)) ||
      (email && existingEmails.has(email)) ||
      (normCompany && existingCompanies.has(normCompany));
    if (isDuplicate) {
      duplicateCount++;
      importRowRecords.push({ import_id: importId, row_data: row, status: 'duplicate', error_message: 'Lead already exists' });
      continue;
    }

    // Track to avoid duplicates within this import batch
    if (normPhone) existingPhones.add(normPhone);
    if (email) existingEmails.add(email);
    if (normCompany) existingCompanies.add(normCompany);

    validRows.push({
      company: company || null,
      contact: contactName || null,
      email: email || null,
      phone: phone || null,
      state: String(row.state || '').trim() || null,
      city: String(row.city || '').trim() || null,
    });

    const record = { import_id: importId, row_data: row, status: 'valid' };
    importRowRecords.push(record);
    validRowRecords.push(record);
  }

  // The deployed leads table is Zoho-style (company_name/name, no
  // contact_name or state columns); the 002_crm migration schema instead has
  // company/contact_name/state with source as an enum. Build the insert for
  // the live schema first and fall back to the CRM schema if columns differ.
  type ParsedRow = { company: string | null; contact: string | null; email: string | null; phone: string | null; state: string | null; city: string | null };
  const liveShape = (r: ParsedRow) => ({
    company_name: r.company || r.contact || r.phone || r.email,
    name: r.contact || r.company || r.phone || r.email || 'Unknown',
    email: r.email,
    phone: r.phone,
    city: r.city,
    description: r.state ? `State: ${r.state}` : null,
    stage: 'New',
    source: 'TC Import',
    referral_source_detail: 'TC Import',
    tc_status: 'New',
  });
  const crmShape = (r: ParsedRow) => ({
    company: r.company,
    contact_name: r.contact,
    email: r.email,
    phone: r.phone,
    state: r.state,
    city: r.city,
    stage: 'New',
    source: 'Direct', // source is an enum in this schema — only valid values
    referral_source_detail: 'TC Import',
    tc_status: 'New',
  });

  // Bulk insert valid leads in chunks of 500
  let insertedCount = 0;
  let insertError: string | null = null;
  let shaper: ((r: ParsedRow) => Record<string, any>) | null = null;
  const leadChunks = chunkArray(validRows as ParsedRow[], 500);

  for (let c = 0; c < leadChunks.length; c++) {
    const chunk = leadChunks[c];
    const chunkOffset = c * 500;

    let inserted: { id: string }[] | null = null;
    let chunkError: string | null = null;

    for (const tryShape of shaper ? [shaper] : [liveShape, crmShape]) {
      const { data, error } = await db.from('leads').insert(chunk.map(tryShape)).select('id');
      if (!error && data) {
        inserted = data;
        shaper = tryShape;
        break;
      }
      chunkError = error?.message || 'Insert failed';
    }

    if (!inserted) {
      // Don't swallow DB errors — mark the affected rows and report back
      insertError = chunkError;
      for (let i = 0; i < chunk.length; i++) {
        const record = validRowRecords[chunkOffset + i];
        record.status = 'error';
        record.error_message = chunkError;
      }
      errorCount += chunk.length;
      continue;
    }

    for (let i = 0; i < inserted.length; i++) {
      const record = validRowRecords[chunkOffset + i];
      record.status = 'inserted';
      record.mapped_lead_id = inserted[i].id;
    }
    insertedCount += inserted.length;
  }

  // Bulk insert import row records
  for (const chunk of chunkArray(importRowRecords, 500)) {
    await db.from('tc_lead_import_rows').insert(chunk);
  }

  const failed = insertedCount === 0 && validRows.length > 0;

  // Update import job with final counts
  await db.from('tc_lead_imports').update({
    processed_rows: rows.length,
    valid_rows: insertedCount,
    duplicate_rows: duplicateCount,
    error_rows: errorCount,
    status: failed ? 'failed' : 'completed',
    error_log: insertError ? [insertError] : [],
    completed_at: new Date().toISOString(),
  }).eq('id', importId);

  if (failed) {
    return NextResponse.json({
      error: `Import failed: ${insertError || 'no rows could be inserted'}`,
      import_id: importId,
      total: rows.length,
      imported: 0,
      duplicates: duplicateCount,
      errors: errorCount,
    }, { status: 500 });
  }

  return NextResponse.json({
    import_id: importId,
    total: rows.length,
    imported: insertedCount,
    duplicates: duplicateCount,
    errors: errorCount,
    ...(insertError ? { warning: `Some rows failed to insert: ${insertError}` } : {}),
  }, { status: 201 });
}
