/**
 * GET  /api/recycler-portal/service-requests  — list this recycler's service requests
 * POST /api/recycler-portal/service-requests  — submit a new service request
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

const ALLOWED_TYPES = [
  'EPR_CREDIT_ADVISORY', 'COMPLIANCE_AUDIT', 'REGULATORY_FILING',
  'TRAINING_SESSION', 'CERT_RENEWAL', 'TONNAGE_QUERY',
  'PAYMENT_QUERY', 'TECHNICAL_SUPPORT', 'OTHER',
];

function generateRequestNumber(): string {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SR-${yy}${mm}-${rand}`;
}

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const status = req.nextUrl.searchParams.get('status');

  let query = (db as any)
    .from('recycler_service_requests')
    .select(`
      id, request_number, service_type, subject, description,
      priority, status, remarks, created_at, updated_at, resolved_at,
      assigned_to_profile_id
    `)
    .eq('recycler_id', actor.recyclerId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status && status !== 'ALL') {
    query = query.eq('status', status);
  }

  const { data: requests, error } = await query;
  if (error) {
    // Table may not exist yet — return empty list gracefully
    if (error.code === '42P01') return NextResponse.json({ requests: [] });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Attach assigned-to names
  const assignedIds = (requests ?? [])
    .map((r: any) => r.assigned_to_profile_id)
    .filter(Boolean);

  let profileMap: Record<string, string> = {};
  if (assignedIds.length > 0) {
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, full_name')
      .in('id', assignedIds);
    for (const p of profiles ?? []) {
      profileMap[p.id] = p.full_name;
    }
  }

  const enriched = (requests ?? []).map((r: any) => ({
    ...r,
    assigned_to_name: r.assigned_to_profile_id ? profileMap[r.assigned_to_profile_id] ?? null : null,
  }));

  return NextResponse.json({ requests: enriched });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { service_type, subject, description, priority = 'MEDIUM' } = body;

  if (!service_type || !ALLOWED_TYPES.includes(service_type)) {
    return NextResponse.json({ error: 'Invalid service_type' }, { status: 400 });
  }
  if (!subject?.trim()) return NextResponse.json({ error: 'subject is required' }, { status: 400 });
  if (!description?.trim()) return NextResponse.json({ error: 'description is required' }, { status: 400 });
  if (!['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(priority)) {
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
  }

  const db = adminClient();

  // Look up recycler name for context
  const { data: recycler } = await (db as any)
    .from('recyclers')
    .select('name, recycler_code')
    .eq('id', actor.recyclerId)
    .maybeSingle();

  const { data: request, error } = await (db as any)
    .from('recycler_service_requests')
    .insert({
      recycler_id: actor.recyclerId,
      request_number: generateRequestNumber(),
      service_type,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      status: 'SUBMITTED',
      recycler_name: recycler?.name ?? null,
      recycler_code: recycler?.recycler_code ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ error: 'Service requests feature is not yet available. Please contact support.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }

  return NextResponse.json({ request, message: 'Request submitted successfully.' }, { status: 201 });
}
