/**
 * @openapi
 * /api/network/notifications/contract-expiry:
 *   post:
 *     summary: Check all active contracts and queue expiry alerts
 *     description: |
 *       Called by a Vercel Cron or external scheduler (e.g. daily at 08:00 IST).
 *       Requires the CRON_SECRET header to match CRON_SECRET env var.
 *     tags: [Recycler Network Notifications]
 *     security: [{ CronSecret: [] }]
 */
import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { contractsNeedingAlert } from '@/lib/recyclerNetwork/recyclerNetworkService';

export async function POST(req: NextRequest) {
  // Cron secret guard — prevents unauthorized triggers
  const secret = req.headers.get('x-cron-secret');
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = adminClient();

  // Fetch all ACTIVE contracts with an end_date
  const { data: contracts, error } = await (db as any)
    .from('recycler_contracts')
    .select('id, contract_number, client_id, status, end_date, renewal_notice_days, epr_category, financial_year, committed_qty, recycler_id')
    .eq('status', 'ACTIVE')
    .not('end_date', 'is', null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const alertPairs = contractsNeedingAlert(contracts ?? [], [30, 15, 7]);

  if (!alertPairs.length) {
    return NextResponse.json({ queued: 0, message: 'No contracts need alerts today' });
  }

  // Build notification rows
  const notifications = alertPairs.map(({ contract, days }) => ({
    recipient_id: contract.client_id,
    type: 'contract_expiry_warning',
    payload: {
      title: `Contract Expiring in ${days} Days`,
      message: `Contract ${contract.contract_number} for ${contract.epr_category} expires in ${days} days. Review or renew before the deadline.`,
      contract_id: contract.id,
      days_remaining: days,
    },
  }));

  const { error: insertError } = await (db as any)
    .from('epr_notification_queue')
    .insert(notifications);

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });

  return NextResponse.json({ queued: notifications.length, contracts: alertPairs.map(({ contract, days }) => ({ id: contract.id, days })) });
}
