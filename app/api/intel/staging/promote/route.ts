import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveIntelUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  const db = makeDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await resolveIntelUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    raw_record_id,
    company_name,
    contact_name,
    phone,
    phone_whatsapp,
    email,
    industry,
    waste_categories,
    city,
    state,
    notes,
    lead_temperature,
  } = body;

  if (!raw_record_id || !company_name) {
    return NextResponse.json({ error: 'raw_record_id and company_name are required' }, { status: 400 });
  }

  const db = makeDb();

  // Verify record exists and is pending
  const { data: record, error: fetchErr } = await db
    .from('intel_raw_records')
    .select('id, review_status, external_record_id')
    .eq('id', raw_record_id)
    .maybeSingle();

  if (fetchErr || !record) {
    return NextResponse.json({ error: 'Staged record not found' }, { status: 404 });
  }
  if (record.review_status === 'approved') {
    return NextResponse.json({ error: 'Already promoted' }, { status: 409 });
  }

  // Check if company already exists by phone or name
  let companyId: string | null = null;

  if (phone) {
    const { data: existing } = await db
      .from('intel_companies')
      .select('id')
      .eq('phone', phone)
      .maybeSingle();
    if (existing?.id) companyId = existing.id;
  }

  if (!companyId) {
    const { data: existing } = await db
      .from('intel_companies')
      .select('id')
      .ilike('canonical_name', company_name.trim())
      .maybeSingle();
    if (existing?.id) companyId = existing.id;
  }

  // Create company if not found
  if (!companyId) {
    const { data: created, error: insertErr } = await db
      .from('intel_companies')
      .insert({
        canonical_name: company_name.trim(),
        state: state || null,
        phone: phone || null,
      })
      .select('id')
      .single();

    if (insertErr || !created) {
      return NextResponse.json({ error: insertErr?.message || 'Failed to create company' }, { status: 500 });
    }
    companyId = created.id;
  }

  // Save extra details to fact sheet
  await db.from('intel_company_fact_sheets').upsert({
    company_id: companyId,
    city: city || null,
    notes: notes || null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'company_id' });

  // Save contact person if we have a name
  if (contact_name && contact_name !== 'Unknown') {
    await db.from('intel_company_associated_people').insert({
      company_id: companyId,
      person_name: contact_name,
      phone: phone || null,
      email: email || null,
      source_type: 'whatsapp_inbound',
      source_vendor: 'forgechat',
      confidence_score: 0.6,
      is_placeholder: false,
      updated_at: new Date().toISOString(),
    });
  }

  // Mark staged record as approved
  await db.from('intel_raw_records').update({
    review_status: 'approved',
    reviewed_by: user.id,
    reviewed_at: new Date().toISOString(),
    promoted_company_id: companyId,
  }).eq('id', raw_record_id);

  return NextResponse.json({ success: true, company_id: companyId });
}
