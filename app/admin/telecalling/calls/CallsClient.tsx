'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import CallLogModal from '@/components/telecalling/CallLogModal';

const DISPOSITIONS = ['Interested', 'Not Interested', 'Call Back', 'Wrong Number', 'No Answer', 'Busy', 'Voicemail', 'Other'];

interface Call {
  id: string;
  lead?: { company?: string; contact_name?: string };
  agent?: { full_name?: string };
  status: string;
  disposition: string;
  duration_seconds: number;
  notes: string;
  created_at: string;
  direction: string;
  recording_url?: string | null;
  transcript_status?: string;
  transcript?: string | null;
}

const TRANSCRIPT_BADGE: Record<string, string> = {
  NONE: 'bg-slate-900 text-slate-500',
  PENDING: 'bg-amber-900/30 text-amber-300',
  PROCESSING: 'bg-amber-900/30 text-amber-300',
  DONE: 'bg-emerald-900/30 text-emerald-300',
  FAILED: 'bg-red-900/30 text-red-300',
};

export default function CallsClient() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dispositionFilter, setDispositionFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (dispositionFilter) params.set('disposition', dispositionFilter);
    const res = await fetch(`/api/admin/telecalling/calls?${params}`);
    const data = await res.json();
    setCalls(data.calls || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, dispositionFilter]);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    const header = 'Date,Company,Agent,Status,Disposition,Duration,Notes';
    const rows = calls.map(c =>
      [
        new Date(c.created_at).toLocaleDateString(),
        c.lead?.company || '',
        c.agent?.full_name || '',
        c.status,
        c.disposition || '',
        c.duration_seconds || 0,
        (c.notes || '').replace(/,/g, ';'),
      ].join(',')
    );
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'calls.csv';
    a.click();
  }

  function fmtDuration(s: number) {
    if (!s) return '—';
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  async function retryTranscription(id: string) {
    setRetrying(id);
    try {
      const res = await fetch(`/api/admin/telecalling/calls/${id}/transcribe`, { method: 'POST' });
      if (res.ok) load();
    } finally {
      setRetrying(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Call Log <span className="text-sm font-normal text-slate-500">({total})</span></h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-3 py-2 border border-slate-700 rounded-lg text-sm text-slate-400 hover:bg-slate-950">
            Export CSV
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={dispositionFilter}
          onChange={e => { setDispositionFilter(e.target.value); setPage(1); }}
          className="border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
        >
          <option value="">All dispositions</option>
          {DISPOSITIONS.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-950">
              <tr className="text-xs text-slate-500">
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Lead</th>
                <th className="text-left px-4 py-3 font-medium">Agent</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Disposition</th>
                <th className="text-left px-4 py-3 font-medium">Duration</th>
                <th className="text-left px-4 py-3 font-medium">Notes</th>
                <th className="text-left px-4 py-3 font-medium">Transcript</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">Loading…</td></tr>
              ) : calls.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-500">No calls found</td></tr>
              ) : calls.map(call => (
                <Fragment key={call.id}>
                  <tr
                    className="border-t border-slate-800/60 hover:bg-slate-950 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === call.id ? null : call.id)}
                  >
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{new Date(call.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-medium text-slate-100">{call.lead?.company || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{call.agent?.full_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${call.status === 'Completed' ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-400'}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{call.disposition || '—'}</td>
                    <td className="px-4 py-3 text-slate-500">{fmtDuration(call.duration_seconds)}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{call.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TRANSCRIPT_BADGE[call.transcript_status || 'NONE']}`}>
                        {call.transcript_status || 'NONE'}
                      </span>
                    </td>
                  </tr>
                  {expandedId === call.id && (
                    <tr className="border-t border-slate-800/60 bg-slate-950/60">
                      <td colSpan={8} className="px-4 py-4">
                        {call.transcript ? (
                          <div className="text-sm text-slate-300 whitespace-pre-wrap max-w-3xl">{call.transcript}</div>
                        ) : (
                          <div className="text-sm text-slate-500">
                            {call.recording_url
                              ? 'No transcript yet.'
                              : 'No recording available for this call.'}
                          </div>
                        )}
                        {call.recording_url && (call.transcript_status === 'FAILED' || call.transcript_status === 'NONE') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); retryTranscription(call.id); }}
                            disabled={retrying === call.id}
                            className="mt-3 px-3 py-1.5 border border-slate-700 rounded-lg text-xs text-slate-300 hover:bg-slate-900 disabled:opacity-50"
                          >
                            {retrying === call.id ? 'Submitting…' : 'Retry Transcription'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-slate-500">
        <span>Showing {Math.min((page - 1) * 50 + 1, total)}–{Math.min(page * 50, total)} of {total}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
