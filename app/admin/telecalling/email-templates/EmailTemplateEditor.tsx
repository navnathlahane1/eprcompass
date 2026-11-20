'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  EmailTemplate,
  EmailTemplateCallStage,
  EmailTemplateCategory,
  EmailTemplateLink,
  EmailTemplateWithRelations,
} from '@/lib/telecalling/email-templates/types';
import { sanitizeEmailHtml } from '@/lib/telecalling/email-templates/content';

const CATEGORY_OPTIONS: EmailTemplateCategory[] = ['plastic', 'ewaste', 'battery', 'tyre', 'general'];
const STAGE_OPTIONS: EmailTemplateCallStage[] = ['intro', 'follow_up', 'proposal_sent', 'objection', 'closing', 'post_sale'];

interface Props {
  template: EmailTemplateWithRelations | null;
  onSaved: (template?: EmailTemplate) => void | Promise<void>;
  onDeleted: (templateId: string) => void;
}

export default function EmailTemplateEditor({ template, onSaved, onDeleted }: Props) {
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [title, setTitle] = useState(template?.title || '');
  const [category, setCategory] = useState<EmailTemplateCategory>((template?.category as EmailTemplateCategory) || 'general');
  const [callStage, setCallStage] = useState<EmailTemplateCallStage>((template?.call_stage as EmailTemplateCallStage) || 'intro');
  const [subject, setSubject] = useState(template?.subject || '');
  const [bodyHtml, setBodyHtml] = useState(template?.body_html || '');
  const [isActive, setIsActive] = useState(Boolean(template?.is_active ?? true));
  const [links, setLinks] = useState<Array<Pick<EmailTemplateLink, 'label' | 'url' | 'sort_order'>>>(
    (template?.links || []).map((l) => ({ label: l.label, url: l.url, sort_order: l.sort_order }))
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    setTitle(template?.title || '');
    setCategory((template?.category as EmailTemplateCategory) || 'general');
    setCallStage((template?.call_stage as EmailTemplateCallStage) || 'intro');
    setSubject(template?.subject || '');
    setBodyHtml(template?.body_html || '');
    setIsActive(Boolean(template?.is_active ?? true));
    setLinks((template?.links || []).map((l) => ({ label: l.label, url: l.url, sort_order: l.sort_order })));
    setMessage('');
  }, [template?.id]);

  const previewHtml = useMemo(() => sanitizeEmailHtml(bodyHtml), [bodyHtml]);

  async function parseJsonSafe(res: Response) {
    const text = await res.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return { error: res.ok ? 'Unexpected response format' : 'Server returned non-JSON error response' };
    }
  }

  async function saveTemplate() {
    if (!title.trim() || !subject.trim() || !bodyHtml.trim()) {
      setMessage('Title, subject and body are required.');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const payload = {
        title: title.trim(),
        category,
        call_stage: callStage,
        subject: subject.trim(),
        body_html: bodyHtml,
        is_active: isActive,
        links: links
          .filter((l) => l.label.trim() && l.url.trim())
          .map((l, i) => ({ label: l.label.trim(), url: l.url.trim(), sort_order: i })),
      };

      const isNew = !template?.id;
      const endpoint = isNew
        ? '/api/admin/telecalling/email-templates'
        : `/api/admin/telecalling/email-templates/${template.id}`;

      const res = await fetch(endpoint, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Failed to save template');

      onSaved(data.template);
      setMessage('Template saved');
    } catch (err: any) {
      setMessage(err?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  }

  async function softDeleteTemplate() {
    if (!template?.id) return;
    if (!confirm('Deactivate this template?')) return;

    const res = await fetch(`/api/admin/telecalling/email-templates/${template.id}`, {
      method: 'DELETE',
    });

    const data = await parseJsonSafe(res);
    if (!res.ok) {
      setMessage(data?.error || 'Failed to deactivate template');
      return;
    }

    onDeleted(template.id);
  }

  async function uploadAttachment(file: File) {
    if (!template?.id) {
      setMessage('Save template before adding attachments.');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/admin/telecalling/email-templates/${template.id}/attachments`, {
        method: 'POST',
        body: form,
      });

      const data = await parseJsonSafe(res);
      if (!res.ok) throw new Error(data?.error || 'Attachment upload failed');
      setMessage(`Uploaded ${data?.attachment?.file_name || file.name}`);
      await onSaved();
    } catch (err: any) {
      setMessage(err?.message || 'Attachment upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function removeAttachment(attachmentId: string) {
    if (!template?.id) return;
    if (!confirm('Delete this attachment?')) return;

    const res = await fetch(`/api/admin/telecalling/email-templates/${template.id}/attachments?attachment_id=${encodeURIComponent(attachmentId)}`, {
      method: 'DELETE',
    });
    const data = await parseJsonSafe(res);
    if (!res.ok) {
      setMessage(data?.error || 'Failed to delete attachment');
      return;
    }

    setMessage('Attachment deleted');
    await onSaved();
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-400">
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100" />
        </label>
        <label className="text-xs font-medium text-slate-400">
          Subject
          <input value={subject} onChange={(e) => setSubject(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100" />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <label className="text-xs font-medium text-slate-400">
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value as EmailTemplateCategory)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-400">
          Call Stage
          <select value={callStage} onChange={(e) => setCallStage(e.target.value as EmailTemplateCallStage)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100">
            {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-end gap-2 text-xs font-medium text-slate-400">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active
        </label>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium text-slate-400">Body (HTML)</div>
        <textarea
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          rows={12}
          placeholder="Enter email body as HTML (for example: <p>Hello {{client_name}}</p>)"
          className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
        />
      </div>

      <div className="rounded-lg border border-slate-800 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Links</div>
        <div className="space-y-2">
          {links.map((link, index) => (
            <div key={`${index}-${link.label}`} className="grid grid-cols-1 gap-2 md:grid-cols-6">
              <input value={link.label} onChange={(e) => setLinks((prev) => prev.map((x, i) => (i === index ? { ...x, label: e.target.value } : x)))} placeholder="Label" className="md:col-span-2 rounded border border-slate-700 px-2 py-1.5 text-sm" />
              <input value={link.url} onChange={(e) => setLinks((prev) => prev.map((x, i) => (i === index ? { ...x, url: e.target.value } : x)))} placeholder="https://..." className="md:col-span-3 rounded border border-slate-700 px-2 py-1.5 text-sm" />
              <button type="button" onClick={() => setLinks((prev) => prev.filter((_, i) => i !== index))} className="rounded border border-rose-800/40 px-2 py-1.5 text-xs text-rose-400">Remove</button>
            </div>
          ))}
        </div>
        <button type="button" onClick={() => setLinks((prev) => [...prev, { label: '', url: '', sort_order: prev.length }])} className="mt-2 rounded border border-slate-700 px-2 py-1.5 text-xs text-slate-200">Add link</button>
      </div>

      <div className="rounded-lg border border-slate-800 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Attachments</div>
        <input type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadAttachment(file); }} className="text-xs" />
        {uploading ? <div className="mt-2 text-xs text-slate-500">Uploading...</div> : null}
        {template?.attachments?.length ? (
          <ul className="mt-2 space-y-1 text-xs text-slate-200">
            {template.attachments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2">
                <span>{a.file_name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(a.id)}
                  className="rounded border border-rose-800/40 px-2 py-1 text-[11px] text-rose-400"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-lg border border-slate-800 p-3">
        <div className="mb-2 text-xs font-semibold uppercase text-slate-500">Preview</div>
        <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: previewHtml }} />
      </div>

      {message ? <div className="text-xs text-slate-400">{message}</div> : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={saveTemplate} disabled={saving} className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Save template'}</button>
        {template?.id ? (
          <button type="button" onClick={softDeleteTemplate} className="rounded-md border border-rose-700/50 px-3 py-2 text-xs text-rose-400">Soft delete</button>
        ) : null}
      </div>
    </div>
  );
}
