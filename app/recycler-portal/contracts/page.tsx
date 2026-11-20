'use client';

import { useEffect, useState } from 'react';

interface Contract {
  id: string;
  contract_no: string;
  title: string;
  source_type: 'tender' | 'auction' | 'direct';
  client_name: string | null;
  waste_category: string | null;
  quantity_mt: number | null;
  rate_per_mt_inr: number | null;
  total_value_inr: number | null;
  start_date: string | null;
  end_date: string | null;
  status: 'DRAFT' | 'SENT' | 'SIGNED' | 'ACTIVE' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
  created_at: string;
}

interface Summary {
  active: number;
  completed: number;
  total_value: number;
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-700',
  SIGNED: 'bg-yellow-100 text-yellow-700',
  ACTIVE: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-teal-100 text-teal-700',
  DISPUTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

const SOURCE_STYLES: Record<string, string> = {
  tender: 'bg-indigo-100 text-indigo-700',
  auction: 'bg-orange-100 text-orange-700',
  direct: 'bg-purple-100 text-purple-700',
};

function fmt(n: number | null) {
  if (n == null) return '—';
  return '₹' + n.toLocaleString('en-IN');
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [summary, setSummary] = useState<Summary>({ active: 0, completed: 0, total_value: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/recycler-portal/contracts')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else {
          setContracts(d.contracts ?? []);
          setSummary(d.summary ?? { active: 0, completed: 0, total_value: 0 });
        }
      })
      .catch(() => setError('Failed to load contracts.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
        <p className="text-sm text-gray-500 mt-1">View and track your recycling contracts.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">{error}</div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{summary.active}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Completed</p>
          <p className="mt-2 text-3xl font-bold text-gray-600">{summary.completed}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Value</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(summary.total_value)}</p>
        </div>
      </div>

      {/* Contract List */}
      {contracts.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-400 text-sm">No contracts found.</p>
          <p className="text-gray-400 text-xs mt-1">Contracts will appear here after winning tenders or auctions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-gray-700">{c.contract_no}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SOURCE_STYLES[c.source_type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {c.source_type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {c.status}
                  </span>
                </div>
                {c.total_value_inr != null && (
                  <span className="text-base font-bold text-gray-900">{fmt(c.total_value_inr)}</span>
                )}
              </div>

              <p className="mt-2 text-sm font-medium text-gray-800">{c.title}</p>

              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-500">
                {c.client_name && (
                  <div>
                    <span className="block font-medium text-gray-600">Client</span>
                    <span>{c.client_name}</span>
                  </div>
                )}
                {c.waste_category && (
                  <div>
                    <span className="block font-medium text-gray-600">Category</span>
                    <span>{c.waste_category}</span>
                  </div>
                )}
                {c.quantity_mt != null && (
                  <div>
                    <span className="block font-medium text-gray-600">Quantity</span>
                    <span>{c.quantity_mt} MT</span>
                  </div>
                )}
                {c.rate_per_mt_inr != null && (
                  <div>
                    <span className="block font-medium text-gray-600">Rate/MT</span>
                    <span>{fmt(c.rate_per_mt_inr)}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 flex gap-4 text-xs text-gray-400">
                <span>Start: <span className="text-gray-600">{fmtDate(c.start_date)}</span></span>
                <span>End: <span className="text-gray-600">{fmtDate(c.end_date)}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
