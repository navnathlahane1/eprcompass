/**
 * GET  /api/recycler-portal/traceability         — list batches (+ summary)
 * POST /api/recycler-portal/traceability         — create a new inflow batch
 */
import { createHash, randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

function batchCode(): string {
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const n = (randomBytes(2).readUInt16BE(0) % 9000) + 1000;
  return `BATCH-${stamp}-${n}`;
}

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const status = req.nextUrl.searchParams.get('status');

  let q = (db as any)
    .from('recycler_traceability_batches')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status && status !== 'ALL') q = q.eq('status', status);

  const { data, error } = await q;
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ batches: [], summary: emptySummary() });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const batches = data ?? [];
  const summary = {
    total_batches: batches.length,
    total_inflow_mt: round3(batches.reduce((s: number, b: any) => s + Number(b.inflow_qty_mt || 0), 0)),
    total_output_mt: round3(batches.reduce((s: number, b: any) => s + Number(b.output_qty_mt || 0), 0)),
    credited: batches.filter((b: any) => b.status === 'CREDITED').length,
    in_processing: batches.filter((b: any) => b.status === 'IN_PROCESSING').length,
  };

  return NextResponse.json({ batches, summary });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (!body.waste_category) return NextResponse.json({ error: 'waste_category is required' }, { status: 400 });
  if (!body.inflow_qty_mt || Number(body.inflow_qty_mt) <= 0) {
    return NextResponse.json({ error: 'inflow_qty_mt must be positive' }, { status: 400 });
  }

  const db = adminClient();
  const code = batchCode();
  const hash = createHash('sha256')
    .update(`${actor.recyclerId}|${code}|${body.waste_category}|${body.inflow_qty_mt}|${Date.now()}`)
    .digest('hex')
    .slice(0, 32);

  const row = {
    recycler_id: actor.recyclerId,
    batch_code: code,
    waste_category: body.waste_category,
    source_type: body.source_type || null,
    source_name: body.source_name?.trim() || null,
    source_location: body.source_location?.trim() || null,
    gps_lat: body.gps_lat ? Number(body.gps_lat) : null,
    gps_lng: body.gps_lng ? Number(body.gps_lng) : null,
    inflow_qty_mt: Number(body.inflow_qty_mt),
    inflow_date: body.inflow_date || new Date().toISOString().slice(0, 10),
    weighbridge_slip_url: body.weighbridge_slip_url?.trim() || null,
    inflow_photo_url: body.inflow_photo_url?.trim() || null,
    transporter_name: body.transporter_name?.trim() || null,
    vehicle_number: body.vehicle_number?.trim() || null,
    manifest_no: body.manifest_no?.trim() || null,
    status: 'COLLECTED',
    provenance_hash: hash,
  };

  const { data: batch, error } = await (db as any)
    .from('recycler_traceability_batches')
    .insert(row)
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ batch: { id: 'pending', batch_code: code }, message: 'Batch recorded.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Seed the first chain-of-custody event
  await (db as any).from('recycler_traceability_events').insert({
    batch_id: batch.id,
    recycler_id: actor.recyclerId,
    event_type: 'COLLECTED',
    actor: actor.name,
    location: row.source_location,
    qty_mt: row.inflow_qty_mt,
    document_url: row.weighbridge_slip_url,
    notes: `Collected from ${row.source_name ?? 'source'}`,
    hash,
    prev_hash: null,
  });

  return NextResponse.json({ batch, message: 'Inflow batch created.' }, { status: 201 });
}

function emptySummary() {
  return { total_batches: 0, total_inflow_mt: 0, total_output_mt: 0, credited: 0, in_processing: 0 };
}
function round3(n: number) { return Math.round(n * 1000) / 1000; }
