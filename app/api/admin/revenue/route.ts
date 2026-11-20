import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const revalidate = 3600;

function linearRegressionForecast(values: number[], monthsAhead = 3) {
  const n = values.length;
  if (n < 2) return [] as number[];

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i += 1) {
    const x = i + 1;
    const y = Number(values[i] || 0);
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const denominator = n * sumX2 - sumX * sumX;
  const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  const out: number[] = [];
  for (let i = 1; i <= monthsAhead; i += 1) {
    const x = n + i;
    out.push(Math.max(0, Number((intercept + slope * x).toFixed(2))));
  }
  return out;
}

function toMonthKey(dateLike?: string | null) {
  if (!dateLike) return null;
  return String(dateLike).slice(0, 7);
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

export async function GET(request: Request) {
  const { supabase, ok } = await validateAdminManager();
  if (!ok) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const months = Math.max(1, Math.min(24, Number(searchParams.get('months') || 12)));
  const breakdown = searchParams.get('breakdown') || 'service';

  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - (months - 1), 1));

  const { data: invoices, error } = await (supabase as any)
    .from('invoices')
    .select('id, total_inr, issued_date, paid_date, service_id, status')
    .gte('issued_date', start.toISOString().slice(0, 10))
    .order('issued_date', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const serviceIds = [...new Set((invoices || []).map((row: any) => row.service_id).filter(Boolean))];
  const { data: services } = serviceIds.length
    ? await (supabase as any)
        .from('services')
        .select('id, service_type, waste_category, assigned_to')
        .in('id', serviceIds)
    : { data: [] };

  const managerIds = [...new Set((services || []).map((row: any) => row.assigned_to).filter(Boolean))];
  const { data: managers } = managerIds.length
    ? await (supabase as any)
        .from('profiles')
        .select('id, full_name')
        .in('id', managerIds)
    : { data: [] };

  const serviceMap = new Map<string, any>((services || []).map((row: any) => [row.id, row]));
  const managerMap = new Map<string, string>((managers || []).map((row: any) => [row.id, row.full_name || row.id]));

  const monthlyMap = new Map<string, { month: string; billed: number; collected: number; leads: number }>();
  const breakdownMap = new Map<string, number>();

  for (const row of invoices || []) {
    const month = toMonthKey(row.issued_date);
    if (!month) continue;

    const current = monthlyMap.get(month) || { month, billed: 0, collected: 0, leads: 0 };
    current.billed += Number(row.total_inr || 0);

    if (row.paid_date && toMonthKey(row.paid_date) === month) {
      current.collected += Number(row.total_inr || 0);
    }

    monthlyMap.set(month, current);

    const service = serviceMap.get(row.service_id);
    let key = 'Unknown';
    if (breakdown === 'category') {
      key = service?.waste_category || 'Unknown';
    } else if (breakdown === 'manager') {
      key = managerMap.get(service?.assigned_to) || 'Unassigned';
    } else {
      key = service?.service_type || 'Unknown';
    }

    breakdownMap.set(key, Number((breakdownMap.get(key) || 0) + Number(row.total_inr || 0)));
  }

  const leadsByMonth = new Map<string, number>();
  const { data: leads } = await (supabase as any)
    .from('leads')
    .select('id, created_at')
    .gte('created_at', `${start.toISOString().slice(0, 10)}T00:00:00Z`);

  for (const lead of leads || []) {
    const month = toMonthKey(lead.created_at);
    if (!month) continue;
    leadsByMonth.set(month, Number((leadsByMonth.get(month) || 0) + 1));
  }

  const monthly = Array.from(monthlyMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({
      ...row,
      billed: Number(row.billed.toFixed(2)),
      collected: Number(row.collected.toFixed(2)),
      leads: leadsByMonth.get(row.month) || 0
    }));

  const recent = monthly.slice(-6).map((row) => row.collected);
  const predicted = linearRegressionForecast(recent, 3);
  const lastMonth = monthly.length ? monthly[monthly.length - 1].month : toMonthKey(new Date().toISOString()) || '';

  const forecast = predicted.map((value, idx) => {
    const [yy, mm] = lastMonth.split('-').map(Number);
    const nextDate = new Date(Date.UTC(yy, (mm - 1) + idx + 1, 1));
    return {
      month: nextDate.toISOString().slice(0, 7),
      collected: value
    };
  });

  const breakdownRows = Array.from(breakdownMap.entries())
    .map(([name, total]) => ({ name, total: Number(total.toFixed(2)) }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    monthly,
    breakdown: breakdownRows,
    forecast
  });
}
