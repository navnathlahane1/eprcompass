/**
 * GET /api/epr/activity-log
 * Admin: full log (filterable). Client: own entries only.
 * Supports: ?entity_type=&entity_id=&actor_id=&client_id=&limit=&offset=
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdminUser = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, isAdmin: isAdminUser };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const limit = Math.min(parseInt(sp.get('limit') ?? '50', 10), 200);
    const offset = Math.max(parseInt(sp.get('offset') ?? '0', 10), 0);

    const db = adminClient();
    let query = (db as any)
      .from('epr_activity_log')
      .select(`
        id, action, entity_type, entity_id, old_values, new_values, created_at,
        actor:profiles!actor_id ( full_name, email ),
        client:profiles!client_id ( full_name, company_name )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (!actor.isAdmin) {
      query = query.eq('client_id', actor.userId);
    } else {
      if (sp.get('entity_type')) query = query.eq('entity_type', sp.get('entity_type'));
      if (sp.get('entity_id'))   query = query.eq('entity_id', sp.get('entity_id'));
      if (sp.get('actor_id'))    query = query.eq('actor_id', sp.get('actor_id'));
      if (sp.get('client_id'))   query = query.eq('client_id', sp.get('client_id'));
      if (sp.get('action'))      query = query.eq('action', sp.get('action'));
    }

    const { data, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ log: data ?? [], total: count ?? 0 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
