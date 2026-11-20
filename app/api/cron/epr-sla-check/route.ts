/**
 * GET /api/cron/epr-sla-check
 * Called by Vercel Cron (or external scheduler) every hour.
 * Finds filings whose SLA due date has passed and:
 *   1. Queues a warning notification 6 hours before breach
 *   2. Queues an escalation notification on breach
 *
 * Secured by CRON_SECRET header (set in Vercel env vars).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized invocations
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = adminClient();
    const now = new Date();
    const sixHoursFromNow = new Date(now.getTime() + 6 * 3600 * 1000);

    // --- Find filings due within 6 hours (warning zone) ---
    const { data: warnFilings, error: warnError } = await db
      .from('epr_filing_statuses')
      .select('id, client_id, category, current_status, sla_due_at')
      .lte('sla_due_at', sixHoursFromNow.toISOString())
      .gt('sla_due_at', now.toISOString())
      .not('sla_due_at', 'is', null)
      .not('current_status', 'in', '("Certificate Issued","Approved")');
    if (warnError) throw warnError;

    const warnNotifs = (warnFilings ?? []).map((f: any) => ({
      type: 'sla_breach_warning',
      channel: 'email',
      recipient_id: f.client_id,
      payload: {
        filing_id: f.id,
        category: f.category,
        current_status: f.current_status,
        sla_due_at: f.sla_due_at,
        hours_remaining: Math.round((new Date(f.sla_due_at).getTime() - now.getTime()) / 3600000),
      },
    }));

    // --- Find filings already past SLA (breach) ---
    const { data: breachedFilings, error: breachError } = await db
      .from('epr_filing_statuses')
      .select('id, client_id, category, current_status, sla_due_at')
      .lt('sla_due_at', now.toISOString())
      .not('sla_due_at', 'is', null)
      .not('current_status', 'eq', 'Certificate Issued')
      .not('current_status', 'eq', 'Approved');
    if (breachError) throw breachError;

    const breachNotifs = (breachedFilings ?? []).map((f: any) => ({
      type: 'sla_breached',
      channel: 'email',
      recipient_id: f.client_id,
      payload: {
        filing_id: f.id,
        category: f.category,
        current_status: f.current_status,
        sla_due_at: f.sla_due_at,
      },
    }));

    // Deduplicate against already-queued notifications (same type + filing_id)
    const all = [...warnNotifs, ...breachNotifs].map(notif => ({
      ...notif,
      dedupe_key: `${notif.type}:${notif.payload.filing_id}:${notif.payload.sla_due_at}`,
    }));
    let queued = 0;

    if (all.length) {
      const { data: inserted, error } = await db.from('epr_notification_queue')
        .upsert(all, { onConflict: 'dedupe_key', ignoreDuplicates: true }).select('id');
      if (error) throw error;
      queued = inserted?.length ?? 0;
    }

    return NextResponse.json({
      checked: (warnFilings?.length ?? 0) + (breachedFilings?.length ?? 0),
      queued,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error('[cron/epr-sla-check]', err);
    return NextResponse.json({ error: 'Unable to queue SLA notifications' }, { status: 500 });
  }
}
