/**
 * GET /api/admin/intel-companies/search?q=
 * Searches intel_companies by name or GSTIN.
 * Returns up to 10 results for use in the Admin CRM create-client form.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { createClient } from '@supabase/supabase-js';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin role required' }, { status: 403 });

  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  if (q.length < 2) return NextResponse.json({ companies: [] });

  const db = makeServiceClient();

  // Search by canonical_name (ilike) OR exact GSTIN match
  const isGstin = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(q.toUpperCase());

  let data, error;

  if (isGstin) {
    ({ data, error } = await db
      .from('intel_companies')
      .select('id, canonical_name, gstin, pan, state, district, company_type, cin')
      .eq('gstin', q.toUpperCase())
      .limit(5));
  } else {
    ({ data, error } = await db
      .from('intel_companies')
      .select('id, canonical_name, gstin, pan, state, district, company_type, cin')
      .ilike('canonical_name', `%${q}%`)
      .limit(10));
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ companies: data ?? [] });
}
