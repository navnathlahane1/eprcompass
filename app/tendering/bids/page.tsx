'use client';

import { useEffect, useState } from 'react';

const BID_STATUS_COLORS: Record<string, string> = {
  draft:       'bg-slate-500/10 text-slate-400 border-slate-500/20',
  review:      'bg-amber-500/10 text-amber-300 border-amber-500/20',
  approved:    'bg-blue-500/10 text-blue-300 border-blue-500/20',
  submitted:   'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
  shortlisted: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  won:         'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  lost:        'bg-rose-500/10 text-rose-300 border-rose-500/20',
};

function fmt(n: number | null) {
  if (n == null) return '—';
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)}Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(2)}L`;
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function BidsPage() {
  const [bids,       setBids]       = useState<any[]>([]);
  const [tenders,    setTenders]    = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [showModal,  setShowModal]  = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  const [tenderId,   setTenderId]   = useState('');
  const [amount,     setAmount]     = useState('');
  const [techScore,  setTechScore]  = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const [br, tr] = await Promise.all([
        fetch('/api/tendering/bids'),
        fetch('/api/tendering/tenders?limit=50'),
      ]);
      const bd = await br.json();
      setBids(bd.bids ?? []);
      if (tr.ok) {
        const td = await tr.json();
        setTenders(td.tenders ?? []);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load bids');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAddBid(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    if (!tenderId) { setFormError('Please select a tender'); return; }
    setSaving(true);
    try {
      const r = await fetch('/api/tendering/bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tender_id: tenderId,
          financial_amount_inr: amount ? parseFloat(amount) : null,
          technical_score: techScore ? parseFloat(techScore) : null,
        }),
      });
      if (!r.ok) {
        const d = await r.json();
        setFormError(d.error || 'Failed to create bid');
        return;
      }
      setShowModal(false);
      setTenderId(''); setAmount(''); setTechScore('');
      load();
    } catch (e: any) {
      setFormError(e.message || 'Failed to create bid');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-amber-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-rose-400 text-sm">{error}</p>
      <button onClick={load} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Bids</h1>
          <p className="text-sm text-slate-400 mt-0.5">Track all bids prepared and submitted.</p>
        </div>
        {tenders.length > 0 && (
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 transition-colors">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
            Add Bid
          </button>
        )}
      </div>

      {bids.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-900/50 gap-2">
          <p className="text-slate-400 text-sm font-medium">No bids yet</p>
          <p className="text-slate-600 text-xs">Add a bid to start tracking.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-800 bg-slate-900">
                <tr>
                  {['Bid No', 'Tender', 'Our Amount', 'L1 Amount', 'Status', 'Submitted At'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {bids.map((b: any, i: number) => (
                  <tr key={b.id} className={`transition-colors hover:bg-slate-800/30 ${i % 2 === 1 ? 'bg-slate-900/30' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-amber-400">{b.bid_no}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[180px]">{b.tender_title}</p>
                      <p className="text-[10px] text-slate-500">{b.tender_no}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{fmt(b.financial_amount_inr)}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">
                      {b.l1_amount_inr ? (
                        <span className={b.financial_amount_inr && b.financial_amount_inr <= b.l1_amount_inr ? 'text-emerald-400' : 'text-rose-400'}>
                          {fmt(b.l1_amount_inr)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${BID_STATUS_COLORS[b.status] ?? ''}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {b.submitted_at ? new Date(b.submitted_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bid Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Add New Bid</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {formError && (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 px-3 py-2 text-sm text-rose-300">{formError}</div>
            )}

            <form onSubmit={handleAddBid} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Tender <span className="text-rose-400">*</span></label>
                <select value={tenderId} onChange={e => setTenderId(e.target.value)} required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500">
                  <option value="">Select tender…</option>
                  {tenders.map((t: any) => (
                    <option key={t.id} value={t.id}>{t.tender_no} — {t.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Our Bid Amount (₹)</label>
                <input type="number" min={0} value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 5000000"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Technical Score (0–100)</label>
                <input type="number" min={0} max={100} value={techScore} onChange={e => setTechScore(e.target.value)}
                  placeholder="e.g. 85"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-amber-500" />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 rounded-lg bg-amber-600 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                  {saving ? 'Creating…' : 'Create Bid'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
