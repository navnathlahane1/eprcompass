import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { deny } = await requireAdminSession();
    if (deny) return deny;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month'); // format: "YYYY-MM"
    const db = adminClient() as any;

    let query = db
      .from('compliance_obligations')
      .select('id, status, due_date, waste_category, created_at');

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1).toISOString();
      const end = new Date(year, mon, 1).toISOString();
      query = query.gte('created_at', start).lt('created_at', end);
    }

    const { data: obligations, error } = await query;
    if (error) throw error;

    const safe = obligations || [];
    const byCategory: Record<string, { total: number; approved: number; pending: number; overdue: number }> = {};
    const now = new Date();

    for (const ob of safe) {
      const cat = ob.waste_category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, approved: 0, pending: 0, overdue: 0 };
      byCategory[cat].total++;
      if (ob.status === 'Approved') {
        byCategory[cat].approved++;
      } else if (ob.due_date && new Date(ob.due_date) < now) {
        byCategory[cat].overdue++;
      } else {
        byCategory[cat].pending++;
      }
    }

    const rows = Object.entries(byCategory).map(([category, counts]) => ({
      category,
      total_obligations: counts.total,
      approved: counts.approved,
      pending: counts.pending,
      overdue: counts.overdue,
      fulfillment_rate: counts.total > 0
        ? ((counts.approved / counts.total) * 100).toFixed(1)
        : '0.0',
    }));

    rows.sort((a, b) => b.total_obligations - a.total_obligations);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[analytics/compliance/by-category]', err);
    return NextResponse.json({ error: 'Failed to load compliance data' }, { status: 500 });
  }
}
