import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { SERVICE_CATEGORIES, PRIORITIES } from '@/lib/serviceRequests/constants';

/** GET /api/portal/service-requests — list client's own requests */
export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();

  // Resolve client_id from profile_id
  const { data: client } = await (db as any)
    .from('clients')
    .select('id')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 });

  const { data, error } = await (db as any)
    .from('service_requests')
    .select(`
      id, category, subject, priority, status,
      created_at, updated_at,
      service_request_quotes ( id, total_amount, quote_status, sent_at )
    `)
    .eq('client_id', client.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data });
}

/** POST /api/portal/service-requests — create a new service request */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (actor.role !== 'client' && !actor.isAdmin)
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { category, subject, description, priority = 'Normal' } = body as Record<string, string>;

  if (!category || !SERVICE_CATEGORIES.includes(category as never))
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  if (!subject?.trim() || subject.trim().length < 5)
    return NextResponse.json({ error: 'Subject is required (min 5 chars)' }, { status: 400 });
  if (!description?.trim() || description.trim().length < 10)
    return NextResponse.json({ error: 'Description is required (min 10 chars)' }, { status: 400 });
  if (!PRIORITIES.includes(priority as never))
    return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });

  const db = adminClient();

  const { data: client } = await (db as any)
    .from('clients')
    .select('id')
    .eq('profile_id', actor.userId)
    .maybeSingle();

  if (!client) return NextResponse.json({ error: 'Client record not found' }, { status: 404 });

  const { data: request, error } = await (db as any)
    .from('service_requests')
    .insert({
      client_id:   client.id,
      profile_id:  actor.userId,
      category:    category.trim(),
      subject:     subject.trim(),
      description: description.trim(),
      priority,
      status:      'Submitted',
    })
    .select('id, category, subject, priority, status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Status log entry
  await (db as any).from('service_request_status_logs').insert({
    request_id:  request.id,
    changed_by:  actor.userId,
    from_status: null,
    to_status:   'Submitted',
    note:        'Request created by client',
  });

  // Notify all admins
  await notifyAdmins(db, actor.userId, request.id, subject.trim());

  return NextResponse.json({ request }, { status: 201 });
}

async function notifyAdmins(
  db: ReturnType<typeof adminClient>,
  _submittedBy: string,
  requestId: string,
  subject: string
) {
  try {
    const { data: admins } = await (db as any)
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'manager']);

    if (!admins?.length) return;

    await (db as any).from('notifications').insert(
      admins.map((a: { id: string }) => ({
        profile_id: a.id,
        type:       'system',
        message:    `New service request: "${subject}"`,
        read:       false,
        metadata:   { request_id: requestId, action: 'new_service_request' },
      }))
    );
  } catch {
    // non-fatal
  }
}
