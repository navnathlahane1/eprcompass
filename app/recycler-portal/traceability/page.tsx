'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Batch {
  id: string;
  batch_code: string;
  waste_category: string;
  source_type: string | null;
  source_name: string | null;
  source_location: string | null;
  inflow_qty_mt: number;
  inflow_date: string | null;
  output_qty_mt: number | null;
  processed_qty_mt: number | null;
  yield_pct: number | null;
  process_method: string | null;
  status: 'COLLECTED' | 'IN_PROCESSING' | 'PROCESSED' | 'CREDITED';
  provenance_hash: string | null;
  transporter_name: string | null;
  vehicle_number: string | null;
  weighbridge_slip_url: string | null;
  credit_issued_qty_mt: number | null;
}

interface TraceEvent {
  id: string;
  event_type: string;
  event_at: string;
  actor: string | null;
  location: string | null;
  qty_mt: number | null;
  document_url: string | null;
  notes: string | null;
  hash: string | null;
}

interface Summary {
  total_batches: number;
  total_inflow_mt: number;
  total_output_mt: number;
  credited: number;
  in_processing: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const WASTE_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Used Oil', 'Other'];
const SOURCE_TYPES = ['Aggregator', 'Bulk Consumer', 'ULB / Municipality', 'Collection Center', 'Import', 'Other'];
const EVENT_TYPES = ['WEIGHED', 'TRANSPORTED', 'RECEIVED', 'QC', 'NOTE'];

const STATUS_STYLE: Record<string, string> = {
  COLLECTED: 'bg-blue-100 text-blue-800 border-blue-300',
  IN_PROCESSING: 'bg-amber-100 text-amber-800 border-amber-300',
  PROCESSED: 'bg-purple-100 text-purple-800 border-purple-300',
  CREDITED: 'bg-green-100 text-green-800 border-green-300',
};
const STATUS_STEPS = ['COLLECTED', 'IN_PROCESSING', 'PROCESSED', 'CREDITED'];

const EVENT_ICON: Record<string, string> = {
  COLLECTED: 'M5 13l4 4L19 7',
  WEIGHED: 'M3 6l3 1m0 0l-3 9a5 5 0 006 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5 5 0 006 0M18 7l3 9',
  TRANSPORTED: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z',
  RECEIVED: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
  PROCESSED: 'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-2.82 1.17',
  QC: 'M9 12l2 2 4-4',
  CREDIT_ISSUED: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01',
  NOTE: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5',
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}
function fmtDT(d: string) {
  return new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const EMPTY_FORM = {
  waste_category: '', source_type: '', source_name: '', source_location: '',
  inflow_qty_mt: '', inflow_date: '', transporter_name: '', vehicle_number: '',
  manifest_no: '', weighbridge_slip_url: '', gps_lat: '', gps_lng: '',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function TraceabilityPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [detail, setDetail] = useState<Batch | null>(null);
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const q = filter !== 'ALL' ? `?status=${filter}` : '';
    fetch(`/api/recycler-portal/traceability${q}`)
      .then(r => r.json())
      .then(d => { setBatches(d.batches ?? []); setSummary(d.summary ?? null); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function openDetail(b: Batch) {
    setDetail(b); setDetailLoading(true); setEvents([]);
    try {
      const r = await fetch(`/api/recycler-portal/traceability/${b.id}`);
      const d = await r.json();
      setDetail(d.batch ?? b);
      setEvents(d.events ?? []);
    } finally {
      setDetailLoading(false);
    }
  }

  async function handleCreate() {
    if (!form.waste_category) { setFormError('Select a waste category'); return; }
    if (!form.inflow_qty_mt || Number(form.inflow_qty_mt) <= 0) { setFormError('Enter a valid inflow quantity'); return; }
    setSaving(true); setFormError('');
    try {
      const r = await fetch('/api/recycler-portal/traceability', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error || 'Failed'); return; }
      trackEvent('Recycler Traceability Batch Created', { waste_category: form.waste_category });
      setForm(EMPTY_FORM); setCreateOpen(false); load();
    } finally { setSaving(false); }
  }

  async function patchBatch(action: string, payload: Record<string, any>) {
    if (!detail) return;
    const r = await fetch(`/api/recycler-portal/traceability/${detail.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
    });
    if (r.ok) { trackEvent('Recycler Traceability Batch Updated', { action }); openDetail(detail); load(); }
  }

  const cards = summary ? [
    { label: 'Total Batches', value: summary.total_batches, color: 'text-gray-900' },
    { label: 'Inflow (MT)', value: summary.total_inflow_mt, color: 'text-blue-600' },
    { label: 'Output (MT)', value: summary.total_output_mt, color: 'text-purple-600' },
    { label: 'Credited Batches', value: summary.credited, color: 'text-green-600' },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traceability Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track each batch from waste collection → processing → EPR credit issuance with a verifiable chain of custody.
          </p>
        </div>
        <button onClick={() => { setCreateOpen(true); setFormError(''); }}
          className="shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
          + Record Inflow Batch
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map(c => (
            <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{c.label}</p>
              <p className={`text-3xl font-bold mt-1 ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['ALL', ...STATUS_STEPS].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s === 'ALL' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}</div>
      ) : batches.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <p className="text-sm font-medium text-gray-700">No batches recorded yet</p>
          <p className="text-xs text-gray-400 mt-1">Record your first inflow batch to start building a provenance trail.</p>
          <button onClick={() => setCreateOpen(true)} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Record Inflow Batch</button>
        </div>
      ) : (
        <div className="space-y-3">
          {batches.map(b => (
            <button key={b.id} onClick={() => openDetail(b)}
              className="w-full text-left rounded-xl border border-gray-200 bg-white p-4 hover:border-teal-300 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-mono text-gray-400">{b.batch_code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[b.status]}`}>{b.status.replace('_', ' ')}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{b.waste_category}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {b.inflow_qty_mt} MT from {b.source_name || b.source_type || 'source'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.source_location && `${b.source_location} · `}Collected {fmt(b.inflow_date)}
                    {b.output_qty_mt != null && ` · Output ${b.output_qty_mt} MT`}
                    {b.yield_pct != null && ` · ${Math.round(b.yield_pct)}% yield`}
                  </p>
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400 shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </div>
              {/* Mini progress */}
              <div className="mt-3 flex items-center gap-1">
                {STATUS_STEPS.map((step, i) => {
                  const reached = STATUS_STEPS.indexOf(b.status) >= i;
                  return <div key={step} className={`h-1.5 flex-1 rounded-full ${reached ? 'bg-teal-500' : 'bg-gray-200'}`} />;
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
          <div className="my-4 w-full max-w-lg rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Record Inflow Batch</h2>
              <button onClick={() => setCreateOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Waste Category *</label>
                <select value={form.waste_category} onChange={e => setForm(f => ({ ...f, waste_category: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select…</option>
                  {WASTE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Inflow Qty (MT) *</label>
                <input type="number" min={0.001} step={0.001} value={form.inflow_qty_mt}
                  onChange={e => setForm(f => ({ ...f, inflow_qty_mt: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Source Type</label>
                <select value={form.source_type} onChange={e => setForm(f => ({ ...f, source_type: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="">Select…</option>
                  {SOURCE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Source Name</label>
                <input value={form.source_name} onChange={e => setForm(f => ({ ...f, source_name: e.target.value }))}
                  placeholder="e.g. Shree Scrap Traders"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Source Location</label>
                <input value={form.source_location} onChange={e => setForm(f => ({ ...f, source_location: e.target.value }))}
                  placeholder="City / area"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Collection Date</label>
                <input type="date" value={form.inflow_date} onChange={e => setForm(f => ({ ...f, inflow_date: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Transporter</label>
                <input value={form.transporter_name} onChange={e => setForm(f => ({ ...f, transporter_name: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Vehicle Number</label>
                <input value={form.vehicle_number} onChange={e => setForm(f => ({ ...f, vehicle_number: e.target.value }))}
                  placeholder="MH 12 AB 1234"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Weighbridge Slip URL</label>
                <input value={form.weighbridge_slip_url} onChange={e => setForm(f => ({ ...f, weighbridge_slip_url: e.target.value }))}
                  placeholder="https://… (link to scanned slip)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            {formError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{formError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setCreateOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Create Batch'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={() => setDetail(null)}>
          <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-xl p-6 space-y-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-mono text-gray-400">{detail.batch_code}</p>
                <h2 className="text-lg font-bold text-gray-900">{detail.waste_category} — {detail.inflow_qty_mt} MT</h2>
                <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_STYLE[detail.status]}`}>{detail.status.replace('_', ' ')}</span>
              </div>
              <button onClick={() => setDetail(null)} className="text-gray-400 hover:text-gray-600 shrink-0">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Provenance hash */}
            {detail.provenance_hash && (
              <div className="rounded-lg bg-gray-900 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">Provenance Hash</p>
                <p className="font-mono text-xs text-green-400 break-all">{detail.provenance_hash}</p>
              </div>
            )}

            {/* Source / processing facts */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Fact label="Source" value={detail.source_name || detail.source_type} />
              <Fact label="Location" value={detail.source_location} />
              <Fact label="Transporter" value={detail.transporter_name} />
              <Fact label="Vehicle" value={detail.vehicle_number} />
              <Fact label="Processed" value={detail.processed_qty_mt != null ? `${detail.processed_qty_mt} MT` : null} />
              <Fact label="Output" value={detail.output_qty_mt != null ? `${detail.output_qty_mt} MT` : null} />
              <Fact label="Yield" value={detail.yield_pct != null ? `${Math.round(detail.yield_pct)}%` : null} />
              <Fact label="Method" value={detail.process_method} />
            </div>
            {detail.weighbridge_slip_url && (
              <a href={detail.weighbridge_slip_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 underline">View weighbridge slip ↗</a>
            )}

            {/* Stage actions */}
            <div className="flex flex-wrap gap-2">
              {(detail.status === 'COLLECTED' || detail.status === 'IN_PROCESSING') && (
                <ProcessingAction onSubmit={(p) => patchBatch('add_processing', p)} />
              )}
              {detail.status === 'PROCESSED' && (
                <button onClick={() => patchBatch('mark_credited', {})}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Mark Credit Issued</button>
              )}
              <AddEventAction onSubmit={(p) => patchBatch('add_event', p)} />
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Chain of Custody</h3>
              {detailLoading ? (
                <div className="space-y-2">{[1,2].map(i => <div key={i} className="h-12 rounded-lg bg-gray-100 animate-pulse" />)}</div>
              ) : (
                <ol className="relative border-l-2 border-gray-200 ml-3 space-y-5">
                  {events.map(ev => (
                    <li key={ev.id} className="ml-5">
                      <span className="absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full bg-teal-100 ring-4 ring-white">
                        <svg viewBox="0 0 24 24" className="h-3 w-3 text-teal-600" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={EVENT_ICON[ev.event_type] || EVENT_ICON.NOTE}/></svg>
                      </span>
                      <p className="text-sm font-semibold text-gray-900">{ev.event_type.replace('_', ' ')}</p>
                      <p className="text-xs text-gray-500">{fmtDT(ev.event_at)}{ev.actor && ` · ${ev.actor}`}{ev.qty_mt != null && ` · ${ev.qty_mt} MT`}</p>
                      {ev.notes && <p className="text-xs text-gray-600 mt-0.5">{ev.notes}</p>}
                      {ev.document_url && <a href={ev.document_url} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 underline">Document ↗</a>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-gray-800">{value || '—'}</p>
    </div>
  );
}

function ProcessingAction({ onSubmit }: { onSubmit: (p: Record<string, any>) => void }) {
  const [open, setOpen] = useState(false);
  const [processed, setProcessed] = useState('');
  const [output, setOutput] = useState('');
  const [method, setMethod] = useState('');
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-700">Log Processing</button>;
  return (
    <div className="w-full rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-purple-800">Log Processing Output</p>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step={0.001} value={processed} onChange={e => setProcessed(e.target.value)} placeholder="Processed MT" className="rounded border border-purple-200 px-2 py-1 text-xs" />
        <input type="number" step={0.001} value={output} onChange={e => setOutput(e.target.value)} placeholder="Output MT" className="rounded border border-purple-200 px-2 py-1 text-xs" />
      </div>
      <input value={method} onChange={e => setMethod(e.target.value)} placeholder="Process method (e.g. shredding, smelting)" className="w-full rounded border border-purple-200 px-2 py-1 text-xs" />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 rounded border border-purple-200 py-1 text-xs text-purple-700">Cancel</button>
        <button onClick={() => { onSubmit({ processed_qty_mt: processed, output_qty_mt: output, process_method: method }); setOpen(false); }}
          className="flex-1 rounded bg-purple-600 py-1 text-xs font-semibold text-white">Save</button>
      </div>
    </div>
  );
}

function AddEventAction({ onSubmit }: { onSubmit: (p: Record<string, any>) => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(EVENT_TYPES[0]);
  const [notes, setNotes] = useState('');
  const [doc, setDoc] = useState('');
  if (!open) return <button onClick={() => setOpen(true)} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">+ Add Event</button>;
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-700">Add Custody Event</p>
      <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded border border-gray-300 px-2 py-1 text-xs">
        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
      <input value={doc} onChange={e => setDoc(e.target.value)} placeholder="Document URL (optional)" className="w-full rounded border border-gray-300 px-2 py-1 text-xs" />
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 rounded border border-gray-300 py-1 text-xs text-gray-600">Cancel</button>
        <button onClick={() => { onSubmit({ event_type: type, notes, document_url: doc }); setOpen(false); }} className="flex-1 rounded bg-teal-600 py-1 text-xs font-semibold text-white">Add</button>
      </div>
    </div>
  );
}
