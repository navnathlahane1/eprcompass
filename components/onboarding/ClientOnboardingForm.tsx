'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Save } from 'lucide-react';
import { BUSINESS_ACTIVITIES, SETUP_CATEGORIES, parseClientSetup, readClientSetup } from '@/lib/onboarding/clientSetup';

export default function ClientOnboardingForm({ initial: stored, readOnly = false }: { initial: unknown; readOnly?: boolean }) {
  const initial = readClientSetup(stored);
  const [activity, setActivity] = useState(initial.business_activity ?? '');
  const [countries, setCountries] = useState((initial.operating_countries ?? []).join(', '));
  const [categories, setCategories] = useState(initial.product_categories ?? []);
  const [imports, setImports] = useState(initial.imported_products ?? '');
  const [manufacturing, setManufacturing] = useState(initial.manufactured_products ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const field = 'mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
  async function save(draft = false) {
    if (readOnly || busy) return;
    setBusy(true); setError(''); setSaved('');
    try {
      const setup = parseClientSetup({ business_activity: activity, operating_countries: countries.split(',').map(country => country.trim()).filter(Boolean), product_categories: categories, imported_products: imports, manufactured_products: manufacturing }, { draft });
      const response = await fetch('/api/portal/onboarding', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...setup, mode: draft ? 'draft' : 'complete' }) });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error || 'Unable to save');
      setSaved(draft ? 'Draft saved.' : 'Company setup completed.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save'); }
    finally { setBusy(false); }
  }
  return <main className="mx-auto max-w-3xl p-4 text-slate-900 sm:p-6">
    <h1 className="text-2xl font-semibold">Company Setup</h1>
    <form onSubmit={event => { event.preventDefault(); void save(); }} onChange={() => setSaved('')} className="mt-6 space-y-6">
      <fieldset disabled={busy || readOnly} className="space-y-6">
        <fieldset><legend className="text-sm font-semibold">Company type</legend><div className="mt-3 flex flex-wrap gap-6">{BUSINESS_ACTIVITIES.map(option => <label key={option.value} className="flex min-h-11 items-center gap-2 text-sm"><input required type="radio" name="activity" value={option.value} checked={activity === option.value} onChange={() => setActivity(option.value)} />{option.label}</label>)}</div></fieldset>
        <label className="block text-sm font-medium">Operating countries (comma-separated)<input required maxLength={10000} value={countries} onChange={e => setCountries(e.target.value)} className={field} placeholder="India, Germany" /></label>
        <fieldset className="border-t border-slate-200 pt-5"><legend className="text-sm font-semibold">Product categories</legend><div className="flex flex-wrap gap-5">{SETUP_CATEGORIES.map(category => <label key={category} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={categories.includes(category)} onChange={e => setCategories(current => e.target.checked ? [...current, category] : current.filter(item => item !== category))} />{category}</label>)}</div></fieldset>
        {(activity === 'importer' || activity === 'both') && <label className="block text-sm font-medium">Imported products and packaging<textarea required maxLength={2000} rows={3} value={imports} onChange={e => setImports(e.target.value)} className={field} /></label>}
        {(activity === 'manufacturer' || activity === 'both') && <label className="block text-sm font-medium">Manufactured products and packaging<textarea required maxLength={2000} rows={3} value={manufacturing} onChange={e => setManufacturing(e.target.value)} className={field} /></label>}
      </fieldset>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="text-sm text-emerald-700">{saved}</p>}
      {!readOnly && <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={() => void save(true)} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold disabled:opacity-50"><Save size={16} />Save draft</button>
        <button disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Complete company setup'}</button>
      </div>}
    </form>
    <nav aria-label="Account setup" className="mt-8 flex flex-wrap gap-6 border-t border-slate-200 pt-5 text-sm font-semibold text-emerald-700"><Link href="/portal/profile">Company details</Link><Link href="/portal/documents">Documents</Link><Link href="/account/workspaces">Subscription plan</Link></nav>
  </main>;
}
