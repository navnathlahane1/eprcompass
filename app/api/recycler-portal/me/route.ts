/**
 * GET  /api/recycler-portal/me  — returns current recycler's profile
 * PATCH /api/recycler-portal/me — update notification prefs / bank details
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();
  const { data: recycler, error } = await (db as any)
    .from('recyclers')
    .select(
      'id, recycler_code, name, type, epr_categories, authorized_states, certifications, ' +
      'verification_status, contact_email, contact_phone, contact_address, city, state, ' +
      'capacity, last_audit_date, next_audit_due, onboarded_at, verified_at, ' +
      'assigned_compliance_officer, documents_count, training_completed'
    )
    .eq('id', actor.recyclerId)
    .maybeSingle();

  if (error || !recycler) {
    return NextResponse.json({ error: 'Recycler profile not found' }, { status: 404 });
  }

  // Load notification prefs
  const { data: prefs } = await (db as any)
    .from('recycler_notification_prefs')
    .select('channels, type_overrides, digest_mode')
    .eq('recycler_id', actor.recyclerId)
    .maybeSingle();

  // Load compliance officer profile if assigned
  let complianceOfficer: { id: string; full_name: string; email: string } | null = null;
  if (recycler.assigned_compliance_officer) {
    const { data: co } = await (db as any)
      .from('profiles')
      .select('id, full_name, email')
      .eq('id', recycler.assigned_compliance_officer)
      .maybeSingle();
    complianceOfficer = co ?? null;
  }

  return NextResponse.json({ recycler, notificationPrefs: prefs ?? null, complianceOfficer, memberRole: actor.memberRole });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const db = adminClient();

  const allowed: Record<string, unknown> = {};
  if (body.notificationPrefs !== undefined) {
    // Upsert notification prefs
    await (db as any).from('recycler_notification_prefs').upsert(
      {
        recycler_id: actor.recyclerId,
        ...(body.notificationPrefs.channels && { channels: body.notificationPrefs.channels }),
        ...(body.notificationPrefs.typeOverrides && { type_overrides: body.notificationPrefs.typeOverrides }),
        ...(body.notificationPrefs.digestMode && { digest_mode: body.notificationPrefs.digestMode }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'recycler_id' }
    );
  }

  if (body.bankDetails !== undefined) {
    allowed.bank_details = body.bankDetails;
  }

  if (body.profileDetails !== undefined) {
    const pd = body.profileDetails;
    if (pd.contact_phone !== undefined) allowed.contact_phone = pd.contact_phone?.trim() || null;
    if (pd.contact_address !== undefined) allowed.contact_address = pd.contact_address?.trim() || null;
    if (pd.city !== undefined) allowed.city = pd.city?.trim() || null;
    if (pd.state !== undefined) allowed.state = pd.state?.trim() || null;
  }

  if (Object.keys(allowed).length > 0) {
    await (db as any)
      .from('recyclers')
      .update(allowed)
      .eq('id', actor.recyclerId);
  }

  return NextResponse.json({ ok: true });
}
