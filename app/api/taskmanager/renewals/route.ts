/**
 * GET /api/taskmanager/renewals
 * Certificate Expiry & Renewal Calendar.
 * Sources: epr_filing_statuses with issued/approved status → derive expiry from fy_label.
 * FY 2026-27 certificates expire March 31, 2027.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveTaskManager, getServiceClient } from '@/lib/taskmanager/auth';

export const dynamic = 'force-dynamic';

/** Parse "FY 2026-27" → expiry date = March 31 of the second year */
function fyToExpiry(fyLabel: string | null): string | null {
  if (!fyLabel) return null;
  const m = fyLabel.match(/(\d{4})-(\d{2,4})/);
  if (!m) return null;
  const startYear = parseInt(m[1]);
  const endYear   = m[2].length === 2 ? startYear + 1 : parseInt(m[2]);
  return `${endYear}-03-31`;
}

function expiryTier(days: number): string {
  if (days < 0)   return 'expired';
  if (days <= 7)  return 'critical';
  if (days <= 30) return 'urgent';
  if (days <= 60) return 'warning';
  if (days <= 90) return 'soon';
  return 'ok';
}

export async function GET(req: NextRequest) {
  const actor = await resolveTaskManager();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db  = getServiceClient();
  const now = new Date();
  const { searchParams } = new URL(req.url);
  const tier   = searchParams.get('tier')   ?? '';
  const search = searchParams.get('search') ?? '';

  // ── Fetch issued/approved filings as certificate proxies ─────────────────
  const { data: filings } = await db
    .from('epr_filing_statuses')
    .select('id, client_id, category, current_status, fy_label, sla_due_at, updated_at')
    .in('current_status', ['Certificate Issued', 'Approved', 'Submitted'])
    .order('fy_label', { ascending: false });

  if (!filings?.length) {
    return NextResponse.json({
      certificates: [],
      summary: { total: 0, expired: 0, critical: 0, urgent: 0, warning: 0, ok: 0 },
    });
  }

  // ── Client names ─────────────────────────────────────────────────────────
  const clientIds = [...new Set(filings.map(f => f.client_id).filter(Boolean))];
  const { data: clients } = clientIds.length
    ? await db.from('clients').select('id, name, assigned_manager_id').in('id', clientIds)
    : { data: [] };
  const cMap: Record<string, { name: string; mgr: string | null }> = {};
  for (const c of clients ?? []) cMap[c.id] = { name: c.name, mgr: c.assigned_manager_id };

  // Manager names
  const mgrIds = [...new Set((clients ?? []).map(c => c.assigned_manager_id).filter(Boolean))];
  const { data: managers } = mgrIds.length
    ? await db.from('profiles').select('id, full_name').in('id', mgrIds)
    : { data: [] };
  const mMap: Record<string, string> = {};
  for (const m of managers ?? []) mMap[m.id] = m.full_name ?? 'Unknown';

  // ── Build certificate objects ─────────────────────────────────────────────
  const certificates = filings.map(f => {
    const expiryStr = fyToExpiry(f.fy_label);
    const expiry    = expiryStr ? new Date(expiryStr) : null;
    const days      = expiry ? Math.ceil((expiry.getTime() - now.getTime()) / 86_400_000) : null;
    const tier      = days !== null ? expiryTier(days) : 'unknown';
    const ci        = f.client_id ? cMap[f.client_id] : null;

    return {
      id:          f.id,
      client_id:   f.client_id,
      client_name: ci?.name ?? 'Unknown Client',
      manager_name: ci?.mgr ? (mMap[ci.mgr] ?? 'Unknown') : null,
      category:    f.category,
      fy_label:    f.fy_label,
      status:      f.current_status,
      expiry_date: expiryStr,
      days_to_expiry: days,
      expiry_tier: tier,
      last_updated: f.updated_at,
    };
  });

  // ── Filters ───────────────────────────────────────────────────────────────
  let filtered = certificates;
  if (tier)   filtered = filtered.filter(c => c.expiry_tier === tier);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(c =>
      c.client_name.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    );
  }

  // Sort: most urgent first
  filtered.sort((a, b) => (a.days_to_expiry ?? 9999) - (b.days_to_expiry ?? 9999));

  const summary = {
    total:    certificates.length,
    expired:  certificates.filter(c => c.expiry_tier === 'expired').length,
    critical: certificates.filter(c => c.expiry_tier === 'critical').length,
    urgent:   certificates.filter(c => c.expiry_tier === 'urgent').length,
    warning:  certificates.filter(c => c.expiry_tier === 'warning').length,
    ok:       certificates.filter(c => ['ok', 'soon'].includes(c.expiry_tier)).length,
  };

  return NextResponse.json({ certificates: filtered, summary });
}
