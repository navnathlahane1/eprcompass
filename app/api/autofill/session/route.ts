import { NextRequest, NextResponse } from 'next/server';
import { resolveExtensionActor, requireScope } from '@/lib/autofill/extensionAuth';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';

/**
 * POST /api/autofill/session
 * Manages autofill session lifecycle from the Chrome Extension.
 * Body action:
 *   { action: 'start',    portal_id, trigger_url, page_context, session_type, user_agent?, extension_version? }
 *   { action: 'log',      session_id, logs: [{...AutofillFieldLog fields}] }
 *   { action: 'complete', session_id, status, fields_attempted, fields_filled, fields_failed, fields_skipped, error_message? }
 */
export async function POST(req: NextRequest) {
  const actor = await resolveExtensionActor(req.headers.get('authorization'));
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.clientId) return NextResponse.json({ error: 'Token not scoped to a client' }, { status: 403 });
  if (!requireScope(actor, 'autofill')) return NextResponse.json({ error: 'Insufficient scope' }, { status: 403 });

  const body = await req.json();
  const { action } = body;
  const db = adminClient();

  if (action === 'start') {
    const { portal_id, trigger_url, page_context, session_type, user_agent, extension_version } = body;

    const { data, error } = await (db as any)
      .from('autofill_sessions')
      .insert({
        client_id: actor.clientId,
        portal_id: portal_id || null,
        profile_id: actor.profileId,
        session_type: session_type || 'chrome_extension',
        trigger_url: trigger_url || null,
        page_context: page_context || null,
        status: 'started',
        user_agent: user_agent || null,
        extension_version: extension_version || null,
      })
      .select('id, started_at')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ session_id: data.id, started_at: data.started_at }, { status: 201 });
  }

  if (action === 'log') {
    const { session_id, logs } = body;
    if (!session_id || !Array.isArray(logs) || !logs.length) {
      return NextResponse.json({ error: 'session_id and logs[] required' }, { status: 400 });
    }

    // Verify session belongs to this client
    const { data: session } = await (db as any)
      .from('autofill_sessions')
      .select('id, client_id')
      .eq('id', session_id)
      .single();

    if (!session || session.client_id !== actor.clientId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Update session status to 'filling'
    await (db as any)
      .from('autofill_sessions')
      .update({ status: 'filling' })
      .eq('id', session_id)
      .eq('status', 'started');

    const rows = logs.map((l: Record<string, unknown>) => ({
      session_id,
      global_field_id: l.global_field_id || null,
      mapping_id: l.mapping_id || null,
      field_key: l.field_key || null,
      selector_used: l.selector_used || null,
      selector_type: l.selector_type || null,
      status: l.status,
      fill_value_preview: l.fill_value_preview
        ? String(l.fill_value_preview).slice(0, 50)
        : null,
      error_detail: l.error_detail || null,
      confidence: l.confidence ?? null,
      fill_duration_ms: l.fill_duration_ms ?? null,
    }));

    const { error } = await (db as any)
      .from('autofill_field_logs')
      .insert(rows);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ logged: rows.length });
  }

  if (action === 'complete') {
    const { session_id, status, fields_attempted, fields_filled, fields_failed, fields_skipped, error_message } = body;
    if (!session_id || !status) {
      return NextResponse.json({ error: 'session_id and status required' }, { status: 400 });
    }

    const { data: session } = await (db as any)
      .from('autofill_sessions')
      .select('id, client_id')
      .eq('id', session_id)
      .single();

    if (!session || session.client_id !== actor.clientId) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Compute average confidence from logs
    const { data: logs } = await (db as any)
      .from('autofill_field_logs')
      .select('confidence')
      .eq('session_id', session_id)
      .eq('status', 'filled')
      .not('confidence', 'is', null);

    const confidences: number[] = (logs || []).map((l: { confidence: number }) => l.confidence);
    const confidenceAvg = confidences.length
      ? Math.round(confidences.reduce((a: number, b: number) => a + b, 0) / confidences.length)
      : null;

    const { error } = await (db as any)
      .from('autofill_sessions')
      .update({
        status,
        fields_attempted: fields_attempted ?? 0,
        fields_filled: fields_filled ?? 0,
        fields_failed: fields_failed ?? 0,
        fields_skipped: fields_skipped ?? 0,
        confidence_avg: confidenceAvg,
        error_message: error_message || null,
        completed_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, confidence_avg: confidenceAvg });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}
