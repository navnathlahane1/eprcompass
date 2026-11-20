import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/autofill/sessions?client_id=&portal_id=&status=&limit=50 */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('id');
  const clientId = searchParams.get('client_id') || '';
  const portalId = searchParams.get('portal_id') || '';
  const status = searchParams.get('status') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  const db = adminClient();

  if (sessionId) {
    const { data: session, error } = await (db as any)
      .from('autofill_sessions')
      .select(`
        *,
        compliance_portals ( id, name, short_name ),
        clients ( id, company_name ),
        profiles!autofill_sessions_profile_id_fkey ( id, full_name, email )
      `)
      .eq('id', sessionId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const { data: fieldLogs } = await (db as any)
      .from('autofill_field_logs')
      .select('*, global_field_definitions(id,field_key,display_name)')
      .eq('session_id', sessionId)
      .order('created_at');

    return NextResponse.json({ session, fieldLogs });
  }

  let query = (db as any)
    .from('autofill_sessions')
    .select(`
      *,
      compliance_portals ( id, name, short_name ),
      clients ( id, company_name ),
      profiles!autofill_sessions_profile_id_fkey ( id, full_name )
    `)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (clientId) query = query.eq('client_id', clientId);
  if (portalId) query = query.eq('portal_id', portalId);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate stats
  const stats = {
    total: data?.length ?? 0,
    completed: data?.filter((s: { status: string }) => s.status === 'completed').length ?? 0,
    failed: data?.filter((s: { status: string }) => s.status === 'failed').length ?? 0,
    total_fields_filled: data?.reduce((sum: number, s: { fields_filled: number }) => sum + (s.fields_filled || 0), 0) ?? 0,
    avg_confidence: data?.length
      ? Math.round(data.reduce((sum: number, s: { confidence_avg: number | null }) => sum + (s.confidence_avg || 0), 0) / data.length)
      : null,
  };

  return NextResponse.json({ sessions: data, stats });
}
