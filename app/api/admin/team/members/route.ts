import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

type CreateMemberPayload = {
  name?: string;
  email?: string;
  role?:
    | 'admin'
    | 'manager'
    | 'operator'
    | 'hr-executive'
    | 'sales-executive'
    | 'training-executive'
    | 'epr-executive';
  password?: string;
};

function adminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const canManageMembers = profile?.role === 'admin' || isSuperAdmin(user.email);
    if (!canManageMembers) {
      return NextResponse.json({ error: 'Only admins can create team users.' }, { status: 403 });
    }

    const body = (await request.json()) as CreateMemberPayload;
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const role = (body?.role || 'manager') as
      | 'admin'
      | 'manager'
      | 'operator'
      | 'hr-executive'
      | 'sales-executive'
      | 'training-executive'
      | 'epr-executive';
    const password = String(body?.password || '');

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email and password are required.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const admin = adminClient();
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name
      }
    });

    if (error) {
      const message = String(error.message || 'Failed to create user');
      const status = /already|exists|registered/i.test(message) ? 409 : 400;
      return NextResponse.json({ error: message }, { status });
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json({ error: 'User was created without an ID.' }, { status: 500 });
    }

    // Best-effort profile sync. Keep auth-user creation as source of truth.
    // Note: profiles.email does not exist — email lives in auth.users only.
    // All non-admin staff roles map to 'manager' (DB enum only supports admin/manager/client/partner/cepc/recycler).
    await (admin as any)
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: name,
          role: role === 'admin' ? 'admin' : 'manager'
        },
        { onConflict: 'id' }
      );

    return NextResponse.json({ userId, email, name, role }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || 'Could not create team member user.' },
      { status: 500 }
    );
  }
}
