import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

export interface RegulatoryNotification {
  id: string;
  category: string;
  title: string;
  sourceUrl: string;
  localPath?: string;
  publishedAt?: string;
  tags?: string[];
  summary?: string;
  sourcePage?: string;
  downloadedAt?: string;
}

export interface RegulatoryRagChunk {
  chunkId: string;
  notificationId: string;
  category: string;
  title: string;
  sourceUrl: string;
  publishedAt?: string;
  excerpt: string;
  score: number;
}

const MANIFEST_PATH = path.join(process.cwd(), 'data', 'regulatory-notifications.json');
const MANIFEST_PATH_ALT = path.join(process.cwd(), 'frontend', 'data', 'regulatory-notifications.json');
const TABLE_NAME = 'regulatory_notifications';
const CHUNKS_TABLE = 'regulatory_notification_chunks';

const CHUNK_TEXT_LIMIT = 850;

interface NotificationRow {
  id: string;
  category: string;
  title: string;
  source_url: string;
  local_path?: string | null;
  published_at?: string | null;
  tags?: string[] | null;
  summary?: string | null;
  source_page?: string | null;
  downloaded_at?: string | null;
}

interface RagChunkRow {
  id: string;
  notification_id: string;
  chunk_index: number;
  content: string;
}

interface RagMatchRow {
  chunk_id: string;
  notification_id: string;
  category: string;
  title: string;
  source_url: string;
  published_at?: string | null;
  excerpt: string;
  score: number;
}

function makeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

function toRegulatoryNotification(row: NotificationRow): RegulatoryNotification {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    sourceUrl: row.source_url,
    localPath: row.local_path || undefined,
    publishedAt: row.published_at || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    summary: row.summary || undefined,
    sourcePage: row.source_page || undefined,
    downloadedAt: row.downloaded_at || undefined,
  };
}

function cleanText(input?: string): string {
  return String(input || '')
    .replace(/\s+/g, ' ')
    .replace(/\u0000/g, '')
    .trim();
}

function splitIntoChunks(text: string, maxChars = CHUNK_TEXT_LIMIT): string[] {
  const normalized = cleanText(text);
  if (!normalized) return [];

  const parts: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const remaining = normalized.length - cursor;
    if (remaining <= maxChars) {
      parts.push(normalized.slice(cursor).trim());
      break;
    }

    const windowText = normalized.slice(cursor, cursor + maxChars);
    const breakIdx = Math.max(
      windowText.lastIndexOf('. '),
      windowText.lastIndexOf('; '),
      windowText.lastIndexOf(', '),
      windowText.lastIndexOf(' ')
    );

    const cut = breakIdx > 180 ? breakIdx + 1 : maxChars;
    parts.push(windowText.slice(0, cut).trim());
    cursor += cut;
  }

  return parts.filter(Boolean);
}

function composeNotificationRagText(notification: RegulatoryNotification): string {
  const tags = (notification.tags || []).join(', ');
  return [
    `Title: ${notification.title}`,
    `Category: ${notification.category}`,
    tags ? `Tags: ${tags}` : '',
    notification.summary ? `Summary: ${notification.summary}` : '',
    `Source: ${notification.sourceUrl}`,
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildNotificationRagChunks(notification: RegulatoryNotification): string[] {
  const chunks = splitIntoChunks(composeNotificationRagText(notification));
  if (chunks.length > 0) return chunks;
  return [`Title: ${notification.title}\nCategory: ${notification.category}\nSource: ${notification.sourceUrl}`];
}

export async function upsertNotificationRagChunks(notification: RegulatoryNotification): Promise<void> {
  const db = makeServiceClient();
  if (!db) return;

  const chunks = buildNotificationRagChunks(notification);
  if (!chunks.length) return;

  const rows = chunks.map((content, idx) => ({
    notification_id: notification.id,
    chunk_index: idx,
    content,
    token_count: Math.ceil(content.length / 4),
  }));

  try {
    await (db as any).from(CHUNKS_TABLE).delete().eq('notification_id', notification.id);
    const { error } = await (db as any).from(CHUNKS_TABLE).insert(rows);
    if (error) {
      throw error;
    }
  } catch {
    // RAG schema may not be migrated yet; keep primary workflow functional.
  }
}

async function readLocalManifest(): Promise<RegulatoryNotification[]> {
  for (const candidate of [MANIFEST_PATH, MANIFEST_PATH_ALT]) {
    try {
      const raw = await fs.readFile(candidate, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // Try next candidate path.
    }
  }

  return [];
}

function tokenize(input: string): string[] {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3);
}

function scoreDoc(queryTokens: string[], doc: RegulatoryNotification): number {
  const titleTokens = tokenize(doc.title);
  const categoryTokens = tokenize(doc.category);
  const summaryTokens = tokenize(doc.summary || '');
  const tagTokens = (doc.tags || []).flatMap((t) => tokenize(t));

  const haystack = new Set([...titleTokens, ...categoryTokens, ...summaryTokens, ...tagTokens]);
  let score = 0;

  for (const q of queryTokens) {
    if (haystack.has(q)) score += 2;
    if (titleTokens.includes(q)) score += 2;
    if (categoryTokens.includes(q)) score += 1;
  }

  if (doc.publishedAt && /^\d{4}/.test(doc.publishedAt)) {
    const year = Number(doc.publishedAt.slice(0, 4));
    if (year >= new Date().getFullYear() - 2) score += 1;
  }

  return score;
}

export async function loadRegulatoryNotifications(): Promise<RegulatoryNotification[]> {
  const db = makeServiceClient();
  if (db) {
    try {
      const { data, error } = await (db as any)
        .from(TABLE_NAME)
        .select('id, category, title, source_url, local_path, published_at, tags, summary, source_page, downloaded_at')
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(500);

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: NotificationRow) => toRegulatoryNotification(row));
      }
    } catch {
      // Falls back to local corpus manifest below.
    }
  }

  try {
    return await readLocalManifest();
  } catch {
    return [];
  }
}

