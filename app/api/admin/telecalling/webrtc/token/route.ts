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

// Returns the logged-in agent's own SIP credentials so the browser softphone
// can register. Deliberately self-only — never accepts an agent_id param —
// so one telecaller can't fetch another's SIP identity from devtools.
export async function GET(_req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { data, error } = await db
    .from('tc_agent_sip_credentials')
    .select('sip_username, sip_password, sip_domain, is_active')
    .eq('agent_id', actor.userId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data || !data.is_active) {
    return NextResponse.json({ configured: false });
  }

  return NextResponse.json({
    configured: true,
    account: {
      username: data.sip_username,
      password: data.sip_password,
      domain: data.sip_domain,
    },
  });
}
