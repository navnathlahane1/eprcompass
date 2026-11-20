'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

const DISPOSITIONS = ['All', 'Interested', 'Callback', 'Not Interested', 'No Answer', 'Busy', 'Wrong Number', 'DNC'];

function fmtDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function CallsClient() {
  const [calls, setCalls] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [disposition, setDisposition] = useState('All');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (disposition !== 'All') params.set('disposition', disposition);
    const res = await fetch(`/api/admin/telecalling/calls?${params}`);
    const data = await res.json();
    setCalls(data.calls || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, disposition]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">My Calls <span className="text-sm font-normal text-slate-500">({total})</span></h1>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={disposition}
          onChange={e => { setDisposition(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        >
          {DISPOSITIONS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading…</div>
      ) : calls.length === 0 ? (
        <div className="text-center py-12 text-slate-500">No calls found</div>
      ) : (
        <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-800/40">
                <th className="text-left px-4 py-3 font-medium text-slate-400">Lead</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Disposition</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Duration</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Notes</th>
                <th className="text-left px-4 py-3 font-medium text-slate-400">Date</th>
              </tr>
            </thead>
            <tbody>
              {calls.map((call: any) => (
                <tr key={call.id} className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <Link href={`/telecalling/leads/${call.lead_id}`} className="font-medium text-slate-200 hover:text-teal-400">
                      {call.lead?.company || call.lead?.contact_name || '—'}
                    </Link>
                    {call.lead?.phone && <div className="text-xs text-slate-500">{call.lead.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{call.disposition || '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{fmtDuration(call.duration_seconds || 0)}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-xs truncate">{call.notes || '—'}</td>
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {new Date(call.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between mt-5 text-sm text-slate-400">
        <span>{total} total</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
