import { cookies, headers } from 'next/headers';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/packages/db/types';
import { getSessionToken } from './sessionToken';

export async function createServerComponentClient(): Promise<SupabaseClient<Database>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }

  const cookieStore = await cookies();
  const authorization = (await headers()).get('authorization');
  const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const accessToken = bearerToken || getSessionToken(cookieStore.getAll(), supabaseUrl);

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined
  });

  // Patch auth.getUser() so callers can use it with no argument.
  // With persistSession:false there is no in-memory session, so the default
  // implementation always returns null without making an HTTP call.
  // By intercepting here we inject the cookie token transparently, fixing
  // every server component that calls supabase.auth.getUser() with no arg.
  if (accessToken) {
    const _getUser = client.auth.getUser.bind(client.auth);
    client.auth.getUser = (jwt?: string) => _getUser(jwt ?? accessToken);
  }

  return client;
}
