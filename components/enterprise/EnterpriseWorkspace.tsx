'use client';

import { useEffect, useState } from 'react';
import { Plus, RefreshCw, Send, Check, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { BUSINESS_ACTIVITIES } from '@/lib/onboarding/clientSetup';

type Entity = { id: string; name: string; kind: string; parent_id: string | null; country_code: string; business_activity: string };
type Product = { id: string; entity_id: string; sku: string; version: number; name: string; material: string; weight_grams: number; effective_date: string };
type Submission = { id: string; entity_id: string; title: string; status: string; created_by: string; reporting_period: string; details: string; review_comment: string | null; product_id: string | null };
type Data = { selected: string; userId: string; workspaces: { id: string; name: string; member_role: string }[]; entities: Entity[]; submissions: Submission[]; access: { entity_id: string; user_id: string; role: string }[]; team: { user_id: string; full_name: string }[]; audit: { id: number; entity_id: string; actor_id: string; action: string; created_at: string; detail: { comment?: string } }[] };
const field = 'min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold disabled:opacity-50';

export default function EnterpriseWorkspace() {
  const [data, setData] = useState<(Data & { products: Product[] }) | null>(null);
  const [workspace, setWorkspace] = useState('');
  const [entityId, setEntityId] = useState('');
  const [tab, setTab] = useState('Structure');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const [kind, setKind] = useState('legal_entity');
  const [review, setReview] = useState<{ id: string; action: string } | null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    fetch(`/api/portal/enterprise${workspace ? `?workspace=${encodeURIComponent(workspace)}` : ''}`, { cache: 'no-store' })
      .then(async response => { const value = await response.json(); if (!response.ok) throw new Error(value.error); return value as Data & { products: Product[] }; })
      .then(value => { if (active) { setData(value); setError(''); setEntityId(current => value.entities.some(e => e.id === current) ? current : value.entities[0]?.id ?? ''); } })
      .catch(e => { if (active) setError(e.message || 'Unable to load'); });
    return () => { active = false; };
  }, [workspace, reload]);
  const owner = data?.workspaces.find(w => w.id === data.selected)?.member_role === 'OWNER';
  const role = owner ? 'owner' : data?.access.find(a => a.entity_id === entityId && a.user_id === data.userId)?.role;
  const submissions = data?.submissions.filter(s => s.entity_id === entityId) ?? [];
  async function command(action: string, values: Record<string, unknown>, form?: HTMLFormElement) {
    if (busy) return;
    setBusy(true); setError(''); setNotice('');
    try {
      const response = await fetch('/api/portal/enterprise', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, data: { workspace_id: data?.selected, entity_id: entityId, ...values } }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      form?.reset(); setReview(null); setNotice('Saved.'); setReload(n => n+1);
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); }
    finally { setBusy(false); }
  }
  function submit(action: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget;
    void command(action, Object.fromEntries(new FormData(form)), form);
  }
  return <main className="mx-auto max-w-6xl p-4 text-slate-900 sm:p-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Enterprise Workspace</h1><button className={button} title="Refresh enterprise workspace" aria-label="Refresh enterprise workspace" onClick={() => setReload(n => n+1)}><RefreshCw size={18} /></button></header>
    {error && <p role="alert" className="my-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {notice && <p role="status" className="my-3 text-sm text-emerald-700">{notice}</p>}
    {!data && !error && <p role="status" className="py-8">Loading enterprise workspace...</p>}
    {data && <>
      {!data.workspaces.length ? <p className="py-8">No client workspace is linked to your account.</p> : <>
        <div className="my-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-medium">Organisation<select disabled={busy} className={`${field} mt-2`} value={data.selected} onChange={e => { setWorkspace(e.target.value); setData(null); setReview(null); setNotice(''); }}>{data.workspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
          <label className="text-sm font-medium">Entity<select disabled={busy} className={`${field} mt-2`} value={entityId} onChange={e => { setEntityId(e.target.value); setReview(null); setNotice(''); }}>{!data.entities.length && <option value="">No entities</option>}{data.entities.map(e => <option key={e.id} value={e.id}>{e.name} ({e.country_code})</option>)}</select></label></div>
        <nav aria-label="Enterprise views" className="flex flex-wrap gap-5 border-b border-slate-200">{['Structure','Products','Approvals','Access','Audit'].map(view => <button key={view} aria-pressed={tab === view} className={`min-h-11 border-b-2 text-sm font-semibold ${tab === view ? 'border-emerald-700 text-emerald-700' : 'border-transparent text-slate-500'}`} onClick={() => setTab(view)}>{view}</button>)}</nav>
        {tab === 'Products' && <section className="py-6"><h2 className="text-lg font-semibold">Product Versions</h2>
          <ul className="my-4 divide-y divide-slate-200">{data.products.filter(p => p.entity_id === entityId).map(p => <li key={p.id} className="py-3 text-sm"><p className="font-semibold">{p.sku} · v{p.version} · {p.name}</p><p>{p.material} · {p.weight_grams} g/unit · Effective {p.effective_date}</p></li>)}</ul>
          {entityId && ['owner','preparer'].includes(role ?? '') && <form onSubmit={e => submit('create_product',e)} className="grid gap-4 sm:grid-cols-2"><fieldset disabled={busy} className="contents">
            <label className="text-sm">SKU<input required name="sku" maxLength={80} className={`${field} mt-2`} /></label><label className="text-sm">Product name<input required name="name" maxLength={160} className={`${field} mt-2`} /></label>
            <label className="text-sm">Material<input required name="material" maxLength={160} className={`${field} mt-2`} /></label><label className="text-sm">Material weight (grams per unit)<input required name="weight_grams" type="number" min="0.000001" step="0.000001" className={`${field} mt-2`} /></label>
            <label className="text-sm">Effective date<input required name="effective_date" type="date" className={`${field} mt-2`} /></label><div className="sm:col-span-2"><button className={button}><Plus size={16} />Add product version</button></div>
          </fieldset></form>}
        </section>}
        {tab === 'Structure' && <section className="py-6">
          <h2 className="text-lg font-semibold">Legal Entities &amp; Facilities</h2>
          <ul className="my-5 divide-y divide-slate-200">{data.entities.map(e => <li key={e.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span className="font-medium">{e.name}</span><span>{e.kind.replace('_',' ')} · {e.country_code} · {e.business_activity}{e.parent_id ? ` · ${data.entities.find(parent => parent.id === e.parent_id)?.name ?? 'Parent entity'}` : ''}</span></li>)}</ul>
          {owner && <form onSubmit={e => submit('create_entity', e)} className="grid gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2"><fieldset disabled={busy} className="contents">
            <label className="text-sm">Name<input className={`${field} mt-2`} name="name" required maxLength={160} /></label>
            <label className="text-sm">Type<select className={`${field} mt-2`} name="kind" value={kind} onChange={e => setKind(e.target.value)}><option value="legal_entity">Legal entity</option><option value="facility">Facility</option></select></label>
            <label className="text-sm">Country code<input className={`${field} mt-2 uppercase`} name="country_code" placeholder="IN" pattern="[A-Za-z]{2}" maxLength={2} required /></label>
            <label className="text-sm">Company activity<select className={`${field} mt-2`} name="business_activity">{BUSINESS_ACTIVITIES.map(a => <option value={a.value} key={a.value}>{a.label}</option>)}</select></label>
            {kind === 'facility' && <label className="text-sm">Legal entity<select required name="parent_id" className={`${field} mt-2`}><option value="">Select legal entity</option>{data.entities.filter(e => e.kind === 'legal_entity').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></label>}
            <div className="sm:col-span-2"><button className={button}><Plus size={16} />Add entity</button></div>
          </fieldset></form>}
        </section>}
        {tab === 'Approvals' && <section className="py-6"><h2 className="text-lg font-semibold">Internal Approvals</h2>
          {entityId && ['owner','preparer'].includes(role ?? '') && <form onSubmit={e => submit('create_submission',e)} className="my-5 grid gap-4 sm:grid-cols-2"><fieldset disabled={busy} className="contents"><label className="text-sm">Title<input required maxLength={160} name="title" className={`${field} mt-2`} /></label><label className="text-sm">Reporting period ending<input required type="date" name="reporting_period" className={`${field} mt-2`} /></label>
            <label className="text-sm sm:col-span-2">Product version (optional)<select name="product_id" className={`${field} mt-2`}><option value="">No linked product</option>{data.products.filter(p => p.entity_id === entityId).map(p => <option key={p.id} value={p.id}>{p.sku} · v{p.version} · {p.name}</option>)}</select></label>
            <label className="text-sm sm:col-span-2">Submission details<textarea required maxLength={10000} rows={4} name="details" className={`${field} mt-2`} /></label><div><button className={button}><Plus size={16} />Create draft</button></div></fieldset></form>}
          <p className="my-3 text-sm text-slate-500">Recent submissions: {submissions.length} · Pending review: {submissions.filter(s => s.status === 'submitted').length}</p>
          {!submissions.length && <p className="py-5 text-sm text-slate-500">No submissions for this entity.</p>}
          <div className="divide-y divide-slate-200">{submissions.map(s => <article key={s.id} className="py-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold">{s.title}</h3><span className="text-sm capitalize">{s.status} · {s.reporting_period}</span></div><p className="my-3 whitespace-pre-wrap break-words text-sm">{s.details}</p>{s.product_id && <p className="my-2 break-words text-xs text-slate-500">Product version: {data.products.find(p => p.id === s.product_id)?.sku ?? s.product_id} · {data.products.find(p => p.id === s.product_id)?.version ?? 'Archived version'}</p>}{s.review_comment && <p className="my-3 text-sm">Review: {s.review_comment}</p>}
            {s.status === 'draft' && s.created_by === data.userId && ['owner','preparer'].includes(role ?? '') && <button disabled={busy} className={button} onClick={() => command('submit',{ submission_id: s.id })}><Send size={16} />Submit for review</button>}
            {s.status === 'submitted' && s.created_by !== data.userId && ['owner','reviewer'].includes(role ?? '') && <div className="flex gap-3"><button disabled={busy} className={button} onClick={() => setReview({ id: s.id, action:'approve' })}><Check size={16} />Approve</button><button disabled={busy} className={button} onClick={() => setReview({ id:s.id, action:'reject' })}><X size={16} />Reject</button></div>}
            {review?.id === s.id && <form onSubmit={e => { e.preventDefault(); void command(review.action,{ submission_id:s.id, comment:new FormData(e.currentTarget).get('comment') }); }} className="mt-4 space-y-3"><label className="block text-sm">Review comment<textarea required maxLength={2000} name="comment" className={`${field} mt-2`} /></label><button disabled={busy} className={button}>Confirm {review.action === 'approve' ? 'approval' : 'rejection'}</button><button type="button" className={`${button} ml-3`} onClick={() => setReview(null)}>Cancel</button></form>}
          </article>)}</div>
        </section>}
        {tab === 'Access' && <section className="py-6"><h2 className="text-lg font-semibold">Entity Access</h2>
          <ul className="my-4 divide-y divide-slate-200">{data.access.filter(a => a.entity_id === entityId).map(a => <li key={a.user_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{data.team.find(t => t.user_id === a.user_id)?.full_name || a.user_id} · {a.role}</span>{owner && <button disabled={busy} className={button} title="Revoke entity access" aria-label="Revoke entity access" onClick={() => command('revoke_access',{ user_id:a.user_id })}><Trash2 size={16} /></button>}</li>)}</ul>
          {owner && entityId && <form onSubmit={e => submit('grant_access',e)} className="grid gap-4 sm:grid-cols-2"><fieldset disabled={busy} className="contents"><label className="text-sm">Active team member<select name="user_id" required className={`${field} mt-2`}><option value="">Select team member</option>{data.team.map(t => <option key={t.user_id} value={t.user_id}>{t.full_name || t.user_id}</option>)}</select></label><label className="text-sm">Role<select name="role" className={`${field} mt-2`}><option value="preparer">Preparer</option><option value="reviewer">Reviewer</option><option value="auditor">Read-only auditor</option></select></label><div><button className={button}><Plus size={16} />Assign access</button></div></fieldset></form>}
          <Link href="/portal/team" className="mt-5 inline-block text-sm font-semibold text-emerald-700">Manage workspace team</Link>
        </section>}
        {tab === 'Audit' && <section className="py-6"><h2 className="text-lg font-semibold">Recent Activity</h2><ol className="mt-4 divide-y divide-slate-200">{data.audit.filter(a => a.entity_id === entityId).map(a => <li className="py-3 text-sm" key={a.id}><p className="font-medium">{a.action.replaceAll('_',' ')}</p><p className="break-words text-slate-500">{new Date(a.created_at).toLocaleString()} · {a.actor_id}</p>{a.detail.comment && <p className="mt-2 break-words">{a.detail.comment}</p>}</li>)}</ol></section>}
      </>}
    </>}
  </main>;
}
