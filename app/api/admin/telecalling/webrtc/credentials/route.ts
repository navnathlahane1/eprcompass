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

function maskUsername(value: string): string {
  if (value.length <= 4) return '****';
  return value.slice(0, 2) + '****' + value.slice(-2);
}

// Admin-only: list which agents have SIP credentials provisioned (masked).
export async function GET(_req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = makeServiceClient();
  const { data, error } = await db
    .from('tc_agent_sip_credentials')
    .select('agent_id, sip_username, sip_domain, is_active, updated_at, agent:profiles!tc_agent_sip_credentials_agent_id_fkey(full_name, email)')
    .order('updated_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const credentials = (data || []).map((row: any) => ({
    ...row,
    sip_username: maskUsername(row.sip_username || ''),
  }));

  return NextResponse.json({ credentials });
}

// Admin-only: provision/update a single agent's SIP identity, issued by Exotel.
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { agent_id, sip_username, sip_password, sip_domain, is_active } = body;
  if (!agent_id || !sip_username || !sip_password) {
    return NextResponse.json({ error: 'agent_id, sip_username and sip_password are required' }, { status: 400 });
  }

  const db = makeServiceClient();
  const { error } = await db.from('tc_agent_sip_credentials').upsert(
    {
      agent_id,
      sip_username,
      sip_password,
      sip_domain: sip_domain || 'sip.exotel.com',
      is_active: is_active ?? true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'agent_id' }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
