import { NextResponse } from 'next/server';
import { resolveTenderingUser, getServiceClient } from '@/lib/tendering/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveTenderingUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db  = getServiceClient();
    const now = new Date();
    const in7days = new Date(now.getTime() + 7 * 86400_000).toISOString();

    // All tenders
    const { data: tendersRaw } = await (db as any)
      .from('tendering_tenders')
      .select('id, status, category, submission_deadline, estimated_value_inr, assigned_to, updated_at, title, authority, tender_no, portal');

    const tenders: any[] = tendersRaw ?? [];

    // KPIs
    const totalTenders   = tenders.length;
    const wonTenders     = tenders.filter((t: any) => t.status === 'won').length;
    const lostTenders    = tenders.filter((t: any) => t.status === 'lost').length;
    const successRate    = (wonTenders + lostTenders) > 0
      ? Math.round((wonTenders / (wonTenders + lostTenders)) * 100)
      : 0;

    // Active bids count
    const { count: activeBidsCount } = await (db as any)
      .from('tendering_bids')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'review', 'approved', 'submitted']);

    // Total contract value (won contracts)
    const { data: contractsRaw } = await (db as any)
      .from('tendering_contracts')
      .select('contract_value_inr')
      .eq('status', 'active');
    const totalContractValue = ((contractsRaw ?? []) as any[])
      .reduce((s: number, c: any) => s + (c.contract_value_inr ?? 0), 0);

    // Avg bid value
    const { data: bidsRaw } = await (db as any)
      .from('tendering_bids')
      .select('financial_amount_inr');
    const bidAmounts = ((bidsRaw ?? []) as any[]).map((b: any) => b.financial_amount_inr ?? 0);
    const avgBidValue = bidAmounts.length > 0
      ? bidAmounts.reduce((s: number, v: number) => s + v, 0) / bidAmounts.length
      : 0;

    const tendersDueIn7Days = tenders.filter((t: any) =>
      t.submission_deadline && t.submission_deadline <= in7days &&
      t.submission_deadline >= now.toISOString() &&
      !['submitted', 'won', 'lost', 'cancelled'].includes(t.status)
    ).length;

    // Status breakdown
    const allStatuses = ['new', 'evaluating', 'bidding', 'submitted', 'won', 'lost', 'cancelled'];
    const statusLabels: Record<string, string> = {
      new: 'New', evaluating: 'Evaluating', bidding: 'Bidding',
      submitted: 'Submitted', won: 'Won', lost: 'Lost', cancelled: 'Cancelled',
    };
    const statusBreakdown = allStatuses.map(status => ({
      status,
      label: statusLabels[status],
      count: tenders.filter((t: any) => t.status === status).length,
      value: tenders
        .filter((t: any) => t.status === status)
        .reduce((s: number, t: any) => s + (t.estimated_value_inr ?? 0), 0),
    }));

    // Urgent tenders (due within 7 days, not terminal)
    const urgentTenders = tenders
      .filter((t: any) =>
        t.submission_deadline && t.submission_deadline <= in7days &&
        t.submission_deadline >= now.toISOString() &&
        !['submitted', 'won', 'lost', 'cancelled'].includes(t.status)
      )
      .sort((a: any, b: any) => a.submission_deadline.localeCompare(b.submission_deadline))
      .slice(0, 10);

    // Enrich urgent tenders with assigned user name
    const assignedIds = [...new Set(urgentTenders.map((t: any) => t.assigned_to).filter(Boolean))];
    const assigneeMap: Record<string, string> = {};
    if (assignedIds.length) {
      const { data: profiles } = await (db as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', assignedIds);
      for (const p of (profiles ?? []) as any[]) assigneeMap[p.id] = p.full_name || 'Unknown';
    }

    const urgentEnriched = urgentTenders.map((t: any) => ({
      ...t,
      assigned_name: t.assigned_to ? (assigneeMap[t.assigned_to] || 'Unassigned') : 'Unassigned',
      days_remaining: Math.ceil((new Date(t.submission_deadline).getTime() - now.getTime()) / 86400_000),
    }));

    // Recent activity
    const recentActivity = tenders
      .sort((a: any, b: any) => b.updated_at.localeCompare(a.updated_at))
      .slice(0, 8)
      .map((t: any) => ({
        ...t,
        days_remaining: t.submission_deadline
          ? Math.ceil((new Date(t.submission_deadline).getTime() - now.getTime()) / 86400_000)
          : null,
      }));

    // Top categories
    const catMap: Record<string, { count: number; won: number }> = {};
    for (const t of tenders) {
      if (!t.category) continue;
      if (!catMap[t.category]) catMap[t.category] = { count: 0, won: 0 };
      catMap[t.category].count++;
      if (t.status === 'won') catMap[t.category].won++;
    }
    const topCategories = Object.entries(catMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5)
      .map(([category, v]) => ({ category, ...v }));

    return NextResponse.json({
      kpis: {
        totalTenders,
        activeBids: activeBidsCount ?? 0,
        wonTenders,
        lostTenders,
        successRate,
        totalContractValue,
        avgBidValue,
        tendersDueIn7Days,
      },
      statusBreakdown,
      urgentTenders: urgentEnriched,
      recentActivity,
      topCategories,
    });
  } catch (err: any) {
    console.error('[tendering/dashboard] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}
