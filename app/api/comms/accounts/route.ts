import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

const DEFAULT_CHECKLIST = [
  'Confirm account credentials are up to date',
  'Verify 2FA is enabled and backup codes are stored',
  'Review pending scheduled posts',
  'Check follower/engagement stats for baseline',
  'Update team on account SOP and posting guidelines',
  'Confirm ad accounts and billing details',
  'Transfer page admin access if applicable',
];

export async function GET(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const platform    = searchParams.get('platform') || '';
  const status      = searchParams.get('status') || '';
  const brand_entity = searchParams.get('brand_entity') || '';
  const region      = searchParams.get('region') || '';
  const search      = searchParams.get('search') || '';
  const page        = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit       = 50;
  const offset      = (page - 1) * limit;

  const client = getCommsAdminClient();
  let query = client
    .from('comms_accounts')
    .select(`
      id, platform, display_name, handle, profile_url, account_type, brand_entity,
      region, status, tags, created_at,
      comms_account_owners!inner(owner_role, profiles:user_id(id, full_name))
    `, { count: 'exact' })
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (platform)     query = query.eq('platform', platform);
  if (status)       query = query.eq('status', status);
  if (brand_entity) query = query.eq('brand_entity', brand_entity);
  if (region)       query = query.eq('region', region);
  if (search)       query = query.ilike('display_name', `%${search}%`);

  // Regional scoping for comms_regional_manager
  if (actor.role === 'comms_regional_manager' && actor.commsRegion) {
    query = query.or(`region.eq.${actor.commsRegion},region.eq.Global`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ accounts: data ?? [], total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const canCreate = await checkCommsPermission(actor.role, 'create');
  if (!canCreate) return NextResponse.json({ error: 'Forbidden: create permission required' }, { status: 403 });

  const body = await req.json();
  const {
    platform, display_name, handle, profile_url, login_url,
    account_type, brand_entity, region, status, tags, notes,
  } = body;

  if (!platform || !display_name) {
    return NextResponse.json({ error: 'platform and display_name are required' }, { status: 400 });
  }

  const client = getCommsAdminClient();

  const { data: account, error } = await client
    .from('comms_accounts')
    .insert({
      platform, display_name,
      handle:       handle || null,
      profile_url:  profile_url || null,
      login_url:    login_url || null,
      account_type: account_type || 'brand',
      brand_entity: brand_entity || 'ecovijay_growth',
      region:       region || null,
      status:       status || 'active',
      tags:         tags || [],
      notes:        notes || null,
      created_by:   actor.id,
    })
    .select('id')
    .single();

  if (error || !account) return NextResponse.json({ error: error?.message || 'Insert failed' }, { status: 500 });

  // Seed default handover checklist
  await client.from('comms_handover_checklist').insert(
    DEFAULT_CHECKLIST.map((item, i) => ({
      account_id: account.id,
      item,
      sort_order: i,
    }))
  );

  // Assign creator as primary owner
  await client.from('comms_account_owners').insert({
    account_id:  account.id,
    user_id:     actor.id,
    owner_role:  'primary',
    assigned_by: actor.id,
  });

  // Audit
  await client.from('comms_credential_audit').insert({
    account_id:  account.id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action:      'create',
    metadata:    { platform, display_name },
  });

  return NextResponse.json({ success: true, accountId: account.id }, { status: 201 });
}
