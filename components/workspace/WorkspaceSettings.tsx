'use client';

import { useCallback, useEffect, useState } from 'react';
import { Building2, RefreshCw, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SubscriptionPlans, { type Plan } from './SubscriptionPlans';

type Workspace = { id: string; entity_type: string; name: string; billing_email: string | null; member_role: string };
type Subscription = { workspace_id: string; plan_name: string; status: string; current_period_end: string; cancel_at_period_end: boolean };
type Entitlement = { workspace_id: string; resource: string; limit_value: number; used_value: number };
type Data = { workspaces: Workspace[]; subscriptions: Subscription[]; entitlements: Entitlement[]; plans: Plan[] };
const portal: Record<string,string> = { client: '/portal/account', partner: '/partner/dashboard', recycler: '/recycler-portal/dashboard', cepc: '/cepc/dashboard' };
const field = 'w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900';

export default function WorkspaceSettings() {
  const [data, setData] = useState<Data | null>(null);
  const [selected, setSelected] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [saved, setSaved] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const load = useCallback(() => fetch('/api/workspaces', { cache: 'no-store' })
    .then(async response => {
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to load workspaces');
      return value as Data;
    }).then(value => {
      setError('');
      setData(value);
      setSelected(current => value.workspaces.some((w: Workspace) => w.id === current) ? current : value.workspaces[0]?.id || '');
    }).catch(e => { setError(e instanceof Error ? e.message : 'Unable to load workspaces'); })
    .finally(() => { setBusy(false); }), []);
  useEffect(() => { void load(); }, [load]);
  const workspace = data?.workspaces.find(w => w.id === selected);
  const subscription = data?.subscriptions.find(s => s.workspace_id === selected);
  const entitlements = data?.entitlements.filter(e => e.workspace_id === selected) ?? [];

  async function cancelSubscription() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/workspaces/cancel-subscription', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspaceId: selected }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to cancel');
      setConfirmCancel(false); await load(); setSaved('Cancellation scheduled for the end of the billing period');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to cancel'); }
    finally { setBusy(false); }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSaved(''); setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/workspaces', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected, name: form.get('name'), billing_email: form.get('billing_email') }),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to save workspace');
      await load(); setSaved('Workspace updated');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save workspace'); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-[#fbfdfc] px-4 py-8 text-slate-900 sm:px-6">
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div><p className="text-sm font-semibold text-emerald-700">EPR Compass</p><h1 className="mt-1 text-2xl font-bold">Workspace Settings</h1></div>
        <button type="button" onClick={() => { setBusy(true); void load(); }} disabled={busy} title="Refresh workspaces" aria-label="Refresh workspaces" className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 disabled:opacity-50"><RefreshCw size={18} /></button>
      </header>
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {saved && <p role="status" className="mt-4 text-sm text-emerald-700">{saved}</p>}
      {!data && !error && <p role="status" className="py-8 text-sm text-slate-600">Loading workspaces...</p>}
      {data && !data.workspaces.length && <div className="py-10"><Building2 className="text-emerald-600" size={28} /><h2 className="mt-3 text-lg font-semibold">No workspace linked</h2><Link href="/contact" className="mt-4 inline-flex text-sm font-semibold text-emerald-700">Contact support</Link></div>}
      {workspace && <>
        <div className="py-6"><label htmlFor="workspace" className="mb-2 block text-sm font-medium">Workspace</label><select id="workspace" value={selected} disabled={busy} onChange={e => { setSelected(e.target.value); setSaved(''); setError(''); setConfirmCancel(false); }} className={field}>{data?.workspaces.map(w => <option key={w.id} value={w.id}>{w.name} ({w.entity_type})</option>)}</select></div>
        <form key={`${workspace.id}:${workspace.name}:${workspace.billing_email}`} onSubmit={save} className="border-t border-slate-200 py-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2"><h2 className="text-lg font-semibold">Company Account</h2><span className="text-sm text-slate-500">{workspace.member_role}</span></div>
          <fieldset disabled={busy || workspace.member_role !== 'OWNER'} className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Workspace name<input name="name" required maxLength={160} defaultValue={workspace.name} className={`${field} mt-2`} /></label>
            <label className="text-sm font-medium">Billing email<input name="billing_email" type="email" maxLength={254} defaultValue={workspace.billing_email ?? ''} className={`${field} mt-2`} /></label>
          </fieldset>
          {workspace.member_role === 'OWNER' && <button disabled={busy} type="submit" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#07875f] px-4 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} />{busy ? 'Saving...' : 'Save changes'}</button>}
        </form>
        <section className="border-t border-slate-200 py-6"><h2 className="text-lg font-semibold">Subscription</h2>
          {['OWNER','FINANCE'].includes(workspace.member_role) ? subscription ? <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3"><div><dt className="text-slate-500">Plan</dt><dd className="mt-1 font-semibold">{subscription.plan_name}</dd></div><div><dt className="text-slate-500">Status</dt><dd className="mt-1 capitalize">{subscription.status}</dd></div><div><dt className="text-slate-500">{subscription.cancel_at_period_end ? 'Access ends' : 'Current period ends'}</dt><dd className="mt-1">{new Date(subscription.current_period_end).toLocaleDateString('en-IN')}</dd></div></dl> : <p className="mt-3 text-sm text-slate-600">No subscription configured</p> : <p className="mt-3 text-sm text-slate-600">Billing is available to owners and finance members.</p>}
        </section>
        <section className="border-t border-slate-200 py-6"><h2 className="text-lg font-semibold">Usage &amp; Limits</h2>{entitlements.length ? <div className="mt-4 divide-y divide-slate-100">{entitlements.map(e => <div key={e.resource} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span className="capitalize">{e.resource.replaceAll('_', ' ')}</span><span>{Number(e.used_value).toLocaleString()} / {Number(e.limit_value).toLocaleString()}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-600">No usage limits configured</p>}</section>
        {workspace.member_role === 'OWNER' && subscription?.status === 'active' && !subscription.cancel_at_period_end && <div className="border-t border-slate-200 py-5">{confirmCancel ? <div><p className="text-sm">Cancel renewal at the end of this billing period?</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={cancelSubscription} className="min-h-11 rounded-lg border border-red-300 px-4 text-sm text-red-700">Confirm cancellation</button><button type="button" onClick={() => setConfirmCancel(false)} className="min-h-11 px-4 text-sm">Keep subscription</button></div></div> : <button type="button" onClick={() => setConfirmCancel(true)} className="min-h-11 text-sm text-red-700">Cancel renewal</button>}</div>}
        {workspace.member_role === 'OWNER' && <SubscriptionPlans key={selected} workspaceId={selected} plans={data?.plans ?? []} active={!!subscription && subscription.status !== 'pending'} onChange={load} />}
        <Link href={portal[workspace.entity_type] ?? '/'} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700"><ArrowLeft size={16} />Back to portal</Link>
      </>}
    </div>
  </main>;
}

