import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export async function GET(request: Request) {
  try {
    const cookieHeader = String(request.headers.get('cookie') || '');
    const isDevBypass =
      process.env.NODE_ENV !== 'production' &&
      cookieHeader.split(';').some((cookie) => cookie.trim() === 'dev-admin-bypass=1');

    if (isDevBypass) {
      return NextResponse.json({ statusRows: [], topClients: [], warning: 'Local admin bypass mode active.' });
    }

    const supabase = await createServerComponentClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const isAllowed = ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
    if (!isAllowed) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch clients with their status from the clients table
    const { data: clientsData } = await (supabase as any)
      .from('clients')
      .select('id, status, profile_id');

    // Build status summary
    const statusMap = new Map<string, number>();
    for (const c of clientsData || []) {
      const s = c.status || 'Unknown';
      statusMap.set(s, (statusMap.get(s) || 0) + 1);
    }
    const statusRows = Array.from(statusMap.entries()).map(([status, count]) => ({ status, count }));

    // Top clients by invoice value
    const { data: invoicesData } = await (supabase as any)
      .from('invoices')
      .select('client_id, total_inr, status')
      .eq('status', 'Paid');

    const clientLtvMap = new Map<string, number>();
    for (const inv of invoicesData || []) {
      const prev = clientLtvMap.get(inv.client_id) || 0;
      clientLtvMap.set(inv.client_id, prev + Number(inv.total_inr || 0));
    }

    // Get profile names for top clients
    const sortedClientIds = [...clientLtvMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    const { data: topProfiles } = sortedClientIds.length
      ? await (supabase as any)
          .from('clients')
          .select('id, profile_id, profiles!inner(company_name, full_name)')
          .in('id', sortedClientIds)
      : { data: [] };

    const topClients = sortedClientIds.map((id) => {
      const row = (topProfiles || []).find((r: any) => r.id === id);
      const name = row?.profiles?.company_name || row?.profiles?.full_name || id;
      return { id, name, ltv: clientLtvMap.get(id) || 0 };
    });

    return NextResponse.json({ statusRows, topClients, warning: '' });
  } catch (error: any) {
    return NextResponse.json(
      { statusRows: [], topClients: [], warning: error?.message || 'Metrics service temporarily unavailable.' },
      { status: 200 }
    );
  }
}
