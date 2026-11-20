'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

/**
 * AuthSync — invisible client component added to the root layout.
 *
 * Problem it solves:
 *   The middleware and server components read the access token from the
 *   `sb-access-token` cookie (set manually during login). Supabase auto-
 *   refreshes tokens roughly every hour and updates its own native cookie
 *   (`sb-{project-ref}-auth-token`), but does NOT update our custom cookie.
 *   After the first token refresh, all middleware-protected routes start
 *   failing because `sb-access-token` holds a stale, expired token.
 *
 * Fix:
 *   Listen to `onAuthStateChange`. On TOKEN_REFRESHED or SIGNED_IN, write
 *   the new access token back into `sb-access-token` so the middleware always
 *   has a fresh token on the next server request.
 */
export default function AuthSync() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') &&
          session?.access_token
        ) {
          const maxAge = session.expires_in ?? 3600;
          document.cookie =
            `sb-access-token=${encodeURIComponent(session.access_token)}` +
            `; Path=/; Max-Age=${maxAge}; SameSite=Lax${window.location.protocol === 'https:' ? '; Secure' : ''}`;
        }

        if (event === 'SIGNED_OUT') {
          // Expire the custom cookie immediately on sign-out
          document.cookie = 'sb-access-token=; Path=/; Max-Age=0; SameSite=Lax';
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
