import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function validateAdmin() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const ok = ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
  return ok ? user : null;
}

export async function POST(req: NextRequest) {
  const user = await validateAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      company_name, gstin, country, state, city, address,
      contact_person, email, phone, website,
      waste_categories, capacity_mt_pa,
      cpcb_cert_no, cpcb_cert_expiry, status, onboarding_stage
    } = body;

    if (!company_name?.trim()) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
    }

    const db = adminDb();
    const { data, error } = await (db as any)
      .from('recyclers')
      .insert({
        company_name: String(company_name).trim(),
        gstin: gstin?.trim() || null,
        country: country || 'India',
        state: state?.trim() || null,
        city: city?.trim() || null,
        address: address?.trim() || null,
        contact_person: contact_person?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        website: website?.trim() || null,
        waste_categories: waste_categories || [],
        capacity_mt_pa: Number(capacity_mt_pa || 0),
        cpcb_cert_no: cpcb_cert_no?.trim() || null,
        cpcb_cert_expiry: cpcb_cert_expiry || null,
        status: status || 'Prospect',
        onboarding_stage: onboarding_stage || 'Lead',
        risk_flag: 'None',
        risk_reason: 'No risk signals detected'
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ id: data.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal error' }, { status: 500 });
  }
}
