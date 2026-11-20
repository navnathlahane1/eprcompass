/**
 * GET /api/admin/portal-users/search?q=
 * Searches profiles with role='client' by name, company, or email.
 * Returns linked_client_id + linked_company_name so the UI can show a
 * "Move here" warning instead of blocking already-linked users.
 *
 * NOTE: The `profiles` table has NO email column — email lives in auth.users.
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
  if (q.length < 2) return NextResponse.json({ users: [] });

  const db = makeServiceClient();
  const qLower = q.toLowerCase();

  // ── 1. Fetch all auth users to build email map + find email matches ────
  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const allAuthUsers = authData?.users ?? [];

  const emailMap: Record<string, string> = {};
  const emailMatchIds: string[] = [];
  for (const u of allAuthUsers) {
    if (u.email) {
      emailMap[u.id] = u.email;
      if (u.email.toLowerCase().includes(qLower)) {
        emailMatchIds.push(u.id);
      }
    }
  }

  // ── 2. Search profiles by name / company ──────────────────────────────
  const { data: nameProfiles, error: nameErr } = await db
    .from('profiles')
    .select('id, full_name, company_name, phone')
    .eq('role', 'client')
    .or(`full_name.ilike.%${q}%,company_name.ilike.%${q}%`)
    .limit(10);

  if (nameErr) return NextResponse.json({ error: nameErr.message }, { status: 500 });

  // ── 3. Fetch profiles for auth-email matches ───────────────────────────
  let emailProfiles: any[] = [];
  if (emailMatchIds.length > 0) {
    const { data } = await db
      .from('profiles')
      .select('id, full_name, company_name, phone')
      .eq('role', 'client')
      .in('id', emailMatchIds)
      .limit(10);
    emailProfiles = data ?? [];
  }

  // ── 4. Merge and deduplicate ───────────────────────────────────────────
  const seen = new Set<string>();
  const profiles: any[] = [];
  for (const p of [...(nameProfiles ?? []), ...emailProfiles]) {
    if (!seen.has(p.id)) {
      seen.add(p.id);
      profiles.push(p);
    }
  }

  if (profiles.length === 0) return NextResponse.json({ users: [] });

  // ── 5. Find which profiles are linked to a clients row ─────────────────
  const profileIds = profiles.map((p) => p.id);
  const { data: linkedClients } = await db
    .from('clients')
    .select('id, profile_id')
    .in('profile_id', profileIds);

  // Map: profile_id → client_id
  const linkedClientMap: Record<string, string> = {};
  for (const lc of linkedClients ?? []) {
    if (lc.profile_id) linkedClientMap[lc.profile_id] = lc.id;
  }

  // ── 6. Build response ──────────────────────────────────────────────────
  const users = profiles.slice(0, 10).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    company_name: p.company_name,
    email: emailMap[p.id] || null,
    phone: p.phone,
    already_linked: !!linkedClientMap[p.id],
    linked_client_id: linkedClientMap[p.id] ?? null,
    // Company name is on their own profile
    linked_company_name: linkedClientMap[p.id] ? (p.company_name ?? 'another company') : null,
  }));

  return NextResponse.json({ users });
}
