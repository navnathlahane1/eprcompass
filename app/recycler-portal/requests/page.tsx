'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { daysUntilRequestExpiry, urgencyToColor } from '@/lib/recyclerPortal/alertRequestService';

interface Request {
  id: string;
  request_number: string;
  epr_type: string;
  required_qty: number;
  unit: string;
  states_covered: string[];
  urgency: string;
  status: string;
  expires_at: string;
  created_at: string;
  myResponse: { status: string; round_number: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  SENT: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  VIEWED: 'bg-blue-100 text-blue-800 border-blue-300',
  RESPONDED: 'bg-green-100 text-green-800 border-green-300',
  NEGOTIATING: 'bg-purple-100 text-purple-800 border-purple-300',
  ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  DECLINED: 'bg-gray-100 text-gray-600 border-gray-300',
};

export default function RecyclerRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');

  useEffect(() => {
    setLoading(true);
    fetch('/api/recycler-portal/requests')
      .then((r) => r.json())
      .then((d) => {
        let data: Request[] = d.requests ?? [];
        if (filter === 'active') {
          data = data.filter((r) =>
            ['SENT', 'VIEWED', 'RESPONDED', 'NEGOTIATING'].includes(r.status)
          );
        }
        setRequests(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Corporate Requests</h1>
        <div className="flex gap-2">
          {(['active', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
                filter === f ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f === 'active' ? 'Active' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500 text-sm">No corporate requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const daysLeft = daysUntilRequestExpiry(req.expires_at);
            return (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-mono">{req.request_number}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          STATUS_COLOR[req.status] ?? 'bg-gray-100 text-gray-600 border-gray-300'
                        }`}
                      >
                        {req.status}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border ${urgencyToColor(req.urgency)}`}
                      >
                        {req.urgency}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-1">
                      {req.epr_type} · {req.required_qty} {req.unit}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {req.states_covered.join(', ') || 'All India'}
                    </p>
                    {daysLeft <= 3 && daysLeft > 0 && (
                      <p className="text-xs text-red-600 mt-0.5">
                        ⚠ Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </p>
                    )}
                    {daysLeft <= 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">Expired</p>
                    )}
                    {req.myResponse && (
                      <p className="text-xs text-green-600 mt-0.5">
                        You responded (Round {req.myResponse.round_number})
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/recycler-portal/requests/${req.id}`}
                    className="shrink-0 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
                  >
                    {['SENT', 'VIEWED'].includes(req.status) && !req.myResponse ? 'Respond' : 'View'}
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
