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

    let query = db.from('leads').select('id, status, source, created_at');

    if (month) {
      const [year, mon] = month.split('-').map(Number);
      const start = new Date(year, mon - 1, 1).toISOString();
      const end = new Date(year, mon, 1).toISOString();
      query = query.gte('created_at', start).lt('created_at', end);
    } else {
      const since = new Date();
      since.setDate(since.getDate() - 90);
      query = query.gte('created_at', since.toISOString());
    }

    const { data: leads, error } = await query;
    if (error) throw error;

    const safe = leads || [];
    const bySource: Record<string, { total: number; qualified: number; converted: number }> = {};

    for (const lead of safe) {
      const src = lead.source || 'Unknown';
      if (!bySource[src]) bySource[src] = { total: 0, qualified: 0, converted: 0 };
      bySource[src].total++;
      if (['Qualified', 'Proposal Sent', 'Negotiation', 'Converted'].includes(lead.status)) {
        bySource[src].qualified++;
      }
      if (lead.status === 'Converted') bySource[src].converted++;
    }

    const rows = Object.entries(bySource).map(([source, counts]) => ({
      source,
      total_leads: counts.total,
      qualified_leads: counts.qualified,
      converted_leads: counts.converted,
      conversion_rate: counts.total > 0
        ? ((counts.converted / counts.total) * 100).toFixed(2)
        : '0.00',
    }));

    rows.sort((a, b) => b.total_leads - a.total_leads);
    return NextResponse.json(rows);
  } catch (err: any) {
    console.error('[analytics/leads/funnel]', err);
    return NextResponse.json({ error: 'Failed to load leads funnel' }, { status: 500 });
  }
}
