import { NextResponse } from 'next/server';
import { adminClient, resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export async function GET() {
  const actor = await resolveActor();
  if (!actor) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!actor.isSuperAdminUser) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = adminClient();

  const { data: authData, error: authError } = await db.auth.admin.listUsers({ perPage: 1000 });
  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  const { data: profiles } = await db.from('profiles').select('id, full_name, role, company_name');
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const users = (authData?.users || []).map((u) => {
    const profile = profileMap.get(u.id) || {};
    return {
      id: u.id,
      email: u.email,
      full_name: profile.full_name || u.user_metadata?.full_name || null,
      company_name: profile.company_name || null,
      role: profile.role || 'client',
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    };
  });

  return NextResponse.json({ users });
}
