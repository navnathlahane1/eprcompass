import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';
import { upsertNotificationRagChunks } from '@/lib/telecalling/notificationIntel';

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ALLOWED_EXT = new Set(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.zip', '.txt']);
const STORAGE_BUCKET = 'regulatory-notifications';
const TABLE_NAME = 'regulatory_notifications';

interface NotificationEntry {
  id: string;
  category: string;
  title: string;
  sourceUrl: string;
  sourcePage?: string;
  localPath?: string;
  publishedAt?: string | null;
  tags?: string[];
  summary?: string | null;
  downloadedAt?: string;
}

interface NotificationRow {
  id: string;
  category: string;
  title: string;
  source_url: string;
  source_page?: string | null;
  local_path?: string | null;
  published_at?: string | null;
  tags?: string[] | null;
  summary?: string | null;
  downloaded_at?: string | null;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function toNotificationEntry(row: NotificationRow): NotificationEntry {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    sourceUrl: row.source_url,
    sourcePage: row.source_page || undefined,
    localPath: row.local_path || undefined,
    publishedAt: row.published_at || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    summary: row.summary || null,
    downloadedAt: row.downloaded_at || undefined,
  };
}

async function findFrontendRoot(): Promise<string> {
  const cwd = process.cwd();
  const direct = path.join(cwd, 'data', 'regulatory-notifications.json');
  try {
    await fs.access(direct);
    return cwd;
  } catch {
    const nested = path.join(cwd, 'frontend', 'data', 'regulatory-notifications.json');
    await fs.access(nested);
    return path.join(cwd, 'frontend');
  }
}

function sanitizeSlug(input: string): string {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

async function readManifest(manifestPath: string): Promise<NotificationEntry[]> {
  try {
    const raw = await fs.readFile(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeManifest(manifestPath: string, entries: NotificationEntry[]): Promise<void> {
  await fs.writeFile(manifestPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
}

async function upsertManifestEntry(entry: NotificationEntry): Promise<void> {
  try {
    const frontendRoot = await findFrontendRoot();
    const manifestPath = path.join(frontendRoot, 'data', 'regulatory-notifications.json');
    const current = await readManifest(manifestPath);
    const next = [entry, ...current.filter((item) => item.id !== entry.id)];
    await writeManifest(manifestPath, next);
  } catch {
    // Best effort sync for local fallback.
  }
}

async function saveLocally(params: {
  buffer: Buffer;
  file: File;
  category: string;
  baseTitle: string;
  sourceUrlInput: string;
  sourcePage: string;
  publishedAt: string;
  tags: string[];
  summary: string;
  hash: string;
}): Promise<{ entry: NotificationEntry; total: number }> {
  const {
    buffer,
    file,
    category,
    baseTitle,
    sourceUrlInput,
    sourcePage,
    publishedAt,
    tags,
    summary,
    hash,
  } = params;

  const ext = path.extname(file.name || '').toLowerCase();
  const frontendRoot = await findFrontendRoot();
  const manifestPath = path.join(frontendRoot, 'data', 'regulatory-notifications.json');
  const storageDir = path.join(frontendRoot, 'public', 'regulatory-notifications');

  await fs.mkdir(storageDir, { recursive: true });

  const filename = `${sanitizeSlug(`${category}-${baseTitle}`) || 'notification'}-${hash.slice(0, 10)}${ext}`;
  const absOut = path.join(storageDir, filename);
  const localPath = `/regulatory-notifications/${filename}`;
  await fs.writeFile(absOut, buffer);

  const manifest = await readManifest(manifestPath);
  const entry: NotificationEntry = {
    id: crypto.createHash('sha1').update(`${sourceUrlInput}|${filename}|${Date.now()}`).digest('hex').slice(0, 16),
    category,
    title: baseTitle,
    sourceUrl: sourceUrlInput || localPath,
    sourcePage: sourcePage || undefined,
    localPath,
    publishedAt: publishedAt || null,
    tags,
    summary: summary || null,
    downloadedAt: new Date().toISOString(),
  };

  manifest.unshift(entry);
  await writeManifest(manifestPath, manifest);

  return { entry, total: manifest.length };
}

export async function GET() {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const db = adminClient();
    const { data, error } = await (db as any)
      .from(TABLE_NAME)
      .select('id, category, title, source_url, source_page, local_path, published_at, tags, summary, downloaded_at')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(300);

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ notifications: data.map((row: NotificationRow) => toNotificationEntry(row)) });
    }

    const frontendRoot = await findFrontendRoot();
    const manifestPath = path.join(frontendRoot, 'data', 'regulatory-notifications.json');
    const fallbackList = await readManifest(manifestPath);
    return NextResponse.json({ notifications: fallbackList });
  } catch {
    try {
      const frontendRoot = await findFrontendRoot();
      const manifestPath = path.join(frontendRoot, 'data', 'regulatory-notifications.json');
      const fallbackList = await readManifest(manifestPath);
      return NextResponse.json({ notifications: fallbackList });
    } catch {
      return NextResponse.json({ notifications: [] });
    }
  }
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: 'Invalid file size. Max 25MB.' }, { status: 400 });
    }

    const category = String(form.get('category') || 'General CPCB').trim();
    const titleInput = String(form.get('title') || '').trim();
    const sourceUrlInput = String(form.get('sourceUrl') || '').trim();
    const sourcePage = String(form.get('sourcePage') || '').trim();
    const publishedAt = String(form.get('publishedAt') || '').trim();
    const summary = String(form.get('summary') || '').trim();
    const tagsRaw = String(form.get('tags') || '').trim();
    const tagList = tagsRaw ? tagsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [category];

    const originalName = file.name || 'notification-file';
    const ext = path.extname(originalName).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return NextResponse.json({ error: `Unsupported file type: ${ext || 'unknown'}` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const baseTitle = titleInput || path.basename(originalName, ext).replace(/[-_]+/g, ' ').trim();
    const hash = crypto.createHash('sha1').update(buffer).digest('hex');
    const objectPath = `${new Date().getUTCFullYear()}/${sanitizeSlug(`${category}-${baseTitle}`) || 'notification'}-${hash.slice(0, 10)}${ext}`;

    try {
      const db = adminClient();
      const { error: uploadError } = await (db as any)
        .storage
        .from(STORAGE_BUCKET)
        .upload(objectPath, buffer, {
          contentType: file.type || undefined,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = (db as any).storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
      const publicUrl = String(publicUrlData?.publicUrl || '');
      const nowIso = new Date().toISOString();

      const insertPayload = {
        category,
        title: baseTitle,
        source_url: sourceUrlInput || publicUrl,
        source_page: sourcePage || null,
        local_path: publicUrl || null,
        storage_bucket: STORAGE_BUCKET,
        storage_path: objectPath,
        file_name: originalName,
        mime_type: file.type || null,
        file_size: file.size,
        file_sha1: hash,
        published_at: publishedAt || null,
        tags: tagList,
        summary: summary || null,
        downloaded_at: nowIso,
        uploaded_by: actor.userId,
      };

      const { data: row, error: insertError } = await (db as any)
        .from(TABLE_NAME)
        .upsert(insertPayload, { onConflict: 'file_sha1' })
        .select('id, category, title, source_url, source_page, local_path, published_at, tags, summary, downloaded_at')
        .single();

      if (insertError) throw insertError;

      const entry = toNotificationEntry(row as NotificationRow);
      await upsertManifestEntry(entry);
      try {
        await upsertNotificationRagChunks(entry);
      } catch (chunkErr) {
        console.warn('[telecalling-intelligence-upload] RAG chunk upsert skipped:', chunkErr);
      }

      return NextResponse.json({ ok: true, entry, persisted: 'supabase' });
    } catch {
      const local = await saveLocally({
        buffer,
        file,
        category,
        baseTitle,
        sourceUrlInput,
        sourcePage,
        publishedAt,
        tags: tagList,
        summary,
        hash,
      });

      return NextResponse.json({ ok: true, entry: local.entry, total: local.total, persisted: 'local-fallback' });
    }
  } catch (err: any) {
    console.error('[telecalling-intelligence-upload] error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
