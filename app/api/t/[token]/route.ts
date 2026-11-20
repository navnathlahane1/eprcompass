import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = db();

  const { data: share } = await supabase
    .from('trainer_profile_shares')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!share) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  if (share.is_revoked) return NextResponse.json({ error: 'revoked' }, { status: 410 });
  if (new Date(share.expires_at) < new Date()) return NextResponse.json({ error: 'expired' }, { status: 410 });

  // Increment view count (fire-and-forget)
  supabase
    .from('trainer_profile_shares')
    .update({ view_count: share.view_count + 1, last_viewed_at: new Date().toISOString() })
    .eq('id', share.id)
    .then(() => {});

  // Fetch trainer profile + clients + services
  const [{ data: profile }, { data: clients }, { data: services }, { data: userProfile }] = await Promise.all([
    supabase.from('trainer_profiles').select('*').eq('user_id', share.trainer_id).maybeSingle(),
    supabase.from('trainer_past_clients').select('*').eq('trainer_id', share.trainer_id).order('sort_order'),
    supabase.from('trainer_services').select('*').eq('trainer_id', share.trainer_id).eq('status', 'approved'),
    supabase.from('profiles').select('full_name, email').eq('id', share.trainer_id).maybeSingle(),
  ]);

  return NextResponse.json({
    share: {
      expires_at:       share.expires_at,
      recipient_name:   share.recipient_name,
      note_to_recipient: share.note_to_recipient,
    },
    trainer: {
      full_name:   userProfile?.full_name ?? null,
      ...profile,
    },
    clients:  clients ?? [],
    services: services ?? [],
  });
}
