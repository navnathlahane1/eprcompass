'use client';

import React, { useState, useEffect, useCallback } from 'react';
import KPICard from '../../../components/dashboard/KPICard';
import {
  LineChartComponent,
  BarChartComponent,
  PieChartComponent,
  FunnelChart,
} from '../../../components/dashboard/Charts';
import { Users, Briefcase, IndianRupee, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { authenticatedFetch } from '@/lib/auth/authenticatedFetch';

export default function AdminAnalytics() {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState(null);
  const [ctaData, setCtaData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [summaryRes, ctaRes] = await Promise.all([
        authenticatedFetch('/api/analytics/dashboard/summary'),
        authenticatedFetch('/api/analytics/leads/cta-performance')
      ]);
      if (summaryRes.status === 401 || ctaRes.status === 401) throw new Error('Your session has expired. Sign in again to load analytics.');
      if (summaryRes.status === 403 || ctaRes.status === 403) throw new Error('Your account does not have access to analytics.');
      if (!summaryRes.ok) throw new Error('The analytics summary could not be loaded. Please retry.');
      if (!ctaRes.ok) throw new Error('CTA analytics could not be loaded. Please retry.');

      const [summaryJson, ctaJson] = await Promise.all([
        summaryRes.json(),
        ctaRes.json(),
      ]);

      setData(summaryJson);
      setCtaData(ctaJson);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n) => n >= 100000
    ? `₹${(n / 100000).toFixed(1)}L`
    : n >= 1000
    ? `₹${(n / 1000).toFixed(1)}K`
    : `₹${n}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Comprehensive insights for your EPR compliance platform</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 border-b border-slate-800">
        {['overview', 'leads', 'compliance', 'financial'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-teal-500 text-teal-600'
                : 'border-transparent text-slate-500 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">Loading analytics…</span>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-xl border border-rose-800/40 bg-rose-950/30 p-4 text-sm text-rose-300">
          {error}
          <Link href="/login?returnUrl=%2Fadmin%2Fanalytics" className="ml-3 underline">Sign in again</Link>
        </div>
      )}

      {/* Content */}
      {!loading && !error && data && (
        <>
          {/* ── Overview tab ───────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                  title="Total Clients"
                  value={data.kpis.totalClients}
                  color="blue"
                  icon={Users}
                  trend={data.kpis.clientGrowthPct !== 0
                    ? { value: Math.abs(data.kpis.clientGrowthPct), positive: data.kpis.clientGrowthPct > 0 }
                    : null}
                />
                <KPICard
                  title="Active Services"
                  value={data.kpis.activeServices}
                  color="green"
                  icon={Briefcase}
                />
                <KPICard
                  title="Revenue Collected"
                  value={fmt(data.kpis.totalRevenue)}
                  color="purple"
                  icon={IndianRupee}
                />
                <KPICard
                  title="Overdue Filings"
                  value={data.kpis.overdueCount}
                  color={data.kpis.overdueCount > 0 ? 'red' : 'green'}
                  icon={AlertTriangle}
                />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <LineChartComponent
                  data={data.charts.clientGrowth}
                  title="New Clients — Last 12 Months"
                  dataKey="count"
                  strokeColor="#07875f"
                  showForecast
                />
                <BarChartComponent
                  data={data.charts.serviceType}
                  title="Services by Type"
                  dataKey="count"
                  barColor="#6366f1"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartComponent
                  data={data.charts.category}
                  title="Services by Waste Category"
                />
                <PieChartComponent
                  data={data.charts.invoiceStatus}
                  title="Invoice Status Breakdown"
                />
              </div>
            </div>
          )}

          {/* ── Leads tab ──────────────────────────────────── */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FunnelChart
                  data={data.charts.leadFunnel}
                  title="Lead Conversion Funnel"
                />
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-slate-100">Funnel Summary</h3>
                  <div className="space-y-3">
                    {data.charts.leadFunnel.map((item) => (
                      <div key={item.stage} className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">{item.stage}</span>
                        <span className="font-semibold text-slate-100">
                          {item.value} <span className="text-slate-500 font-normal">({item.percentage}%)</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-100">CTA Submission Performance (Last {ctaData?.windowDays || 90} Days)</h3>
                <p className="mt-1 text-sm text-slate-500">Compares conversion share between CTA Variant A and B for each contact intent.</p>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant A Share</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.aShare ?? 0}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant B Share</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.bShare ?? 0}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Overall Click-&gt;Submit Rate</p>
                    <p className="mt-1 text-lg font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.overallConversionRate ?? 0}%</p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant A Clicks</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.clicksA ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant B Clicks</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.clicksB ?? 0}</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant A Conversion</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.conversionRateA ?? 0}%</p>
                  </div>
                  <div className="rounded-lg border border-slate-800 p-3">
                    <p className="text-xs text-slate-500">Variant B Conversion</p>
                    <p className="mt-1 text-base font-semibold text-slate-100">{ctaData?.conversionShareByVariant?.conversionRateB ?? 0}%</p>
                  </div>
                </div>

                {Array.isArray(ctaData?.intentVariantRows) && ctaData.intentVariantRows.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-left text-slate-500">
                          <th className="py-2 pr-3">Intent</th>
                          <th className="py-2 pr-3">CTA Variant</th>
                          <th className="py-2 pr-3">Clicks</th>
                          <th className="py-2 pr-3">Submissions</th>
                          <th className="py-2 pr-3">Click-&gt;Submit</th>
                          <th className="py-2 pr-3">Share Within Intent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ctaData.intentVariantRows.map((row) => (
                          <tr key={`${row.intent}-${row.ctaVariant}`} className="border-b border-slate-800/60">
                            <td className="py-2 pr-3 text-slate-100">{row.intent}</td>
                            <td className="py-2 pr-3 text-slate-100">{row.ctaVariant.toUpperCase()}</td>
                            <td className="py-2 pr-3 text-slate-100">{row.clicks}</td>
                            <td className="py-2 pr-3 font-semibold text-slate-100">{row.submissions}</td>
                            <td className="py-2 pr-3 text-slate-200">{row.conversionRate}%</td>
                            <td className="py-2 pr-3 text-slate-200">{row.shareWithinIntent}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">No CTA submission data collected yet.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Compliance tab ─────────────────────────────── */}
          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartComponent
                  data={data.charts.complianceStatus}
                  title="Compliance Obligation Status"
                />
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-slate-100">Status Breakdown</h3>
                  {data.charts.complianceStatus.length === 0 ? (
                    <p className="text-sm text-slate-500">No compliance obligations recorded yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.charts.complianceStatus.map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                          <span className="text-slate-400">{item.name}</span>
                          <span className="font-semibold text-slate-100">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {data.kpis.overdueCount > 0 && (
                <div className="rounded-xl border border-rose-800/40 bg-rose-950/30 p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-rose-300">
                      {data.kpis.overdueCount} overdue filing{data.kpis.overdueCount !== 1 ? 's' : ''} require attention
                    </p>
                    <p className="text-xs text-rose-400 mt-0.5">
                      Go to Compliance → Obligations to review and action them.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Financial tab ──────────────────────────────── */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <LineChartComponent
                  data={data.charts.revenue}
                  title="Revenue Collected — Last 12 Months (₹)"
                  dataKey="revenue"
                  strokeColor="#8b5cf6"
                  showForecast
                />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PieChartComponent
                  data={data.charts.invoiceStatus}
                  title="Invoice Status"
                />
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">
                  <h3 className="mb-4 text-base font-semibold text-slate-100">Revenue Summary</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Total Collected</dt>
                      <dd className="font-semibold text-slate-100">{fmt(data.kpis.totalRevenue)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Total Invoices</dt>
                      <dd className="font-semibold text-slate-100">
                        {data.charts.invoiceStatus.reduce((s, i) => s + i.value, 0)}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Paid Invoices</dt>
                      <dd className="font-semibold text-emerald-300">
                        {data.charts.invoiceStatus.find(i => i.name === 'Paid')?.value ?? 0}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Pending / Overdue</dt>
                      <dd className="font-semibold text-rose-400">
                        {(data.charts.invoiceStatus.find(i => i.name === 'Pending')?.value ?? 0) +
                         (data.charts.invoiceStatus.find(i => i.name === 'Overdue')?.value ?? 0)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!loading && !error && !data && (
        <div className="flex items-center justify-center min-h-[300px] text-sm text-slate-500">
          No data returned.
        </div>
      )}
    </div>
  );
}
