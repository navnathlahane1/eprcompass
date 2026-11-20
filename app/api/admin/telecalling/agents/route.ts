import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { requireRole } from '@/lib/api/requireActor';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
  );
}

/**
 * GET /api/admin/telecalling/agents
 *
 * Returns all telecaller / sales-executive profiles joined with their
 * most recent call activity in the last 4 hours.
 *
 * Response shape:
 * {
 *   agents: Array<{
 *     id: string;
 *     full_name: string | null;
 *     email: string | null;
 *     role: string;
 *     // most recent call (null when idle all day)
 *     last_call_at: string | null;
 *     last_disposition: string | null;
 *     last_campaign_name: string | null;
 *     calls_today: number;
 *     connected_today: number;
 *   }>
 * }
 */
export async function GET() {
  const actor = await resolveActor();
  const deny = requireRole(actor, 'sales-executive', 'telecaller');
  if (deny) return deny;

  const db = makeServiceClient();

  // ── 1. All telecaller/sales-executive profiles ──────────────────────────
  const { data: profiles, error: profErr } = await db
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['telecaller', 'sales-executive', 'manager', 'admin'])
    .order('full_name', { ascending: true });

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });

  const agentIds = (profiles || []).map((p) => p.id as string);
  if (agentIds.length === 0) return NextResponse.json({ agents: [] });

  // ── 2. Today's call activity for those agents ───────────────────────────
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: calls } = await db
    .from('tc_calls')
    .select('agent_id, disposition, created_at, campaign_id')
    .in('agent_id', agentIds)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })
    .limit(2000);

  // ── 3. Campaign names for display ──────────────────────────────────────
  const campaignIds = [...new Set((calls || []).map((c) => c.campaign_id).filter(Boolean))] as string[];
  let campaignNames: Record<string, string> = {};
  if (campaignIds.length > 0) {
    const { data: camps } = await db
      .from('tc_campaigns')
      .select('id, name')
      .in('id', campaignIds);
    for (const c of camps || []) {
      campaignNames[c.id as string] = c.name as string;
    }
  }

  // ── 4. Aggregate per agent ──────────────────────────────────────────────
  const CONNECTED = new Set(['Connected', 'Answered', 'Callback', 'Interested', 'Converted']);

  const agentStats: Record<string, {
    calls_today: number;
    connected_today: number;
    last_call_at: string | null;
    last_disposition: string | null;
    last_campaign_name: string | null;
  }> = {};

  for (const call of calls || []) {
    const aid = call.agent_id as string;
    if (!agentStats[aid]) {
      agentStats[aid] = {
        calls_today: 0,
        connected_today: 0,
        last_call_at: null,
        last_disposition: null,
        last_campaign_name: null,
      };
    }
    agentStats[aid].calls_today++;
    if (CONNECTED.has(call.disposition || '')) agentStats[aid].connected_today++;
    // first row per agent (ordered DESC) is the latest
    if (!agentStats[aid].last_call_at) {
      agentStats[aid].last_call_at = call.created_at as string;
      agentStats[aid].last_disposition = call.disposition as string | null;
      agentStats[aid].last_campaign_name = call.campaign_id
        ? (campaignNames[call.campaign_id as string] ?? null)
        : null;
    }
  }

  // ── 5. Build response ───────────────────────────────────────────────────
  // Also pull emails from auth.users via admin API
  const { data: authData } = await db.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = {};
  for (const u of authData?.users || []) {
    emailMap[u.id] = u.email ?? '';
  }

  const agents = (profiles || []).map((p) => ({
    id: p.id,
    full_name: p.full_name ?? null,
    email: emailMap[p.id as string] ?? null,
    role: p.role,
    ...(agentStats[p.id as string] ?? {
      calls_today: 0,
      connected_today: 0,
      last_call_at: null,
      last_disposition: null,
      last_campaign_name: null,
    }),
  }));

  return NextResponse.json({ agents });
}
