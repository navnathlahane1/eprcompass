import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { submitTranscriptionJob } from '@/lib/telecalling/callTranscription';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  // Verify webhook secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get('secret');
  if (!secret || secret !== process.env.EXOTEL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: Record<string, any>;
  try {
    // Exotel sends form-encoded data
    const text = await req.text();
    body = Object.fromEntries(new URLSearchParams(text));
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const callSid = body.CallSid as string;
  if (!callSid) return NextResponse.json({ error: 'CallSid missing' }, { status: 400 });

  const db = makeServiceClient();

  const updates: Record<string, any> = {};

  const statusMap: Record<string, string> = {
    'completed': 'Completed',
    'busy': 'Busy',
    'no-answer': 'No Answer',
    'failed': 'Failed',
    'canceled': 'Cancelled',
    'in-progress': 'In Progress',
  };
  const exotelStatus = String(body.Status || body.CallStatus || '').toLowerCase();
  if (exotelStatus) updates.status = statusMap[exotelStatus] || 'Unknown';

  if (body.RecordingUrl) updates.recording_url = body.RecordingUrl;
  if (body.Duration) updates.duration_seconds = parseInt(body.Duration) || 0;
  if (body.StartTime) updates.started_at = new Date(body.StartTime).toISOString();
  if (body.EndTime) updates.ended_at = new Date(body.EndTime).toISOString();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ received: true });
  }

  const { data: updatedCall, error } = await db
    .from('tc_calls')
    .update(updates)
    .eq('exotel_call_sid', callSid)
    .select('id, recording_url, status')
    .maybeSingle();
  if (error) {
    console.error('[exotel-webhook] update error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Kick off transcription once the recording is available and the call is done.
  if (updatedCall?.recording_url && updatedCall.status === 'Completed') {
    submitTranscriptionJob(updatedCall.id, updatedCall.recording_url).catch(() => {});
  }

  return NextResponse.json({ received: true });
}
