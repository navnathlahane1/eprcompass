import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Pool } from 'pg';

const WA_SOURCE_ID = process.env.WHATSAPP_INTEL_SOURCE_ID ?? '994a17f0-ca48-4ef0-9138-22ee1419c1b6';
const EXCLUDED_NUMBERS = ['919769769110', '919960967250'];
const EXCLUDED_NAMES = ['Jerin🥤', 'EPR CERTIFICATE'];

function makeDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function makeForgeChatPool() {
  return new Pool({
    connectionString: process.env.FORGECHAT_DB_URL,
    ssl: false,
    max: 3,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
  });
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

  if (!process.env.FORGECHAT_DB_URL) {
    return NextResponse.json({ error: 'FORGECHAT_DB_URL not configured' }, { status: 500 });
  }

  const db = makeDb();
  const pool = makeForgeChatPool();

  try {
    // Get already staged phone numbers
    const { data: existing } = await db
      .from('intel_raw_records')
      .select('external_record_id')
      .eq('source_id', WA_SOURCE_ID);

    const alreadyStaged = new Set((existing || []).map((r: any) => r.external_record_id));

    // Fetch all contacts from ForgeChat DB directly
    const contactsResult = await pool.query(
      `SELECT id, contact_number, name, profile_name, wa_number, tags, custom_fields, created_at, updated_at
       FROM coexistence.contacts
       ORDER BY updated_at DESC`
    );

    const contacts = contactsResult.rows;

    const newContacts = contacts.filter((c: any) => {
      if (EXCLUDED_NUMBERS.includes(c.contact_number)) return false;
      if (EXCLUDED_NAMES.includes(c.name || '') || EXCLUDED_NAMES.includes(c.profile_name || '')) return false;
      if (alreadyStaged.has(c.contact_number)) return false;
      return true;
    });

    if (newContacts.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No new contacts to sync' });
    }

    // Process in batches so a large first-time backlog can't time out the whole
    // request, and progress is saved incrementally instead of all-or-nothing.
    const BATCH_SIZE = 300;
    let synced = 0;
    const batchErrors: string[] = [];

    for (let i = 0; i < newContacts.length; i += BATCH_SIZE) {
      const batch = newContacts.slice(i, i + BATCH_SIZE);
      const numbers = batch.map((c: any) => c.contact_number);

      // Two bulk queries for the whole batch instead of two queries per contact —
      // avoids hundreds/thousands of round-trips through a 3-connection pool.
      const [lastMsgResult, countResult] = await Promise.all([
        pool.query(
          `SELECT DISTINCT ON (contact_number) contact_number, message_body, timestamp
           FROM coexistence.chat_history
           WHERE contact_number = ANY($1::text[]) AND direction = 'incoming'
           ORDER BY contact_number, timestamp DESC`,
          [numbers]
        ),
        pool.query(
          `SELECT contact_number, COUNT(*) as count
           FROM coexistence.chat_history
           WHERE contact_number = ANY($1::text[])
           GROUP BY contact_number`,
          [numbers]
        ),
      ]);

      const lastMsgByNumber = new Map(lastMsgResult.rows.map((r: any) => [r.contact_number, r]));
      const countByNumber = new Map(countResult.rows.map((r: any) => [r.contact_number, parseInt(r.count, 10)]));

      const rows = batch.map((c: any) => {
        const lastMsg = lastMsgByNumber.get(c.contact_number) as any;
        return {
          id: crypto.randomUUID(),
          source_id: WA_SOURCE_ID,
          external_record_id: c.contact_number,
          payload: {
            phone: c.contact_number,
            phone_whatsapp: c.contact_number,
            name: c.name?.trim() || c.profile_name?.trim() || 'Unknown',
            source: 'whatsapp',
            channel: 'whatsapp_inbound',
            forgechat_contact_id: c.id,
            wa_number: c.wa_number,
            tags: c.tags,
            custom_fields: c.custom_fields,
            message_count: countByNumber.get(c.contact_number) || 0,
            last_message: lastMsg?.message_body || null,
            last_message_at: lastMsg?.timestamp || null,
            first_contact_at: c.created_at,
          },
          observed_at: c.updated_at,
          created_at: new Date().toISOString(),
        };
      });

      const { error: insertErr } = await db.from('intel_raw_records').insert(rows);
      if (insertErr) {
        batchErrors.push(insertErr.message);
        continue;
      }
      synced += rows.length;
    }

    if (synced === 0 && batchErrors.length > 0) {
      return NextResponse.json({ error: batchErrors.join('; ') }, { status: 500 });
    }

    return NextResponse.json({ synced, errors: batchErrors });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await pool.end();
  }
}
