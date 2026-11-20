import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { licenseForCompanies } from '@/lib/intel/license';

function toCsv(rows: Record<string, unknown>[]) {
  const headers = Object.keys(rows[0] || {});
  const lines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '').replace(/"/g, '""');
          return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
        })
        .join(','),
    ),
  ];
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const { db, user } = auth;

  const body = await req.json().catch(() => ({}));
  const format = String(body?.format || 'csv').toLowerCase();
  const filters = body?.filters || {};
  const includeInternal = Boolean(body?.include_internal);

  if (!['csv', 'xlsx'].includes(format)) {
    return NextResponse.json({ error: 'format must be csv or xlsx' }, { status: 400 });
  }

  let companyQuery = db
    .from('intel_companies')
    .select('id, canonical_name, cin, gstin, pan, state, district, website, company_type, sector, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5000);
  if (filters.state) companyQuery = companyQuery.eq('state', filters.state);

  const { data: companies, error: companiesError } = await companyQuery;
  if (companiesError) return NextResponse.json({ error: companiesError.message }, { status: 500 });
  const companyRows = companies || [];
  const companyIds = companyRows.map((c) => c.id);

  if (!companyIds.length) {
    await db.from('intel_exports_log').insert({
      requested_by: user.id,
      export_type: format,
      filters,
      blocked_by_license_count: 0,
      exported_row_count: 0,
    });
    return NextResponse.json({ ok: true, format, rows: [], csv: '', blocked_by_license_count: 0 });
  }

  let noticeQuery = db
    .from('intel_notices')
    .select('company_id, notice_type, waste_category, penalty_inr, notice_date, confidence_score')
    .in('company_id', companyIds);
  if (filters.category) noticeQuery = noticeQuery.eq('waste_category', filters.category);

  const [noticesResult, pipelinesResult, licenses] = await Promise.all([
    noticeQuery,
    db.from('intel_pipeline_records').select('company_id, urgency_tier, estimated_deal_size_inr, warmness_stage, updated_at').in('company_id', companyIds),
    licenseForCompanies(db, companyIds),
  ]);
  if (noticesResult.error) return NextResponse.json({ error: noticesResult.error.message }, { status: 500 });
  if (pipelinesResult.error) return NextResponse.json({ error: pipelinesResult.error.message }, { status: 500 });

  const noticesByCompany = new Map<string, typeof noticesResult.data>();
  for (const n of noticesResult.data || []) {
    const list = noticesByCompany.get(n.company_id) || [];
    list.push(n);
    noticesByCompany.set(n.company_id, list);
  }
  const pipelineByCompany = new Map<string, (typeof pipelinesResult.data)[number]>();
  for (const p of pipelinesResult.data || []) {
    const existing = pipelineByCompany.get(p.company_id);
    if (!existing || new Date(p.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
      pipelineByCompany.set(p.company_id, p);
    }
  }

  const rows: Record<string, unknown>[] = [];
  let blockedByLicenseCount = 0;

  for (const c of companyRows) {
    const lic = licenses.get(c.id);
    if (!includeInternal && lic && !lic.shareable) {
      blockedByLicenseCount += 1;
      continue;
    }
    const companyNotices = noticesByCompany.get(c.id) || [];
    const topNotice = [...companyNotices].sort(
      (a, b) => new Date(b.notice_date || 0).getTime() - new Date(a.notice_date || 0).getTime(),
    )[0];
    const pipeline = pipelineByCompany.get(c.id);
    rows.push({
      company_id: c.id,
      company_name: c.canonical_name,
      cin: c.cin,
      gstin: c.gstin,
      pan: c.pan,
      state: c.state,
      district: c.district,
      website: c.website,
      sector: c.sector,
      notice_type: topNotice?.notice_type || '',
      waste_category: topNotice?.waste_category || '',
      penalty_inr: topNotice?.penalty_inr || '',
      confidence_score: topNotice?.confidence_score ?? '',
      urgency_tier: pipeline?.urgency_tier || '',
      estimated_deal_size_inr: pipeline?.estimated_deal_size_inr || '',
      source_names: (lic?.sources || []).map((s) => s.source_name).join(' | '),
      source_license_flags: (lic?.flags || []).join(' | '),
      source_reliability: (lic?.sources || []).map((s) => s.reliability_tier ?? '').join(' | '),
      shareable: lic?.shareable ? 'yes' : 'no',
    });
  }

  await db.from('intel_exports_log').insert({
    requested_by: user.id,
    export_type: format,
    filters,
    blocked_by_license_count: blockedByLicenseCount,
    exported_row_count: rows.length,
  });

  return NextResponse.json({
    ok: true,
    format,
    rows,
    csv: format === 'csv' ? toCsv(rows) : undefined,
    blocked_by_license_count: blockedByLicenseCount,
  });
}
