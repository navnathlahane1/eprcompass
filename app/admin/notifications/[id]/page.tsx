/**
 * /admin/notifications/[id]
 * Full notification editor — edit SEO fields, approve/reject, view files,
 * view audit history, inline PDF preview, AI regeneration.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter }             from 'next/navigation';
import {
  ArrowLeft, Save, CheckCircle2, XCircle, Trash2, ExternalLink,
  FileText, RefreshCw, Eye, AlertCircle, History, Tag,
  ChevronDown, ChevronUp, Download
} from 'lucide-react';

interface NotificationDetail {
  id:                   string;
  slug:                 string;
  title:                string;
  short_description:    string | null;
  body_html:            string | null;
  body_text:            string | null;
  status:               string;
  epr_type:             string | null;
  document_type:        string | null;
  notification_number:  string | null;
  published_date:       string | null;
  effective_date:       string | null;
  compliance_deadline:  string | null;
  source_url:           string;
  tags:                 string[];
  is_featured:          boolean;
  seo_title:            string | null;
  seo_description:      string | null;
  seo_keywords:         string[];
  ai_summary:           string | null;
  compliance_impact:    string | null;
  action_points:        string[];
  affected_stakeholders:string[];
  key_compliance_points:string[];
  faqs:                 Array<{ q: string; a: string }>;
  applicable_states:    string[];
  applicable_industries:string[];
  view_count:           number;
  download_count:       number;
  created_at:           string;
  notification_authorities: { name: string; short_name: string } | null;
  notification_files:   Array<{
    id: string; cdn_url: string; mime_type: string; display_name: string | null;
    file_extension: string | null; file_size: number | null; is_primary: boolean;
    processing_status: string; extracted_text: string | null;
  }>;
}

interface AuditEntry {
  id:          string;
  change_type: string;
  new_values:  Record<string, any>;
  changed_at:  string;
  changed_by:  string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-900/30 text-emerald-300 border-emerald-800/40',
  draft:    'bg-amber-900/30 text-amber-300 border-amber-800/40',
  archived: 'bg-slate-900 text-slate-400 border-slate-800',
  rejected: 'bg-rose-900/30 text-rose-300 border-rose-800/40',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// ─── Editable field ───────────────────────────────────────────────────────────
function EditableField({
  label, value, onChange, type = 'text', rows = 2, hint
}: {
  label:    string;
  value:    string;
  onChange: (v: string) => void;
  type?:    string;
  rows?:    number;
  hint?:    string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</label>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none"
        />
      )}
      {hint && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

// ─── Section toggle wrapper ───────────────────────────────────────────────────
function Section({ title, icon, children, defaultOpen = true }: {
  title:       string;
  icon?:       React.ReactNode;
  children:    React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-950 transition-colors">
        <div className="flex items-center gap-2 font-semibold text-slate-100 text-sm">
          {icon}
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5 space-y-4">{children}</div>}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminNotificationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id     = params.id;

  const [notif,   setNotif]   = useState<NotificationDetail | null>(null);
  const [audit,   setAudit]   = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [dirty,   setDirty]   = useState(false);
  const [alert,   setAlert]   = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [form,    setForm]     = useState<Partial<NotificationDetail>>({});

  // ── Load data ───────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, auditRes] = await Promise.all([
        fetch(`/api/notifications/${id === undefined ? '' : id}`).then((r) => r.json()),
        fetch(`/api/admin/notifications/${id}/audit`).then((r) => r.json()).catch(() => ({ data: [] })),
      ]);

      if (notifRes.data) {
        setNotif(notifRes.data);
        setForm({
          title:                notifRes.data.title            || '',
          short_description:    notifRes.data.short_description || '',
          seo_title:            notifRes.data.seo_title         || '',
          seo_description:      notifRes.data.seo_description   || '',
          seo_keywords:         notifRes.data.seo_keywords      || [],
          tags:                 notifRes.data.tags              || [],
          is_featured:          notifRes.data.is_featured       || false,
          epr_type:             notifRes.data.epr_type          || '',
          document_type:        notifRes.data.document_type     || '',
          compliance_deadline:  notifRes.data.compliance_deadline || '',
          ai_summary:           notifRes.data.ai_summary         || '',
          compliance_impact:    notifRes.data.compliance_impact  || '',
        });
      }
      setAudit(auditRes.data || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function showAlert(msg: string, type: 'success' | 'error' = 'success') {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  }

  function updateField(key: keyof NotificationDetail, val: any) {
    setForm((prev) => ({ ...prev, [key]: val }));
    setDirty(true);
  }

  // ── Save ────────────────────────────────────────────────────────────────────
  async function save() {
    setSaving(true);
    try {
      const res  = await fetch(`/api/notifications/admin/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showAlert('Saved successfully');
      setDirty(false);
      load();
    } catch (err: any) {
      showAlert(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  // ── Status change ────────────────────────────────────────────────────────────
  async function changeStatus(status: string) {
    try {
      const res  = await fetch(`/api/notifications/admin/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showAlert(`Status changed to ${status}`);
      load();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────────
  async function deleteNotif() {
    if (!confirm('Soft-delete this notification? It will be hidden from the public site.')) return;
    await fetch(`/api/notifications/admin/${id}`, { method: 'DELETE' });
    showAlert('Deleted');
    setTimeout(() => router.push('/admin/notifications'), 1000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-400 mr-2" />
        <span className="text-slate-500">Loading notification…</span>
      </div>
    );
  }

  if (!notif) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-slate-400">Notification not found</p>
        <button onClick={() => router.back()} className="mt-4 text-blue-400 hover:underline text-sm">← Go back</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* Alert */}
      {alert && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium
          ${alert.type === 'success'
            ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
            : 'bg-rose-950/30 border-rose-800/40 text-rose-300'}`}>
          {alert.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            : <AlertCircle   className="w-4 h-4 flex-shrink-0" />}
          {alert.msg}
        </div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/admin/notifications')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${STATUS_STYLES[notif.status] || 'bg-slate-900 text-slate-400 border-slate-800'}`}>
            {notif.status}
          </span>

          {notif.is_featured && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-900/30 text-blue-300 border border-blue-800/40">
              ⭐ Featured
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/notifications/${notif.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-800 rounded-lg hover:bg-slate-950 transition-colors">
            <Eye className="w-3.5 h-3.5" />
            View Live
          </a>

          {notif.status !== 'active' && (
            <button
              onClick={() => changeStatus('active')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approve
            </button>
          )}

          {notif.status === 'active' && (
            <button
              onClick={() => changeStatus('archived')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors">
              Archive
            </button>
          )}

          {notif.status === 'draft' && (
            <button
              onClick={() => changeStatus('rejected')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-rose-900/30 hover:bg-red-200 text-rose-300 rounded-lg transition-colors">
              <XCircle className="w-3.5 h-3.5" />
              Reject
            </button>
          )}

          <button
            onClick={save}
            disabled={saving || !dirty}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50">
            {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>

          <button
            onClick={deleteNotif}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-rose-800/40 text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Stats mini row */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-500 bg-slate-950 rounded-xl px-4 py-3">
        <span>👁 {notif.view_count.toLocaleString()} views</span>
        <span>⬇ {notif.download_count.toLocaleString()} downloads</span>
        <span>📅 Published: {formatDate(notif.published_date)}</span>
        <span>🕒 Created: {formatDate(notif.created_at)}</span>
        {notif.notification_authorities?.short_name && (
          <span>🏛 {notif.notification_authorities.short_name}</span>
        )}
        <span className="font-mono text-xs text-slate-600">{id}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column: main edit fields ────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Core Content */}
          <Section title="Core Content" icon={<FileText className="w-4 h-4 text-blue-400" />}>
            <EditableField
              label="Title"
              value={form.title as string || ''}
              onChange={(v) => updateField('title', v)}
              hint="Displayed as H1 on the detail page"
            />
            <EditableField
              label="Short Description"
              value={form.short_description as string || ''}
              onChange={(v) => updateField('short_description', v)}
              type="textarea"
              rows={3}
              hint="Shown in card previews and as meta description fallback"
            />
            <EditableField
              label="AI Summary"
              value={form.ai_summary as string || ''}
              onChange={(v) => updateField('ai_summary', v)}
              type="textarea"
              rows={4}
              hint="Shown in the blue summary box on the detail page"
            />
            <EditableField
              label="Compliance Impact"
              value={form.compliance_impact as string || ''}
              onChange={(v) => updateField('compliance_impact', v)}
              type="textarea"
              rows={3}
            />
          </Section>

          {/* SEO Fields */}
          <Section title="SEO Settings" icon={<Tag className="w-4 h-4 text-violet-400" />} defaultOpen={false}>
            <EditableField
              label="SEO Title"
              value={form.seo_title as string || ''}
              onChange={(v) => updateField('seo_title', v)}
              hint={`${(form.seo_title as string || '').length}/60 chars`}
            />
            <EditableField
              label="Meta Description"
              value={form.seo_description as string || ''}
              onChange={(v) => updateField('seo_description', v)}
              type="textarea"
              rows={2}
              hint={`${(form.seo_description as string || '').length}/160 chars`}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                SEO Keywords
              </label>
              <input
                type="text"
                value={(form.seo_keywords as string[] || []).join(', ')}
                onChange={(e) => updateField('seo_keywords', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="keyword1, keyword2, keyword3"
                className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Tags</label>
              <input
                type="text"
                value={(form.tags as string[] || []).join(', ')}
                onChange={(e) => updateField('tags', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none"
              />
            </div>
          </Section>

          {/* Notification Body (read-only preview) */}
          {notif.body_html && (
            <Section title="Full Notification Content" defaultOpen={false}>
              <div
                className="prose prose-sm prose-blue max-w-none text-slate-200 text-sm leading-relaxed max-h-96 overflow-y-auto p-3 bg-slate-950 rounded-lg border"
                dangerouslySetInnerHTML={{ __html: notif.body_html }}
              />
            </Section>
          )}

          {/* Files */}
          {notif.notification_files.length > 0 && (
            <Section title={`Attached Files (${notif.notification_files.length})`} icon={<Download className="w-4 h-4 text-emerald-400" />} defaultOpen={false}>
              <div className="space-y-3">
                {notif.notification_files.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-rose-950/30 flex items-center justify-center">
                      <FileText className="w-4 h-4 text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {file.display_name || `File (${file.file_extension?.toUpperCase() || 'DOC'})`}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{file.mime_type}</span>
                        <span>{formatBytes(file.file_size)}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium
                          ${file.processing_status === 'processed' ? 'bg-emerald-900/30 text-emerald-300'
                            : file.processing_status === 'failed' ? 'bg-rose-900/30 text-rose-300'
                            : 'bg-amber-900/30 text-amber-300'}`}>
                          {file.processing_status}
                        </span>
                        {file.is_primary && <span className="text-blue-500 font-semibold">PRIMARY</span>}
                      </div>
                    </div>
                    <a
                      href={file.cdn_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-slate-800 text-slate-500 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Audit History */}
          {audit.length > 0 && (
            <Section title="Audit History" icon={<History className="w-4 h-4 text-slate-500" />} defaultOpen={false}>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {audit.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-3 text-xs">
                    <span className="flex-shrink-0 text-slate-600 mt-0.5">{formatDate(entry.changed_at)}</span>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium
                      ${entry.change_type === 'status_change' ? 'bg-blue-900/30 text-blue-300'
                        : entry.change_type === 'created' ? 'bg-emerald-900/30 text-emerald-300'
                        : 'bg-slate-900 text-slate-400'}`}>
                      {entry.change_type}
                    </span>
                    <span className="text-slate-500 truncate">
                      {Object.entries(entry.new_values || {})
                        .slice(0, 3)
                        .map(([k, v]) => `${k}: ${typeof v === 'string' ? v.slice(0, 30) : v}`)
                        .join(' · ')}
                    </span>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* ── Right sidebar ─────────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Classification */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">Classification</h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">EPR Type</label>
              <select
                value={form.epr_type as string || ''}
                onChange={(e) => { updateField('epr_type', e.target.value); }}
                className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none bg-slate-900/60">
                <option value="">— None —</option>
                {['Plastic','E-Waste','Battery','Tyre','Used-Oil','C&D','Hazardous','Biomedical'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Document Type</label>
              <select
                value={form.document_type as string || ''}
                onChange={(e) => updateField('document_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-800 rounded-lg focus:border-blue-400 outline-none bg-slate-900/60">
                <option value="">— None —</option>
                {['Circular','Gazette','Office Memorandum','Guideline','Amendment','Advisory','Penalty Notice','Press Release'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_featured"
                checked={form.is_featured as boolean || false}
                onChange={(e) => updateField('is_featured', e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-blue-400"
              />
              <label htmlFor="is_featured" className="text-sm text-slate-200 cursor-pointer">
                Featured notification (shown with ⭐ badge)
              </label>
            </div>

            <EditableField
              label="Compliance Deadline"
              value={form.compliance_deadline as string || ''}
              onChange={(v) => updateField('compliance_deadline', v)}
              type="date"
            />
          </div>

          {/* Source */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Source</h3>
            <a
              href={notif.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:underline break-all">
              {notif.source_url}
            </a>
            {notif.notification_number && (
              <p className="text-xs text-slate-500 mt-2">No: {notif.notification_number}</p>
            )}
          </div>

          {/* Quick status actions */}
          <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-4">
            <h3 className="text-xs font-semibold text-slate-400 uppercase mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {['active','draft','archived','rejected'].map((st) => (
                <button
                  key={st}
                  onClick={() => changeStatus(st)}
                  disabled={notif.status === st}
                  className={`px-2 py-1.5 text-xs rounded-lg border font-medium transition-colors capitalize
                    ${notif.status === st
                      ? 'opacity-40 cursor-not-allowed bg-slate-900 text-slate-500 border-slate-800'
                      : 'hover:bg-slate-950 text-slate-400 border-slate-800'}`}>
                  Set {st}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
