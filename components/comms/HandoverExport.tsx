'use client';

import { useState } from 'react';

interface Props {
  accountId: string;
  accountName: string;
}

export default function HandoverExport({ accountId, accountName }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const res = await fetch(`/api/comms/accounts/${accountId}/export`);
      if (!res.ok) { alert('Export failed'); return; }
      const text = await res.text();
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `handover-${accountName.toLowerCase().replace(/\s+/g, '-')}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-4 py-2.5 text-sm font-medium text-emerald-400 hover:bg-emerald-600/20 disabled:opacity-50 transition"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {loading ? 'Generating…' : 'Export Handover Pack'}
      <span className="rounded px-1.5 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-500">MD</span>
    </button>
  );
}
