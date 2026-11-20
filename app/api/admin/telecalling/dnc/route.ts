import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  let query = db.from('tc_dnc_registry')
    .select(`*, added_by_profile:profiles!tc_dnc_registry_added_by_fkey(full_name)`, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (q) {
    query = query.or(`phone.ilike.%${q}%,email.ilike.%${q}%`);
  }

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data, total: count, page, limit });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { phone, email, reason, expires_at } = body;
  if (!phone && !email) return NextResponse.json({ error: 'phone or email is required' }, { status: 400 });

  const db = makeServiceClient();

  // Check for existing entry
  let existingQuery = db.from('tc_dnc_registry').select('id');
  if (phone) existingQuery = existingQuery.eq('phone', phone);
  else existingQuery = existingQuery.eq('email', email);
  const { data: existing } = await existingQuery.maybeSingle();
  if (existing) return NextResponse.json({ error: 'Entry already exists in DNC registry' }, { status: 409 });

  const { data, error } = await db.from('tc_dnc_registry').insert({
    phone: phone || null,
    email: email || null,
    reason: reason || 'Manual addition',
    added_by: actor.userId,
    expires_at: expires_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entry: data }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const db = makeServiceClient();
  const { error } = await db.from('tc_dnc_registry').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
