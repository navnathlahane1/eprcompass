// Phase 0 — Backup all telecaller_* tables to JSON before migration/drop.
// READ-ONLY against the DB. Loads creds from .env.local. Writes files locally.
// Usage: node scripts/backup_telecaller_tables.mjs
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n').filter(l => l.includes('=') && !l.trim().startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]; })
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TABLES = [
  'telecaller_users',
  'telecaller_teams',
  'telecaller_lead_imports',
  'telecaller_leads',
  'telecaller_enrichment_queue',
  'telecaller_lead_enrichments',
  'telecaller_activity_logs',
];

const OUT_DIR = new URL('../backups/telecaller_migration_2026-06-16/', import.meta.url);

async function fetchAll(table) {
  const all = [];
  for (let page = 0; page < 200; page++) {
    const { data, error } = await db.from(table).select('*').range(page * 1000, page * 1000 + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < 1000) break;
  }
  return all;
}

(async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  const manifest = { project: env.NEXT_PUBLIC_SUPABASE_URL, created_at: new Date().toISOString(), tables: {} };
  for (const t of TABLES) {
    const rows = await fetchAll(t);
    writeFileSync(new URL(`${t}.json`, OUT_DIR), JSON.stringify(rows, null, 2));
    manifest.tables[t] = rows.length;
    console.log(`backed up ${t}: ${rows.length} rows`);
  }
  writeFileSync(new URL('manifest.json', OUT_DIR), JSON.stringify(manifest, null, 2));
  console.log('\nmanifest:', JSON.stringify(manifest.tables));
})();
