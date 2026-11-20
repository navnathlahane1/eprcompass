import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Public type-ahead search over the EPR penalty registry (epr_penalty_records).
// Service-role only — the table is RLS-locked and never read by anon clients.

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

// Strip characters that would break a PostgREST `ilike` filter, then escape
// the LIKE wildcards so user input is treated literally.
function sanitizeQuery(raw: string): string {
  return raw
    .slice(0, 60)
    .replace(/[(),*"']/g, ' ')
    .replace(/[%_]/g, (m) => `\\${m}`)
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = sanitizeQuery(String(searchParams.get('q') || ''));
    if (q.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await (supabase as any)
      .from('epr_penalty_records')
      .select('id, company_name, applicant_type, penalty_inr, normalized_name')
      .ilike('company_name', `%${q}%`)
      .order('penalty_inr', { ascending: false, nullsFirst: false })
      .limit(40);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    // Collapse multiple notices for the same company into one suggestion.
    const seen = new Map<string, any>();
    for (const r of data || []) {
      const key = r.normalized_name || String(r.company_name || '').toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, { id: r.id, name: r.company_name, applicant_type: r.applicant_type || null, notice_count: 0 });
      }
      seen.get(key).notice_count++;
    }

    const results = [...seen.values()].slice(0, 8);
    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Search failed') },
      { status: 500 }
    );
  }
}
