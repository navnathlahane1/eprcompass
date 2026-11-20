/**
 * GET  /api/taskmanager/notes?task_source=X&task_id=Y  — list notes
 * POST /api/taskmanager/notes  — add note
 *
 * POST /api/taskmanager/notes?action=escalate  — create an escalation
 * POST /api/taskmanager/notes?action=resolve_escalation  — resolve an escalation
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp     = req.nextUrl.searchParams;
  const source = sp.get('task_source') || '';
  const taskId = sp.get('task_id')     || '';
  if (!source || !taskId) return NextResponse.json({ error: 'task_source and task_id required' }, { status: 400 });

  const db = getServiceClient();

  const [notesRes, escRes] = await Promise.all([
    db.from('task_manager_notes')
      .select('id, body, author_id, created_at')
      .eq('task_source', source)
      .eq('task_id', taskId)
      .order('created_at', { ascending: false }),
    db.from('task_escalations')
      .select('id, reason, severity, escalated_at, resolved, resolved_at, resolution_note, escalated_by')
      .eq('task_source', source)
      .eq('task_id', taskId)
      .order('escalated_at', { ascending: false }),
  ]);

  // Enrich author names
  const authorIds = [...new Set((notesRes.data ?? []).map((n: any) => n.author_id))];
  const nameMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await db.from('profiles').select('id, full_name').in('id', authorIds);
    for (const p of profiles ?? []) nameMap[(p as any).id] = (p as any).full_name || 'Unknown';
  }

  const notes = (notesRes.data ?? []).map((n: any) => ({ ...n, author_name: nameMap[n.author_id] || 'Unknown' }));

  return NextResponse.json({ notes, escalations: escRes.data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const action = req.nextUrl.searchParams.get('action') || 'note';
  const body   = await req.json().catch(() => ({}));
  const db     = getServiceClient();

  // ── Add note ────────────────────────────────────────────────────────────
  if (action === 'note') {
    const { task_source, task_id, note } = body;
    if (!task_source || !task_id || !note?.trim()) {
      return NextResponse.json({ error: 'task_source, task_id, note required' }, { status: 400 });
    }
    const { data, error } = await db.from('task_manager_notes').insert({
      task_source,
      task_id,
      author_id: actor.id,
      body:      note.trim().slice(0, 1000),
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  // ── Escalate ─────────────────────────────────────────────────────────────
  if (action === 'escalate') {
    const { task_source, task_id, reason, severity = 'high' } = body;
    if (!task_source || !task_id || !reason?.trim()) {
      return NextResponse.json({ error: 'task_source, task_id, reason required' }, { status: 400 });
    }
    const { data, error } = await db.from('task_escalations').insert({
      task_source,
      task_id,
      escalated_by: actor.id,
      reason:       reason.trim().slice(0, 500),
      severity,
    }).select('id').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  }

  // ── Resolve escalation ────────────────────────────────────────────────────
  if (action === 'resolve_escalation') {
    const { escalation_id, resolution_note } = body;
    if (!escalation_id) return NextResponse.json({ error: 'escalation_id required' }, { status: 400 });
    const { error } = await db.from('task_escalations').update({
      resolved:         true,
      resolved_at:      new Date().toISOString(),
      resolved_by:      actor.id,
      resolution_note:  resolution_note?.trim() || null,
    }).eq('id', escalation_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
