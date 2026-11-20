import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const ALLOWED_KEYS = new Set([
  'checkout.earlybird_end',
]);

export async function GET(_req: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;

  if (!ALLOWED_KEYS.has(key)) {
    return NextResponse.json({ error: 'Unknown key' }, { status: 404 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const supabase = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const { data, error } = await supabase
    .from('site_settings')
    .select('value, updated_at')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ value: null }, { status: 200 });
  }

  return NextResponse.json(
    { value: data.value, updatedAt: data.updated_at },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
  );
}
