import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { licenseForCompanies } from '@/lib/intel/license';

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const { db, user } = auth;

  const body = await req.json().catch(() => ({}));
  const target = String(body.target || '');
  const companyId = body.company_id ? String(body.company_id) : '';
  const title = String(body.title || '').trim();

  if (!['telecalling', 'crm', 'play'].includes(target)) {
    return NextResponse.json({ error: 'target must be telecalling, crm, or play' }, { status: 400 });
  }

  if (companyId && (target === 'telecalling' || target === 'crm')) {
    const licenses = await licenseForCompanies(db, [companyId]);
    const lic = licenses.get(companyId);
    if (lic && !lic.shareable) {
      await db.from('intel_exports_log').insert({
        requested_by: user.id,
        export_type: `${target}_handoff`,
        filters: { company_id: companyId },
        blocked_by_license_count: 1,
        exported_row_count: 0,
      });
      return NextResponse.json(
        {
          ok: false,
          error: 'License policy blocks external handoff for this company',
          blocked_by_license_count: 1,
          sources: lic.sources,
        },
        { status: 403 },
      );
    }
  }

  let company: Record<string, unknown> | null = null;
  if (companyId) {
    const { data } = await db.from('intel_companies').select('*').eq('id', companyId).maybeSingle();
    company = data;
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });
  }

  if (target === 'play') {
    const { data, error } = await db
      .from('intel_cockpit_tasks')
      .insert({
        title: title || `Follow up: ${String(company?.canonical_name || 'segment')}`,
        detail: body.detail || body.play_hint || null,
        play_kind: body.play_kind || 'intel_handoff',
        play_payload: body.play || {},
        state: body.state || company?.state || null,
        waste_category: body.waste_category || null,
        company_id: companyId || null,
        projected_inr: body.projected_inr ?? null,
        confidence: body.confidence ?? null,
        priority: body.priority || 'p2',
        status: 'open',
        assignee_user_id: user.id,
      })
      .select('id')
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, target, id: data?.id, href: '/intel/cockpit/tasks' });
  }

  if (target === 'telecalling') {
    const name = String(company?.canonical_name || title || 'Intel company');
    const common = {
      phone: (company?.phone as string) || null,
      email: (company?.email as string) || null,
      city: (company?.district as string) || null,
      industry: (company?.sector as string) || null,
      website: (company?.website as string) || null,
      referral_source_detail: 'intel_handoff',
      stage: 'New',
      tc_status: 'New',
    };
    let inserted: { id?: string } | null = null;
    const live = await db.from('leads').insert({
      ...common,
      company_name: name,
      name,
      description: `Intel company ${companyId}`,
      source: 'intel',
    }).select('id').maybeSingle();
    if (live.error) {
      const crm = await db.from('leads').insert({
        ...common,
        company: name,
        contact_name: name,
        source: 'website',
      }).select('id').maybeSingle();
      if (crm.error) return NextResponse.json({ error: crm.error.message }, { status: 500 });
      inserted = crm.data;
    } else {
      inserted = live.data;
    }
    return NextResponse.json({ ok: true, target, id: inserted?.id, href: '/telecalling/dashboard' });
  }

  const legalName = String(company?.canonical_name || title);
  const { data: existing } = await db
    .from('clients')
    .select('id')
    .eq('intel_company_id', companyId)
    .maybeSingle();
  if (existing?.id) {
    return NextResponse.json({ ok: true, target, id: existing.id, href: '/admin/crm/clients' });
  }

  const { data: task } = await db
    .from('intel_cockpit_tasks')
    .insert({
      title: `CRM onboard: ${legalName}`,
      detail: 'Intel handoff — create/link a CRM client from this intel company (license already cleared).',
      play_kind: 'crm_handoff',
      play_payload: { company_id: companyId, gstin: company?.gstin || null },
      company_id: companyId || null,
      state: company?.state || null,
      status: 'open',
      priority: 'p1',
      assignee_user_id: user.id,
    })
    .select('id')
    .maybeSingle();

  const leadName = legalName;
  const live = await db.from('leads').insert({
    company_name: leadName,
    name: leadName,
    description: `Intel CRM handoff ${companyId}`,
    source: 'intel',
    referral_source_detail: 'intel_crm_handoff',
    stage: 'New',
    tc_status: 'New',
    website: (company?.website as string) || null,
  }).select('id').maybeSingle();

  return NextResponse.json({
    ok: true,
    target,
    id: existing?.id || live.data?.id || task?.id,
    href: '/intel/cockpit/tasks',
    lead_id: live.data?.id || live.error?.message || null,
    task_id: task?.id || null,
  });
}
