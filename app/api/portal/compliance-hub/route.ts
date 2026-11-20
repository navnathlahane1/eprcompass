import { NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';

/** GET /api/portal/compliance-hub
 *  Returns the authenticated client's assigned compliance frameworks
 *  with summary stats for the hub dashboard.
 */
export async function GET() {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const clientId = actor.clientId;
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const in30Str = in30Days.toISOString().split('T')[0];

  const [assignmentsRes, tasksRes, notificationsRes] = await Promise.all([
    // Assigned compliance frameworks
    (db as any)
      .from('client_compliances')
      .select(`
        *,
        compliance_frameworks (
          id, name, short_name, description, legal_reference, portal_url,
          applicability_criteria, filing_notes,
          compliance_countries ( id, name, iso2, flag_emoji ),
          compliance_types ( id, name, code, category, region ),
          regulatory_authorities ( id, name, acronym, website_url, portal_url ),
          compliance_filing_cycles ( id, cycle_code, cycle_label, cycle_type, sort_order ),
          compliance_document_requirements ( id, document_name, is_mandatory, display_order, is_active )
        )
      `)
      .eq('client_id', clientId)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),

    // Upcoming + overdue tasks
    (db as any)
      .from('client_compliance_tasks')
      .select(`
        id, title, task_type, due_date, priority, status,
        compliance_deadlines ( id, title, filing_type, due_date )
      `)
      .eq('client_id', clientId)
      .not('status', 'in', '("completed","waived")')
      .order('due_date', { ascending: true })
      .limit(20),

    // Unread notifications
    (db as any)
      .from('compliance_notifications')
      .select('id, title, message, notification_type, created_at, is_read')
      .eq('client_id', clientId)
      .eq('recipient_id', actor.userId)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (assignmentsRes.error || tasksRes.error || notificationsRes.error) {
    return NextResponse.json({ error: 'Compliance data is temporarily unavailable' }, { status: 503 });
  }

  const assignments = assignmentsRes.data ?? [];
  const tasks = tasksRes.data ?? [];

  // For each assignment, fetch its upcoming deadlines + filing statuses
  const frameworkIds = assignments.map((a: { framework_id: string }) => a.framework_id);

  const [deadlinesRes, filingsRes] = await Promise.all([
    frameworkIds.length
      ? (db as any)
          .from('compliance_deadlines')
          .select(`
            *,
            compliance_filing_cycles ( id, cycle_code, cycle_label )
          `)
          .in('framework_id', frameworkIds)
          .eq('is_active', true)
          .gte('due_date', today)
          .order('due_date', { ascending: true })
      : Promise.resolve({ data: [], error: null }),

    assignments.length
      ? (db as any)
          .from('client_compliance_filings')
          .select('id, compliance_id, deadline_id, status, submission_date, reference_number')
          .eq('client_id', clientId)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (deadlinesRes.error || filingsRes.error) {
    return NextResponse.json({ error: 'Deadline and filing data is temporarily unavailable' }, { status: 503 });
  }
  const deadlines = deadlinesRes.data ?? [];
  const filings = filingsRes.data ?? [];
  const filingMap = Object.fromEntries(filings.map((f: { deadline_id: string; status: string }) => [f.deadline_id, f]));

  // Attach deadlines and filing status to each assignment
  const enrichedAssignments = assignments.map((a: { framework_id: string; id: string }) => {
    const fwDeadlines = deadlines
      .filter((d: { framework_id: string }) => d.framework_id === a.framework_id)
      .map((d: { id: string; due_date: string }) => ({
        ...d,
        filing_status: filingMap[d.id] || null,
        days_remaining: Math.round(
          (new Date(d.due_date).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
        ),
      }));
    return { ...a, deadlines: fwDeadlines };
  });

  // Summary stats
  const overdueCount = tasks.filter((t: { status: string; due_date: string }) =>
    t.status !== 'completed' && t.status !== 'waived' && t.due_date && t.due_date < today
  ).length;

  const upcoming30Count = deadlines.filter((d: { due_date: string }) => d.due_date <= in30Str).length;

  const summary = {
    total_frameworks: assignments.length,
    active_tasks: tasks.filter((t: { status: string }) => t.status === 'pending' || t.status === 'in_progress').length,
    overdue_tasks: overdueCount,
    upcoming_deadlines_30d: upcoming30Count,
    unread_notifications: notificationsRes.data?.length ?? 0,
  };

  return NextResponse.json({
    assignments: enrichedAssignments,
    tasks,
    notifications: notificationsRes.data ?? [],
    summary,
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
