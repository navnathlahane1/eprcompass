import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

function toArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item || '').trim())
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  let failedStep = 'init';
  try {
    const cookieHeader = String(request.headers.get('cookie') || '');
    const bypassFromHeader = cookieHeader
      .split(';')
      .some((cookie) => cookie.trim() === 'dev-admin-bypass=1');
    const bypassFromRequestCookie = request.cookies.get('dev-admin-bypass')?.value === '1';

    const isDevBypass =
      process.env.NODE_ENV !== 'production' &&
      (bypassFromRequestCookie || bypassFromHeader);

    if (!isDevBypass) {
      failedStep = 'resolve_actor';
      const actor = await resolveActor();
      if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      if (!actor.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    failedStep = 'validate_env';
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server misconfiguration: missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.' },
        { status: 503 }
      );
    }

  failedStep = 'parse_body';
    const body = await request.json().catch(() => ({}));

    const clientName = String(body.client_name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const companyName = String(body.company_name || '').trim();
    const category = String(body.category || '').trim();
    const status = String(body.status || '').trim();
    const assignedManagerId = String(body.assigned_manager_id || '').trim();
    const wasteCategories = toArray(body.waste_categories);

    if (!clientName) {
      return NextResponse.json({ error: 'client_name is required' }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    if (!password || password.length < 8) {
      return NextResponse.json({ error: 'password with at least 8 characters is required' }, { status: 400 });
    }

    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    failedStep = 'admin_client';
    const db = adminClient();

    // Email uniqueness is enforced by Supabase Auth; profiles.email column does not exist.
    let userId: string | null = null;

    if (isDevBypass) {
      // Local testing fallback: create profile/client even if Auth admin APIs are unavailable.
      userId = crypto.randomUUID();
    } else {
      failedStep = 'create_auth_user';
      const { data: createdUser, error: createUserError } = await (db as any).auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: clientName
        }
      });

      if (createUserError) {
        const message = String(createUserError.message || 'Failed to create auth user');
        if (/service_role|not allowed|not authorized|invalid api key|permission|jwt/i.test(message)) {
          return NextResponse.json(
            {
              error:
                'Supabase admin permissions missing. Verify SUPABASE_SERVICE_ROLE_KEY is correct for this project.'
            },
            { status: 403 }
          );
        }
        const statusCode = /already|exists|registered/i.test(message) ? 409 : 400;
        return NextResponse.json({ error: message }, { status: statusCode });
      }

      userId = createdUser?.user?.id || null;
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unable to create user ID.' }, { status: 500 });
    }

    failedStep = 'upsert_profile';
    const { error: profileUpsertError } = await (db as any)
      .from('profiles')
      .upsert(
        {
          id: userId,
          full_name: clientName,
          company_name: companyName || clientName,
          role: 'client'
        },
        { onConflict: 'id' }
      );

    if (profileUpsertError) {
      return NextResponse.json({ error: profileUpsertError.message, step: 'upsert_profile' }, { status: 500 });
    }

    failedStep = 'insert_client';
    const baseClientPayload = {
      profile_id: userId,
      category,
      status,
      waste_categories: wasteCategories,
      assigned_manager_id: assignedManagerId || null
    };

    const legacyCompatiblePayload = {
      ...baseClientPayload,
      name: companyName || clientName,
      email,
      service_type: wasteCategories[0] || null
    };

    let insertedClient: any = null;
    let insertError: any = null;

    const firstInsert = await (db as any)
      .from('clients')
      .insert(legacyCompatiblePayload)
      .select('id, profile_id, category, waste_categories, status, assigned_manager_id')
      .maybeSingle();

    insertedClient = firstInsert.data;
    insertError = firstInsert.error;

    // Some environments use a newer clients schema without legacy columns.
    if (insertError && /column .* does not exist/i.test(String(insertError.message || ''))) {
      const fallbackInsert = await (db as any)
        .from('clients')
        .insert(baseClientPayload)
        .select('id, profile_id, category, waste_categories, status, assigned_manager_id')
        .maybeSingle();

      insertedClient = fallbackInsert.data;
      insertError = fallbackInsert.error;
    }

    if (insertError) {
      return NextResponse.json({ error: insertError.message, step: 'insert_client' }, { status: 500 });
    }

    if (!insertedClient) {
      return NextResponse.json({ error: 'Unable to create client.', step: 'insert_client' }, { status: 500 });
    }

    failedStep = 'load_profile';
    const { data: profile } = await (db as any)
      .from('profiles')
      .select('id, company_name')
      .eq('id', userId)
      .maybeSingle();

    return NextResponse.json({
      client: {
        ...insertedClient,
        company_name: profile?.company_name || null,
        services: [],
        open_payments: [],
        activities: []
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error?.message || 'Failed to create client due to server error.',
        step: failedStep
      },
      { status: 500 }
    );
  }
}
