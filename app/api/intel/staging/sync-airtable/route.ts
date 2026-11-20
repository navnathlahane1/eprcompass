import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchAllRecords, tableSourceType, isAirtableIntelConfigured } from '@/lib/airtableIntel';

function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

async function resolveIntelUser(req: NextRequest) {
  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice('Bearer '.length);
  const db = makeDb();
  const { data: { user }, error } = await db.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await resolveIntelUser(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isAirtableIntelConfigured()) {
    return NextResponse.json(
      { error: 'AIRTABLE_INTEL_BASE_ID / AIRTABLE_INTEL_PAT (or AIRTABLE_PAT) not configured' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const table = typeof body.table === 'string' ? body.table.trim() : '';
  if (!table) return NextResponse.json({ error: 'table is required' }, { status: 400 });

  const db = makeDb();
  const sourceType = tableSourceType(table);

  try {
    const { data: existing } = await db
      .from('intel_raw_records')
      .select('external_record_id')
      .eq('source_type', sourceType);

    const alreadyStaged = new Set((existing || []).map((r: any) => r.external_record_id));

    const records = await fetchAllRecords(table);
    const newRecords = records.filter(r => !alreadyStaged.has(r.id));

    if (newRecords.length === 0) {
      return NextResponse.json({ synced: 0, message: `No new rows in ${table}` });
    }

    const rows = newRecords.map(r => ({
      source_type: sourceType,
      external_record_id: r.id,
      payload: { ...r.fields, _airtable_table: table },
      observed_at: r.createdTime,
      review_status: 'pending',
    }));

    const { error: insertErr } = await db.from('intel_raw_records').insert(rows);
    if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

    return NextResponse.json({ synced: rows.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
