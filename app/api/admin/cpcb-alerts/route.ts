/**
 * Admin CPCB alert management.
 *
 * GET  /api/admin/cpcb-alerts         — list all alerts (admin)
 * POST /api/admin/cpcb-alerts         — create new alert + fan-out notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';
import { matchAlertToRecycler } from '@/lib/recyclerPortal/alertRequestService';

async function resolveAdmin() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const db = adminClient();
  const { data: profile } = await (db as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();

  const role = profile?.role ?? '';
  const isAdmin = ['admin', 'manager'].includes(role) || isSuperAdmin(user.email);
  if (!isAdmin) return null;

  return { userId: user.id };
}

export async function GET(req: NextRequest) {
  const admin = await resolveAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const sp = req.nextUrl.searchParams;
  const active = sp.get('active');

  let q = (db as any)
    .from('cpcb_alerts')
    .select('*')
    .order('published_at', { ascending: false })
    .limit(100);

  if (active === 'true') q = q.eq('is_active', true);
  if (active === 'false') q = q.eq('is_active', false);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ alerts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await resolveAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (!body.title || !body.alertType) {
    return NextResponse.json({ error: 'title and alertType are required' }, { status: 400 });
  }

  const db = adminClient();

  const { data: alert, error: insertErr } = await (db as any)
    .from('cpcb_alerts')
    .insert({
      title: body.title,
      summary: body.summary,
      full_text: body.fullText,
      source_url: body.sourceUrl,
      issued_by: body.issuedBy ?? 'CPCB',
      issuing_authority: body.issuingAuthority,
      alert_type: body.alertType,
      epr_types: body.eprTypes ?? [],
      affected_states: body.affectedStates ?? [],
      affected_categories: body.affectedCategories ?? [],
      urgency: body.urgency ?? 'MEDIUM',
      effective_date: body.effectiveDate,
      compliance_deadline: body.complianceDeadline,
      attachments: body.attachments ?? [],
      added_by: admin.userId,
    })
    .select('*')
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Fan-out: notify matched recyclers
  try {
    const { data: recyclers } = await (db as any)
      .from('recyclers')
      .select('id, user_id, epr_categories, authorized_states')
      .not('user_id', 'is', null);

    const notifications = (recyclers ?? [])
      .filter((r: any) => {
        const { matched } = matchAlertToRecycler(
          {
            eprTypes: alert.epr_types ?? [],
            affectedStates: alert.affected_states ?? [],
            affectedCategories: alert.affected_categories ?? [],
          },
          {
            eprCategories: r.epr_categories ?? [],
            authorizedStates: r.authorized_states ?? [],
          }
        );
        return matched && r.user_id;
      })
      .map((r: any) => ({
        recipient_id: r.user_id,
        type: 'CPCB_ALERT_NEW',
        payload: {
          alertId: alert.id,
          title: alert.title,
          urgency: alert.urgency,
          complianceDeadline: alert.compliance_deadline,
        },
      }));

    if (notifications.length > 0) {
      await (db as any).from('epr_notification_queue').insert(notifications);
    }
  } catch {
    // Fan-out failure should not fail the creation
  }

  return NextResponse.json({ ok: true, alert }, { status: 201 });
}
