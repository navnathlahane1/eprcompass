/**
 * POST /api/recycler-portal/change-password
 * Changes password + clears force_password_change using the service role key.
 * This avoids needing a client-side Supabase session (which doesn't exist
 * when the user was created via IAM and hasn't gone through normal login flow).
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST(req: NextRequest) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { password } = body;
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const db = getServiceClient();

  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from('profiles').update({ force_password_change: false }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
