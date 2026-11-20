'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface CorporateRequest {
  id: string;
  request_number: string;
  epr_type: string;
  required_qty: number;
  unit: string;
  urgency: string;
  status: string;
  expires_at: string;
  created_at: string;
  response_count: number;
}

const STATUS_COLORS: Record<string, string> = {
  SENT: 'bg-blue-100 text-blue-800 border-blue-300',
  VIEWED: 'bg-purple-100 text-purple-800 border-purple-300',
  RESPONDED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  NEGOTIATING: 'bg-orange-100 text-orange-800 border-orange-300',
  ACCEPTED: 'bg-green-100 text-green-800 border-green-300',
  DECLINED: 'bg-red-100 text-red-700 border-red-300',
  EXPIRED: 'bg-slate-100 text-slate-500 border-slate-300',
  WITHDRAWN: 'bg-slate-100 text-slate-500 border-slate-300',
};

const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'text-red-700',
  HIGH: 'text-orange-600',
  MEDIUM: 'text-yellow-700',
  LOW: 'text-slate-500',
};

export default function CorporateRequestsPage() {
  const [requests, setRequests] = useState<CorporateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    setLoading(true);
    const q = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    fetch(`/api/corporate/requests${q}`)
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const statuses = ['all', 'SENT', 'VIEWED', 'NEGOTIATING', 'ACCEPTED', 'DECLINED', 'EXPIRED'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-slate-900">Recycler Requests</h1>
        <Link
          href="/portal/requests/new"
          className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
        >
          + New Request
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${
              statusFilter === s ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500 text-sm">No requests yet.</p>
          <Link
            href="/portal/requests/new"
            className="mt-3 inline-block rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700"
          >
            Send your first request
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const daysLeft = Math.ceil(
              (new Date(req.expires_at).getTime() - Date.now()) / 86_400_000
            );
            return (
              <Link
                key={req.id}
                href={`/portal/requests/${req.id}`}
                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-purple-300 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 font-mono">{req.request_number}</p>
                    <p className="text-sm font-semibold text-slate-900">
                      {req.epr_type} — {req.required_qty} {req.unit}
                    </p>
                    <p className={`text-xs font-medium mt-0.5 ${URGENCY_COLORS[req.urgency] ?? ''}`}>
                      {req.urgency} urgency
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[req.status] ?? STATUS_COLORS.SENT}`}>
                      {req.status}
                    </span>
                    <p className="text-xs text-slate-400 mt-1">{req.response_count} responses</p>
                    <p className={`text-xs mt-0.5 ${daysLeft <= 1 ? 'text-red-600' : 'text-slate-400'}`}>
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
