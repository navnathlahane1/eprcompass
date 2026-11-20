'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

interface Plan {
  id: string;
  plan_code: string;
  plan_name: string;
  price_inr_monthly: number;
  price_inr_annual: number;
  max_alerts_per_month: number | null;
  filing_service: boolean;
  features: string[];
}

interface ServiceData {
  plans: Plan[];
  subscription: any | null;
  pendingFilings: number;
  hasActiveSubscription: boolean;
  canUseFiling: boolean;
}

const PLAN_GRADIENTS: Record<string, string> = {
  basic:   'from-blue-500/10 to-blue-600/5 border-blue-500/20',
  pro:     'from-violet-500/10 to-violet-600/5 border-violet-500/20',
  premium: 'from-amber-500/10 to-amber-600/5 border-amber-500/20',
};

const PLAN_BADGE: Record<string, string> = {
  basic:   'bg-blue-500/15 text-blue-300 border-blue-500/30',
  pro:     'bg-violet-500/15 text-violet-300 border-violet-500/30',
  premium: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const PLAN_BTN: Record<string, string> = {
  basic:   'bg-blue-600 hover:bg-blue-700',
  pro:     'bg-violet-600 hover:bg-violet-700',
  premium: 'bg-amber-600 hover:bg-amber-700',
};

export default function TenderServicesPage() {
  const [data,      setData]      = useState<ServiceData | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [billing,   setBilling]   = useState<'monthly' | 'annual'>('monthly');
  const [requesting,setRequesting]= useState<string | null>(null);
  const [reqError,  setReqError]  = useState('');
  const [reqSuccess,setReqSuccess]= useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/recycler-portal/tender-services');
      if (!r.ok) throw new Error(await r.text());
      setData(await r.json());
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSubscribe(plan_code: string) {
    setRequesting(plan_code); setReqError(''); setReqSuccess('');
    try {
      const r = await fetch('/api/recycler-portal/tender-services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan_code, billing_cycle: billing }),
      });
      const d = await r.json();
      if (!r.ok) { setReqError(d.error || 'Failed'); return; }
      trackEvent('Recycler Tender Service Subscribed', { plan_code, billing_cycle: billing });
      setReqSuccess(d.message || 'Request submitted!');
      load();
    } catch (e: any) {
      setReqError(e.message || 'Failed');
    } finally {
      setRequesting(null);
    }
  }

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <svg className="h-8 w-8 animate-spin text-green-600" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
    </div>
  );

  if (error) return (
    <div className="flex h-64 flex-col items-center justify-center gap-3">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={load} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">Retry</button>
    </div>
  );

  if (!data) return null;

  const { plans, subscription, hasActiveSubscription } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tender Services</h1>
        <p className="text-gray-500 mt-1 text-sm max-w-2xl">
          Access government and private tenders sourced from GeM, CPPP, State portals, and more — curated for EPR recyclers. Optionally have our expert team file tenders on your behalf.
        </p>
      </div>

      {/* Active subscription banner */}
      {hasActiveSubscription && subscription && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800">
                Active — {subscription.plan_code.charAt(0).toUpperCase() + subscription.plan_code.slice(1)} Plan
              </p>
              <p className="text-xs text-green-600 mt-0.5">
                Valid until {new Date(subscription.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <Link href="/recycler-portal/govt-tenders"
            className="shrink-0 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors">
            Browse Tenders →
          </Link>
        </div>
      )}

      {/* Success / error feedback */}
      {reqSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-green-500" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
          {reqSuccess}
        </div>
      )}
      {reqError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{reqError}</div>
      )}

      {/* Billing toggle */}
      {!hasActiveSubscription && (
        <div className="flex items-center gap-3">
          <p className="text-sm font-medium text-gray-700">Billing:</p>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['monthly', 'annual'] as const).map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                  billing === b ? 'bg-green-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {b}
                {b === 'annual' && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Save 17%</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan) => {
          const isCurrentPlan = subscription?.plan_code === plan.plan_code;
          const price = billing === 'annual' ? plan.price_inr_annual / 12 : plan.price_inr_monthly;
          const isPopular = plan.plan_code === 'pro';

          return (
            <div key={plan.plan_code}
              className={`relative rounded-2xl border bg-gradient-to-br p-6 space-y-5 ${PLAN_GRADIENTS[plan.plan_code]} ${
                isPopular ? 'ring-2 ring-violet-400/40' : ''
              }`}>
              {isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-violet-600 px-3 py-1 text-[11px] font-bold text-white shadow">Most Popular</span>
                </div>
              )}

              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${PLAN_BADGE[plan.plan_code]}`}>
                    {plan.plan_code}
                  </span>
                  <h3 className="mt-2 text-base font-bold text-gray-900">{plan.plan_name}</h3>
                </div>
                {isCurrentPlan && (
                  <span className="rounded-full bg-green-100 border border-green-200 px-2 py-0.5 text-[10px] font-bold text-green-700">Current</span>
                )}
              </div>

              <div>
                <span className="text-3xl font-extrabold text-gray-900">₹{Math.round(price).toLocaleString('en-IN')}</span>
                <span className="text-sm text-gray-500 ml-1">/month</span>
                {billing === 'annual' && plan.price_inr_annual && (
                  <p className="text-xs text-gray-400 mt-0.5">Billed ₹{plan.price_inr_annual.toLocaleString('en-IN')}/year</p>
                )}
              </div>

              <ul className="space-y-2.5">
                {plan.features.map((f: string) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 mt-0.5 text-green-500" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                    {f}
                  </li>
                ))}
              </ul>

              {!hasActiveSubscription ? (
                <button onClick={() => handleSubscribe(plan.plan_code)} disabled={!!requesting}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${PLAN_BTN[plan.plan_code]}`}>
                  {requesting === plan.plan_code ? 'Requesting…' : `Get ${plan.plan_name}`}
                </button>
              ) : isCurrentPlan ? (
                <Link href="/recycler-portal/govt-tenders"
                  className={`block w-full rounded-xl py-2.5 text-center text-sm font-semibold text-white transition-colors ${PLAN_BTN[plan.plan_code]}`}>
                  Browse Tenders →
                </Link>
              ) : (
                <button onClick={() => handleSubscribe(plan.plan_code)} disabled={!!requesting}
                  className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                  {requesting === plan.plan_code ? 'Requesting…' : 'Switch Plan'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Filing service callout */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex flex-col md:flex-row gap-5 items-start">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-amber-900 text-base">Tender Filing Service</h3>
          <p className="text-sm text-amber-700 mt-1 max-w-xl">
            Let our expert tendering team file government tenders on your behalf — from document preparation to portal submission. Available as an add-on for Pro &amp; Premium subscribers, or as a standalone service.
          </p>
          <ul className="mt-3 space-y-1">
            {['Document preparation & DSC signing', 'GeM / CPPP / State portal submission', 'EMD deposit coordination', 'Post-submission tracking & result updates'].map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-amber-700">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {f}
              </li>
            ))}
          </ul>
        </div>
        <div className="shrink-0">
          {hasActiveSubscription ? (
            <Link href="/recycler-portal/filing-requests"
              className="block rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 transition-colors whitespace-nowrap">
              Request Filing →
            </Link>
          ) : (
            <p className="text-xs text-amber-600 font-medium">Subscribe to any plan to access filing service.</p>
          )}
        </div>
      </div>

      {/* Quick links for active subscribers */}
      {hasActiveSubscription && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/recycler-portal/govt-tenders"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-green-300 hover:bg-green-50 transition-colors group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 group-hover:bg-green-200 transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h16M4 10h16M4 14h16M4 18h7"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Browse Govt Tenders</p>
              <p className="text-xs text-gray-500">View all active tenders sourced for you</p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>

          <Link href="/recycler-portal/filing-requests"
            className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:border-amber-300 hover:bg-amber-50 transition-colors group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 group-hover:bg-amber-200 transition-colors">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">Filing Requests</p>
              <p className="text-xs text-gray-500">
                {data.pendingFilings > 0 ? `${data.pendingFilings} pending request${data.pendingFilings > 1 ? 's' : ''}` : 'Request tender filing service'}
              </p>
            </div>
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </Link>
        </div>
      )}
    </div>
  );
}
