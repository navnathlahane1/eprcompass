import { createClient } from '@supabase/supabase-js';

export type PartnerType =
  | 'CHA'
  | 'Logistics / Freight Forwarder'
  | 'Trading / Manufacturing Co.'
  | 'Industry Association'
  | 'Environmental Consultant'
  | 'CA/CS'
  | 'Recycler Network'
  | 'Legal / Compliance Firm'
  | 'Other';

export type PartnerStage =
  | 'Not Contacted'
  | 'First Contact Sent'
  | 'Responded'
  | 'Meeting Scheduled'
  | 'Proposal Shared'
  | 'Negotiation'
  | 'Contract Signed'
  | 'Onboarding'
  | 'Active Partner'
  | 'Dormant'
  | 'Rejected';

export type EPRPitchStatus =
  | 'Not Pitched'
  | 'Pitched'
  | 'Follow Up'
  | 'Interested'
  | 'Declined';

export type OutreachTier = 'Hot' | 'Warm' | 'Cold';

export type ParsedPhones = {
  primary: string | null;
  secondary: string | null;
  tertiary: string | null;
};

export type ParsedAddress = {
  line1: string | null;
  line2: string | null;
  city: string | null;
  pincode: string | null;
};

type ImportRow = Record<string, any>;

type ImportError = {
  rowIndex: number;
  companyName: string;
  reason: string;
};

const PARTNER_TYPES: PartnerType[] = [
  'CHA',
  'Logistics / Freight Forwarder',
  'Trading / Manufacturing Co.',
  'Industry Association',
  'Environmental Consultant',
  'CA/CS',
  'Recycler Network',
  'Legal / Compliance Firm',
  'Other'
];

const PARTNER_STAGES: PartnerStage[] = [
  'Not Contacted',
  'First Contact Sent',
  'Responded',
  'Meeting Scheduled',
  'Proposal Shared',
  'Negotiation',
  'Contract Signed',
  'Onboarding',
  'Active Partner',
  'Dormant',
  'Rejected'
];

const EPR_PITCH_STATUSES: EPRPitchStatus[] = [
  'Not Pitched',
  'Pitched',
  'Follow Up',
  'Interested',
  'Declined'
];

