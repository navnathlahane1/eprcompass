/**
 * Server-side auth helper that uses the service role key to bypass RLS.
 * Use this in layout.tsx and page.tsx files instead of calling
 * supabase.auth.getUser() + profiles query separately.
 *
 * Returns null if no valid session token is found in cookies, or if the
 * user's profile has is_banned = true (treated as unauthenticated).
 *
 * Gracefully degrades when optional IAM columns (is_banned) don't exist yet.
 */
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isSuperAdmin as emailIsSuperAdmin } from '@/lib/admin/isSuperAdmin';
import { getSessionToken } from './sessionToken';

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
  role: string;
  fullName?: string | null;
  companyName?: string | null;
  isBanned?: boolean;
  forcePasswordChange?: boolean;
}

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || (!serviceRoleKey && !anonKey)) return null;

    // Read access token from cookies — supports custom and Supabase v2 native formats
    const cookieStore = await cookies();
    const accessToken = getSessionToken(cookieStore.getAll(), supabaseUrl);
    if (!accessToken) return null;

    // Use service role when available; otherwise query with the user's bearer
    // token so RLS can resolve auth.uid() for protected layouts.
    const client = createClient(supabaseUrl, serviceRoleKey ?? anonKey!, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: serviceRoleKey
        ? undefined
        : { headers: { Authorization: `Bearer ${accessToken}` } },
    });

    // Validate the token
    const { data: { user }, error: authError } = await client.auth.getUser(accessToken);
    if (authError || !user) return null;

    const isSuperAdmin = emailIsSuperAdmin(user.email);

    // Fetch profile — try with is_banned included; fall back if that column
    // doesn't exist yet (IAM migration not yet run).
    type ProfileRow = { role?: string; full_name?: string | null; company_name?: string | null; is_banned?: boolean | null; force_password_change?: boolean | null };
    let profile: ProfileRow | null = null;

    const { data: fullProfile, error: fullErr } = await client
      .from('profiles')
      .select('role, full_name, company_name, is_banned, force_password_change')
      .eq('id', user.id)
      .maybeSingle();

    if (fullErr?.message?.includes('is_banned')) {
      // Column doesn't exist yet — query without it so auth still works
      const { data: basicProfile } = await client
        .from('profiles')
        .select('role, full_name, company_name')
        .eq('id', user.id)
        .maybeSingle();
      profile = basicProfile as ProfileRow | null;
    } else {
      profile = fullProfile as ProfileRow | null;
    }

    // Banned users are treated as unauthenticated
    if (profile?.is_banned && !isSuperAdmin) return null;

    const role = profile?.role || (isSuperAdmin ? 'admin' : '');

    return {
      id: user.id,
      email: user.email,
      role,
      fullName: profile?.full_name ?? null,
      companyName: profile?.company_name ?? null,
      isBanned: false,
      forcePasswordChange: !isSuperAdmin && !!(profile?.force_password_change),
    };
  } catch {
    // Fail closed on auth-helper errors to avoid 500s in protected layouts.
    return null;
  }
}
