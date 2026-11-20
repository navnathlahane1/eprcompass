'use client';

/**
 * /portal/epr-filings — Client EPR Filing Status Tracker
 * Shows client's own filings with status timeline + comment thread.
 */

import { useState, useEffect, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];

interface Filing {
  id: string;
  category: string;
  current_status: string;
  sla_due_at: string | null;
  created_at: string;
  updated_at: string;
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string; is_active: boolean }

export default function EPRFilingsPortalPage() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterFy, setFilterFy] = useState('');

  const [activeFiling, setActiveFiling] = useState<Filing | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [histLoading, setHistLoading] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/epr/financial-years').then(r => r.json()).then(d => setFys(d.financialYears ?? []));
  }, []);

  const loadFilings = useCallback(async () => {
    setLoading(true); setError(null);
    const p = new URLSearchParams();
    if (filterFy) p.set('fy_id', filterFy);
    const res = await fetch(`/api/epr/filing-statuses?${p}`);
    if (!res.ok) { setError('Could not load filings'); setLoading(false); return; }
    const d = await res.json();
    setFilings(d.filings ?? []);
    setLoading(false);
  }, [filterFy]);

  useEffect(() => { loadFilings(); }, [loadFilings]);

  const openFiling = async (f: Filing) => {
    setActiveFiling(f);
    setHistLoading(true);
    const [hRes, cRes] = await Promise.all([
      fetch(`/api/epr/filing-statuses/${f.id}/history`),
      fetch(`/api/epr/comments/${f.id}`),
    ]);
    setHistory(hRes.ok ? (await hRes.json()).history ?? [] : []);
    setComments(cRes.ok ? (await cRes.json()).comments ?? [] : []);
    setHistLoading(false);
  };

  const submitComment = async () => {
    if (!activeFiling || !newComment.trim()) return;
    setSubmitting(true);
    const res = await fetch(`/api/epr/comments/${activeFiling.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment }),
    });
    setSubmitting(false);
    if (res.ok) {
      trackEvent('Client Filing Comment Posted', {});
      showToast('success', 'Comment posted');
      setNewComment('');
      const cRes = await fetch(`/api/epr/comments/${activeFiling.id}`);
      setComments(cRes.ok ? (await cRes.json()).comments ?? [] : comments);
    } else {
      showToast('error', 'Failed to post comment');
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      'Pending': 'bg-slate-100 text-slate-700',
      'Documents Submitted': 'bg-blue-100 text-blue-700',
      'Under Review': 'bg-yellow-100 text-yellow-700',
      'Query Raised': 'bg-orange-100 text-orange-700',
      'Approved': 'bg-green-100 text-green-700',
      'Certificate Issued': 'bg-emerald-100 text-emerald-700',
      'Rejected': 'bg-red-100 text-red-700',
    };
    return map[s] || 'bg-slate-100 text-slate-600';
  };

  const slaStatus = (sla: string | null) => {
    if (!sla) return null;
    const diff = new Date(sla).getTime() - Date.now();
    if (diff < 0) return { label: 'SLA Breached', cls: 'text-red-600' };
    if (diff < 6 * 3600_000) return { label: `Due in ${Math.round(diff / 3600_000)}h`, cls: 'text-orange-500' };
    return { label: `Due ${new Date(sla).toLocaleDateString()}`, cls: 'text-slate-500' };
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">EPR Filing Status</h1>
        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Financial Years</option>
          {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}{fy.is_active ? ' (Active)' : ''}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
      ) : filings.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed">
          <p className="text-slate-500 font-medium">No filings found</p>
          <p className="text-sm text-slate-400 mt-1">Your EPR filing records will appear here once created by your compliance team.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filings.map(f => {
            const sla = slaStatus(f.sla_due_at);
            return (
              <button
                key={f.id}
                onClick={() => openFiling(f)}
                className="text-left border rounded-xl p-4 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-slate-800">{f.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(f.current_status)}`}>
                    {f.current_status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{f.epr_financial_years?.label ?? '—'}</p>
                {sla && <p className={`text-xs mt-1 ${sla.cls}`}>{sla.label}</p>}
                <p className="text-xs text-blue-600 mt-2">View timeline & comments →</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Detail Panel */}
      {activeFiling && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{activeFiling.category} Filing</h2>
                <p className="text-sm text-slate-500">{activeFiling.epr_financial_years?.label}</p>
              </div>
              <button onClick={() => setActiveFiling(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Status Timeline</h3>
                {histLoading ? (
                  <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse" />)}</div>
                ) : history.length === 0 ? (
                  <p className="text-slate-400 text-sm">No status changes yet.</p>
                ) : (
                  <ol className="relative border-l border-slate-200 pl-5 space-y-4">
                    {history.map((h: any) => (
                      <li key={h.id} className="text-sm">
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full bg-blue-500" />
                        <p className="font-medium text-slate-800">{h.new_status}</p>
                        {h.comment && <p className="text-xs text-slate-500 italic mt-0.5">&ldquo;{h.comment}&rdquo;</p>}
                        <p className="text-xs text-slate-400">{new Date(h.created_at).toLocaleString()}</p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              {/* Comments */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Messages</h3>
                {comments.length === 0 ? (
                  <p className="text-slate-400 text-sm">No messages yet.</p>
                ) : (
                  <div className="space-y-3">
                    {comments.map((c: any) => (
                      <div key={c.id} className={`p-3 rounded-lg text-sm ${c.author?.role === 'admin' || c.author?.role === 'manager' ? 'bg-blue-50' : 'bg-slate-50'}`}>
                        <p className="font-medium text-slate-700">{c.author?.full_name || 'Team'}</p>
                        <p className="text-slate-600 mt-0.5">{c.content}</p>
                        <p className="text-xs text-slate-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Post comment */}
                <div className="mt-3 flex gap-2">
                  <textarea
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Write a message…"
                    className="flex-1 border rounded px-3 py-2 text-sm resize-none"
                  />
                  <button
                    onClick={submitComment}
                    disabled={submitting || !newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 h-fit"
                  >
                    {submitting ? '…' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
