import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { updateChecklistStep } from '@/lib/onboarding/templates';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getActor() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { user: null, role: null };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { user, role: profile?.role || null };
}

async function canAccessChecklist(checklist: any, actorId: string, role: string | null) {
  if (['admin', 'manager'].includes(role || '')) return true;

  const supabase = getSupabaseAdmin();

  if (checklist.entity_type === 'client') {
    const { data } = await (supabase as any).from('clients').select('profile_id').eq('id', checklist.entity_id).maybeSingle();
    return data?.profile_id === actorId;
  }

  if (checklist.entity_type === 'recycler') {
    const { data } = await (supabase as any).from('recyclers').select('profile_id').eq('id', checklist.entity_id).maybeSingle();
    return data?.profile_id === actorId;
  }

  if (checklist.entity_type === 'cepc') {
    const { data } = await (supabase as any).from('cepc_consultants').select('profile_id').eq('id', checklist.entity_id).maybeSingle();
    return data?.profile_id === actorId;
  }

  if (checklist.entity_type === 'partner') {
    const { data } = await (supabase as any).from('partners').select('profile_id').eq('id', checklist.entity_id).maybeSingle();
    return data?.profile_id === actorId;
  }

  return false;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await getActor();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const stepId = String(body?.stepId || '').trim();
  const done = Boolean(body?.done);

  if (!stepId) {
    return NextResponse.json({ error: 'stepId is required' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: checklist } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, entity_type, entity_id, steps, completion_pct')
    .eq('id', id)
    .maybeSingle();

  if (!checklist) return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });

  const allowed = await canAccessChecklist(checklist, user.id, role);
  if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const updated = await updateChecklistStep(id, stepId, done, user.id);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update step' }, { status: 500 });
  }
}
