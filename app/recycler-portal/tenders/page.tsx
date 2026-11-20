'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { tenderDeadlineUrgency } from '@/lib/recyclerPortal/tenderService';

interface Tender {
  id: string;
  tender_number: string;
  title: string;
  epr_type: string;
  required_qty: number;
  unit: string;
  states_covered: string[];
  submission_deadline: string | null;
  status: string;
  matchScore: number;
  matched: boolean;
  matchReasons: string[];
  disqualifiers: string[];
  myResponse: { status: string; submitted_at: string } | null;
}

const URGENCY_CLASSES = {
  expired: 'text-gray-400 line-through',
  critical: 'text-red-600 font-semibold',
  warning: 'text-orange-600',
  normal: 'text-gray-600',
};

export default function RecyclerTendersPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'matched'>('matched');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/tenders')
      .then((r) => r.json())
      .then((data) => setTenders(data.tenders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = filter === 'matched' ? tenders.filter((t) => t.matched) : tenders;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tender Alerts</h1>
        <div className="flex gap-2">
          {(['all', 'matched'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'All Tenders' : 'My Matches'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500 text-sm">No tenders found.</p>
          {filter === 'matched' && (
            <p className="text-gray-400 text-xs mt-1">
              Try switching to &ldquo;All Tenders&rdquo; or contact your EPR manager to update your categories.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((tender) => {
            const urgency = tenderDeadlineUrgency(tender.submission_deadline);
            return (
              <div
                key={tender.id}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{tender.tender_number}</span>
                      <span className="rounded-full bg-blue-50 text-blue-700 text-xs px-2 py-0.5 border border-blue-200">
                        {tender.epr_type}
                      </span>
                      {tender.matched && (
                        <span className="rounded-full bg-green-50 text-green-700 text-xs px-2 py-0.5 border border-green-200">
                          {tender.matchScore}% Match
                        </span>
                      )}
                      {tender.myResponse && (
                        <span className="rounded-full bg-purple-50 text-purple-700 text-xs px-2 py-0.5 border border-purple-200">
                          {tender.myResponse.status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1 truncate">{tender.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tender.required_qty} {tender.unit} · {tender.states_covered.join(', ') || 'All India'}
                    </p>
                    {tender.submission_deadline && (
                      <p className={`text-xs mt-0.5 ${URGENCY_CLASSES[urgency]}`}>
                        Deadline: {new Date(tender.submission_deadline).toLocaleDateString('en-IN')}
                        {urgency === 'critical' && ' ⚠ Closing soon'}
                        {urgency === 'expired' && ' (Expired)'}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/recycler-portal/tenders/${tender.id}`}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                  >
                    {tender.myResponse ? 'View' : 'Bid'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
