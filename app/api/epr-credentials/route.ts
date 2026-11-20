/**
 * GET   /api/epr-credentials       — client's own credentials (read-only, masked password)
 * PATCH /api/epr-credentials       — propose an edit (sets pending_edit + pending_status)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveClient(): Promise<{ userId: string } | null> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['client'].includes(profile?.role || '')) return null;
  return { userId: user.id };
}

export async function GET() {
  const actor = await resolveClient();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();
  const { data, error } = await (db as any)
    .from('epr_credentials')
    .select('id, waste_category, cpcb_login_link, username, password, otp_receiver, last_changed_date, comment, pending_edit, pending_status, pending_requested_at, created_at, updated_at')
    .eq('client_id', actor.userId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credentials: data || [] });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveClient();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, waste_category, cpcb_login_link, username, password, otp_receiver, last_changed_date, comment } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminDb();

  // Verify this credential belongs to this client
  const { data: row } = await (db as any)
    .from('epr_credentials')
    .select('id, client_id, pending_status')
    .eq('id', id)
    .eq('client_id', actor.userId)
    .maybeSingle();

  if (!row) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  if (row.pending_status === 'pending') {
    return NextResponse.json({ error: 'A change is already pending admin approval' }, { status: 409 });
  }

  const pending_edit = {
    waste_category: waste_category ?? undefined,
    cpcb_login_link: cpcb_login_link ?? null,
    username: username ?? null,
    password: password ?? null,
    otp_receiver: otp_receiver ?? null,
    last_changed_date: last_changed_date ?? null,
    comment: comment ?? null,
  };

  const { data, error } = await (db as any)
    .from('epr_credentials')
    .update({
      pending_edit,
      pending_status: 'pending',
      pending_requested_at: new Date().toISOString(),
      pending_requested_by: actor.userId,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credential: data });
}
