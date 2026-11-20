'use client';

import { useEffect, useState } from 'react';

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-amber-500/10 text-amber-300 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
  filed:       'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  rejected:    'bg-rose-500/10 text-rose-300 border-rose-500/20',
  won:         'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lost:        'bg-slate-500/10 text-slate-400 border-slate-500/20',
  cancelled:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

const ALL_STATUSES = ['pending','in_progress','filed','rejected','won','lost','cancelled'];

export default function FilingRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [statusF,  setStatusF]  = useState('');
  const [page,     setPage]     = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [noteModal,setNoteModal]= useState<{ id: string; field: string; current: string } | null>(null);
  const [noteText, setNoteText] = useState('');

  async function load(p = page) {
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (statusF) params.set('status', statusF);
      const r = await fetch(`/api/tendering/filing-requests?${params}`);
      if (!r.ok) throw new Error(await r.text());
      const d = await r.json();
      setRequests(d.requests ?? []);
      setTotal(d.total ?? 0);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { setPage(1); load(1); }, [statusF]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load(page); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleStatusChange(id: string, status: string) {
    setUpdating(id);
    await fetch(`/api/tendering/filing-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setUpdating(null);
    load(page);
  }

  async function handleSaveNote() {
    if (!noteModal) return;
    await fetch(`/api/tendering/filing-requests/${noteModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [noteModal.field]: noteText }),
    });
    setNoteModal(null);
    load(page);
  }

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Filing Requests</h1>
        <p className="text-sm text-slate-400 mt-0.5">Recyclers requesting the company to file government tenders on their behalf. {total} total.</p>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {(['', ...ALL_STATUSES]).map(s => (
          <button key={s} onClick={() => setStatusF(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${
              statusF === s ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
            }`}>
            {s.replace('_', ' ') || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center"><svg className="h-7 w-7 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg></div>
      ) : error ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3">
          <p className="text-rose-400 text-sm">{error}</p>
          <button onClick={() => load(page)} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
        </div>
      ) : requests.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No filing requests yet</p>
          <p className="text-slate-600 text-xs">Requests from recyclers will appear here.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {requests.map((req: any) => {
              const deadline = req.tender_deadline ? new Date(req.tender_deadline) : null;
              const days = deadline ? Math.ceil((deadline.getTime() - Date.now()) / 86400_000) : null;
              return (
                <div key={req.id} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-slate-100">{req.tender_title}</p>
                        {req.tender_no && <span className="font-mono text-[10px] text-amber-400">{req.tender_no}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-300">{req.recycler_name}</span>
                        <span>{req.recycler_code}</span>
                        <span>Requested: {new Date(req.requested_at).toLocaleDateString('en-IN')}</span>
                        {days !== null && (
                          <span className={days <= 3 ? 'text-rose-400 font-bold' : days <= 7 ? 'text-amber-400' : ''}>
                            {days < 0 ? 'Deadline passed' : `${days}d to deadline`}
                          </span>
                        )}
                      </div>
                      {req.recycler_notes && (
                        <p className="mt-2 text-xs text-slate-400 bg-slate-800/50 rounded-lg px-3 py-2">
                          <span className="font-semibold text-slate-300">Recycler note: </span>{req.recycler_notes}
                        </p>
                      )}
                      {req.manager_notes && (
                        <p className="mt-1 text-xs text-slate-400 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                          <span className="font-semibold text-amber-300">Internal note: </span>{req.manager_notes}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <select
                        value={req.status}
                        disabled={updating === req.id}
                        onChange={e => handleStatusChange(req.id, e.target.value)}
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold bg-transparent focus:outline-none cursor-pointer ${STATUS_COLORS[req.status] ?? ''}`}>
                        {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-slate-900 text-slate-200 capitalize">{s.replace('_', ' ')}</option>)}
                      </select>

                      <button
                        onClick={() => { setNoteModal({ id: req.id, field: 'manager_notes', current: req.manager_notes ?? '' }); setNoteText(req.manager_notes ?? ''); }}
                        className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors">
                        {req.manager_notes ? 'Edit note' : '+ Add note'}
                      </button>
                    </div>
                  </div>

                  {req.filed_at && (
                    <div className="mt-2 flex items-center gap-2 text-[11px] text-indigo-300">
                      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      Filed on {new Date(req.filed_at).toLocaleDateString('en-IN')} by {req.assigned_name}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">{total} requests</span>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Prev</button>
                <span className="flex items-center px-3 text-xs text-slate-400">{page}/{totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Note modal */}
      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNoteModal(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Internal Note</h3>
            <textarea rows={4} value={noteText} onChange={e => setNoteText(e.target.value)}
              placeholder="Add a note for the team…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
            <div className="flex gap-3">
              <button onClick={() => setNoteModal(null)} className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleSaveNote} className="flex-1 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
