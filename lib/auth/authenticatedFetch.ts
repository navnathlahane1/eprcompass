import { supabase } from '@/lib/supabaseClient';

/** Keep the browser's current session attached to same-origin API requests. */
export async function authenticatedFetch(url: string, init: RequestInit = {}) {
  if (!url.startsWith('/api/')) throw new Error('Authenticated requests must use a local API route');
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw new Error('Unable to refresh your session. Please sign in again.');
  const headers = new Headers(init.headers);
  if (session?.access_token) headers.set('Authorization', `Bearer ${session.access_token}`);
  return fetch(url, { ...init, headers, credentials: 'same-origin', cache: 'no-store' });
}
