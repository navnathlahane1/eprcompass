/**
 * POST /api/admin/telecalling/assemblyai-webhook?call_id=... — AssemblyAI calls
 * this back when a transcription job finishes. We then fetch the full
 * transcript, extract action items via Claude, and save them as
 * tc_followups (source = 'CALL_TRANSCRIPT').
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { extractActionItems, saveActionItemsAsFollowups } from '@/lib/telecalling/callTranscription';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const callId = req.nextUrl.searchParams.get('call_id');
  if (!callId) return NextResponse.json({ error: 'call_id missing' }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const transcriptId = body.transcript_id as string | undefined;
  const status = body.status as string | undefined;

  const db = serviceClient();

  if (!transcriptId || status !== 'completed') {
    await db.from('tc_calls').update({ transcript_status: 'FAILED' }).eq('id', callId);
    return NextResponse.json({ received: true });
  }

  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  if (!apiKey) return NextResponse.json({ received: true });

  const res = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
    headers: { Authorization: apiKey },
  });
  const data = await res.json();
  const transcriptText = String(data.text || '').trim();

  await db.from('tc_calls').update({
    transcript: transcriptText,
    transcript_status: transcriptText ? 'DONE' : 'FAILED',
  }).eq('id', callId);

  if (transcriptText) {
    const { data: call } = await db.from('tc_calls').select('lead_id').eq('id', callId).maybeSingle();
    const items = await extractActionItems(transcriptText);
    await saveActionItemsAsFollowups(callId, call?.lead_id ?? null, items);
    await db.from('tc_calls').update({ action_items_extracted: true }).eq('id', callId);
  }

  return NextResponse.json({ received: true });
}