async function searchRegulatoryNotificationChunksViaRpc(query: string, limit: number): Promise<RegulatoryRagChunk[]> {
  const db = makeServiceClient();
  if (!db) return [];

  try {
    const { data, error } = await (db as any)
      .rpc('search_regulatory_notification_chunks', {
        p_query: query,
        p_limit: limit,
      });

    if (error || !Array.isArray(data)) return [];

    return data.map((row: RagMatchRow) => ({
      chunkId: row.chunk_id,
      notificationId: row.notification_id,
      category: row.category,
      title: row.title,
      sourceUrl: row.source_url,
      publishedAt: row.published_at || undefined,
      excerpt: cleanText(row.excerpt),
      score: Number(row.score || 0),
    }));
  } catch {
    return [];
  }
}

async function searchRegulatoryNotificationChunksFallback(query: string, limit: number): Promise<RegulatoryRagChunk[]> {
  const docs = await searchRegulatoryNotifications(query, limit);
  return docs.map((doc, idx) => ({
    chunkId: `${doc.id}-fallback-${idx + 1}`,
    notificationId: doc.id,
    category: doc.category,
    title: doc.title,
    sourceUrl: doc.sourceUrl,
    publishedAt: doc.publishedAt,
    excerpt: cleanText(doc.summary || `${doc.title} in ${doc.category}.`),
    score: Math.max(0.1, (limit - idx) / limit),
  }));
}

export async function searchRegulatoryNotificationChunks(query: string, limit = 8): Promise<RegulatoryRagChunk[]> {
  const q = cleanText(query).slice(0, 1000);
  if (!q) return [];

  const rpcHits = await searchRegulatoryNotificationChunksViaRpc(q, limit);
  if (rpcHits.length > 0) return rpcHits;

  return searchRegulatoryNotificationChunksFallback(q, limit);
}

export async function searchRegulatoryNotifications(query: string, limit = 8): Promise<RegulatoryNotification[]> {
  const docs = await loadRegulatoryNotifications();
  if (!docs.length) return [];

  const queryTokens = tokenize(query);
  if (!queryTokens.length) return docs.slice(0, limit);

  return docs
    .map((doc) => ({ doc, score: scoreDoc(queryTokens, doc) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.doc);
}

export function formatNotificationContext(docs: RegulatoryNotification[]): string {
  if (!docs.length) {
    return 'No local regulatory notification corpus is available yet. Reply with high-level guidance and ask to run notification sync.';
  }

  const lines: string[] = [];
  lines.push('REGULATORY NOTIFICATION REFERENCES (local corpus):');
  for (const d of docs) {
    lines.push(`- ${d.title} | Category: ${d.category} | Date: ${d.publishedAt || 'Unknown'} | URL: ${d.sourceUrl}`);
    if (d.summary) lines.push(`  Summary: ${d.summary}`);
  }
  return lines.join('\n');
}

export function formatRagContext(chunks: RegulatoryRagChunk[]): string {
  if (!chunks.length) {
    return 'RAG corpus not found. Use conservative guidance and include "⚠️ VERIFY LATEST" where details are uncertain.';
  }

  const lines: string[] = [];
  lines.push('REGULATORY RAG CONTEXT (ranked chunks):');
  for (const chunk of chunks) {
    lines.push(
      `- ${chunk.title} | Category: ${chunk.category} | Date: ${chunk.publishedAt || 'Unknown'} | Score: ${chunk.score.toFixed(3)} | URL: ${chunk.sourceUrl}`
    );
    lines.push(`  Excerpt: ${chunk.excerpt}`);
  }

  return lines.join('\n');
}
