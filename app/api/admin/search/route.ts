import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { requireAdmin } from '@/lib/api/requireActor';

/**
 * GET /api/admin/search?q=...
 *
 * Backs the admin GlobalSearch palette. Runs the lookups server-side with the
 * service-role key so the `leads` table (and the others) are never queried from
 * the browser anon client — that was the source of the RLS-disabled exposure
 * fixed in migration 153.
 */

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

type SearchItem = {
  id: string;
  type: 'client' | 'lead' | 'recycler' | 'cepc';
  label: string;
  subtitle?: string;
  href: string;
};

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  const deny = requireAdmin(actor);
  if (deny) return deny;

  const q = (new URL(req.url).searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ results: [] });

  const db = makeServiceClient();

  const [clientRes, leadRes, recyclerRes, cepcRes] = await Promise.all([
    (db as any)
      .from('clients')
      .select('id, profile_id, profiles!inner(company_name, full_name)')
      .textSearch('profiles.company_name', q, { type: 'websearch' })
      .limit(5),
    (db as any)
      .from('leads')
      .select('id, company, contact_name')
      .textSearch('company', q, { type: 'websearch' })
      .limit(5),
    (db as any)
      .from('recyclers')
      .select('id, company_name, state')
      .textSearch('company_name', q, { type: 'websearch' })
      .limit(5),
    (db as any)
      .from('cepc_consultants')
      .select('id, full_name, state')
      .textSearch('full_name', q, { type: 'websearch' })
      .limit(5),
  ]);

  const results: SearchItem[] = [
    ...((clientRes.data || []) as any[]).map((row) => ({
      id: `client-${row.id}`,
      type: 'client' as const,
      label: row.profiles?.company_name || row.profiles?.full_name || 'Client',
      subtitle: 'CRM Client',
      href: '/admin/crm/clients',
    })),
    ...((leadRes.data || []) as any[]).map((row) => ({
      id: `lead-${row.id}`,
      type: 'lead' as const,
      label: row.company || row.contact_name || 'Lead',
      subtitle: 'Lead',
      href: `/admin/telecalling/leads/${row.id}`,
    })),
    ...((recyclerRes.data || []) as any[]).map((row) => ({
      id: `recycler-${row.id}`,
      type: 'recycler' as const,
      label: row.company_name || 'Recycler',
      subtitle: row.state || 'Recycler',
      href: `/admin/recyclers/${row.id}`,
    })),
    ...((cepcRes.data || []) as any[]).map((row) => ({
      id: `cepc-${row.id}`,
      type: 'cepc' as const,
      label: row.full_name || 'CEPC Consultant',
      subtitle: row.state || 'CEPC',
      href: `/admin/cepc/${row.id}`,
    })),
  ].slice(0, 15);

  return NextResponse.json({ results });
}
