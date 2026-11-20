import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

const SENSITIVE_KEYS = ['exotel_api_key', 'exotel_api_token', 'anthropic_api_key'];

function maskValue(key: string, value: string): string {
  if (SENSITIVE_KEYS.includes(key) && value.length > 8) {
    return value.slice(0, 4) + '****' + value.slice(-4);
  }
  return value;
}

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(_req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = makeServiceClient();
  const { data, error } = await db.from('tc_settings').select('key, value, updated_at').order('key');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const settings: Record<string, string> = {};
  for (const row of data || []) {
    settings[row.key] = maskValue(row.key, row.value);
  }
  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, any>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { settings } = body;
  if (!settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'settings object is required' }, { status: 400 });
  }

  const db = makeServiceClient();
  const now = new Date().toISOString();
  const rows = Object.entries(settings as Record<string, string>).map(([key, value]) => ({
    key,
    value: String(value),
    updated_at: now,
  }));

  const { error } = await db.from('tc_settings').upsert(rows, { onConflict: 'key' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Invalidate Exotel config cache if Exotel settings changed
  const exotelKeys = ['exotel_account_sid', 'exotel_api_key', 'exotel_api_token', 'exotel_caller_id', 'exotel_subdomain'];
  const hasExotelChange = Object.keys(settings).some(k => exotelKeys.includes(k));
  if (hasExotelChange) {
    try {
      const { invalidateExotelConfigCache } = await import('@/lib/telecalling/exotel');
      invalidateExotelConfigCache();
    } catch { /* non-critical */ }
  }

  return NextResponse.json({ success: true, updated: rows.length });
}
