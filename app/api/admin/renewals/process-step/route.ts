import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { processRenewalStep } from '@/lib/renewal/engine';

function isInternal(request: Request) {
  const secret = process.env.WHATSAPP_INTERNAL_SECRET || '';
  const incoming = request.headers.get('x-internal-secret') || '';
  return Boolean(secret && incoming && secret === incoming);
}

async function isAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return ['admin', 'manager'].includes(profile?.role || '');
}

export async function POST(request: Request) {
  if (!isInternal(request) && !(await isAdminManager())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const sequenceId = String(body?.sequenceId || '').trim();

  if (!sequenceId) {
    return NextResponse.json({ error: 'sequenceId is required' }, { status: 400 });
  }

  const result = await processRenewalStep(sequenceId);
  return NextResponse.json(result);
}
