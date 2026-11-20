/**
 * Call transcription + auto action-item extraction (CRM Phase 5).
 *
 * Pipeline: Exotel webhook sets tc_calls.recording_url on call completion
 * -> submitTranscriptionJob() sends the recording URL to AssemblyAI with a
 * webhook callback -> assemblyai-webhook route receives the finished
 * transcript -> extractActionItems() asks Claude to pull out follow-ups
 * -> those get inserted into tc_followups (source = 'CALL_TRANSCRIPT').
 */
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

/** Kick off transcription for a completed call recording. Fire-and-forget from the caller. */
export async function submitTranscriptionJob(callId: string, recordingUrl: string): Promise<void> {
  const apiKey = process.env.ASSEMBLYAI_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!apiKey || !appUrl) return; // Not configured yet — silently skip until credentials are added.

  const db = serviceClient();

  try {
    const res = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_url: recordingUrl,
        webhook_url: `${appUrl}/api/admin/telecalling/assemblyai-webhook?call_id=${callId}`,
        language_code: 'en',
      }),
    });
    const data = await res.json();

    if (!res.ok || !data.id) {
      await db.from('tc_calls').update({ transcript_status: 'FAILED' }).eq('id', callId);
      return;
    }

    await db.from('tc_calls').update({
      transcript_status: 'PROCESSING',
      transcript_job_id: data.id,
    }).eq('id', callId);
  } catch {
    await db.from('tc_calls').update({ transcript_status: 'FAILED' }).eq('id', callId);
  }
}

interface ActionItem {
  description: string;
  days_from_now: number; // when to follow up
  priority: 'Low' | 'Normal' | 'High' | 'Urgent';
}

const EXTRACTION_PROMPT = `You are a sales assistant for an Indian EPR compliance consultancy. Below is a transcript of a phone call between a telecaller and a lead/client. Extract concrete follow-up action items only — things that were promised, requested, or need to happen next. Ignore small talk.

Return STRICT JSON only (no markdown), an array of objects:
[{ "description": "string, what to do", "days_from_now": 0, "priority": "Low|Normal|High|Urgent" }]

If there are no clear action items, return an empty array [].

Transcript:
"""
{{transcript}}
"""`;

function parseJsonArray(text: string): ActionItem[] {
  const stripped = text.replace(/```json?\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = stripped.indexOf('[');
  const end = stripped.lastIndexOf(']');
  if (start === -1 || end === -1) return [];
  try {
    const parsed = JSON.parse(stripped.slice(start, end + 1));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function extractActionItems(transcript: string): Promise<ActionItem[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !transcript.trim()) return [];

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: EXTRACTION_PROMPT.replace('{{transcript}}', transcript.slice(0, 12000)) }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return [];
  return parseJsonArray(textBlock.text);
}

/** Persist extracted action items as tc_followups linked to the call and lead. */
export async function saveActionItemsAsFollowups(callId: string, leadId: string | null, items: ActionItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = serviceClient();

  const rows = items.map((item) => ({
    lead_id: leadId,
    call_id: callId,
    type: 'Call',
    status: 'Pending',
    scheduled_for: new Date(Date.now() + Math.max(0, item.days_from_now || 0) * 86400000).toISOString(),
    notes: item.description.slice(0, 1000),
    priority: ['Low', 'Normal', 'High', 'Urgent'].includes(item.priority) ? item.priority : 'Normal',
    source: 'CALL_TRANSCRIPT',
  }));

  await db.from('tc_followups').insert(rows);
}
