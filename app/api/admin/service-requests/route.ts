import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/service-requests — list all with optional status filter */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status    = searchParams.get('status')   || '';
  const priority  = searchParams.get('priority') || '';
  const assignedTo = searchParams.get('assigned_to') || '';
  const search    = searchParams.get('search')   || '';

  const db = adminClient();

  let query = (db as any)
    .from('service_requests')
    .select(`
      id, category, subject, priority, status,
      created_at, updated_at,
      clients ( id, profiles!clients_profile_id_fkey ( full_name, company_name ) ),
      profiles!service_requests_assigned_to_fkey ( id, full_name ),
      service_request_quotes ( id, total_amount, quote_status )
    `)
    .order('created_at', { ascending: false });

  if (status)     query = query.eq('status', status);
  if (priority)   query = query.eq('priority', priority);
  if (assignedTo) query = query.eq('assigned_to', assignedTo);
  if (search)     query = query.or(`subject.ilike.%${search}%,category.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ requests: data });
}
