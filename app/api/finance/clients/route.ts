/**
 * GET /api/finance/clients
 * Returns a list of all clients (id + name) for use in invoice creation dropdowns.
 */
import { NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data: cls, error } = await (db as any)
    .from('clients')
    .select('id, profile_id, status')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: any[] = cls ?? [];
  const pids = rows.map(c => c.profile_id).filter(Boolean);

  const nameMap: Record<string, string> = {};
  if (pids.length) {
    const { data: profs } = await db.from('profiles').select('id, company_name, full_name').in('id', pids);
    for (const p of profs ?? [])
      nameMap[(p as any).id] = (p as any).company_name || (p as any).full_name || 'Client';
  }

  const clients = rows.map(c => ({
    id:          c.id,
    client_name: nameMap[c.profile_id] || 'Unknown',
    status:      c.status,
  }));

  return NextResponse.json({ clients });
}