const EMAIL_REGEX = /^[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(\+91\d{10}|\d{7,11})$/;

function isPartnerImportsCacheMiss(error: any): boolean {
  const code = String(error?.code || '');
  const message = String(error?.message || '').toLowerCase();
  const details = String(error?.details || '').toLowerCase();

  return (
    code === 'PGRST205' &&
    (
      message.includes("public.partner_imports") ||
      details.includes("public.partner_imports") ||
      message.includes('partner_imports') ||
      details.includes('partner_imports')
    )
  );
}

async function createImportLogSafely(
  supabase: any,
  importedBy: string,
  sourceName: string,
  totalRows: number
): Promise<string | null> {
  const { data, error } = await supabase
    .from('partner_imports')
    .insert({
      imported_by: importedBy,
      source_name: sourceName,
      total_rows: totalRows,
      imported_rows: 0,
      skipped_rows: 0,
      status: 'Processing',
      error_log: []
    })
    .select('id')
    .single();

  if (error) {
    if (isPartnerImportsCacheMiss(error)) {
      return null;
    }
    throw error;
  }

  return data?.id || null;
}

async function updateImportLogSafely(
  supabase: any,
  importId: string | null,
  payload: { imported_rows: number; skipped_rows: number; error_log: ImportError[]; status: 'Processing' | 'Done' }
): Promise<void> {
  if (!importId) return;

  const { error } = await supabase
    .from('partner_imports')
    .update(payload)
    .eq('id', importId);

  if (error && !isPartnerImportsCacheMiss(error)) {
    throw error;
  }
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function compact(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeKey(value: string): string {
  return compact(String(value || '')).toLowerCase();
}

function toStringSafe(value: any): string {
  return compact(String(value ?? ''));
}

function normalizePhoneToken(rawToken: string): string | null {
  const digitsOnly = rawToken.replace(/\D/g, '');
  if (!digitsOnly) return null;

  let n = digitsOnly;
  if (n.length === 11 && n.startsWith('0')) {
    n = n.slice(1);
  }

  if (n.length === 12 && n.startsWith('91')) {
    return `+${n}`;
  }

  if (n.length === 10 && /^[6-9]/.test(n)) {
    return `+91${n}`;
  }

  // Accept STD + number style landline tokens.
  if (n.length >= 8 && n.length <= 11) {
    return n;
  }

  return null;
}

function expandHyphenLandline(token: string): string[] {
  // Example: 22233033-34 -> 22233033, 22233034
  const cleaned = token.replace(/\s+/g, '');
  if (!cleaned.includes('-')) return [cleaned];

  const [left, right] = cleaned.split('-');
  if (!left || !right) return [cleaned];

  const leftDigits = left.replace(/\D/g, '');
  const rightDigits = right.replace(/\D/g, '');
  if (!leftDigits || !rightDigits) return [cleaned];

  const rebuilt = `${leftDigits.slice(0, Math.max(leftDigits.length - rightDigits.length, 0))}${rightDigits}`;
  return [leftDigits, rebuilt];
}

export function parseRawPhones(rawString: string): ParsedPhones {
  const raw = String(rawString || '');
  const chunks = raw
    .split(/[|/]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const candidates: string[] = [];
  for (const chunk of chunks) {
    const expanded = expandHyphenLandline(chunk);
    for (const value of expanded) {
      value
        .split(/[\s,;]+/)
        .map((token) => token.trim())
        .filter(Boolean)
        .forEach((token) => candidates.push(token));
    }
  }

  const normalized = Array.from(
    new Set(
      candidates
        .map(normalizePhoneToken)
        .filter((value): value is string => Boolean(value))
    )
  ).slice(0, 3);

  return {
    primary: normalized[0] || null,
    secondary: normalized[1] || null,
    tertiary: normalized[2] || null
  };
}

export function parseAddress(rawAddress: string): ParsedAddress {
  const raw = compact(String(rawAddress || ''));
  if (!raw) {
    return { line1: null, line2: null, city: null, pincode: null };
  }

  const pinMatch = raw.match(/(\d{6})(?!.*\d{6})/);
  const pincode = pinMatch?.[1] || null;

  const addressNoPin = pincode ? compact(raw.replace(pincode, '')) : raw;
  const parts = addressNoPin
    .split(',')
    .map((item) => compact(item))
    .filter(Boolean);

  let city: string | null = null;
  if (parts.length > 1) {
    city = parts[parts.length - 1] || null;
  } else {
    const tokens = addressNoPin.split(/\s+/).filter(Boolean);
    city = tokens.length > 1 ? tokens[tokens.length - 1] : null;
  }

  return {
    line1: parts[0] || addressNoPin || null,
    line2: parts.slice(1, Math.max(parts.length - 1, 1)).join(', ') || null,
    city,
    pincode
  };
}

export function computeDataCompletenessScore(row: Record<string, any>): number {
  let score = 0;

  if (row.hasEmail) score += 20;
  if (row.hasMobilePhone) score += 20;
  if (toStringSafe(row.website).length > 0) score += 15;
  if (toStringSafe(row.contactPerson).length > 0) score += 15;
  if (toStringSafe(row.fullAddress).length > 0) score += 15;
  if (toStringSafe(row.companyType).length > 0) score += 15;

  return Math.max(0, Math.min(100, score));
}

// CHANGED: Expanded mapping for new CSV partner types.
export function mapCompanyType(rawType: string): PartnerType {
  const text = normalizeKey(rawType);

  if (text.includes('cha') || text.includes('customs')) return 'CHA';
  if (text.includes('logistics') || text.includes('freight')) return 'Logistics / Freight Forwarder';
  if (text.includes('trading') || text.includes('manufacturing')) return 'Trading / Manufacturing Co.';
  if (text.includes('association')) return 'Industry Association';
  if (text.includes('ca') || text.includes('cs')) return 'CA/CS';
  if (text.includes('recycler')) return 'Recycler Network';
  if (text.includes('legal') || text.includes('compliance')) return 'Legal / Compliance Firm';
  if (text.includes('consult') || text.includes('service')) return 'Environmental Consultant';
  if (text.includes('travel')) return 'Other';
  return 'Other';
}

export function mapOutreachTier(rawTier: string): OutreachTier {
  const text = normalizeKey(rawTier);
  if (text.includes('tier 1')) return 'Hot';
  if (text.includes('tier 2')) return 'Warm';
  if (text.includes('tier 3')) return 'Cold';
  if (text.includes('hot')) return 'Hot';
  if (text.includes('cold')) return 'Cold';
  return 'Warm';
}

// CHANGED: CSV row validator for strict/non-strict checks with defaults handled by import pipeline.
export function validateCSVRow(row: Record<string, string>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const companyName = toStringSafe(
    row.company_name || row['company_name'] || row['Company Name'] || row.CompanyName || row.company || ''
  );
  if (!companyName) {
    errors.push('company_name is required');
  }

  const partnerTypeRaw = toStringSafe(row.partner_type || row['Partner Type'] || row.company_type || row['Company Type'] || '');
  if (partnerTypeRaw && !PARTNER_TYPES.includes(partnerTypeRaw as PartnerType)) {
    const mapped = mapCompanyType(partnerTypeRaw);
    if (!mapped) errors.push('partner_type is invalid');
  }

  const outreachTierRaw = toStringSafe(row.outreach_tier || row['Outreach Tier'] || '');
  if (outreachTierRaw && !['Hot', 'Warm', 'Cold'].includes(outreachTierRaw)) {
    // fixable by defaulting to Cold
  }

  const emailPrimary = toStringSafe(row.email_primary || row.email || row['Email'] || row['E-Mail'] || '');
  if (emailPrimary && !EMAIL_REGEX.test(emailPrimary)) {
    errors.push('email_primary format is invalid');
  }

  const phonePrimaryRaw = toStringSafe(row.phone_primary || row.phone || row['Phone Numbers'] || row.phone_numbers || '');
  const phonePrimaryToken = phonePrimaryRaw.includes('|') ? phonePrimaryRaw.split('|')[0] : phonePrimaryRaw;
  const parsedPhone = normalizePhoneToken(phonePrimaryToken || '');
  if (phonePrimaryRaw && !(parsedPhone && PHONE_REGEX.test(parsedPhone))) {
    errors.push('phone_primary format is invalid');
  }

  const scoreRaw = toStringSafe(row.data_completeness_score || '');
  if (scoreRaw) {
    const score = Number(scoreRaw);
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      // fixable by defaulting to 0
    }
  }

  const priorityRaw = toStringSafe(row.priority_score || '');
  if (priorityRaw) {
    const priority = Number(priorityRaw);
    if (!Number.isInteger(priority) || priority < 0 || priority > 10) {
      // fixable by defaulting to 0
    }
  }

  const stageRaw = toStringSafe(row.stage || '');
  if (stageRaw && !PARTNER_STAGES.includes(stageRaw as PartnerStage)) {
    // fixable by defaulting to Not Contacted
  }

  const pitchRaw = toStringSafe(row.epr_pitch_status || '');
  if (pitchRaw && !EPR_PITCH_STATUSES.includes(pitchRaw as EPRPitchStatus)) {
    // fixable by defaulting to Not Pitched
  }

  return { valid: errors.length === 0, errors };
}

function toIntInRange(value: any, min: number, max: number, fallback: number): number {
  const num = Number(value);
  if (!Number.isInteger(num) || num < min || num > max) return fallback;
  return num;
}

function isIgnorableRow(rawRow: Record<string, any>): boolean {
  const companyName = toStringSafe(
    rawRow.company_name || rawRow['company_name'] || rawRow['Company Name'] || rawRow.CompanyName || rawRow.company || ''
  );

  if (companyName) return false;

  const signalValues = [
    rawRow.partner_type,
    rawRow.company_type,
    rawRow.contact_name,
    rawRow.contact_person,
    rawRow.email_primary,
    rawRow.email,
    rawRow['Email'],
    rawRow.phone_primary,
    rawRow.phone,
    rawRow.phone_numbers,
    rawRow['Phone Numbers'],
    rawRow.address,
    rawRow.full_address,
    rawRow.city,
    rawRow.state
  ]
    .map((value) => toStringSafe(value))
    .filter(Boolean);

  // Row has no company and no meaningful import signal.
  return signalValues.length === 0;
}

function fuzzyCompanyCityKey(companyName: string, city: string): string {
  return `${normalizeKey(companyName)}::${normalizeKey(city)}`;
}

function mapDataSource(sourceName: string): 'CHA_EPR_Leads' | 'Manual' | 'Referral' {
  const normalized = normalizeKey(sourceName);
  if (normalized.includes('cha')) return 'CHA_EPR_Leads';
  if (normalized.includes('referral')) return 'Referral';
  return 'Manual';
}

// CHANGED: Import pipeline now validates rows, auto-corrects fixable fields, and strips generated columns.
export async function importPartnersFromJSON(
  rows: ImportRow[],
  importedBy: string,
  sourceName: string
): Promise<{ imported: number; skipped: number; errors: ImportError[] }> {
  const supabase = getSupabaseAdmin();
  const cappedRows = (rows || []).slice(0, 5000);

  const importId = await createImportLogSafely(supabase as any, importedBy, sourceName, cappedRows.length);
  const errors: ImportError[] = [];
  let imported = 0;
  let skipped = 0;

  const { data: existingRows } = await (supabase as any)
    .from('partners')
    .select('company_name, city')
    .limit(100000);

  const seen = new Set<string>();
  (existingRows || []).forEach((item: any) => {
    seen.add(fuzzyCompanyCityKey(item.company_name || '', item.city || ''));
  });

  for (let offset = 0; offset < cappedRows.length; offset += 100) {
    const batch = cappedRows.slice(offset, offset + 100);
    const payload: any[] = [];

    batch.forEach((rawRow, batchIndex) => {
      const rowIndex = offset + batchIndex;

      try {
        if (isIgnorableRow(rawRow as Record<string, any>)) {
          skipped += 1;
          return;
        }

        const companyName = toStringSafe(
          rawRow.company_name || rawRow['company_name'] || rawRow['Company Name'] || rawRow.CompanyName || rawRow.company || ''
        );
        const rawType = toStringSafe(rawRow.partner_type || rawRow['Partner Type'] || rawRow.company_type || rawRow['Company Type'] || '');
        const contactName = toStringSafe(rawRow.contact_name || rawRow['Contact Name'] || '');
        const emailPrimary = toStringSafe(rawRow.email_primary || rawRow.email || rawRow['E-Mail'] || rawRow['Email'] || '');
        const emailSecondary = toStringSafe(rawRow.email_secondary || rawRow.email_2 || '');
        const rawPhone = toStringSafe(rawRow.phone_numbers || rawRow.phone || rawRow['Phone Numbers'] || '');
        const weblink = toStringSafe(rawRow.website || rawRow.weblink || rawRow['Weblink'] || '');
        const rawAddress = toStringSafe(rawRow.address || rawRow['Address'] || '');
        const rawTier = toStringSafe(rawRow.outreach_tier || rawRow['Outreach Tier'] || '');
        const rawStage = toStringSafe(rawRow.stage || '');
        const rawPitchStatus = toStringSafe(rawRow.epr_pitch_status || '');

        const validation = validateCSVRow({
          ...rawRow,
          company_name: companyName,
          partner_type: rawType,
          outreach_tier: rawTier,
          email_primary: emailPrimary,
          phone_primary: rawPhone
        } as Record<string, string>);

        if (!validation.valid) {
          skipped += 1;
          errors.push({ rowIndex, companyName: companyName || 'N/A', reason: validation.errors.join('; ') });
          return;
        }

        if (!companyName) {
          skipped += 1;
          errors.push({ rowIndex, companyName: 'N/A', reason: 'Missing company name' });
          return;
        }

        const parsedAddress = parseAddress(rawAddress);
        const city = toStringSafe(rawRow.city || parsedAddress.city || '');
        const dupKey = fuzzyCompanyCityKey(companyName, city);

        if (seen.has(dupKey)) {
          skipped += 1;
          errors.push({ rowIndex, companyName, reason: 'Duplicate company_name + city' });
          return;
        }

        const phones = parseRawPhones(rawPhone);
        const hasEmail = Boolean(emailPrimary);
        const hasMobilePhone = Boolean(phones.primary && phones.primary.startsWith('+91'));
        const mappedType = mapCompanyType(rawType);
        const normalizedStage: PartnerStage = PARTNER_STAGES.includes(rawStage as PartnerStage)
          ? (rawStage as PartnerStage)
          : 'Not Contacted';
        const normalizedPitch: EPRPitchStatus = EPR_PITCH_STATUSES.includes(rawPitchStatus as EPRPitchStatus)
          ? (rawPitchStatus as EPRPitchStatus)
          : 'Not Pitched';

        const normalizedTier: OutreachTier = ['Hot', 'Warm', 'Cold'].includes(rawTier)
          ? (rawTier as OutreachTier)
          : 'Cold';

        const normalizedScore = toIntInRange(rawRow.data_completeness_score ?? '', 0, 100, 0);
        const normalizedPriority = toIntInRange(rawRow.priority_score ?? '', 0, 10, 0);

        const score = computeDataCompletenessScore({
          hasEmail,
          hasMobilePhone,
          website: weblink,
          contactPerson: contactName,
          fullAddress: rawAddress,
          companyType: mappedType
        });

        payload.push({
          company_name: companyName,
          partner_type: mappedType,
          state: toStringSafe(rawRow.state || rawRow['State'] || ''),
          city,
          contact_person: contactName || null,
          email: emailPrimary || null,
          email_primary: emailPrimary || null,
          email_secondary: emailSecondary || null,
          phone: phones.primary || null,
          contact_person_2: toStringSafe(rawRow.contact_person_2 || '') || null,
          contact_person_3: toStringSafe(rawRow.contact_person_3 || '') || null,
          email_2: toStringSafe(rawRow.email_2 || '') || null,
          email_3: toStringSafe(rawRow.email_3 || '') || null,
          phone_primary: phones.primary,
          phone_secondary: phones.secondary,
          phone_tertiary: phones.tertiary,
          phone_raw: rawPhone || null,
          website: weblink || null,
          address_line1: parsedAddress.line1,
          address_line2: parsedAddress.line2,
          address: rawAddress || null,
          full_address: rawAddress || null,
          pincode: parsedAddress.pincode,
          outreach_tier: normalizedTier || mapOutreachTier(rawTier),
          stage: normalizedStage,
          epr_pitch_status: normalizedPitch,
          epr_awareness_level: ['None', 'Low', 'High'].includes(toStringSafe(rawRow.epr_awareness_level || ''))
            ? toStringSafe(rawRow.epr_awareness_level)
            : 'None',
          outreach_attempt_count: toIntInRange(rawRow.outreach_attempt_count ?? '', 0, 999999, 0),
          data_source: mapDataSource(sourceName),
          data_completeness_score: rawRow.data_completeness_score != null && rawRow.data_completeness_score !== ''
            ? normalizedScore
            : score,
          priority_score: normalizedPriority,
          annual_import_export_volume: toStringSafe(rawRow.annual_import_export_volume || '' ) || null,
          best_time_to_call: toStringSafe(rawRow.best_time_to_call || '') || null,
          customs_license_no: toStringSafe(rawRow.customs_license_no || '') || null
        });

        // Generated columns are readonly and must never be inserted manually.
        delete payload[payload.length - 1].has_email;
        delete payload[payload.length - 1].has_phone;

        seen.add(dupKey);
      } catch (error: any) {
        skipped += 1;
        errors.push({
          rowIndex,
          companyName: toStringSafe(rawRow.company_name || rawRow['Company Name'] || 'N/A'),
          reason: String(error?.message || 'Unknown parse error')
        });
      }
    });

    if (payload.length) {
      const { error } = await (supabase as any).from('partners').insert(payload);
      if (error) {
        payload.forEach((item) => {
          skipped += 1;
          errors.push({ rowIndex: offset, companyName: item.company_name, reason: `Insert failed: ${error.message}` });
        });
      } else {
        imported += payload.length;
      }
    }

    await updateImportLogSafely(supabase as any, importId, {
      imported_rows: imported,
      skipped_rows: skipped,
      error_log: errors.slice(0, 500),
      status: 'Processing'
    });
  }

  await updateImportLogSafely(supabase as any, importId, {
    imported_rows: imported,
    skipped_rows: skipped,
    error_log: errors.slice(0, 500),
    status: 'Done'
  });

  return { imported, skipped, errors };
}
