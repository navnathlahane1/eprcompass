'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Invoice {
  id: string;
  invoice_no: string;
  client_id: string;
  client_name: string;
  client_gstin: string | null;
  gstin_verified: boolean;
  amount_inr: number;
  tax_inr: number;
  total_inr: number;
  issued_date: string;
  due_date: string | null;
  paid_date: string | null;
  status: string;
  notes: string | null;
  service_id: string | null;
  pdf_path: string | null;
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
}

const STATUS_STYLES: Record<string, string> = {
  draft:    'bg-slate-700/60 text-slate-400 border-slate-700/40',
  sent:     'bg-blue-500/20 text-blue-300 border-blue-500/30',
  paid:     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  overdue:  'bg-rose-500/20 text-rose-300 border-rose-500/30',
  cancelled:'bg-slate-600/30 text-slate-500 border-slate-700/30',
};

// India GSTIN: 2 digits + 5 uppercase letters + 4 digits + 1 letter + 1 alphanumeric + Z + 1 alphanumeric
const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z\d]$/;

function validateGstin(g: string) {
  return GSTIN_RE.test(g.toUpperCase().trim());
}

function fmt(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fmtFileSize(bytes: number | null) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

function fileIcon(mime: string | null) {
  if (mime === 'application/pdf') return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  if (mime?.startsWith('image/')) return 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z';
  return 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z';
}

export default function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  useRouter();

  const [inv,          setInv]          = useState<Invoice | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState<string | null>(null);
  const [err,          setErr]          = useState('');
  const [editMode,     setEditMode]     = useState(false);
  const [attachments,  setAttachments]  = useState<Attachment[]>([]);
  const [attLoading,   setAttLoading]   = useState(false);
  const [gstinEdit,    setGstinEdit]    = useState(false);
  const [gstinVal,     setGstinVal]     = useState('');
  const [gstinSaving,  setGstinSaving]  = useState(false);
  const [gstinErr,     setGstinErr]     = useState('');

  // Document upload
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const attInputRef   = useRef<HTMLInputElement>(null);
  const [uploading,   setUploading]   = useState(false);
  const [attUploading,setAttUploading]= useState(false);
  const [docErr,      setDocErr]      = useState('');
  const [attErr,      setAttErr]      = useState('');

  // Edit state
  const [eAmount,  setEAmount]  = useState('');
  const [eTax,     setETax]     = useState('');
  const [eDueDate, setEDueDate] = useState('');
  const [eNotes,   setENotes]   = useState('');

  const loadAttachments = useCallback(() => {
    if (!id) return;
    setAttLoading(true);
    fetch(`/api/finance/invoices/${id}/attachments`)
      .then(r => r.ok ? r.json() : [])
      .then(d => setAttachments(d ?? []))
      .finally(() => setAttLoading(false));
  }, [id]);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/finance/invoices/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(d => {
        setInv(d.invoice);
        setEAmount(String(d.invoice.amount_inr ?? ''));
        setETax(String(d.invoice.tax_inr ?? ''));
        setEDueDate(d.invoice.due_date ?? '');
        setENotes(d.invoice.notes ?? '');
        setGstinVal(d.invoice.client_gstin ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); loadAttachments(); }, [load, loadAttachments]);

  async function patchInvoice(body: Record<string, unknown>, label: string) {
    setSaving(label); setErr('');
    try {
      const res = await fetch(`/api/finance/invoices/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      load();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setSaving(null);
    }
  }

  async function handleEditSave() {
    await patchInvoice({
      amount_inr: parseFloat(eAmount) || 0,
      tax_inr:    parseFloat(eTax)    || 0,
      due_date:   eDueDate || null,
      notes:      eNotes   || null,
    }, 'edit');
    setEditMode(false);
  }

  // Main invoice PDF upload
  async function handleDocUpload(file: File) {
    setUploading(true); setDocErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/finance/invoices/${id}/document`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      load();
    } catch (e: any) {
      setDocErr(e.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleDocView() {
    setDocErr('');
    try {
      const res = await fetch(`/api/finance/invoices/${id}/document`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not open');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e: any) { setDocErr(e.message); }
  }

  async function handleDocRemove() {
    if (!confirm('Remove the uploaded invoice document?')) return;
    setDocErr('');
    try {
      const res = await fetch(`/api/finance/invoices/${id}/document`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error || 'Remove failed');
      load();
    } catch (e: any) { setDocErr(e.message); }
  }

  // Attachment upload
  async function handleAttUpload(file: File) {
    setAttUploading(true); setAttErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch(`/api/finance/invoices/${id}/attachments`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      loadAttachments();
    } catch (e: any) {
      setAttErr(e.message);
    } finally {
      setAttUploading(false);
      if (attInputRef.current) attInputRef.current.value = '';
    }
  }

  async function handleAttView(att: Attachment) {
    try {
      const res = await fetch(`/api/finance/invoices/${id}/attachments`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachmentId: att.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (e: any) { setAttErr((e as Error).message); }
  }

  async function handleAttDelete(att: Attachment) {
    if (!confirm(`Remove attachment "${att.file_name}"?`)) return;
    setAttErr('');
    try {
      const res = await fetch(`/api/finance/invoices/${id}/attachments?attachmentId=${att.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error);
      loadAttachments();
    } catch (e: any) { setAttErr((e as Error).message); }
  }

  // GSTIN save
  async function saveGstin() {
    const val = gstinVal.toUpperCase().trim();
    if (val && !validateGstin(val)) {
      setGstinErr('Invalid GSTIN format. Must be 15 characters (e.g. 27AAPFU0939F1ZV)');
      return;
    }
    setGstinSaving(true); setGstinErr('');
    try {
      const res = await fetch(`/api/finance/clients/${inv!.client_id}/gstin`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gstin: val || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save GSTIN');
      setGstinEdit(false);
      load();
    } catch (e: any) {
      setGstinErr(e.message);
    } finally {
      setGstinSaving(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  if (!inv) return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] py-16 text-center">
      <p className="text-sm text-slate-500">Invoice not found</p>
      <Link href="/finance/invoices" className="mt-2 inline-block text-xs text-emerald-400 hover:text-emerald-300 transition">
        Back to invoices →
      </Link>
    </div>
  );

  const isEditable  = inv.status === 'draft';
  const canSend     = inv.status === 'draft';
  const canMarkPaid = inv.status === 'sent' || inv.status === 'overdue';

  const gstinStatus = !inv.client_gstin
    ? { label: 'No GSTIN on file', color: 'text-amber-400', badge: 'bg-amber-500/15 text-amber-300', dot: 'bg-amber-500' }
    : !validateGstin(inv.client_gstin)
    ? { label: 'Invalid format', color: 'text-rose-400', badge: 'bg-rose-500/15 text-rose-300', dot: 'bg-rose-500' }
    : inv.gstin_verified
    ? { label: 'Verified', color: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-300', dot: 'bg-emerald-500' }
    : { label: 'Not verified', color: 'text-slate-400', badge: 'bg-slate-700/60 text-slate-400', dot: 'bg-slate-500' };

  return (
    <div className="space-y-5 max-w-3xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs">
        <Link href="/finance/invoices" className="text-slate-500 hover:text-slate-300 transition">Invoices</Link>
        <span className="text-slate-700">/</span>
        <span className="text-slate-400">{inv.invoice_no}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-100">{inv.invoice_no}</h1>
            <span className={`rounded-lg border px-2.5 py-0.5 text-xs font-bold uppercase ${STATUS_STYLES[inv.status] || 'bg-slate-700/50 text-slate-400'}`}>
              {inv.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{inv.client_name}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isEditable && !editMode && (
            <button onClick={() => setEditMode(true)}
              className="rounded-lg border border-slate-800 px-3 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">
              Edit
            </button>
          )}
          {canSend && (
            <button onClick={() => patchInvoice({ action: 'send' }, 'send')} disabled={saving === 'send'}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 transition hover:bg-blue-500/20 disabled:opacity-60">
              {saving === 'send' && <span className="h-3 w-3 animate-spin rounded-full border border-blue-300 border-t-transparent" />}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Invoice
            </button>
          )}
          {canMarkPaid && (
            <button onClick={() => { if (confirm('Mark this invoice as paid?')) patchInvoice({ action: 'mark_paid' }, 'mark_paid'); }}
              disabled={saving === 'mark_paid'}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving === 'mark_paid' && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />}
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Mark as Paid
            </button>
          )}
        </div>
      </div>

      {err && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-3 py-2.5 text-xs text-rose-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {err}
        </div>
      )}

      {/* Main invoice card */}
      {editMode ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Edit Invoice</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Amount (₹)</label>
              <input type="number" min="0" step="0.01" value={eAmount} onChange={e => setEAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">Tax / GST (₹)</label>
              <input type="number" min="0" step="0.01" value={eTax} onChange={e => setETax(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Due Date</label>
            <input type="date" value={eDueDate} onChange={e => setEDueDate(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50 transition [color-scheme:dark]" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Notes</label>
            <textarea rows={3} value={eNotes} onChange={e => setENotes(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 resize-none transition" />
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditMode(false)} className="rounded-lg border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-400 transition hover:text-slate-200">Cancel</button>
            <button onClick={handleEditSave} disabled={saving === 'edit'}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {saving === 'edit' && <span className="h-3.5 w-3.5 animate-spin rounded-full border border-white border-t-transparent" />}
              Save Changes
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          <div className="border-b border-slate-800/60 px-6 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">EPR Compass</p>
                <p className="mt-1 text-2xl font-bold text-slate-100">{inv.invoice_no}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-600">Issued</p>
                <p className="text-xs font-semibold text-slate-300">{fmtDate(inv.issued_date)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-slate-800/60 px-6 py-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">Bill To</p>
              <p className="text-sm font-semibold text-slate-200">{inv.client_name}</p>
            </div>
            <div>
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">Due Date</p>
              <p className={`text-sm font-semibold ${inv.status === 'overdue' ? 'text-rose-400' : 'text-slate-200'}`}>
                {fmtDate(inv.due_date)}
              </p>
            </div>
            {inv.paid_date && (
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">Paid On</p>
                <p className="text-sm font-semibold text-emerald-400">{fmtDate(inv.paid_date)}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-800/60">
                  <th className="pb-2 text-left text-[10px] font-bold uppercase tracking-widest text-slate-600">Description</th>
                  <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-widest text-slate-600">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/30">
                  <td className="py-2.5 text-slate-300">EPR Compliance Services</td>
                  <td className="py-2.5 text-right font-semibold text-slate-200 tabular-nums">{fmt(inv.amount_inr)}</td>
                </tr>
                {inv.tax_inr > 0 && (
                  <tr className="border-b border-slate-800/30">
                    <td className="py-2.5 text-slate-500">GST / Tax</td>
                    <td className="py-2.5 text-right text-slate-400 tabular-nums">{fmt(inv.tax_inr)}</td>
                  </tr>
                )}
                <tr>
                  <td className="pt-3 font-bold text-slate-200">Total</td>
                  <td className="pt-3 text-right text-base font-bold text-emerald-400 tabular-nums">{fmt(inv.total_inr)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {inv.notes && (
            <div className="border-t border-slate-800/60 px-6 py-4">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">Notes</p>
              <p className="text-xs text-slate-400">{inv.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* ── GST Validation ───────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">GST Validation</p>
          </div>
          {!gstinEdit && (
            <button onClick={() => { setGstinEdit(true); setGstinErr(''); }}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-300">
              {inv.client_gstin ? 'Edit GSTIN' : 'Add GSTIN'}
            </button>
          )}
        </div>

        {gstinEdit ? (
          <div className="space-y-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-400">
                Client GSTIN <span className="font-normal text-slate-600">(15 characters)</span>
              </label>
              <input
                type="text" maxLength={15}
                value={gstinVal}
                onChange={e => { setGstinVal(e.target.value.toUpperCase()); setGstinErr(''); }}
                placeholder="e.g. 27AAPFU0939F1ZV"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-emerald-500/50 transition uppercase"
              />
              {gstinVal.length > 0 && (
                <p className={`mt-1 text-[10px] font-medium ${validateGstin(gstinVal) ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {validateGstin(gstinVal) ? '✓ Valid GSTIN format' : `${15 - gstinVal.length} characters remaining`}
                </p>
              )}
            </div>
            {gstinErr && <p className="text-xs text-rose-400">{gstinErr}</p>}
            <div className="flex gap-2">
              <button onClick={() => { setGstinEdit(false); setGstinVal(inv.client_gstin ?? ''); setGstinErr(''); }}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">
                Cancel
              </button>
              <button onClick={saveGstin} disabled={gstinSaving}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition disabled:opacity-50">
                {gstinSaving ? 'Saving…' : 'Save GSTIN'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className={`h-2 w-2 shrink-0 rounded-full ${gstinStatus.dot}`} />
            <div className="min-w-0 flex-1">
              {inv.client_gstin ? (
                <p className="text-sm font-mono font-semibold text-slate-200">{inv.client_gstin}</p>
              ) : (
                <p className="text-xs text-slate-500">No GSTIN on file for {inv.client_name}</p>
              )}
            </div>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold ${gstinStatus.badge}`}>
              {gstinStatus.label}
            </span>
          </div>
        )}

        {!inv.client_gstin && !gstinEdit && (
          <p className="text-[11px] text-amber-500/80">
            Missing GSTIN may cause GST compliance issues. Add the client's GSTIN before sending.
          </p>
        )}
      </div>

      {/* ── Invoice Document Upload ───────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Invoice Document</p>
            <p className="mt-1 text-xs text-slate-500">The primary invoice PDF sent to the client (PDF/PNG/JPG · max 10MB)</p>
          </div>
          <div className="flex items-center gap-2">
            {inv.pdf_path && (
              <>
                <button onClick={handleDocView}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </button>
                <button onClick={handleDocRemove}
                  className="rounded-lg border border-rose-500/30 px-3 py-2 text-xs font-semibold text-rose-400 transition hover:bg-rose-500/10">
                  Remove
                </button>
              </>
            )}
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">
              {uploading
                ? <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                : <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12m0-12l-4 4m4-4l4 4" />
                  </svg>
              }
              {inv.pdf_path ? 'Replace' : 'Upload Invoice'}
            </button>
            <input ref={fileInputRef} type="file" accept="application/pdf,image/png,image/jpeg" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleDocUpload(f); }} />
          </div>
        </div>

        {inv.pdf_path ? (
          <div className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate text-xs text-slate-300">{inv.pdf_path.split('/').pop()?.replace(/^\d+-/, '')}</span>
            <span className="ml-auto shrink-0 rounded-md bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-400">Uploaded</span>
          </div>
        ) : (
          <p className="text-xs text-slate-600">No document uploaded yet.</p>
        )}

        {docErr && <p className="text-xs text-rose-400">{docErr}</p>}
      </div>

      {/* ── Attachments ──────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Attachments</p>
            <p className="mt-1 text-xs text-slate-500">Supporting documents — PO, work order, delivery receipt, contracts (PDF/PNG/JPG/DOCX/XLSX · max 20MB)</p>
          </div>
          <button onClick={() => attInputRef.current?.click()} disabled={attUploading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white disabled:opacity-50">
            {attUploading
              ? <span className="h-3 w-3 animate-spin rounded-full border border-slate-300 border-t-transparent" />
              : <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
            }
            Attach File
          </button>
          <input ref={attInputRef} type="file"
            accept="application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleAttUpload(f); }} />
        </div>

        {attErr && <p className="text-xs text-rose-400">{attErr}</p>}

        {attLoading ? (
          <div className="flex items-center justify-center py-6">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : attachments.length === 0 ? (
          <p className="text-xs text-slate-600">No attachments yet. Add supporting documents above.</p>
        ) : (
          <div className="space-y-2">
            {attachments.map(att => (
              <div key={att.id} className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={fileIcon(att.mime_type)} />
                </svg>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">{att.file_name}</p>
                  {att.file_size && (
                    <p className="text-[10px] text-slate-600">{fmtFileSize(att.file_size)}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => handleAttView(att)}
                    className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400 transition hover:border-emerald-500/40 hover:text-emerald-400">
                    View
                  </button>
                  <button onClick={() => handleAttDelete(att)}
                    className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-rose-500/40 hover:text-rose-400">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status banners */}
      {inv.status === 'paid' && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs text-emerald-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Payment received on {fmtDate(inv.paid_date)}. IAM task has been created to set up the client portal login.
        </div>
      )}
      {inv.status === 'overdue' && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 px-4 py-3 text-xs text-rose-400">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          This invoice is overdue. Follow up with the client and mark as paid once payment is received.
        </div>
      )}
    </div>
  );
}

