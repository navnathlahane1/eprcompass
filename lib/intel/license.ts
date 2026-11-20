import type { SupabaseClient } from '@supabase/supabase-js';

export type SourceLicense = {
  id: string;
  source_name: string;
  license_flag: string;
  reliability_tier: number | null;
};

export type CompanyLicense = {
  company_id: string;
  shareable: boolean;
  sources: SourceLicense[];
  flags: string[];
};

const INTERNAL = 'internal-use-only';

export async function licenseForCompanies(
  db: SupabaseClient,
  companyIds: string[],
): Promise<Map<string, CompanyLicense>> {
  const out = new Map<string, CompanyLicense>();
  for (const id of companyIds) {
    out.set(id, { company_id: id, shareable: true, sources: [], flags: [] });
  }
  if (!companyIds.length) return out;

  const { data: notices } = await db
    .from('intel_notices')
    .select('company_id, source_document_id')
    .in('company_id', companyIds);

  const docIds = [...new Set((notices || []).map((n) => n.source_document_id).filter(Boolean))] as string[];
  const docsById = new Map<string, { id: string; source_id: string }>();
  if (docIds.length) {
    const { data: docs } = await db.from('intel_source_documents').select('id, source_id').in('id', docIds);
    for (const d of docs || []) docsById.set(d.id, d);
  }

  const sourceIds = [...new Set([...docsById.values()].map((d) => d.source_id).filter(Boolean))];
  const sourcesById = new Map<string, SourceLicense>();
  if (sourceIds.length) {
    const { data: sources } = await db
      .from('intel_sources')
      .select('id, source_name, license_flag, reliability_tier')
      .in('id', sourceIds);
    for (const s of sources || []) {
      sourcesById.set(s.id, {
        id: s.id,
        source_name: s.source_name,
        license_flag: s.license_flag || INTERNAL,
        reliability_tier: s.reliability_tier ?? null,
      });
    }
  }

  const { data: fields } = await db
    .from('intel_field_values')
    .select('entity_id, source_id, license_flag, confidence_score')
    .eq('entity_table', 'intel_companies')
    .eq('is_current', true)
    .in('entity_id', companyIds);

  const extraSourceIds = [...new Set((fields || []).map((f) => f.source_id).filter((id): id is string => Boolean(id) && !sourcesById.has(id)))];
  if (extraSourceIds.length) {
    const { data: extras } = await db
      .from('intel_sources')
      .select('id, source_name, license_flag, reliability_tier')
      .in('id', extraSourceIds);
    for (const s of extras || []) {
      sourcesById.set(s.id, {
        id: s.id,
        source_name: s.source_name,
        license_flag: s.license_flag || INTERNAL,
        reliability_tier: s.reliability_tier ?? null,
      });
    }
  }

  for (const n of notices || []) {
    const row = out.get(n.company_id);
    if (!row) continue;
    const doc = n.source_document_id ? docsById.get(n.source_document_id) : null;
    const source = doc ? sourcesById.get(doc.source_id) : null;
    if (source && !row.sources.some((s) => s.id === source.id)) {
      row.sources.push(source);
      row.flags.push(source.license_flag);
    }
  }

  for (const f of fields || []) {
    const row = out.get(f.entity_id);
    if (!row) continue;
    if (f.license_flag) row.flags.push(f.license_flag);
    if (f.source_id && sourcesById.has(f.source_id)) {
      const source = sourcesById.get(f.source_id)!;
      if (!row.sources.some((s) => s.id === source.id)) row.sources.push(source);
    }
  }

  for (const row of out.values()) {
    row.flags = [...new Set(row.flags.filter(Boolean))];
    row.shareable = !row.flags.includes(INTERNAL) && !row.sources.some((s) => s.license_flag === INTERNAL);
  }

  return out;
}

export async function provenanceForCompany(db: SupabaseClient, companyId: string) {
  const { data: fields } = await db
    .from('intel_field_values')
    .select('field_name, field_value, confidence_score, license_flag, ingested_at, source_id, source_document_id')
    .eq('entity_table', 'intel_companies')
    .eq('entity_id', companyId)
    .eq('is_current', true)
    .order('ingested_at', { ascending: false })
    .limit(40);

  const sourceIds = [...new Set((fields || []).map((f) => f.source_id).filter(Boolean))] as string[];
  const sourcesById = new Map<string, SourceLicense>();
  if (sourceIds.length) {
    const { data: sources } = await db
      .from('intel_sources')
      .select('id, source_name, license_flag, reliability_tier')
      .in('id', sourceIds);
    for (const s of sources || []) {
      sourcesById.set(s.id, {
        id: s.id,
        source_name: s.source_name,
        license_flag: s.license_flag || INTERNAL,
        reliability_tier: s.reliability_tier ?? null,
      });
    }
  }

  return (fields || []).map((f) => ({
    field_name: f.field_name,
    field_value: f.field_value,
    confidence_score: f.confidence_score,
    license_flag: f.license_flag,
    ingested_at: f.ingested_at,
    source: f.source_id ? sourcesById.get(f.source_id) || null : null,
  }));
}
