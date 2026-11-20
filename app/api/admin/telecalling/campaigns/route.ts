import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

const TELECALLING_ROLES = ['admin', 'manager', 'sales-executive'];

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // isAdmin covers DB roles 'admin'/'manager' + super-admin email bypass;
  // TELECALLING_ROLES also allows 'sales-executive' without full admin rights.
  if (!actor.isAdmin && !TELECALLING_ROLES.includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  let query = db.from('tc_campaigns')
    .select(`*, created_by_profile:profiles!tc_campaigns_created_by_fkey(full_name)`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // ── Enrich with per-campaign call stats ────────────────────────────────
  // Single batch fetch is far cheaper than N+1 queries per campaign.
  const campaigns = data || [];
  const campaignIds = campaigns.map((c) => c.id as string);

  let statsMap: Record<string, { total: number; connected: number; last_call_at: string | null }> = {};
  if (campaignIds.length > 0) {
    const { data: callRows } = await db
      .from('tc_calls')
      .select('campaign_id, disposition, created_at')
      .in('campaign_id', campaignIds)
      .order('created_at', { ascending: false })
      .limit(5000); // generous but bounded

    const CONNECTED_DISPOSITIONS = new Set([
      'Connected', 'Answered', 'Callback', 'Interested', 'Converted',
    ]);

    for (const call of callRows || []) {
      const cid = call.campaign_id as string;
      if (!statsMap[cid]) statsMap[cid] = { total: 0, connected: 0, last_call_at: null };
      statsMap[cid].total++;
      if (CONNECTED_DISPOSITIONS.has(call.disposition || '')) statsMap[cid].connected++;
      if (!statsMap[cid].last_call_at) statsMap[cid].last_call_at = call.created_at as string;
    }
  }

  const enriched = campaigns.map((c) => ({
    ...c,
    _stats: statsMap[c.id as string] ?? { total: 0, connected: 0, last_call_at: null },
  }));

  return NextResponse.json({ campaigns: enriched });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, description, type, start_date, end_date, daily_call_limit, target_filter } = body;
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_campaigns').insert({
    name: String(name).trim(),
    description: description || null,
    type: type || 'Outbound',
    status: 'Draft',
    start_date: start_date || null,
    end_date: end_date || null,
    daily_call_limit: daily_call_limit || 100,
    target_filter: target_filter || {},
    created_by: actor.userId,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
