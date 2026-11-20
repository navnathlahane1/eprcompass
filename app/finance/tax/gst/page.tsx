'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface GstFiling {
  id: string;
  return_type: string;
  period_month: number | null;
  period_year: number;
  due_date: string;
  status: 'pending' | 'filed' | 'overdue';
  filed_date: string | null;
  arn: string | null;
  remarks: string | null;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function periodLabel(f: GstFiling) {
  if (f.return_type === 'GSTR-9') return `FY ${f.period_year}-${String(f.period_year + 1).slice(2)}`;
  return `${MONTHS[(f.period_month ?? 1) - 1]} ${f.period_year}`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysLabel(due: string) {
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86400_000);
  if (diff < 0)   return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `${diff}d left`;
}

const TYPE_META: Record<string, { color: string; bg: string; border: string }> = {
  'GSTR-1':  { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  'GSTR-3B': { color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30'   },
  'GSTR-9':  { color: 'text-violet-400',  bg: 'bg-violet-500/10',  border: 'border-violet-500/30'  },
};

// ── Mark Filed Modal ──────────────────────────────────────────────────────────

function MarkFiledModal({
  filing,
  onClose,
  onSaved,
}: {
  filing: GstFiling;
  onClose: () => void;
  onSaved: (updated: GstFiling) => void;
}) {
  const [arn,        setArn]        = useState(filing.arn ?? '');
  const [filedDate,  setFiledDate]  = useState(filing.filed_date ?? new Date().toISOString().split('T')[0]);
  const [remarks,    setRemarks]    = useState(filing.remarks ?? '');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  async function save() {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/finance/gst', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: filing.id, status: 'filed', filed_date: filedDate, arn, remarks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      onSaved(json);
    } catch (e: any) {
      setError(e.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c1022] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">Mark as Filed</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {filing.return_type} — {periodLabel(filing)}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Filed Date</label>
            <input
              type="date"
              value={filedDate}
              onChange={e => setFiledDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              ARN <span className="text-slate-600 font-normal">(Acknowledgement Reference Number)</span>
            </label>
            <input
              type="text"
              value={arn}
              onChange={e => setArn(e.target.value)}
              placeholder="e.g. AA012345678901D"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">Remarks <span className="text-slate-600 font-normal">(optional)</span></label>
            <textarea
              rows={2}
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              placeholder="e.g. Nil return, filed via GST portal"
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </div>

        <div className="mt-5 flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800">
            Cancel
          </button>
          <button onClick={save} disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            {saving ? 'Saving…' : 'Mark as Filed'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Mark Pending Modal ────────────────────────────────────────────────────────

function RevertModal({
  filing,
  onClose,
  onSaved,
}: {
  filing: GstFiling;
  onClose: () => void;
  onSaved: (updated: GstFiling) => void;
}) {
  const [saving, setSaving] = useState(false);
  const dueDate = new Date(filing.due_date);
  const newStatus = dueDate < new Date() ? 'overdue' : 'pending';

  async function save() {
    setSaving(true);
    try {
      const res = await fetch('/api/finance/gst', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: filing.id, status: newStatus, filed_date: '', arn: '', remarks: '' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      onSaved(json);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-[#0c1022] p-6 shadow-2xl"
        onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold text-slate-100 mb-2">Revert to Pending?</h3>
        <p className="text-xs text-slate-500 mb-5">
          This will clear the filed date and ARN for {filing.return_type} — {periodLabel(filing)}.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">Cancel</button>
          <button onClick={save} disabled={saving} className="flex-1 rounded-lg bg-rose-600 py-2 text-sm font-semibold text-white hover:bg-rose-500 transition disabled:opacity-50">
            {saving ? 'Reverting…' : 'Revert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function GSTPage() {
  const [filings,    setFilings]    = useState<GstFiling[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [markFiling, setMarkFiling] = useState<GstFiling | null>(null);
  const [revertFiling, setRevertFiling] = useState<GstFiling | null>(null);
  const [filter,     setFilter]     = useState<'all' | 'pending' | 'overdue' | 'filed'>('all');

  useEffect(() => {
    fetch('/api/finance/gst')
      .then(r => r.ok ? r.json() : [])
      .then(d => setFilings(d ?? []))
      .finally(() => setLoading(false));
  }, []);

  function onSaved(updated: GstFiling) {
    setFilings(prev => prev.map(f => f.id === updated.id ? updated : f));
    setMarkFiling(null);
    setRevertFiling(null);
  }

  const filtered = filings.filter(f => filter === 'all' || f.status === filter)
    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());

  const counts = {
    all:     filings.length,
    pending: filings.filter(f => f.status === 'pending').length,
    overdue: filings.filter(f => f.status === 'overdue').length,
    filed:   filings.filter(f => f.status === 'filed').length,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-6">
      {markFiling   && <MarkFiledModal filing={markFiling}   onClose={() => setMarkFiling(null)}   onSaved={onSaved} />}
      {revertFiling && <RevertModal    filing={revertFiling} onClose={() => setRevertFiling(null)} onSaved={onSaved} />}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">GST Management</h1>
          <p className="mt-0.5 text-sm text-slate-500">GSTR-1, GSTR-3B and GSTR-9 filing tracker</p>
        </div>
        <Link href="/finance/tax"
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700 transition">
          ← Tax Management
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: 'all',     label: 'Total Returns', color: 'text-slate-200', accent: 'bg-slate-500' },
          { key: 'pending', label: 'Pending',        color: 'text-amber-400', accent: 'bg-amber-500' },
          { key: 'overdue', label: 'Overdue',        color: 'text-rose-400',  accent: 'bg-rose-500'  },
          { key: 'filed',   label: 'Filed',          color: 'text-emerald-400', accent: 'bg-emerald-500' },
        ].map(s => (
          <button key={s.key} onClick={() => setFilter(s.key as typeof filter)}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
              filter === s.key ? 'border-slate-600 bg-slate-800' : 'border-slate-800/80 bg-[#0c1022] hover:border-slate-700'
            }`}>
            <div className={`h-8 w-1 shrink-0 rounded-full ${s.accent}`} />
            <div>
              <p className={`text-xl font-bold tabular-nums ${s.color}`}>{counts[s.key as keyof typeof counts]}</p>
              <p className="text-[10px] text-slate-600">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filings table */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
        <div className="border-b border-slate-800/80 px-5 py-3.5 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-200">
            {filter === 'all' ? 'All Returns' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Returns`}
            <span className="ml-2 text-xs text-slate-600">({filtered.length})</span>
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-600">No returns in this category</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {filtered.map(f => {
              const meta      = TYPE_META[f.return_type] ?? TYPE_META['GSTR-1'];
              const isFiled   = f.status === 'filed';
              const isOverdue = f.status === 'overdue';
              const diff      = Math.ceil((new Date(f.due_date).getTime() - Date.now()) / 86400_000);
              return (
                <div key={f.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-800/20 transition">
                  {/* Return type badge */}
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${meta.border} ${meta.bg}`}>
                    <span className={`text-[10px] font-bold ${meta.color}`}>{f.return_type.replace('GSTR-', '')}</span>
                  </div>

                  {/* Type + period */}
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${meta.color}`}>{f.return_type}</p>
                    <p className="text-xs text-slate-500">{periodLabel(f)}</p>
                  </div>

                  {/* Due date */}
                  <div className="hidden sm:block min-w-[100px]">
                    <p className="text-xs text-slate-500">Due</p>
                    <p className={`text-sm font-semibold ${isOverdue ? 'text-rose-400' : isFiled ? 'text-slate-400' : 'text-slate-200'}`}>
                      {fmtDate(f.due_date)}
                    </p>
                  </div>

                  {/* Days remaining / filed info */}
                  <div className="hidden md:block min-w-[110px]">
                    {isFiled ? (
                      <div>
                        <p className="text-xs text-slate-500">Filed</p>
                        <p className="text-sm font-semibold text-emerald-400">{fmtDate(f.filed_date)}</p>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                        isOverdue          ? 'bg-rose-500/20 text-rose-300' :
                        diff <= 7          ? 'bg-amber-500/20 text-amber-300' :
                        'bg-slate-700/60 text-slate-400'
                      }`}>
                        {daysLabel(f.due_date)}
                      </span>
                    )}
                  </div>

                  {/* ARN */}
                  <div className="hidden lg:block min-w-[150px]">
                    <p className="text-xs text-slate-500">ARN</p>
                    <p className="text-xs font-mono text-slate-400 truncate">{f.arn || '—'}</p>
                  </div>

                  {/* Status + action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      isFiled   ? 'bg-emerald-500/20 text-emerald-300' :
                      isOverdue ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {f.status}
                    </span>
                    {isFiled ? (
                      <button onClick={() => setRevertFiling(f)}
                        className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition">
                        Revert
                      </button>
                    ) : (
                      <button onClick={() => setMarkFiling(f)}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition">
                        Mark Filed
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
