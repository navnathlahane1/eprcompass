/**
 * GET /api/admin/clients/list
 * Returns a lightweight list of clients for admin tools (AI recommender, etc.)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const runtime = 'nodejs';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET() {
  const actor = await resolveActor();
  if (!actor || !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = makeServiceClient();

  const { data, error } = await db
    .from('clients')
    .select('id, company_name, waste_categories, industry, state, status')
    .eq('status', 'active')
    .order('company_name', { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }

  return NextResponse.json({
    clients: (data ?? []).map(c => ({
      id: c.id,
      company_name: c.company_name ?? '—',
      waste_categories: Array.isArray(c.waste_categories) ? c.waste_categories : [],
      industry: c.industry ?? null,
      state: c.state ?? null,
    })),
  });
}
