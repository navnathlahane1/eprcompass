/**
 * PATCH /api/finance/clients/[id]/gstin — save client GSTIN
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z\d]$/;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { gstin } = await req.json().catch(() => ({}));

  if (gstin && !GSTIN_RE.test(String(gstin).toUpperCase().trim())) {
    return NextResponse.json({ error: 'Invalid GSTIN format' }, { status: 400 });
  }

  const db = getServiceClient();
  const { error } = await (db as any)
    .from('clients')
    .update({ gstin: gstin ? String(gstin).toUpperCase().trim() : null })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
