/**
 * GET  /api/epr/comments/[filingId]  – threaded comments for a filing
 * POST /api/epr/comments/[filingId]  – add a new comment (client or admin)
 *
 * Clients cannot post admin-only comments and cannot see admin-only comments.
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

async function verifyFilingAccess(db: ReturnType<typeof adminClient>, filingId: string, actor: { userId: string; isAdmin: boolean }) {
  if (actor.isAdmin) return true;
  const { data } = await (db as any)
    .from('epr_filing_statuses')
    .select('client_id')
    .eq('id', filingId)
    .maybeSingle();
  return data?.client_id === actor.userId;
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = adminClient();
    const { filingId } = await params;

    const ok = await verifyFilingAccess(db, filingId, actor);
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    let query = (db as any)
      .from('epr_filing_comments')
      .select(`
        id, content, parent_id, is_admin_only, created_at, updated_at,
        author:profiles!author_id ( full_name, role )
      `)
      .eq('filing_status_id', filingId)
      .order('created_at', { ascending: true });

    // Clients cannot see admin-only comments
    if (!actor.isAdmin) {
      query = query.eq('is_admin_only', false);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ comments: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ filingId: string }> }
) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { filingId } = await params;
    const body = await req.json();
    const content: string = String(body.content ?? '').trim().slice(0, 3000);
    const parentId: string | null = body.parent_id ?? null;
    const isAdminOnly: boolean = actor.isAdmin ? (body.is_admin_only ?? false) : false;

    if (!content) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const db = adminClient();
    const ok = await verifyFilingAccess(db, filingId, actor);
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { data, error } = await (db as any)
      .from('epr_filing_comments')
      .insert({
        filing_status_id: filingId,
        author_id: actor.userId,
        content,
        parent_id: parentId,
        is_admin_only: isAdminOnly,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Notify the other party if it's a public comment
    if (!isAdminOnly) {
      // Fetch filing to find client
      const { data: filing } = await (db as any)
        .from('epr_filing_statuses')
        .select('client_id')
        .eq('id', filingId)
        .maybeSingle();

      const recipientId = actor.isAdmin ? filing?.client_id : null;
      if (recipientId) {
        await (db as any).from('epr_notification_queue').insert({
          type: 'new_comment',
          channel: 'in_app',
          recipient_id: recipientId,
          payload: { filing_id: filingId, comment_id: data.id },
        });
      }
    }

    return NextResponse.json({ comment: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
