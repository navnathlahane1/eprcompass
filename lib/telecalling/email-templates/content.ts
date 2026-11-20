import DOMPurify from 'isomorphic-dompurify';
import { convert } from 'html-to-text';

const MERGE_TAG_REGEX = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function sanitizeEmailHtml(input: string): string {
  return DOMPurify.sanitize(String(input || ''), {
    USE_PROFILES: { html: true },
  });
}

export function htmlToPlainText(inputHtml: string): string {
  return convert(inputHtml || '', {
    wordwrap: 120,
    preserveNewlines: true,
  }).trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function extractMergeTags(input: string): string[] {
  const tags = new Set<string>();
  const src = String(input || '');
  for (const match of src.matchAll(MERGE_TAG_REGEX)) {
    if (match[1]) tags.add(match[1].trim());
  }
  return Array.from(tags);
}

export function applyMergeTagValues(input: string, values: Record<string, string>): string {
  let output = String(input || '');
  for (const [tag, value] of Object.entries(values || {})) {
    const safeTag = escapeRegExp(tag);
    const re = new RegExp(`\\{\\{\\s*${safeTag}\\s*\\}\\}`, 'g');
    output = output.replace(re, value ?? '');
  }
  return output;
}

export function highlightMergeTags(inputHtml: string): string {
  return String(inputHtml || '').replace(MERGE_TAG_REGEX, (_match, tag) => {
    const cleanedTag = String(tag || '').trim();
    return `<mark data-merge-tag="${escapeHtml(cleanedTag)}" class="rounded bg-yellow-100 px-1 py-0.5 text-yellow-900">{{${escapeHtml(cleanedTag)}}}</mark>`;
  });
}
