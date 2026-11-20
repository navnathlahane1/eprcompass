import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';

/** GET /api/portal/compliance-hub/calendar?year=2025&month=10
 *  Returns calendar events (deadlines + tasks) for a given month.
 *  Default: current month.
 */
export async function GET(req: NextRequest) {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year  = Number(searchParams.get('year') ?? now.getUTCFullYear());
  const month = Number(searchParams.get('month') ?? now.getUTCMonth() + 1);
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Select a valid month and year (2000-2100)' }, { status: 400 });
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1)).toISOString().split('T')[0];
  const monthEnd   = new Date(Date.UTC(year, month, 0)).toISOString().split('T')[0];

  // Get framework IDs for this client
  const { data: assignments, error: assignmentError } = await (db as any)
    .from('client_compliances')
    .select('id, framework_id')
    .eq('client_id', actor.clientId)
    .eq('status', 'active');

  if (assignmentError) return NextResponse.json({ error: 'Assignments are temporarily unavailable' }, { status: 503 });
  const frameworkIds = (assignments ?? []).map((a: { framework_id: string }) => a.framework_id);
  const complianceMap = Object.fromEntries(
    (assignments ?? []).map((a: { framework_id: string; id: string }) => [a.framework_id, a.id])
  );

  const [deadlinesRes, tasksRes] = await Promise.all([
    frameworkIds.length
      ? (db as any)
          .from('compliance_deadlines')
          .select(`
            id, title, due_date, filing_type, grace_period_days, framework_id,
            compliance_frameworks ( id, name, short_name,
              compliance_countries ( id, name, iso2, flag_emoji ),
              compliance_types ( id, name, code )
            ),
            compliance_filing_cycles ( cycle_code, cycle_label )
          `)
          .in('framework_id', frameworkIds)
          .eq('is_active', true)
          .gte('due_date', monthStart)
          .lte('due_date', monthEnd)
          .order('due_date', { ascending: true })
      : Promise.resolve({ data: [], error: null }),

    (db as any)
      .from('client_compliance_tasks')
      .select('id, title, due_date, task_type, status, priority, compliance_id')
      .eq('client_id', actor.clientId)
      .not('due_date', 'is', null)
      .gte('due_date', monthStart)
      .lte('due_date', monthEnd)
      .order('due_date', { ascending: true }),
  ]);

  if (deadlinesRes.error || tasksRes.error) return NextResponse.json({ error: 'Calendar data is temporarily unavailable' }, { status: 503 });
  // Also get filing statuses for the deadlines
  const deadlines = deadlinesRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  const { data: filings, error: filingError } = deadlines.length
    ? await (db as any)
        .from('client_compliance_filings')
        .select('deadline_id, status')
        .eq('client_id', actor.clientId)
        .in('deadline_id', deadlines.map((d: { id: string }) => d.id))
    : { data: [], error: null };
  if (filingError) return NextResponse.json({ error: 'Filing data is temporarily unavailable' }, { status: 503 });

  const filingMap = Object.fromEntries(
    (filings ?? []).map((f: { deadline_id: string; status: string }) => [f.deadline_id, f.status])
  );

  const today = new Date().toISOString().split('T')[0];

  // Build calendar event objects
  const events = [
    ...deadlines.map((d: { id: string; due_date: string; framework_id: string; filing_type: string; title: string; grace_period_days: number; compliance_frameworks?: unknown; compliance_filing_cycles?: unknown }) => {
      const filingStatus = filingMap[d.id];
      const daysRemaining = Math.round(
        (new Date(d.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        id: `deadline-${d.id}`,
        type: 'deadline',
        date: d.due_date,
        title: d.title,
        filing_type: d.filing_type,
        compliance_id: complianceMap[d.framework_id] || null,
        deadline_id: d.id,
        filing_status: filingStatus || 'pending',
        days_remaining: daysRemaining,
        is_overdue: daysRemaining < 0 && !['submitted','approved'].includes(filingStatus || ''),
        framework: d.compliance_frameworks,
        cycle: d.compliance_filing_cycles,
      };
    }),
    ...tasks.map((t: { id: string; due_date: string; title: string; task_type: string; status: string; priority: string; compliance_id: string }) => ({
      id: `task-${t.id}`,
      type: 'task',
      date: t.due_date,
      title: t.title,
      task_type: t.task_type,
      task_status: t.status,
      priority: t.priority,
      compliance_id: t.compliance_id,
      task_id: t.id,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Group by date for easy calendar rendering
  const byDate: Record<string, typeof events> = {};
  for (const ev of events) {
    if (!byDate[ev.date]) byDate[ev.date] = [];
    byDate[ev.date].push(ev);
  }

  return NextResponse.json({ events, byDate, month: { year, month } }, { headers: { 'Cache-Control': 'private, no-store' } });
}
