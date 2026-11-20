/**
 * GET  /api/epr/filing-statuses
 *   – Admin: all statuses (filterable by client_id, category, fy_id, status)
 *   – Client: own statuses only
 *
 * POST /api/epr/filing-statuses
 *   – Admin only: create/upsert a filing status record + append history entry
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

const VALID_STATUSES = [
  'Pending',
  'Documents Submitted',
  'Under Review',
  'Query Raised',
  'Approved',
  'Certificate Issued',
];

const SLA_HOURS: Record<string, number> = {
  'Documents Submitted': 48,
  'Under Review': 72,
  'Query Raised': 96,
  Approved: 24,
};

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
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdminUser = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  return { userId: user.id, isAdmin: isAdminUser };
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const actor = await getActor();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const userClient = await createServerComponentClient();

    const applyFilters = (query: any) => {
      let next = query;
      // Non-admins can only see their own rows
      if (!actor.isAdmin) {
        next = next.eq('client_id', actor.userId);
      } else {
        // Admin filters
        if (sp.get('client_id')) next = next.eq('client_id', sp.get('client_id'));
        if (sp.get('category')) next = next.eq('category', sp.get('category'));
        if (sp.get('fy_id')) next = next.eq('fy_id', sp.get('fy_id'));
        if (sp.get('status')) next = next.eq('current_status', sp.get('status'));
      }
      return next;
    };

    // Portal/client reads should not require service-role credentials.
    if (!actor.isAdmin) {
      const userQuery = applyFilters(
        (userClient as any)
          .from('epr_filing_statuses')
          .select(`
            id, client_id, category, fy_id, current_status, sla_due_at, created_at, updated_at,
            epr_financial_years ( label )
          `)
          .order('updated_at', { ascending: false })
      );

      const { data: userData, error: userError } = await userQuery;
      if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
      }

      const rows = userData ?? [];
      return NextResponse.json({ statuses: rows, filings: rows });
    }

    const db = adminClient();

    const enrichedQuery = applyFilters(
      (db as any)
        .from('epr_filing_statuses')
        .select(`
          id, client_id, category, fy_id, current_status, sla_due_at, created_at, updated_at,
          epr_financial_years ( label ),
          profiles ( full_name, company_name, email )
        `)
        .order('updated_at', { ascending: false })
    );

    let { data, error } = await enrichedQuery;

    if (error) {
      // Fallback keeps portal loading even if relational selects are temporarily unavailable.
      const fallbackQuery = applyFilters(
        (db as any)
          .from('epr_filing_statuses')
          .select('id, client_id, category, fy_id, current_status, sla_due_at, created_at, updated_at')
          .order('updated_at', { ascending: false })
      );
      const fallback = await fallbackQuery;
      if (fallback.error) {
        return NextResponse.json({ error: fallback.error.message }, { status: 500 });
      }
      data = fallback.data;
      error = null;
    }

    const rows = data ?? [];
    return NextResponse.json({ statuses: rows, filings: rows });
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
    const { client_id, category, fy_id, status, comment } = body;

    if (!client_id || !category || !fy_id || !status || !comment?.trim()) {
      return NextResponse.json(
        { error: 'client_id, category, fy_id, status, and comment are required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    // XSS-safe: comment is stored as text and only returned via API, never injected into HTML
    const safeComment = String(comment).trim().slice(0, 2000);

    const db = adminClient();

    // Calculate SLA due date for the new status
    const slaDue = SLA_HOURS[status]
      ? new Date(Date.now() + SLA_HOURS[status] * 3600 * 1000).toISOString()
      : null;

    // Upsert the filing status row
    const { data: filing, error: upsertErr } = await (db as any)
      .from('epr_filing_statuses')
      .upsert(
        {
          client_id,
          category,
          fy_id,
          current_status: status,
          sla_due_at: slaDue,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'client_id,category,fy_id', ignoreDuplicates: false }
      )
      .select()
      .single();

    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

    // Append history entry
    await (db as any).from('epr_filing_history').insert({
      filing_status_id: filing.id,
      new_status: status,
      comment: safeComment,
      changed_by: actor.userId,
    });

    // Write activity log
    await (db as any).from('epr_activity_log').insert({
      action: 'filing_status_updated',
      entity_type: 'filing_status',
      entity_id: filing.id,
      actor_id: actor.userId,
      client_id,
      new_values: { status, comment: safeComment },
    });

    // Queue in_app notification for client
    await (db as any).from('epr_notification_queue').insert({
      type: 'status_changed',
      channel: 'in_app',
      recipient_id: client_id,
      payload: {
        filing_id: filing.id,
        category,
        new_status: status,
        comment: safeComment,
      },
    });

    return NextResponse.json({ filing }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
