import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { checkIntelAccess } from '@/packages/intel/access.cjs';
export { checkIntelAccess } from '@/packages/intel/access.cjs';

export function intelDb(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase is not configured');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export async function requireIntelUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const db = intelDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const access = await checkIntelAccess(db, user, process.env);
  if (access !== 'allowed') return { error: NextResponse.json({ error: access === 'unavailable' ? 'Intel access verification is temporarily unavailable' : 'Intel access denied' }, { status: access === 'unavailable' ? 503 : 403 }) };

  return { db, user };
}

export function intelExpressOrigin() {
  return (
    process.env.INTEL_EXPRESS_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SCRAPER_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ||
    (process.env.NODE_ENV !== 'production' ? 'http://127.0.0.1:5001' : '')
  );
}
