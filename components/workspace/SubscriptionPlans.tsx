'use client';

import { useState } from 'react';
import Script from 'next/script';
import Link from 'next/link';

export type Plan = {
  code: string; name: string; monthly_paise: number | null; annual_paise: number | null; currency: string;
  limits: Record<string,number>; monthly_available: boolean; annual_available: boolean;
};

export default function SubscriptionPlans({ workspaceId, plans, active = false, onChange }: {
  workspaceId?: string; plans: Plan[]; active?: boolean; onChange?: () => void;
}) {
  const [cycle, setCycle] = useState<'monthly'|'annual'>('annual');
  const [busy, setBusy] = useState('');
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');

  async function subscribe(plan: Plan) {
    setBusy(plan.code); setMessage('');
    try {
      const response = await fetch('/api/workspaces/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, planCode: plan.code, cycle, requestId: crypto.randomUUID() }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to open checkout');
      const checkout = new window.Razorpay({
        key: value.keyId, subscription_id: value.subscriptionId, name: 'EPR Compass', description: `${plan.name} - ${cycle}`,
        handler: () => { setBusy(''); setMessage('Payment submitted. Subscription activation is awaiting confirmation.'); onChange?.(); },
        modal: { ondismiss: () => setBusy('') }, theme: { color: '#07875f' },
      });
      checkout.open();
    } catch (e) { setBusy(''); setMessage(e instanceof Error ? e.message : 'Unable to open checkout'); }
  }

  return <section className="border-t border-slate-200 py-6">
    {workspaceId && <Script src="https://checkout.razorpay.com/v1/checkout.js" onReady={() => setReady(true)} onError={() => setMessage('Checkout could not load. Refresh the page to retry.')} />}
    <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Plans</h2>
      <fieldset className="flex gap-4 text-sm"><legend className="sr-only">Billing cycle</legend>{(['monthly','annual'] as const).map(value => <label key={value} className="flex min-h-11 items-center gap-2"><input type="radio" name="billing-cycle" checked={cycle === value} onChange={() => setCycle(value)} /><span className="capitalize">{value}</span></label>)}</fieldset>
    </div>
    {message && <p role="status" className="my-3 text-sm text-slate-700">{message}</p>}
    <div className="mt-4 grid gap-4 sm:grid-cols-2">{plans.map(plan => {
      const amount = cycle === 'annual' ? plan.annual_paise : plan.monthly_paise;
      const available = cycle === 'annual' ? plan.annual_available : plan.monthly_available;
      return <article key={plan.code} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-base font-semibold">{plan.name}</h3>
        <p className="mt-2 text-xl font-bold">{amount == null ? 'Custom pricing' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: plan.currency, maximumFractionDigits: 0 }).format(amount / 100)}{amount != null && <span className="ml-1 text-sm font-normal text-slate-500">/ {cycle === 'annual' ? 'year' : 'month'}</span>}</p>
        <dl className="my-4 space-y-2 text-sm">{Object.keys(plan.limits).length ? Object.entries(plan.limits).map(([resource,limit]) => <div key={resource} className="flex justify-between gap-4"><dt className="text-slate-600">{{ seats: 'Team seats', companies: 'Companies', countries: 'Countries', storage_bytes: 'Storage', ai_requests: 'AI requests / month', exports: 'Exports / month' }[resource] ?? resource}</dt><dd className="font-medium">{resource === 'storage_bytes' ? `${limit / 1073741824} GB` : limit.toLocaleString()}</dd></div>) : <div className="text-slate-600">Contracted capacity and support</div>}</dl>
        {workspaceId && available && !active ? <button type="button" disabled={!!busy || !ready} onClick={() => subscribe(plan)} className="mt-auto min-h-11 rounded-lg bg-[#07875f] px-4 text-sm font-semibold text-white disabled:opacity-50">{busy === plan.code ? 'Opening checkout...' : 'Subscribe'}</button> : <Link href={`/contact?plan=${plan.code}&billing=${cycle}`} className="mt-auto flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold">Contact sales</Link>}
      </article>;
    })}</div>
  </section>;
}

