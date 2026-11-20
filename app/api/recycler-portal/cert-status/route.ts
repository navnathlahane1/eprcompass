/**
 * GET /api/recycler-portal/cert-status
 * Returns CPCB certificate status for the current recycler.
 */
import { NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Recycler authentication required.' }, { status: 401 });

  const db = adminClient();

  try {
    const { data: recycler, error } = await (db as any)
      .from('recyclers')
      .select('id, cpcb_cert_no, cpcb_cert_expiry')
      .eq('id', actor.recyclerId)
      .maybeSingle();

    if (error || !recycler) {
      return NextResponse.json({ error: 'Recycler not found' }, { status: 404 });
    }

    const { cpcb_cert_no, cpcb_cert_expiry } = recycler;

    if (!cpcb_cert_no || !cpcb_cert_expiry) {
      return NextResponse.json({
        cpcb_cert_no: cpcb_cert_no ?? null,
        cpcb_cert_expiry: cpcb_cert_expiry ?? null,
        days_until_expiry: null,
        status: 'missing',
      });
    }

    const now = new Date();
    const expiry = new Date(cpcb_cert_expiry);
    const diffMs = expiry.getTime() - now.getTime();
    const days_until_expiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let status: 'valid' | 'expiring_soon' | 'expired' | 'missing';
    if (days_until_expiry < 0) {
      status = 'expired';
    } else if (days_until_expiry <= 90) {
      status = 'expiring_soon';
    } else {
      status = 'valid';
    }

    return NextResponse.json({ cpcb_cert_no, cpcb_cert_expiry, days_until_expiry, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal error' }, { status: 500 });
  }
}
