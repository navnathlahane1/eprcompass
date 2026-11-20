import { NextResponse } from 'next/server';
import { adminClient, resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export async function POST(request) {
  try {
    const actor = await resolveActor();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!actor.isSuperAdminUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const db = adminClient();

    const { data, error } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${siteUrl}/dashboard` },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    try {
      await db.from('iam_audit_log').insert({
        actor_id: actor.userId,
        target_email: email,
        action: 'impersonate_magic_link',
        old_value: null,
        new_value: { issued: true },
      });
    } catch {
      // Audit table may not exist in every environment; do not fail the action.
    }

    return NextResponse.json({ url: data?.properties?.action_link });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
