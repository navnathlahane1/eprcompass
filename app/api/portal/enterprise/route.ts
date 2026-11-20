import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function GET(req: NextRequest) {
  try {
    const db: SupabaseClient = await createServerComponentClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const workspace = req.nextUrl.searchParams.get('workspace');
    const workspaces = await db.rpc('list_my_workspace_accounts');
    if (workspaces.error) throw workspaces.error;
    const allowed = workspaces.data.filter((w: { entity_type: string }) => w.entity_type === 'client');
    const selected = workspace ?? allowed[0]?.id;
    if (selected && !allowed.some((w: { id: string }) => w.id === selected)) return NextResponse.json({ error: 'Workspace access required' }, { status: 403 });
    const entities = selected ? await db.from('enterprise_entities').select('*').eq('workspace_id', selected).order('created_at') : { data: [], error: null };
    if (entities.error) throw entities.error;
    const ids = entities.data.map(e => e.id);
    const products = ids.length ? await db.from('enterprise_products').select('*').in('entity_id', ids).order('created_at', { ascending: false }).limit(200) : { data: [], error: null };
    const submissions = ids.length ? await db.from('enterprise_submissions').select('*').in('entity_id', ids).order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
    const access = ids.length ? await db.from('enterprise_entity_access').select('*').in('entity_id', ids) : { data: [], error: null };
    const audit = ids.length ? await db.from('enterprise_audit_events').select('*').in('entity_id', ids).order('created_at', { ascending: false }).limit(100) : { data: [], error: null };
    const team = selected ? await db.rpc('enterprise_team', { p_workspace: selected }) : { data: [], error: null };
    if (products.error || submissions.error || access.error || audit.error || team.error) throw new Error('Enterprise data unavailable');
    return NextResponse.json({ workspaces: allowed, selected, userId: user.id, entities: entities.data, products: products.data, submissions: submissions.data, access: access.data, audit: audit.data, team: team.data }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Enterprise workspace is unavailable. Check configuration and migrations.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  try {
    const db: SupabaseClient = await createServerComponentClient();
    const { data: { user } } = await db.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    const body = await req.json().catch(() => null);
    if (!body || !['create_entity','grant_access','revoke_access','create_product','create_submission','submit','approve','reject'].includes(body.action)
      || !body.data || typeof body.data !== 'object' || Array.isArray(body.data) || JSON.stringify(body.data).length>16000) {
      return NextResponse.json({ error: 'Invalid enterprise request' }, { status: 400 });
    }
    const { data, error } = await db.rpc('enterprise_command', { p_action: body.action, p_data: body.data });
    if (error) {
      const message = error.code === '42501' ? 'You do not have permission for this action. Reviews require a different user from the preparer.'
        : error.message?.includes('Entitlement') || error.message?.includes('Subscription') || error.message?.includes('limit')
          ? 'The subscription or capacity does not permit this action. Check Workspace Settings.'
          : 'The action could not be completed. Check required fields and refresh the record before retrying.';
      return NextResponse.json({ error: message }, { status: error.code === '42501' ? 403 : 409 });
    }
    return NextResponse.json({ id: data });
  } catch {
    return NextResponse.json({ error: 'Enterprise service is temporarily unavailable' }, { status: 503 });
  }
}
