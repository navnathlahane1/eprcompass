/**
 * POST /api/admin/telecalling/calls/[id]/transcribe — manually (re)trigger
 * transcription for a call, e.g. if the automatic Exotel-triggered run failed.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { submitTranscriptionJob } from '@/lib/telecalling/callTranscription';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = makeServiceClient();
  const { data: call } = await db.from('tc_calls').select('id, recording_url').eq('id', id).maybeSingle();

  if (!call?.recording_url) return NextResponse.json({ error: 'No recording available for this call' }, { status: 400 });
  if (!process.env.ASSEMBLYAI_API_KEY) {
    return NextResponse.json({ error: 'Transcription is not configured yet (missing ASSEMBLYAI_API_KEY)' }, { status: 400 });
  }

  await db.from('tc_calls').update({ transcript_status: 'PENDING' }).eq('id', id);
  await submitTranscriptionJob(call.id, call.recording_url);

  return NextResponse.json({ ok: true });
}
