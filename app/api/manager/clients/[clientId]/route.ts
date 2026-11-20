/**
 * GET /api/manager/clients/[clientId]
 * Returns full client detail — only if the client is assigned to this manager.
 * Includes: profile info, filing statuses, recent documents.
 *
 * NOTE: We intentionally avoid PostgREST FK embeds on the main clients query
 * so that the profile UUID is preserved as a plain string. Instead we issue
 * a separate SELECT on profiles once we know the profile_id.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveManager, getAdminClient } from '@/lib/manager/auth';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const actor = await resolveManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { clientId } = await params;
  const db = getAdminClient();

  // ── 1. Verify this client is assigned to the current manager ─────────
  // No FK embed here — keeps profile_id as a plain UUID string.
  const { data: client, error: clientError } = await db
    .from('clients')
    .select('id, status, category, profile_id')
    .eq('id', clientId)
    .eq('assigned_manager_id', actor.id)
    .maybeSingle();

  if (clientError) {
    return NextResponse.json({ error: clientError.message }, { status: 500 });
  }
  if (!client) {
    return NextResponse.json(
      { error: 'Client not found or not assigned to you' },
      { status: 404 }
    );
  }

  const profileId = client.profile_id as string | null;

  // ── 2. Fetch profile row separately (safe — no embed ambiguity) ───────
  let profile: {
    full_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    gstin?: string | null;
    state?: string | null;
  } = {};

  if (profileId) {
    const { data: profileData } = await db
      .from('profiles')
      .select('full_name, company_name, phone, gstin, state')
      .eq('id', profileId)
      .maybeSingle();
    profile = profileData ?? {};
  }

  // ── 3. Fetch email from auth.users (not stored in profiles) ──────────
  let authEmail: string | null = null;
  if (profileId) {
    const { data: authData } = await db.auth.admin.getUserById(profileId);
    authEmail = authData?.user?.email ?? null;
  }

  // ── 4. Optional columns (may not exist until migration 091 runs) ──────
  // Cast via `any` and fall back to null so the route never 500s.
  const c = client as any;

  // ── 5. Filing statuses ────────────────────────────────────────────────
  const { data: filings } = await db
    .from('epr_filing_statuses')
    .select(`
      id, category, current_status, sla_due_at, created_at, updated_at,
      epr_financial_years ( id, label )
    `)
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false });

  // ── 6. Recent documents (last 20) ─────────────────────────────────────
  const { data: documents } = await db
    .from('epr_client_documents')
    .select('id, category, doc_type, document_name, status, upload_date, admin_comment, rejection_reason, epr_financial_years(label)')
    .eq('client_id', clientId)
    .order('upload_date', { ascending: false })
    .limit(20);

  return NextResponse.json({
    client: {
      id: client.id,
      status: client.status,
      category: client.category,
      waste_categories: c.waste_categories ?? [],
      onboarded_date: c.onboarded_date ?? null,
      renewal_date: c.renewal_date ?? null,
      notes: c.notes ?? null,
      health_score: c.health_score ?? null,
      ltv_inr: c.ltv_inr ?? null,
      profile_id: profileId,
      company_name: profile.company_name || null,
      full_name: profile.full_name || null,
      email: authEmail,
      phone: profile.phone || null,
      gstin: profile.gstin || null,
      state: profile.state || null,
    },
    filings: (filings ?? []).map((f: any) => ({
      id: f.id,
      category: f.category,
      current_status: f.current_status,
      sla_due_at: f.sla_due_at,
      updated_at: f.updated_at,
      fy_id: f.epr_financial_years?.id || null,
      fy_label: f.epr_financial_years?.label || '',
    })),
    documents: documents ?? [],
  });
}
