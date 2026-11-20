import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';

const TABLES = {
  obligations: 'intel_epr_obligations',
  authorizations: 'intel_recycler_authorizations',
  stream_profiles: 'intel_recycler_stream_profiles',
  pro_agreements: 'intel_pro_agreements',
  credit_purchases: 'intel_credit_purchases',
  documents: 'intel_company_documents',
} as const;

export async function GET(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const companyId = req.nextUrl.searchParams.get('company_id') || '';
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const { db } = auth;
  const [
    company,
    obligations,
    authorizations,
    stream_profiles,
    pro_agreements,
    credit_purchases,
    documents,
  ] = await Promise.all([
    db
      .from('intel_companies')
      .select('id, entity_roles, iec, udyam, whatsapp, phone, email, cpcb_portal_id, job_worker_liable, marketplace_seller_ids, parent_company_id')
      .eq('id', companyId)
      .maybeSingle(),
    db.from('intel_epr_obligations').select('*').eq('company_id', companyId).order('fy', { ascending: false }),
    db.from('intel_recycler_authorizations').select('*').eq('company_id', companyId).order('valid_upto', { ascending: false }),
    db.from('intel_recycler_stream_profiles').select('*').eq('company_id', companyId),
    db.from('intel_pro_agreements').select('*').eq('company_id', companyId),
    db.from('intel_credit_purchases').select('*').eq('company_id', companyId).order('fy', { ascending: false }),
    db.from('intel_company_documents').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
  ]);

  const firstError = [
    company.error,
    obligations.error,
    authorizations.error,
    stream_profiles.error,
    pro_agreements.error,
    credit_purchases.error,
    documents.error,
  ].find(Boolean);
  if (firstError) {
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    company: company.data,
    obligations: obligations.data || [],
    authorizations: authorizations.data || [],
    stream_profiles: stream_profiles.data || [],
    pro_agreements: pro_agreements.data || [],
    credit_purchases: credit_purchases.data || [],
    documents: documents.data || [],
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const companyId = String(body.company_id || '');
  const action = String(body.action || 'upsert');
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const { db } = auth;

  if (action === 'patch_company') {
    const patch = body.patch || {};
    const allowed: Record<string, unknown> = {};
    for (const key of [
      'entity_roles',
      'iec',
      'udyam',
      'whatsapp',
      'phone',
      'email',
      'cpcb_portal_id',
      'job_worker_liable',
      'marketplace_seller_ids',
      'parent_company_id',
    ]) {
      if (patch[key] !== undefined) allowed[key] = patch[key];
    }
    const { data, error } = await db.from('intel_companies').update(allowed).eq('id', companyId).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }

  const kind = String(body.kind || '') as keyof typeof TABLES;
  const table = TABLES[kind];
  if (!table) return NextResponse.json({ error: 'unknown kind' }, { status: 400 });

  if (action === 'delete') {
    const id = String(body.id || '');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const { error } = await db.from(table).delete().eq('id', id).eq('company_id', companyId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const row = { ...(body.row || {}), company_id: companyId };
  delete row.created_at;
  delete row.updated_at;
  if (row.id) {
    const id = row.id;
    delete row.id;
    const { data, error } = await db.from(table).update(row).eq('id', id).eq('company_id', companyId).select('id').maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data?.id });
  }
  const { data, error } = await db.from(table).insert(row).select('id').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data?.id });
}
