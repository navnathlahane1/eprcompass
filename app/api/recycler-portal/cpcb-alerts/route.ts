/**
 * GET  /api/recycler-portal/cpcb-alerts   — matched CPCB alerts for this recycler
 * POST /api/recycler-portal/cpcb-alerts/[alertId]/read  — mark read
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { matchAlertToRecycler } from '@/lib/recyclerPortal/alertRequestService';

export async function GET(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const urgency = sp.get('urgency');
  const unreadOnly = sp.get('unread') === 'true';

  // Fetch active alerts
  let q = (db as any)
    .from('cpcb_alerts')
    .select(
      'id, title, summary, issued_by, alert_type, epr_types, affected_states, ' +
      'urgency, effective_date, compliance_deadline, published_at, source_url'
    )
    .eq('is_active', true)
    .order('published_at', { ascending: false })
    .limit(100);

  if (urgency) q = q.eq('urgency', urgency);

  const { data: alerts, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch read state for this recycler
  const alertIds = (alerts ?? []).map((a: any) => a.id);
  const { data: reads } = alertIds.length > 0
    ? await (db as any)
        .from('recycler_alert_reads')
        .select('alert_id, read_at, marked_important')
        .eq('recycler_id', actor.recyclerId)
        .in('alert_id', alertIds)
    : { data: [] };

  const readMap = new Map<string, { alert_id: string; read_at: string | null; marked_important: boolean }>((reads ?? []).map((r: any) => [r.alert_id, r]));

  // Filter by match + optionally by unread
  const matched = (alerts ?? [])
    .filter((alert: any) => {
      const { matched } = matchAlertToRecycler(
        {
          eprTypes: alert.epr_types ?? [],
          affectedStates: alert.affected_states ?? [],
          affectedCategories: [],
        },
        {
          eprCategories: actor.eprCategories,
          authorizedStates: actor.authorizedStates,
        }
      );
      return matched;
    })
    .map((alert: any) => ({
      ...alert,
      readAt: readMap.get(alert.id)?.read_at ?? null,
      markedImportant: readMap.get(alert.id)?.marked_important ?? false,
    }))
    .filter((a: any) => !unreadOnly || !a.readAt);

  return NextResponse.json({ alerts: matched, total: matched.length });
}
