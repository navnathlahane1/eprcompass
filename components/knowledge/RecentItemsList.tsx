'use client';

import { useState } from 'react';

interface RecentItem {
  id: string;
  title: string;
  item_type: string;
  created_at: string;
  ownerName?: string;
  dateLabel: string;
}

export default function RecentItemsList({ items }: { items: RecentItem[] }) {
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  async function open(item: RecentItem) {
    setBusyId(item.id);
    setError('');
    try {
      const res = await fetch(`/api/knowledge/items/${item.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open item');
      window.open(data.url, '_blank', 'noopener');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to open item');
    } finally {
      setBusyId('');
    }
  }

  return (
    <>
      {error && (
        <div className="mx-5 mt-3 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{error}</div>
      )}
      <ul className="divide-y divide-slate-800/60">
        {items.map(i => (
          <li key={i.id}>
            <button
              type="button"
              onClick={() => open(i)}
              disabled={busyId === i.id}
              className="flex w-full items-center gap-3 px-5 py-3 text-left transition hover:bg-slate-800/40 disabled:opacity-60"
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                i.item_type === 'training_material'
                  ? 'border-violet-500/30 bg-violet-500/10 text-violet-300'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-300'
              }`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-200">{i.title}</p>
                <p className="truncate text-xs text-slate-500">
                  {i.item_type === 'training_material' ? 'Training material' : 'Document'}
                  {i.ownerName ? ` · ${i.ownerName}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-xs text-slate-500">{busyId === i.id ? 'Opening…' : i.dateLabel}</span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
