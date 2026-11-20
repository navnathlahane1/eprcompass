import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
}

export async function GET(req: NextRequest) {
  try {
    const { deny } = await requireAdminSession();
    if (deny) return deny;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // format: "YYYY-MM"
    const db = adminClient() as any;

    let query = db
      .from('invoices')
      .select('id, total_inr, status, issued_date, service_type');

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1).toISOString().slice(0, 10);
      const end = new Date(year, mon, 1).toISOString().slice(0, 10);
      query = query.gte('issued_date', start).lt('issued_date', end);
    } else {
      // Default: last 12 months
      const since = new Date();
      since.setFullYear(since.getFullYear() - 1);
      query = query.gte('issued_date', since.toISOString().slice(0, 10));
    }

    const { data: invoices, error } = await query;
    if (error) throw error;

    const safe = invoices || [];
    const monthlyMap: Record<string, { revenue: number; invoices: number; service_type?: string }> = {};

    for (const inv of safe) {
      if (!inv.issued_date) continue;
      const lbl = monthLabel(inv.issued_date);
      if (!monthlyMap[lbl]) monthlyMap[lbl] = { revenue: 0, invoices: 0 };
      monthlyMap[lbl].invoices++;
      if (inv.status === 'Paid') {
        monthlyMap[lbl].revenue += Number(inv.total_inr) || 0;
      }
    }

    const rows = Object.entries(monthlyMap).map(([month, data]) => ({
      month,
      revenue_inr: Math.round(data.revenue),
      invoice_count: data.invoices,
    }));

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[analytics/revenue/monthly-chart]', err);
    return NextResponse.json({ error: 'Failed to load revenue data' }, { status: 500 });
  }
}
