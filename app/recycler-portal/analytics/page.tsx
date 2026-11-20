'use client';

import { useEffect, useState } from 'react';

interface AnalyticsData {
  credits: {
    total_count: number;
    total_value_inr: number;
    by_category: { category: string; count: number; value: number }[];
    trend_6m: { month: string; value: number }[];
  };
  tenders: { total_responded: number; won: number; response_rate_pct: number };
  auctions: { total_bid: number; won: number };
  capacity: {
    avg_utilization_pct: number | null;
    last_month_utilized_mt: number | null;
    last_month_capacity_mt: number | null;
  };
  contracts: { active_count: number; total_contract_value: number };
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

function pct(n: number | null) {
  if (n == null) return '—';
  return n.toFixed(1) + '%';
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/recycler-portal/analytics')
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error || 'No data available.'}
      </div>
    );
  }

  const maxCategoryValue = Math.max(...(data.credits.by_category.map((c) => c.value) ?? [1]), 1);
  const maxTrendValue = Math.max(...(data.credits.trend_6m.map((t) => t.value) ?? [1]), 1);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your recycling activity and business metrics.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Credit Value</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{fmt(data.credits.total_value_inr)}</p>
          <p className="mt-1 text-xs text-gray-400">{data.credits.total_count} credits issued</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tenders Won</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{data.tenders.won}</p>
          <p className="mt-1 text-xs text-gray-400">of {data.tenders.total_responded} responded</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Capacity Utilization</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{pct(data.capacity.avg_utilization_pct)}</p>
          <p className="mt-1 text-xs text-gray-400">
            {data.capacity.last_month_utilized_mt != null
              ? `${data.capacity.last_month_utilized_mt} MT used last month`
              : 'No data logged'}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Active Contracts</p>
          <p className="mt-2 text-2xl font-bold text-gray-900">{data.contracts.active_count}</p>
          <p className="mt-1 text-xs text-gray-400">{fmt(data.contracts.total_contract_value)} total value</p>
        </div>
      </div>

      {/* Credits by Category */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Credits by Waste Category</h2>
        {data.credits.by_category.length === 0 ? (
          <p className="text-sm text-gray-400">No credit data available.</p>
        ) : (
          <div className="space-y-3">
            {data.credits.by_category.map((cat) => {
              const widthPct = Math.round((cat.value / maxCategoryValue) * 100);
              return (
                <div key={cat.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">{cat.category}</span>
                    <span className="text-sm text-gray-500">{fmt(cat.value)} ({cat.count} credits)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6-Month Credit Trend */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">6-Month Credit Value Trend</h2>
        <div className="flex items-end gap-3 h-32">
          {data.credits.trend_6m.map((t) => {
            const heightPct = maxTrendValue > 0 ? Math.round((t.value / maxTrendValue) * 100) : 0;
            const monthLabel = t.month.slice(0, 7);
            const shortMonth = new Date(t.month + '-01').toLocaleString('en-IN', { month: 'short' });
            return (
              <div key={monthLabel} className="flex flex-col items-center flex-1">
                <div className="w-full flex items-end justify-center" style={{ height: '96px' }}>
                  <div
                    className="w-full bg-green-400 rounded-t"
                    style={{ height: `${Math.max(heightPct, t.value > 0 ? 4 : 0)}%` }}
                    title={fmt(t.value)}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1">{shortMonth}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tender & Auction Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Tender Performance</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.tenders.won}</p>
              <p className="text-xs text-gray-500 mt-1">Won</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-700">{data.tenders.total_responded}</p>
              <p className="text-xs text-gray-500 mt-1">Responded</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{data.tenders.response_rate_pct}%</p>
              <p className="text-xs text-gray-500 mt-1">Win Rate</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Auction Performance</h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">{data.auctions.won}</p>
              <p className="text-xs text-gray-500 mt-1">Won</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-700">{data.auctions.total_bid}</p>
              <p className="text-xs text-gray-500 mt-1">Total Bids</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
