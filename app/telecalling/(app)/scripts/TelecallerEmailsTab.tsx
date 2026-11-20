'use client';

import { useEffect, useMemo, useState } from 'react';
import type { EmailTemplateWithRelations } from '@/lib/telecalling/email-templates/types';
import {
  applyMergeTagValues,
  extractMergeTags,
  highlightMergeTags,
  htmlToPlainText,
  sanitizeEmailHtml,
} from '@/lib/telecalling/email-templates/content';

const CATEGORY_OPTIONS = ['all', 'plastic', 'ewaste', 'battery', 'tyre', 'general'] as const;
const STAGE_OPTIONS = ['all', 'intro', 'follow_up', 'proposal_sent', 'objection', 'closing', 'post_sale'] as const;

function trackUsage(templateId: string, action: string) {
  fetch('/api/admin/telecalling/email-templates/usage', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ templateId, action }),
  }).catch(() => undefined);
}

async function writeClipboardRich(html: string, text: string) {
  const nav = navigator as any;
  if (typeof nav?.clipboard?.write === 'function' && typeof (window as any).ClipboardItem === 'function') {
    const item = new (window as any).ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    });
    await nav.clipboard.write([item]);
    return;
  }

  await navigator.clipboard.writeText(text);
}

export default function TelecallerEmailsTab() {
  const [templates, setTemplates] = useState<EmailTemplateWithRelations[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('all');
  const [callStage, setCallStage] = useState<(typeof STAGE_OPTIONS)[number]>('all');
  const [mergeValues, setMergeValues] = useState<Record<string, string>>({
    client_name: '',
    company: '',
    telecaller_name: '',
  });
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState('');

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('active_only', 'true');
      if (category !== 'all') params.set('category', category);
      if (callStage !== 'all') params.set('call_stage', callStage);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/telecalling/email-templates?${params.toString()}`);
      const payload = await res.json();
      const list = Array.isArray(payload?.templates) ? payload.templates : [];
      setTemplates(list);

      if (list.length > 0) {
        setSelectedId((curr) => (curr && list.some((t: any) => t.id === curr) ? curr : list[0].id));
      } else {
        setSelectedId('');
      }
    } catch (_err) {
      setTemplates([]);
      setSelectedId('');
      setToast('Failed to load email templates');
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [category, callStage]);

  useEffect(() => {
    if (!toast) return;
    const handle = window.setTimeout(() => setToast(''), 2400);
    return () => window.clearTimeout(handle);
  }, [toast]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return templates;
    return templates.filter((t) =>
      `${t.title} ${t.subject}`.toLowerCase().includes(term)
    );
  }, [templates, search]);

  const selected = filtered.find((t) => t.id === selectedId) || filtered[0] || null;

  const mergeTags = useMemo(() => {
    if (!selected) return [];
    const tags = new Set<string>([
      ...extractMergeTags(selected.subject),
      ...extractMergeTags(selected.body_html),
    ]);
    return Array.from(tags);
  }, [selected]);

  const renderedPreviewHtml = useMemo(() => {
    if (!selected) return '';
    const clean = sanitizeEmailHtml(selected.body_html);
    const replaced = applyMergeTagValues(clean, mergeValues);
    return highlightMergeTags(replaced);
  }, [selected, mergeValues]);

  const mergedSubject = selected ? applyMergeTagValues(selected.subject, mergeValues) : '';
  const mergedBodyHtml = selected ? applyMergeTagValues(sanitizeEmailHtml(selected.body_html), mergeValues) : '';
  const mergedBodyText = selected ? htmlToPlainText(mergedBodyHtml) : '';

  async function getSignedUrl(storagePath: string): Promise<string> {
    if (!selected) return '';
    const res = await fetch(`/api/admin/telecalling/email-templates/${selected.id}/attachments/sign-url`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ storagePath }),
    });
    const data = await res.json();
    return String(data?.signedUrl || '');
  }

  async function copySubject() {
    if (!selected) return;
    await navigator.clipboard.writeText(mergedSubject);
    setToast('Subject copied');
    trackUsage(selected.id, 'copied');
  }

  async function copyAllAttachmentLinks() {
    if (!selected) return;
    setBusy(true);
    try {
      const lines: string[] = [];
      for (const att of selected.attachments || []) {
        const signedUrl = await getSignedUrl(att.storage_path);
        if (signedUrl) lines.push(`${att.file_name}: ${signedUrl}`);
      }
      if (lines.length === 0) {
        setToast('No attachment links available');
        return;
      }
      const text = lines.join('\n');
      await navigator.clipboard.writeText(text);
      setToast('Attachment links copied');
    } finally {
      setBusy(false);
    }
  }

  async function downloadAttachment(storagePath: string) {
    if (!selected) return;
    const signedUrl = await getSignedUrl(storagePath);
    if (!signedUrl) return;
    trackUsage(selected.id, 'downloaded_attachment');
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
  }

  async function copyEmail() {
    if (!selected) return;
    setBusy(true);
    try {
      const attachmentLines: string[] = [];
      for (const att of selected.attachments || []) {
        const signedUrl = await getSignedUrl(att.storage_path);
        if (signedUrl) attachmentLines.push(`${att.file_name}: ${signedUrl}`);
      }

      const linksText = (selected.links || []).map((l) => `${l.label}: ${l.url}`).join('\n');
      const attachmentSection = attachmentLines.length ? `\n\nAttachments:\n${attachmentLines.join('\n')}` : '';
      const linksSection = linksText ? `\n\nLinks:\n${linksText}` : '';

      const finalText = `${mergedSubject}\n\n${mergedBodyText}${attachmentSection}${linksSection}`.trim();
      const attachmentHtml = attachmentLines.length
        ? `<hr/><p><strong>Attachments:</strong></p><ul>${attachmentLines
            .map((line) => {
              const splitAt = line.indexOf(': ');
              if (splitAt < 0) return `<li>${line}</li>`;
              const name = line.slice(0, splitAt);
              const url = line.slice(splitAt + 2);
              return `<li>${name}: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></li>`;
            })
            .join('')}</ul>`
        : '';
      const linksHtml = (selected.links || []).length
        ? `<hr/><p><strong>Links:</strong></p><ul>${(selected.links || [])
            .map((link) => `<li>${link.label}: <a href="${link.url}" target="_blank" rel="noopener noreferrer">${link.url}</a></li>`)
            .join('')}</ul>`
        : '';
      const finalHtml = `${mergedBodyHtml}${attachmentHtml}${linksHtml}`;

      await writeClipboardRich(finalHtml, finalText);
      setToast('Email copied (subject + body)');
      trackUsage(selected.id, 'copied');
    } finally {
      setBusy(false);
    }
  }

  function openInMail(provider: 'gmail' | 'outlook') {
    if (!selected) return;
    const body = mergedBodyText;
    if (provider === 'gmail') {
      const u = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(mergedSubject)}&body=${encodeURIComponent(body)}`;
      window.open(u, '_blank', 'noopener,noreferrer');
      trackUsage(selected.id, 'opened_in_gmail');
      setToast('Opened Gmail compose (attachments must be added manually)');
      return;
    }

    const u = `https://outlook.office.com/mail/deeplink/compose?subject=${encodeURIComponent(mergedSubject)}&body=${encodeURIComponent(body)}`;
    window.open(u, '_blank', 'noopener,noreferrer');
    trackUsage(selected.id, 'opened_in_outlook');
    setToast('Opened Outlook compose (attachments must be added manually)');
  }

  return (
    <div className="mt-4">
      {toast && (
        <div className="mb-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
          {toast}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title/subject"
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value as any)} className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
          {CATEGORY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <select value={callStage} onChange={(e) => setCallStage(e.target.value as any)} className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
          {STAGE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        <button onClick={load} className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-300">Refresh</button>
      </div>

      <div className="flex gap-4" style={{ height: 'calc(100vh - 210px)' }}>
        <div className="w-80 flex-shrink-0 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/60">
          {loading ? <div className="p-4 text-sm text-slate-400">Loading templates…</div> : null}
          {!loading && filtered.length === 0 ? <div className="p-4 text-sm text-slate-400">No templates found.</div> : null}
          {!loading && filtered.map((item) => (
            <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full border-b border-slate-800 px-4 py-3 text-left ${selected?.id === item.id ? 'bg-teal-500/10' : 'hover:bg-slate-800/40'}`}>
              <div className="text-sm font-semibold text-slate-100">{item.title}</div>
              <div className="mt-1 text-xs text-slate-400">{item.category} · {item.call_stage}</div>
              <div className="mt-1 text-xs text-slate-500">{item.subject}</div>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-700/60 bg-slate-900/60 p-5">
          {!selected ? <div className="text-sm text-slate-400">Select an email template.</div> : (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-100">{selected.title}</h2>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{selected.category}</span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{selected.call_stage}</span>
              </div>

              <div className="mb-4 rounded-lg border border-slate-700/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Subject</div>
                <div className="mb-3 text-sm text-slate-100">{mergedSubject}</div>
                <button onClick={copySubject} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300">Copy subject</button>
              </div>

              <div className="mb-4 rounded-lg border border-slate-700/60 p-3">
                <div className="mb-3 text-xs font-semibold uppercase text-slate-400">Merge Tags</div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  {Array.from(new Set(['client_name', 'company', 'telecaller_name', ...mergeTags])).map((tag) => (
                    <label key={tag} className="text-xs text-slate-300">
                      {tag}
                      <input
                        value={mergeValues[tag] || ''}
                        onChange={(e) => setMergeValues((prev) => ({ ...prev, [tag]: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-slate-700 px-2 py-1.5 text-sm text-slate-100"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4 rounded-lg border border-slate-700/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Body Preview</div>
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderedPreviewHtml }} />
              </div>

              <div className="mb-4 rounded-lg border border-slate-700/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Attachments</div>
                {(selected.attachments || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No attachments</div>
                ) : (
                  <div className="space-y-2">
                    {selected.attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between rounded border border-slate-800 px-3 py-2">
                        <div className="text-sm text-slate-200">{att.file_name}</div>
                        <button onClick={() => downloadAttachment(att.storage_path)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">Download</button>
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={copyAllAttachmentLinks} disabled={busy || (selected.attachments || []).length === 0} className="mt-3 rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-300 disabled:opacity-40">Copy all as links</button>
              </div>

              <div className="mb-4 rounded-lg border border-slate-700/60 p-3">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Links</div>
                {(selected.links || []).length === 0 ? (
                  <div className="text-sm text-slate-400">No links</div>
                ) : (
                  <div className="space-y-2">
                    {selected.links.map((link) => (
                      <div key={link.id} className="flex flex-wrap items-center gap-2 rounded border border-slate-800 px-3 py-2">
                        <div className="flex-1 text-sm text-slate-200">{link.label}</div>
                        <button onClick={() => navigator.clipboard.writeText(link.url)} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">Copy</button>
                        <button onClick={() => window.open(link.url, '_blank', 'noopener,noreferrer')} className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300">Open</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={copyEmail} disabled={busy} className="rounded-md bg-teal-500/15 border border-teal-500/30 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Copy email (subject + body)</button>
                <button onClick={() => openInMail('gmail')} className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300" title="Attachments must be added manually; links are included in body">Open in Gmail</button>
                <button onClick={() => openInMail('outlook')} className="rounded-md border border-slate-700 px-3 py-2 text-xs text-slate-300" title="Attachments must be added manually; links are included in body">Open in Outlook web</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
