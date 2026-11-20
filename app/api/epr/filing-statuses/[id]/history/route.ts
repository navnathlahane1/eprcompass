/**
 * GET  /api/epr/filing-statuses/[id]/history
 *   Returns the full status timeline for a filing (newest first).
 *   Admin sees all; client can only fetch history for their own filing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getActor() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const isAdminUser = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, isAdmin: isAdminUser };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();
    const { id } = await params;

    // Verify ownership if not admin
    if (!actor.isAdmin) {
      const { data: filing } = await (db as any)
        .from('epr_filing_statuses')
        .select('client_id')
        .eq('id', id)
        .maybeSingle();
      if (!filing || filing.client_id !== actor.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const { data, error } = await (db as any)
      .from('epr_filing_history')
      .select(`
        id, previous_status, new_status, comment, created_at,
        profiles ( full_name )
      `)
      .eq('filing_status_id', id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ history: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
