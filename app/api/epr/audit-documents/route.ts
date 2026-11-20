/**
 * GET  /api/epr/audit-documents  – admin: all (filterable), client: own visible
 * POST /api/epr/audit-documents  – admin only: upload new audit document
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const VALID_MARK_AS = ['Draft', 'Final', 'Certified Copy'];

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

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const db = adminClient();

    // Admin sees all columns (including internal_note); client sees safe subset only
    const selectCols = actor.isAdmin
      ? `id, client_id, category, fy_id, doc_type, title, file_name, file_size,
         mark_as, visible_to_client, internal_note, client_note, created_at, updated_at,
         epr_financial_years ( label ),
         profiles ( full_name, company_name )`
      : `id, category, fy_id, doc_type, title, file_name, file_size,
         mark_as, client_note, created_at,
         epr_financial_years ( label )`;

    let query = (db as any)
      .from('epr_audit_documents')
      .select(selectCols)
      .order('created_at', { ascending: false });

    if (!actor.isAdmin) {
      // Client sees only own + visible
      query = query.eq('client_id', actor.userId).eq('visible_to_client', true);
    } else {
      if (sp.get('client_id')) query = query.eq('client_id', sp.get('client_id'));
      if (sp.get('fy_id'))     query = query.eq('fy_id', sp.get('fy_id'));
      if (sp.get('category'))  query = query.eq('category', sp.get('category'));
      if (sp.get('doc_type'))  query = query.eq('doc_type', sp.get('doc_type'));
      if (sp.get('visible') !== null) {
        const v = sp.get('visible');
        if (v === 'true' || v === 'false') query = query.eq('visible_to_client', v === 'true');
      }
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ documents: data ?? [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor?.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      client_id, category, fy_id, doc_type, title,
      file_path, file_name, file_size, mime_type,
      internal_note, client_note, mark_as,
      visible_to_client,
    } = body;

    if (!client_id || !category || !fy_id || !doc_type || !title?.trim() || !file_path) {
      return NextResponse.json({ error: 'Missing required audit document fields' }, { status: 400 });
    }

    if (mark_as && !VALID_MARK_AS.includes(mark_as)) {
      return NextResponse.json({ error: 'Invalid mark_as value' }, { status: 400 });
    }

    const db = adminClient();
    const { data, error } = await (db as any)
      .from('epr_audit_documents')
      .insert({
        client_id,
        category,
        fy_id,
        doc_type,
        title: title.trim(),
        file_path,
        file_name,
        file_size,
        mime_type,
        internal_note: internal_note?.trim() || null,
        client_note: client_note?.trim() || null,
        mark_as: mark_as || 'Draft',
        visible_to_client: !!visible_to_client,
        created_by: actor.userId,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Activity log
    await (db as any).from('epr_activity_log').insert({
      action: 'audit_document_uploaded',
      entity_type: 'audit_document',
      entity_id: data.id,
      actor_id: actor.userId,
      client_id,
      new_values: { doc_type, title: title.trim(), mark_as, visible_to_client },
    });

    return NextResponse.json({ document: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
