'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Tender {
  id: string;
  tender_number: string;
  title: string;
  epr_type: string;
  tender_type: string;
  status: string;
  quantity_required: number;
  unit: string;
  submission_deadline: string | null;
  created_at: string;
  response_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-300',
  PUBLISHED: 'bg-blue-100 text-blue-800 border-blue-300',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  AWARDED: 'bg-green-100 text-green-800 border-green-300',
  CANCELLED: 'bg-red-100 text-red-700 border-red-300',
};

export default function CorporateTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    setLoading(true);
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    fetch(`/api/corporate/tenders${q}`)
      .then((r) => r.json())
      .then((d) => setTenders(d.tenders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['all', 'DRAFT', 'PUBLISHED', 'UNDER_REVIEW', 'AWARDED', 'CANCELLED'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-900">My Tenders</h1>
        <Link
          href="/portal/tenders/new"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + New Tender
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              statusFilter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : tenders.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500 text-sm">No tenders yet.</p>
          <Link
            href="/portal/tenders/new"
            className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Post your first tender
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {tenders.map((t) => (
            <Link
              key={t.id}
              href={`/portal/tenders/${t.id}`}
              className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-blue-300 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-mono">{t.tender_number}</p>
                  <p className="text-sm font-semibold text-slate-900 truncate">{t.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {t.epr_type} · {t.quantity_required} {t.unit} · {t.tender_type}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[t.status] ?? STATUS_COLORS.DRAFT}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">{t.response_count} responses</p>
                  {t.submission_deadline && (
                    <p className="text-xs text-slate-400">
                      Due {new Date(t.submission_deadline).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
