import { NextResponse } from 'next/server';
import { createServerComponentClient } from '../../../../../lib/supabase/createServerComponentClient';
import { sendTextMessage, sendTemplateMessage, TEMPLATES } from '../../../../../lib/whatsapp/client';
import { createClient } from '@supabase/supabase-js';

async function validateAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { ok: false as const };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { ok: ['admin', 'manager'].includes(profile?.role || '') };
}

function isInternal(request: Request) {
  const secret = process.env.WHATSAPP_INTERNAL_SECRET || '';
  const incoming = request.headers.get('x-internal-secret') || '';
  return Boolean(secret && incoming && secret === incoming);
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function isOptedOutPhone(phone: string) {
  const supabase = getSupabaseAdmin();

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('phone', phone)
    .maybeSingle();

  if (!profile?.id) return false;

  const { data: client } = await (supabase as any)
    .from('clients')
    .select('id')
    .eq('profile_id', profile.id)
    .maybeSingle();

  if (!client?.id) return false;

  const { data: optedOut } = await (supabase as any)
    .from('renewal_sequences')
    .select('id')
    .eq('client_id', client.id)
    .eq('sequence_status', 'Opted Out')
    .limit(1)
    .maybeSingle();

  return Boolean(optedOut?.id);
}

export async function POST(request: Request) {
  const internal = isInternal(request);
  if (!internal) {
    const { ok } = await validateAdminManager();
    if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const phone = String(body?.phone || '').trim();
  if (!phone) return NextResponse.json({ error: 'Missing phone' }, { status: 400 });

  if (body?.mode === 'template') {
    if (await isOptedOutPhone(phone)) {
      return NextResponse.json({ success: true, skipped: true, reason: 'Recipient opted out' });
    }

    const templateName = String(body?.templateName || '');
    const params = Array.isArray(body?.params) ? body.params.map((v: any) => String(v)) : [];

    const validTemplate = Object.values(TEMPLATES).includes(templateName as any);
    if (!validTemplate) {
      return NextResponse.json({ error: 'Invalid templateName' }, { status: 400 });
    }

    const result = await sendTemplateMessage(phone, templateName as any, params);
    return NextResponse.json(result);
  }

  const message = String(body?.message || '').trim();
  if (!message) return NextResponse.json({ error: 'Missing message' }, { status: 400 });

  const result = await sendTextMessage(phone, message);
  return NextResponse.json(result);
}
