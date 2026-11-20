import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export const revalidate = 900;

function monthRange(offsetMonths: number) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths, 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offsetMonths + 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10)
  };
}

function pctDelta(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
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

  const ok = ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
  return { supabase, ok: ok as boolean };
}

export async function GET() {
  const { supabase, ok } = await validateAdminManager();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: mvRow, error: mvError } = await (supabase as any)
    .from('mv_dashboard_kpis')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (mvError) {
    return NextResponse.json({ error: mvError.message }, { status: 500 });
  }

  const currentMonth = monthRange(0);
  const lastMonth = monthRange(-1);

  const [
    { data: currentInvoices },
    { data: lastInvoices },
    { data: currentLeads },
    { data: lastLeads },
    { data: currentWon },
    { data: lastWon }
  ] = await Promise.all([
    (supabase as any)
      .from('invoices')
      .select('total_inr, status, paid_date, issued_date')
      .gte('issued_date', currentMonth.start)
      .lt('issued_date', currentMonth.end),
    (supabase as any)
      .from('invoices')
      .select('total_inr, status, paid_date, issued_date')
      .gte('issued_date', lastMonth.start)
      .lt('issued_date', lastMonth.end),
    (supabase as any)
      .from('leads')
      .select('id, stage, created_at, converted_at')
      .gte('created_at', `${currentMonth.start}T00:00:00Z`)
      .lt('created_at', `${currentMonth.end}T00:00:00Z`),
    (supabase as any)
      .from('leads')
      .select('id, stage, created_at, converted_at')
      .gte('created_at', `${lastMonth.start}T00:00:00Z`)
      .lt('created_at', `${lastMonth.end}T00:00:00Z`),
    (supabase as any)
      .from('leads')
      .select('id, stage, converted_at')
      .eq('stage', 'Won')
      .gte('converted_at', `${currentMonth.start}T00:00:00Z`)
      .lt('converted_at', `${currentMonth.end}T00:00:00Z`),
    (supabase as any)
      .from('leads')
      .select('id, stage, converted_at')
      .eq('stage', 'Won')
      .gte('converted_at', `${lastMonth.start}T00:00:00Z`)
      .lt('converted_at', `${lastMonth.end}T00:00:00Z`)
  ]);

  const sum = (rows: any[], predicate?: (row: any) => boolean) =>
    (rows || []).reduce((acc, row) => (predicate && !predicate(row) ? acc : acc + Number(row.total_inr || 0)), 0);

  const currentRevenue = sum(currentInvoices || []);
  const lastRevenue = sum(lastInvoices || []);

  const currentCollected = sum(
    currentInvoices || [],
    (row) => Boolean(row.paid_date) && String(row.paid_date).slice(0, 7) === currentMonth.start.slice(0, 7)
  );
  const lastCollected = sum(
    lastInvoices || [],
    (row) => Boolean(row.paid_date) && String(row.paid_date).slice(0, 7) === lastMonth.start.slice(0, 7)
  );

  const currentOverdue = sum(currentInvoices || [], (row) => row.status === 'Overdue');
  const lastOverdue = sum(lastInvoices || [], (row) => row.status === 'Overdue');

  const deltas = {
    revenue_this_month: pctDelta(currentRevenue, lastRevenue),
    collected_this_month: pctDelta(currentCollected, lastCollected),
    total_overdue: pctDelta(currentOverdue, lastOverdue),
    leads_this_month: pctDelta((currentLeads || []).length, (lastLeads || []).length),
    conversions_this_month: pctDelta((currentWon || []).length, (lastWon || []).length)
  };

  return NextResponse.json({
    kpis: mvRow || {},
    deltas
  });
}
