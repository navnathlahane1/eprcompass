import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { importPartnersFromJSON } from '@/lib/partners/import';
import { isSuperAdmin as isConfiguredSuperAdmin } from '@/lib/admin/isSuperAdmin';

export const runtime = 'nodejs';

function normalizeHeader(value: string): string {
  return String(value || '')
    .replace(/^\uFEFF/, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getByAliases(row: Record<string, any>, aliases: string[]): any {
  if (!row || typeof row !== 'object') return '';

  const entries = Object.entries(row);
  const normalizedMap = new Map<string, any>();
  for (const [key, value] of entries) {
    normalizedMap.set(normalizeHeader(key), value);
  }

  for (const alias of aliases) {
    const hit = normalizedMap.get(normalizeHeader(alias));
    if (hit !== undefined && String(hit ?? '').trim() !== '') {
      return hit;
    }
  }

  return '';
}

function scoreSheetByHeaders(rows: any[]): number {
  const first = (rows || [])[0] || {};
  const keys = Object.keys(first).map(normalizeHeader);
  const set = new Set(keys);

  let score = 0;
  if (set.has('companyname') || set.has('nameofcompany') || set.has('company')) score += 5;
  if (set.has('contactname') || set.has('contactperson')) score += 2;
  if (set.has('email') || set.has('emailid') || set.has('emailaddress')) score += 2;
  if (set.has('phone') || set.has('phonenumbers') || set.has('mobileno')) score += 2;
  if (set.has('address') || set.has('city') || set.has('state')) score += 1;
  return score;
}

function pickTargetSheetName(sheetNames: string[]): string | null {
  const priority = ['Tier1_Hot', 'Tier2_Warm', 'All Leads'];
  for (const name of priority) {
    const found = sheetNames.find((sheet) => sheet.trim().toLowerCase() === name.toLowerCase());
    if (found) return found;
  }
  return sheetNames[0] || null;
}

function normalizeRows(rows: any[]): Record<string, any>[] {
  return rows
    .map((row) => ({
      company_name: getByAliases(row, [
        'Company Name',
        'CompanyName',
        'Name of Company',
        'Organization Name',
        'Firm Name',
        'Company'
      ]),
      partner_type: getByAliases(row, ['Partner Type', 'Company Type', 'Type', 'Business Type']),
      company_type: getByAliases(row, ['Company Type', 'Type', 'Business Type']),
      state: getByAliases(row, ['State', 'Province']),
      city: getByAliases(row, ['City', 'Town']),
      pincode: getByAliases(row, ['Pincode', 'Pin Code', 'Postal Code', 'Zip']),
      outreach_tier: getByAliases(row, ['Outreach Tier', 'Tier', 'Priority Tier']),
      stage: getByAliases(row, ['Stage', 'Partner Stage']),
      epr_pitch_status: getByAliases(row, ['EPR Pitch Status', 'Pitch Status']),
      epr_awareness_level: getByAliases(row, ['EPR Awareness Level', 'Awareness Level']),
      outreach_attempt_count: getByAliases(row, ['Outreach Attempt Count', 'Attempts']),
      contact_name: getByAliases(row, ['Contact Name', 'Contact Person', 'Contact']),
      contact_person_2: getByAliases(row, ['Contact Person 2', 'Secondary Contact Person']),
      contact_person_3: getByAliases(row, ['Contact Person 3', 'Tertiary Contact Person']),
      email_primary: getByAliases(row, ['Email Primary', 'E-Mail', 'Email', 'Email ID', 'Email Address']),
      email_secondary: getByAliases(row, ['Email Secondary', 'Secondary Email']),
      email_2: getByAliases(row, ['Email 2', 'Alternate Email 2']),
      email_3: getByAliases(row, ['Email 3', 'Alternate Email 3']),
      email: getByAliases(row, ['E-Mail', 'Email', 'Email ID', 'Email Address']),
      phone_numbers: getByAliases(row, ['Phone Numbers', 'Phone', 'Mobile', 'Mobile No', 'Contact Number']),
      phone_primary: getByAliases(row, ['Phone Primary', 'Primary Phone']),
      phone_secondary: getByAliases(row, ['Phone Secondary', 'Secondary Phone']),
      phone_tertiary: getByAliases(row, ['Phone Tertiary', 'Tertiary Phone']),
      phone_raw: getByAliases(row, ['Phone Raw', 'Raw Phone']),
      website: getByAliases(row, ['Website', 'Weblink', 'URL', 'Site']),
      weblink: getByAliases(row, ['Weblink', 'Website', 'URL', 'Site']),
      address: getByAliases(row, ['Address', 'Office Address'])
      ,full_address: getByAliases(row, ['Full Address'])
      ,data_source: getByAliases(row, ['Data Source', 'Source'])
      ,data_completeness_score: getByAliases(row, ['Data Completeness Score', 'Completeness Score'])
      ,priority_score: getByAliases(row, ['Priority Score'])
      ,has_email: getByAliases(row, ['Has Email'])
      ,has_phone: getByAliases(row, ['Has Phone'])
    }))
    .filter((row) =>
      // Keep any non-empty row so import layer can report row-level validation errors
      // instead of failing with a generic "No rows found in file".
      Object.values(row).some((value) => String(value ?? '').trim() !== '')
    );
}

function applyColumnMapping(rows: Record<string, any>[], columnMapping: Record<string, string>): Record<string, any>[] {
  if (!columnMapping || !Object.keys(columnMapping).length) return rows;

  return rows.map((row) => {
    const mapped: Record<string, any> = { ...row };
    for (const [targetKey, sourceKey] of Object.entries(columnMapping)) {
      if (!sourceKey) continue;
      mapped[targetKey] = row[sourceKey];
    }
    return mapped;
  });
}

function keepNonEmptyRows(rows: Record<string, any>[]): Record<string, any>[] {
  return (rows || []).filter((row) =>
    Object.values(row || {}).some((value) => String(value ?? '').trim() !== '')
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const effectiveRole = profile?.role || (isConfiguredSuperAdmin(user.email) ? 'admin' : '');

    if (!['admin', 'manager'].includes(effectiveRole)) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const sourceName = String(formData.get('sourceName') || 'CHA_EPR_Leads_Ready');
    const columnMappingRaw = String(formData.get('columnMapping') || '');

    let columnMapping: Record<string, string> = {};
    if (columnMappingRaw) {
      try {
        const parsed = JSON.parse(columnMappingRaw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          columnMapping = parsed as Record<string, string>;
        }
      } catch {
        // Ignore invalid mapping payload and proceed with alias-based parsing.
      }
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'Missing file' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rows: Record<string, any>[] = [];
    const lowerName = file.name.toLowerCase();

    if (lowerName.endsWith('.csv')) {
      const wb = XLSX.read(buffer, { type: 'buffer', codepage: 65001 });
      const sheetName = wb.SheetNames[0];
      if (!sheetName) {
        return NextResponse.json({ success: false, error: 'CSV has no sheet data' }, { status: 400 });
      }
      const sheet = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const mappedRows = applyColumnMapping(rawRows, columnMapping);
      rows = normalizeRows(mappedRows);
      if (!rows.length && mappedRows.length) {
        rows = keepNonEmptyRows(mappedRows);
      }
    } else {
      const wb = XLSX.read(buffer, { type: 'buffer' });
      const prioritySheetName = pickTargetSheetName(wb.SheetNames);
      let sheetName = prioritySheetName;

      // Fallback: pick the sheet with the strongest expected lead header match.
      if (!sheetName) {
        let bestScore = -1;
        for (const name of wb.SheetNames) {
          const sheet = wb.Sheets[name];
          const sampleRows = XLSX.utils.sheet_to_json(sheet, { defval: '' }).slice(0, 3);
          const score = scoreSheetByHeaders(sampleRows as any[]);
          if (score > bestScore) {
            bestScore = score;
            sheetName = name;
          }
        }
      }

      if (!sheetName) {
        return NextResponse.json({ success: false, error: 'Workbook has no sheets' }, { status: 400 });
      }

      const sheet = wb.Sheets[sheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: '' });
      const mappedRows = applyColumnMapping(rawRows, columnMapping);
      rows = normalizeRows(mappedRows);
      if (!rows.length && mappedRows.length) {
        rows = keepNonEmptyRows(mappedRows);
      }
    }

    if (!rows.length) {
      return NextResponse.json({ success: false, error: 'No rows found in file' }, { status: 400 });
    }

    const result = await importPartnersFromJSON(rows, user.id, sourceName);

    return NextResponse.json({
      success: true,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Import failed') },
      { status: 500 }
    );
  }
}
