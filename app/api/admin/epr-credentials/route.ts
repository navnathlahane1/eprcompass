/**
 * GET  /api/admin/epr-credentials          — list all credentials (filterable by client_id)
 * POST /api/admin/epr-credentials          — create a new credential entry for a client
 * PATCH /api/admin/epr-credentials         — update, approve, or reject a credential
 * DELETE /api/admin/epr-credentials        — delete a credential (by id)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function validateAdmin(): Promise<{ ok: boolean; userId?: string }> {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isSuperAdmin = emailIsSuperAdmin(user.email);

  if (!['admin', 'manager'].includes(profile?.role || '') && !isSuperAdmin) {
    return { ok: false };
  }
  return { ok: true, userId: user.id };
}

export async function GET(req: NextRequest) {
  const { ok } = await validateAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminDb();
  const sp = req.nextUrl.searchParams;

  // Return list of client profiles for admin dropdowns
  if (sp.get('list_clients') === 'true') {
    const { data, error } = await (db as any)
      .from('profiles')
      .select('id, full_name, company_name')
      .eq('role', 'client')
      .order('company_name', { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const clients = (data || []).map((p: any) => ({
      id: p.id,
      label: p.company_name || p.full_name || p.id,
      email: '',
    }));
    return NextResponse.json({ clients });
  }

  const clientId = sp.get('client_id');
  const pendingOnly = sp.get('pending') === 'true';

  let q = (db as any)
    .from('epr_credentials')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) q = q.eq('client_id', clientId);
  if (pendingOnly) q = q.eq('pending_status', 'pending');

  const { data: creds, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Attach client names
  const clientIds: string[] = Array.from(new Set((creds || []).map((c: any) => c.client_id)));
  let profileMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const { data: profiles } = await (db as any)
      .from('profiles')
      .select('id, full_name, company_name')
      .in('id', clientIds);
    for (const p of profiles || []) {
      profileMap[p.id] = p.company_name || p.full_name || p.id;
    }
  }

  const result = (creds || []).map((c: any) => ({
    ...c,
    client_name: profileMap[c.client_id] || c.client_id,
  }));

  return NextResponse.json({ credentials: result });
}

export async function POST(req: NextRequest) {
  const { ok, userId } = await validateAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { client_id, waste_category, cpcb_login_link, username, password, otp_receiver, last_changed_date, comment } = body;

  if (!client_id || !waste_category) {
    return NextResponse.json({ error: 'client_id and waste_category are required' }, { status: 400 });
  }

  const db = adminDb();
  const { data, error } = await (db as any)
    .from('epr_credentials')
    .insert({
      client_id,
      waste_category,
      cpcb_login_link: cpcb_login_link || null,
      username: username || null,
      password: password || null,
      otp_receiver: otp_receiver || null,
      last_changed_date: last_changed_date || null,
      comment: comment || null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credential: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { ok, userId } = await validateAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, action, ...fields } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminDb();

  if (action === 'approve') {
    // Fetch current row to get pending_edit
    const { data: row, error: fetchErr } = await (db as any)
      .from('epr_credentials')
      .select('pending_edit')
      .eq('id', id)
      .single();

    if (fetchErr || !row) return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
    if (!row.pending_edit) return NextResponse.json({ error: 'No pending edit to approve' }, { status: 400 });

    const pe = row.pending_edit as Record<string, any>;
    const { data, error } = await (db as any)
      .from('epr_credentials')
      .update({
        waste_category: pe.waste_category ?? undefined,
        cpcb_login_link: pe.cpcb_login_link ?? null,
        username: pe.username ?? null,
        password: pe.password ?? null,
        otp_receiver: pe.otp_receiver ?? null,
        last_changed_date: pe.last_changed_date ?? null,
        comment: pe.comment ?? null,
        pending_edit: null,
        pending_status: null,
        pending_requested_at: null,
        pending_requested_by: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ credential: data });
  }

  if (action === 'reject') {
    const { data, error } = await (db as any)
      .from('epr_credentials')
      .update({ pending_edit: null, pending_status: null, pending_requested_at: null, pending_requested_by: null })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ credential: data });
  }

  // General update by admin
  const updateData: Record<string, any> = {};
  const allowed = ['waste_category', 'cpcb_login_link', 'username', 'password', 'otp_receiver', 'last_changed_date', 'comment'];
  for (const key of allowed) {
    if (key in fields) updateData[key] = fields[key] ?? null;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  }

  const { data, error } = await (db as any)
    .from('epr_credentials')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ credential: data });
}

export async function DELETE(req: NextRequest) {
  const { ok } = await validateAdmin();
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = adminDb();
  const { error } = await (db as any).from('epr_credentials').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
