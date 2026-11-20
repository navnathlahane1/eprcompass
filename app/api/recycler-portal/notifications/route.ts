/**
 * GET /api/recycler-portal/notifications
 * Returns a synthesised notification log for the current recycler.
 */
import { NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

type Severity = 'info' | 'warning' | 'critical';

interface Notification {
  id: string;
  type: 'CPCB_ALERT' | 'CERT_RENEWAL' | 'TENDER_MATCH' | 'INVOICE';
  title: string;
  message: string;
  severity: Severity;
  created_at: string;
  read: boolean;
}

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();
  const notifications: Notification[] = [];

  try {
    // 1. CPCB cert expiry notification
    const { data: recycler } = await (db as any)
      .from('recyclers')
      .select('cpcb_cert_no, cpcb_cert_expiry')
      .eq('id', actor.recyclerId)
      .maybeSingle();

    if (recycler) {
      const { cpcb_cert_no, cpcb_cert_expiry } = recycler;
      if (!cpcb_cert_no || !cpcb_cert_expiry) {
        notifications.push({
          id: 'cert-missing',
          type: 'CERT_RENEWAL',
          title: 'CPCB Certificate details missing',
          message: 'Add your certificate number and expiry date in My Profile to stay compliant.',
          severity: 'warning',
          created_at: new Date().toISOString(),
          read: false,
        });
      } else {
        const expiry = new Date(cpcb_cert_expiry);
        const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) {
          notifications.push({
            id: 'cert-expired',
            type: 'CERT_RENEWAL',
            title: 'CPCB Certificate has expired',
            message: `Your certificate (${cpcb_cert_no}) expired on ${expiry.toLocaleDateString('en-IN')}. Upload a renewed certificate immediately.`,
            severity: 'critical',
            created_at: expiry.toISOString(),
            read: false,
          });
        } else if (daysLeft <= 90) {
          notifications.push({
            id: 'cert-expiring',
            type: 'CERT_RENEWAL',
            title: `CPCB Certificate expiring in ${daysLeft} days`,
            message: `Your certificate (${cpcb_cert_no}) expires on ${expiry.toLocaleDateString('en-IN')}. Renew before it lapses to avoid suspension.`,
            severity: 'warning',
            created_at: new Date().toISOString(),
            read: false,
          });
        }
      }
    }

    // 2. Pending invoices (from recycler_invoices if the table exists)
    try {
      const { data: invoices } = await (db as any)
        .from('recycler_invoices')
        .select('id, invoice_no, due_date, status')
        .eq('recycler_id', actor.recyclerId)
        .in('status', ['OVERDUE', 'PENDING']);

      if (invoices && invoices.length > 0) {
        for (const inv of invoices) {
          const isOverdue = inv.status === 'OVERDUE';
          notifications.push({
            id: `invoice-${inv.id}`,
            type: 'INVOICE',
            title: isOverdue ? `Invoice ${inv.invoice_no} is overdue` : `Invoice ${inv.invoice_no} pending`,
            message: isOverdue
              ? `Invoice ${inv.invoice_no} was due on ${new Date(inv.due_date).toLocaleDateString('en-IN')} and remains unpaid.`
              : `Invoice ${inv.invoice_no} is pending payment by ${new Date(inv.due_date).toLocaleDateString('en-IN')}.`,
            severity: isOverdue ? 'critical' : 'warning',
            created_at: inv.due_date,
            read: false,
          });
        }
      }
    } catch {
      // recycler_invoices table may not exist yet — skip silently
    }

    // 3. New tender matches (published tenders matching recycler's epr_categories / authorized_states)
    if (actor.eprCategories.length > 0 || actor.authorizedStates.length > 0) {
      try {
        const { data: tenders } = await (db as any)
          .from('tenders')
          .select('id, title, published_at, epr_category, state')
          .eq('status', 'PUBLISHED')
          .order('published_at', { ascending: false })
          .limit(10);

        if (tenders) {
          const matched = tenders.filter((t: any) => {
            const catMatch = actor.eprCategories.length === 0 || actor.eprCategories.includes(t.epr_category);
            const stateMatch = actor.authorizedStates.length === 0 || actor.authorizedStates.includes(t.state);
            return catMatch && stateMatch;
          });

          for (const t of matched.slice(0, 5)) {
            notifications.push({
              id: `tender-${t.id}`,
              type: 'TENDER_MATCH',
              title: 'New tender match',
              message: `"${t.title}" matches your profile. Review and bid before it closes.`,
              severity: 'info',
              created_at: t.published_at,
              read: false,
            });
          }
        }
      } catch {
        // skip if tenders table schema differs
      }
    }

    // 4. Unread CPCB alerts
    try {
      const { data: alerts } = await (db as any)
        .from('cpcb_alerts')
        .select(`
          id, title, summary, urgency, published_at,
          recycler_alert_reads!left(recycler_id)
        `)
        .order('published_at', { ascending: false })
        .limit(20);

      if (alerts) {
        for (const alert of alerts) {
          const reads: any[] = alert.recycler_alert_reads ?? [];
          const isRead = reads.some((r: any) => r.recycler_id === actor.recyclerId);
          if (!isRead) {
            const urgency: string = alert.urgency ?? 'low';
            const severity: Severity = urgency === 'high' ? 'critical' : urgency === 'medium' ? 'warning' : 'info';
            notifications.push({
              id: `cpcb-alert-${alert.id}`,
              type: 'CPCB_ALERT',
              title: alert.title,
              message: alert.summary ?? '',
              severity,
              created_at: alert.published_at,
              read: false,
            });
          }
        }
      }
    } catch {
      // skip if cpcb_alerts table doesn't exist
    }

    // Sort by created_at descending
    notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const unread_count = notifications.filter(n => !n.read).length;

    return NextResponse.json({ notifications, unread_count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
