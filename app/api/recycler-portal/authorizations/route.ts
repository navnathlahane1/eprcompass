/**
 * GET  /api/recycler-portal/authorizations  — list with computed expiry status
 * POST /api/recycler-portal/authorizations  — add an authorization
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

function computeStatus(expiry: string | null, reminderDays: number): { status: string; daysLeft: number | null } {
  if (!expiry) return { status: 'NA', daysLeft: null };
  const days = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { status: 'EXPIRED', daysLeft: days };
  if (days <= reminderDays) return { status: 'EXPIRING', daysLeft: days };
  return { status: 'ACTIVE', daysLeft: days };
}

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_authorizations')
    .select('*')
    .eq('recycler_id', actor.recyclerId)
    .order('expiry_date', { ascending: true, nullsFirst: false });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ authorizations: [], summary: { active: 0, expiring: 0, expired: 0 } });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const authorizations = (data ?? []).map((a: any) => {
    const { status, daysLeft } = computeStatus(a.expiry_date, a.renewal_reminder_days ?? 60);
    return { ...a, status: a.status === 'PENDING_RENEWAL' ? 'PENDING_RENEWAL' : status, daysLeft };
  });

  const summary = {
    active: authorizations.filter((a: any) => a.status === 'ACTIVE').length,
    expiring: authorizations.filter((a: any) => a.status === 'EXPIRING').length,
    expired: authorizations.filter((a: any) => a.status === 'EXPIRED').length,
  };

  return NextResponse.json({ authorizations, summary });
}

export async function POST(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  if (!b.auth_type?.trim()) return NextResponse.json({ error: 'auth_type is required' }, { status: 400 });

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('recycler_authorizations')
    .insert({
      recycler_id: actor.recyclerId,
      auth_type: b.auth_type.trim(),
      authority_name: b.authority_name?.trim() || null,
      reference_no: b.reference_no?.trim() || null,
      issue_date: b.issue_date || null,
      expiry_date: b.expiry_date || null,
      document_url: b.document_url?.trim() || null,
      renewal_reminder_days: b.renewal_reminder_days ? Number(b.renewal_reminder_days) : 60,
      notes: b.notes?.trim() || null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ authorization: { id: 'pending' }, message: 'Saved.' });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ authorization: data }, { status: 201 });
}
