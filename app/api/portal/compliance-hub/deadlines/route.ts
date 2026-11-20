import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';

/** GET /api/portal/compliance-hub/deadlines
 *  Returns upcoming (and recent) deadlines for the authenticated client's
 *  assigned compliance frameworks, enriched with filing status.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { searchParams } = new URL(req.url);
  const fyId       = searchParams.get('financial_year_id') || '';
  const upcoming   = Number(searchParams.get('upcoming') ?? '90');
  const includeAll = searchParams.get('all') === 'true';
  if (!Number.isInteger(upcoming) || upcoming < 1 || upcoming > 366) {
    return NextResponse.json({ error: 'Upcoming days must be between 1 and 366' }, { status: 400 });
  }

  // Get client's active framework IDs
  const { data: assignments, error: assignmentError } = await (db as any)
    .from('client_compliances')
    .select('id, framework_id')
    .eq('client_id', actor.clientId)
    .eq('status', 'active');

  if (assignmentError) return NextResponse.json({ error: 'Assignments are temporarily unavailable' }, { status: 503 });
  if (!assignments?.length) return NextResponse.json({ deadlines: [] }, { headers: { 'Cache-Control': 'private, no-store' } });

  const frameworkIds = assignments.map((a: { framework_id: string }) => a.framework_id);
  const complianceMap = Object.fromEntries(
    assignments.map((a: { framework_id: string; id: string }) => [a.framework_id, a.id])
  );

  const today = new Date().toISOString().split('T')[0];
  const untilDate = new Date();
  untilDate.setDate(untilDate.getDate() + upcoming);
  const untilStr = untilDate.toISOString().split('T')[0];

  let deadlinesQuery = (db as any)
    .from('compliance_deadlines')
    .select(`
      *,
      compliance_frameworks (
        id, name, short_name,
        compliance_countries ( id, name, iso2, flag_emoji ),
        compliance_types ( id, name, code )
      ),
      compliance_filing_cycles ( id, cycle_code, cycle_label ),
      financial_year_structures ( id, label, short_label )
    `)
    .in('framework_id', frameworkIds)
    .eq('is_active', true)
    .order('due_date', { ascending: true });

  if (fyId) deadlinesQuery = deadlinesQuery.eq('financial_year_id', fyId);
  if (!includeAll) deadlinesQuery = deadlinesQuery.lte('due_date', untilStr);

  const [deadlinesRes, filingsRes] = await Promise.all([
    deadlinesQuery,
    (db as any)
      .from('client_compliance_filings')
      .select('id, deadline_id, status, submission_date, reference_number')
      .eq('client_id', actor.clientId),
  ]);

  if (deadlinesRes.error || filingsRes.error) return NextResponse.json({ error: 'Deadlines and filings are temporarily unavailable' }, { status: 503 });

  const filingsByDeadline = Object.fromEntries(
    (filingsRes.data ?? []).map((f: { deadline_id: string }) => [f.deadline_id, f])
  );

  const enriched = (deadlinesRes.data ?? []).map((d: { id: string; due_date: string; framework_id: string }) => {
    const daysRemaining = Math.round(
      (new Date(d.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
    );
    const filing = filingsByDeadline[d.id] || null;
    let urgency: 'critical' | 'high' | 'medium' | 'low' = 'low';
    if (filing?.status === 'approved') urgency = 'low';
    else if (daysRemaining < 0) urgency = 'critical';
    else if (daysRemaining <= 7) urgency = 'critical';
    else if (daysRemaining <= 15) urgency = 'high';
    else if (daysRemaining <= 30) urgency = 'medium';

    return {
      ...d,
      compliance_id: complianceMap[d.framework_id] || null,
      days_remaining: daysRemaining,
      is_overdue: daysRemaining < 0 && (!filing || !['submitted','approved'].includes(filing.status)),
      urgency,
      filing,
    };
  });

  return NextResponse.json({ deadlines: enriched }, { headers: { 'Cache-Control': 'private, no-store' } });
}
