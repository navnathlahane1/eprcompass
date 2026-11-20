/**
 * Generic Airtable → Intel raw-records importer.
 * Talks to a separate Airtable base (the "EPR Intelligence Database") — distinct
 * from the CRM Leads base in lib/airtable.ts. Read-only: pulls records into
 * intel_raw_records for manual review/promotion in the Intel staging UI.
 */

export interface AirtableRecord {
  id: string;
  createdTime: string;
  fields: Record<string, unknown>;
}

const BASE_ID = () => process.env.AIRTABLE_INTEL_BASE_ID;
const PAT = () => process.env.AIRTABLE_INTEL_PAT || process.env.AIRTABLE_PAT;

const authHeader = () => ({
  Authorization: `Bearer ${PAT()}`,
  'Content-Type': 'application/json',
});

export function isAirtableIntelConfigured(): boolean {
  return Boolean(BASE_ID() && PAT());
}

/** Fetch every record from a table, following Airtable's offset-based pagination. */
export async function fetchAllRecords(tableName: string): Promise<AirtableRecord[]> {
  const baseId = BASE_ID();
  if (!baseId) throw new Error('AIRTABLE_INTEL_BASE_ID not configured');

  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);

    const res = await fetch(url.toString(), { headers: authHeader() });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable fetch failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    records.push(...(data.records || []));
    offset = data.offset;
  } while (offset);

  return records;
}

/** Stable source_type key for a table, e.g. "Haryana E-Waste" -> "airtable_haryana_e_waste" */
export function tableSourceType(tableName: string): string {
  return `airtable_${tableName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')}`;
}
