/**
 * POST /api/recycler-portal/auth/verify-code
 *
 * After Supabase auth login, the recycler must provide their Recycler Code
 * to link their auth user to the recyclers table.
 *
 * Body: { recyclerCode: string }
 *
 * On success:
 *   - Sets profiles.role = 'recycler'
 *   - Sets recyclers.user_id = auth user id
 *   - Returns recycler profile
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { adminClient } from '@/lib/recyclerPortal/recyclerAuth';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const recyclerCode = String(body.recyclerCode ?? '').trim().toUpperCase();

    if (!recyclerCode) {
      return NextResponse.json({ error: 'recyclerCode is required' }, { status: 400 });
    }

    const db = adminClient();

    // Look up recycler by code
    const { data: recycler, error: lookupErr } = await (db as any)
      .from('recyclers')
      .select('id, recycler_code, name, verification_status, user_id')
      .eq('recycler_code', recyclerCode)
      .maybeSingle();

    if (lookupErr || !recycler) {
      return NextResponse.json(
        { error: 'Recycler code not found. Contact your EPR manager.' },
        { status: 404 }
      );
    }

    // Prevent code theft: if already claimed by a different user, reject
    if (recycler.user_id && recycler.user_id !== user.id) {
      return NextResponse.json(
        { error: 'This recycler code is already linked to another account.' },
        { status: 409 }
      );
    }

    // Link auth user to recycler record
    const { error: linkErr } = await (db as any)
      .from('recyclers')
      .update({ user_id: user.id, onboarded_at: new Date().toISOString() })
      .eq('id', recycler.id);

    if (linkErr) {
      return NextResponse.json({ error: 'Failed to link recycler account.' }, { status: 500 });
    }

    // Upsert profile with role='recycler'
    await (db as any).from('profiles').upsert(
      { id: user.id, role: 'recycler', full_name: recycler.name },
      { onConflict: 'id' }
    );

    return NextResponse.json({
      ok: true,
      recycler: {
        id: recycler.id,
        recyclerCode: recycler.recycler_code,
        name: recycler.name,
        verificationStatus: recycler.verification_status,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
