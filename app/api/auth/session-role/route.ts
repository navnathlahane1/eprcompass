import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/auth/session-role
 *
 * Returns the authenticated user's role from the profiles table.
 * Uses the service role key to bypass RLS, so this always works even if
 * client-side RLS policies are too restrictive.
 *
 * Accepts the access token via:
 *   - Authorization: Bearer <token>  header
 *   - sb-access-token cookie (fallback)
 */
export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Extract token from Authorization header or cookie
  const authHeader = request.headers.get('authorization');
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;

  if (!token) {
    // Try the custom cookie set by login page
    const raw = request.cookies.get('sb-access-token')?.value;
    if (raw) {
      try {
        const parsed = JSON.parse(decodeURIComponent(raw));
        token = parsed?.access_token ?? (typeof parsed === 'string' ? parsed : null);
      } catch {
        token = decodeURIComponent(raw);
      }
    }
  }

  if (!token) {
    return NextResponse.json({ error: 'No token provided' }, { status: 401 });
  }

  // Validate token — use anon client to verify
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Fetch role with service role key — bypasses all RLS policies
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data: profile } = await (adminClient as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return NextResponse.json({
    role: profile?.role ?? null,
    userId: user.id,
    email: user.email ?? null,
  });
}
