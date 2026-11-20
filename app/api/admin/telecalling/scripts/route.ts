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
  const campaignId = searchParams.get('campaign_id');
  const category = searchParams.get('category');
  const activeOnly = searchParams.get('active_only') !== 'false';

  let query = db.from('tc_call_scripts')
    .select(`*, created_by_profile:profiles!tc_call_scripts_created_by_fkey(full_name)`, { count: 'exact' })
    .order('created_at', { ascending: false });

  if (activeOnly) query = query.eq('is_active', true);
  if (campaignId) query = query.eq('campaign_id', campaignId);
  if (category) query = query.eq('category', category);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scripts: data, total: count });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { title, category, content, campaign_id } = body;
  if (!title || !content) return NextResponse.json({ error: 'title and content are required' }, { status: 400 });

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_call_scripts').insert({
    title,
    category: category || 'General',
    content,
    campaign_id: campaign_id || null,
    created_by: actor.userId,
    is_active: true,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ script: data }, { status: 201 });
}
