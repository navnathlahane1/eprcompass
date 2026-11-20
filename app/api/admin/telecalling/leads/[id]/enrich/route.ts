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

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: leadId } = await params;
  const db = makeServiceClient();

  // Verify lead exists
  const { data: lead } = await db.from('leads').select('id, tc_enrichment_status').eq('id', leadId).maybeSingle();
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

  // Upsert into enrichment queue
  const { error } = await db.from('tc_enrichment_queue').upsert({
    lead_id: leadId,
    status: 'pending',
    priority: 7,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'lead_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead enrichment status
  await db.from('leads').update({ tc_enrichment_status: 'queued' }).eq('id', leadId);

  return NextResponse.json({ queued: true, lead_id: leadId });
}
