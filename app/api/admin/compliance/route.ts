import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const revalidate = 1800;

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];

function weekBucket(dateLike: string) {
  const d = new Date(dateLike);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return monday.toISOString().slice(0, 10);
}

async function validateAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { supabase, ok: false as const };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { supabase, ok: ['admin', 'manager'].includes(profile?.role || '') };
}

export async function GET() {
  const { supabase, ok } = await validateAdminManager();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);

  const [
    { data: services, error: servicesError },
    { data: clients },
    { data: profiles }
  ] = await Promise.all([
    (supabase as any)
      .from('services')
      .select('id, client_id, waste_category, service_type, status, due_date, assigned_to'),
    (supabase as any)
      .from('clients')
      .select('id, profile_id'),
    (supabase as any)
      .from('profiles')
      .select('id, company_name, full_name')
  ]);

  if (servicesError) {
    return NextResponse.json({ error: servicesError.message }, { status: 500 });
  }

  const serviceRows = services || [];

  const byCategory = CATEGORIES.map((category) => {
    const rows = serviceRows.filter((row: any) => row.waste_category === category);
    const clientSet = new Set(rows.map((row: any) => row.client_id));
    const filed = rows.filter((row: any) => ['Filed', 'Approved'].includes(row.status)).length;
    const pending = rows.filter((row: any) => ['Pending', 'In Progress'].includes(row.status)).length;
    const overdue = rows.filter((row: any) => row.status === 'Overdue').length;

    const clientScores = new Map<string, number[]>();
    for (const row of rows) {
      const current = clientScores.get(row.client_id) || [];
      let score = 50;
      if (row.status === 'Approved') score = 100;
      else if (row.status === 'Filed') score = 80;
      else if (row.status === 'In Progress') score = 60;
      else if (row.status === 'Pending') score = 40;
      else if (row.status === 'Overdue') score = 20;
      current.push(score);
      clientScores.set(row.client_id, current);
    }

    const scoreValues = Array.from(clientScores.values()).map(
      (values) => values.reduce((a, b) => a + b, 0) / values.length
    );

    const atRiskCount = scoreValues.filter((v) => v < 50).length;
    const avgScore = scoreValues.length
      ? Number((scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length).toFixed(2))
      : 0;

    return {
      category,
      total_clients: clientSet.size,
      filed,
      pending,
      overdue,
      avg_score: avgScore,
      at_risk_count: atRiskCount
    };
  });

  const deadlineWeekMap = new Map<string, number>();
  for (const row of serviceRows) {
    if (!row.due_date || row.status === 'Approved') continue;
    const due = new Date(`${row.due_date}T00:00:00Z`);
    if (due < now || due > in30) continue;
    const bucket = weekBucket(row.due_date);
    deadlineWeekMap.set(bucket, Number((deadlineWeekMap.get(bucket) || 0) + 1));
  }

  const deadlines = Array.from(deadlineWeekMap.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));

  const profileMap = new Map<string, any>((profiles || []).map((row: any) => [row.id, row]));
  const clientMap = new Map<string, any>((clients || []).map((row: any) => [row.id, row]));

  const riskRows = (clients || []).map((client: any) => {
    const clientServices = serviceRows.filter((row: any) => row.client_id === client.id);
    const total = clientServices.length || 1;
    const overdue = clientServices.filter((row: any) => row.status === 'Overdue').length;
    const pending = clientServices.filter((row: any) => ['Pending', 'In Progress'].includes(row.status)).length;
    const approved = clientServices.filter((row: any) => ['Approved', 'Filed'].includes(row.status)).length;

    const score = Math.max(0, Math.min(100, Math.round(((approved * 100) + (pending * 60) + (overdue * 20)) / total)));

    let reason = 'Stable compliance';
    if (overdue > 0) reason = `${overdue} overdue filings require intervention`;
    else if (pending > 0) reason = `${pending} filings pending action`;

    const profile = profileMap.get(client.profile_id);
    const client_name = profile?.company_name || profile?.full_name || 'Client';

    return {
      client_id: client.id,
      client_name,
      score,
      reason,
      overdue,
      pending
    };
  });

  const atRisk = riskRows
    .filter((row) => row.score < 60)
    .sort((a, b) => a.score - b.score)
    .slice(0, 5)
    .map(({ overdue, pending, ...rest }) => rest);

  return NextResponse.json({ byCategory, deadlines, atRisk });
}
