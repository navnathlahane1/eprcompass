/**
 * POST /api/auth/clear-force-pw
 * Generic endpoint — clears force_password_change = false for the authenticated user.
 * Works for any portal (manager, taskmanager, IAM, finance, etc.)
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const dynamic = 'force-dynamic';

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function POST() {
  // Use createServerComponentClient — it handles all cookie formats including
  // chunked sb-<ref>-auth-token.0/.1 and the rotated token after password change.
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();
  await db.from('profiles').update({ force_password_change: false }).eq('id', user.id);

  return NextResponse.json({ ok: true });
}
