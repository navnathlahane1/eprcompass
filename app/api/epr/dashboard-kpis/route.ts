/**
 * GET /api/epr/dashboard-kpis
 * Returns live EPR workflow counts for the admin dashboard KPI strip.
 * Admin/manager access only.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

export const revalidate = 60; // cache for 60s

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await (supabase as any)
    .from('profiles').select('role').eq('id', user.id).maybeSingle();
  const ok = ['admin', 'manager'].includes(profile?.role ?? '') || isSuperAdmin(user.email);
  if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const db = adminClient();
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const [
    { count: pendingFilings },
    { count: slaBreached },
    { count: docsAwaitingReview },
    { count: certsThisMonth },
  ] = await Promise.all([
    (db as any)
      .from('epr_filing_statuses')
      .select('id', { count: 'exact', head: true })
      .in('current_status', ['Pending', 'Documents Submitted', 'Under Review', 'Query Raised']),
    (db as any)
      .from('epr_filing_statuses')
      .select('id', { count: 'exact', head: true })
      .eq('sla_status', 'Breached'),
    (db as any)
      .from('epr_client_documents')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'Received'),
    (db as any)
      .from('epr_filing_statuses')
      .select('id', { count: 'exact', head: true })
      .eq('current_status', 'Certificate Issued')
      .gte('updated_at', monthStart),
  ]);

  return NextResponse.json({
    pending_filings: pendingFilings ?? 0,
    sla_breached: slaBreached ?? 0,
    docs_awaiting_review: docsAwaitingReview ?? 0,
    certificate_issued_this_month: certsThisMonth ?? 0,
  });
}
