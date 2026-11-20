/**
 * @openapi
 * /api/network/recyclers/import:
 *   post:
 *     summary: Bulk import recyclers via CSV (super-admin only)
 *     tags: [Recycler Network]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rows: { type: array }
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';
import { validateCsvRow, type CsvImportRow } from '@/lib/recyclerNetwork/recyclerNetworkService';

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const rows: CsvImportRow[] = Array.isArray(body.rows) ? body.rows : [];

  if (!rows.length) return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
  if (rows.length > 500) return NextResponse.json({ error: 'Max 500 rows per import' }, { status: 400 });

  const results = rows.map((row, i) => validateCsvRow(row, i + 1));
  const valid = results.filter((r) => r.errors.length === 0);
  const invalid = results.filter((r) => r.errors.length > 0);

  if (!valid.length) {
    return NextResponse.json({ imported: 0, errors: invalid.map((r) => ({ row: r.rowIndex, errors: r.errors })) }, { status: 422 });
  }

  const db = adminClient();
  const toInsert = valid.map((r) => ({
    name: r.valid.name,
    type: r.valid.type ?? 'RECYCLER',
    registration_number: r.valid.registration_number ?? null,
    epr_categories: r.valid.epr_categories,
    authorized_states: r.valid.authorized_states,
    certifications: r.valid.certifications,
    contact_email: r.valid.contact_email ?? null,
    contact_phone: r.valid.contact_phone ?? null,
    contact_address: r.valid.contact_address ?? null,
    contact_pincode: r.valid.contact_pincode ?? null,
    verification_status: 'PENDING',
    geocode_queued: true,
  }));

  const { data, error } = await (db as any).from('recyclers').insert(toInsert).select('id, recycler_code');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    imported: data?.length ?? 0,
    skipped: invalid.length,
    errors: invalid.map((r) => ({ row: r.rowIndex, errors: r.errors })),
  });
}
