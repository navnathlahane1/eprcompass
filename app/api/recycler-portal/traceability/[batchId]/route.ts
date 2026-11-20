/**
 * GET   /api/recycler-portal/traceability/[batchId]  — batch detail + event chain
 * PATCH /api/recycler-portal/traceability/[batchId]  — advance stage / add event
 *   Body: { action: 'add_processing', processed_qty_mt, output_qty_mt, process_method, ... }
 *         { action: 'add_event', event_type, notes, qty_mt, document_url, location }
 *         { action: 'mark_credited', linked_credit_id, credit_issued_qty_mt }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Params = { params: Promise<{ batchId: string }> };

async function ownBatch(db: any, batchId: string, recyclerId: string) {
  const { data } = await db
    .from('recycler_traceability_batches')
    .select('*')
    .eq('id', batchId)
    .eq('recycler_id', recyclerId)
    .maybeSingle();
  return data;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { batchId } = await params;
  const db = adminClient();

  const batch = await ownBatch(db, batchId, actor.recyclerId);
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  const { data: events } = await (db as any)
    .from('recycler_traceability_events')
    .select('*')
    .eq('batch_id', batchId)
    .order('event_at', { ascending: true });

  return NextResponse.json({ batch, events: events ?? [] });
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { batchId } = await params;
  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const batch = await ownBatch(db, batchId, actor.recyclerId);
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });

  // Last event hash for chaining
  const { data: lastEvent } = await (db as any)
    .from('recycler_traceability_events')
    .select('hash')
    .eq('batch_id', batchId)
    .order('event_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const prevHash = lastEvent?.hash ?? batch.provenance_hash ?? null;

  function chain(payload: string) {
    return createHash('sha256').update(`${prevHash ?? ''}|${payload}|${Date.now()}`).digest('hex').slice(0, 32);
  }

  if (body.action === 'add_processing') {
    const update: Record<string, any> = {
      status: 'PROCESSED',
      processed_qty_mt: body.processed_qty_mt != null ? Number(body.processed_qty_mt) : batch.processed_qty_mt,
      output_qty_mt: body.output_qty_mt != null ? Number(body.output_qty_mt) : batch.output_qty_mt,
      process_method: body.process_method?.trim() || batch.process_method,
      processing_notes: body.processing_notes?.trim() || batch.processing_notes,
      process_start_date: body.process_start_date || batch.process_start_date,
      process_end_date: body.process_end_date || new Date().toISOString().slice(0, 10),
    };
    const { error } = await (db as any).from('recycler_traceability_batches').update(update).eq('id', batchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const h = chain(`PROCESSED|${update.output_qty_mt}`);
    await (db as any).from('recycler_traceability_events').insert({
      batch_id: batchId, recycler_id: actor.recyclerId, event_type: 'PROCESSED',
      actor: actor.name, qty_mt: update.output_qty_mt, notes: update.process_method,
      hash: h, prev_hash: prevHash,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'mark_credited') {
    const update = {
      status: 'CREDITED',
      linked_credit_id: body.linked_credit_id || null,
      credit_issued_qty_mt: body.credit_issued_qty_mt != null ? Number(body.credit_issued_qty_mt) : batch.output_qty_mt,
    };
    const { error } = await (db as any).from('recycler_traceability_batches').update(update).eq('id', batchId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const h = chain(`CREDIT_ISSUED|${update.credit_issued_qty_mt}`);
    await (db as any).from('recycler_traceability_events').insert({
      batch_id: batchId, recycler_id: actor.recyclerId, event_type: 'CREDIT_ISSUED',
      actor: actor.name, qty_mt: update.credit_issued_qty_mt,
      notes: 'EPR credit issued for this batch', hash: h, prev_hash: prevHash,
    });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'add_event') {
    if (!body.event_type) return NextResponse.json({ error: 'event_type is required' }, { status: 400 });
    const h = chain(`${body.event_type}|${body.qty_mt ?? ''}`);
    // Move to IN_PROCESSING if still COLLECTED and a transport/receive event is logged
    if (batch.status === 'COLLECTED' && ['TRANSPORTED', 'RECEIVED', 'WEIGHED'].includes(body.event_type)) {
      await (db as any).from('recycler_traceability_batches').update({ status: 'IN_PROCESSING' }).eq('id', batchId);
    }
    const { error } = await (db as any).from('recycler_traceability_events').insert({
      batch_id: batchId, recycler_id: actor.recyclerId,
      event_type: body.event_type, actor: body.actor?.trim() || actor.name,
      location: body.location?.trim() || null, qty_mt: body.qty_mt != null ? Number(body.qty_mt) : null,
      document_url: body.document_url?.trim() || null, notes: body.notes?.trim() || null,
      hash: h, prev_hash: prevHash,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
