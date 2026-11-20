'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' }, { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },   { value: 'tiktok', label: 'TikTok' },
  { value: 'pinterest', label: 'Pinterest' },{ value: 'threads', label: 'Threads' },
  { value: 'google_business', label: 'Google Business' }, { value: 'other', label: 'Other' },
];
const ACCOUNT_TYPES = [
  { value: 'brand', label: 'Brand' }, { value: 'regional', label: 'Regional' },
  { value: 'personal_brand', label: 'Personal Brand' }, { value: 'ads', label: 'Ads' },
];
const ENTITIES = [
  { value: 'neubrain', label: 'Neubrain' },
  { value: 'ecovijay_growth', label: 'EPR Compass' },
  { value: 'eco_vijay_global', label: 'EPR Compass' },
  { value: 'eco_vijay_events', label: 'EPR Compass Events' },
  { value: 'eco_vijay_academy', label: 'EPR Compass Academy' },
];
const REGIONS = ['India', 'UAE', 'SE Asia', 'Africa', 'Global'];

export default function CreateAccountPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    platform: '', display_name: '', handle: '', profile_url: '', login_url: '',
    account_type: 'brand', brand_entity: 'ecovijay_growth', region: '',
    status: 'active', notes: '', tags: '',
  });

  function set(key: string, val: string) { setForm(f => ({ ...f, [key]: val })); }

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.platform || !form.display_name) { setError('Platform and display name are required'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/comms/accounts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to create account'); return; }
      router.push(`/comms/vault/${data.accountId}`);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comms/vault" className="text-slate-500 hover:text-slate-200 transition">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Add Account</h1>
          <p className="text-xs text-slate-500 mt-0.5">Register a new platform account in the vault</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-6 space-y-5">
        {/* Platform + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Platform <span className="text-rose-400">*</span></label>
            <select value={form.platform} onChange={e => set('platform', e.target.value)} required className={inputCls}>
              <option value="">Select platform…</option>
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Account Type</label>
            <select value={form.account_type} onChange={e => set('account_type', e.target.value)} className={inputCls}>
              {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        {/* Name + Handle */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Display Name <span className="text-rose-400">*</span></label>
            <input type="text" placeholder="EPR Compass Official" value={form.display_name} onChange={e => set('display_name', e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Handle / Username</label>
            <input type="text" placeholder="@eprcompass" value={form.handle} onChange={e => set('handle', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Brand entity + Region */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Brand Entity</label>
            <select value={form.brand_entity} onChange={e => set('brand_entity', e.target.value)} className={inputCls}>
              {ENTITIES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Region</label>
            <select value={form.region} onChange={e => set('region', e.target.value)} className={inputCls}>
              <option value="">Global / Not region-specific</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Profile URL</label>
            <input type="url" placeholder="https://linkedin.com/company/…" value={form.profile_url} onChange={e => set('profile_url', e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Login URL</label>
            <input type="url" placeholder="https://linkedin.com/login" value={form.login_url} onChange={e => set('login_url', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Status + Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls}>
              <option value="active">Active</option>
              <option value="dormant">Dormant</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Tags (comma-separated)</label>
            <input type="text" placeholder="epr, plastic, india" value={form.tags} onChange={e => set('tags', e.target.value)} className={inputCls} />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes / SOP</label>
          <textarea
            rows={4}
            placeholder="Posting guidelines, access SOP, important contacts…"
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            className={`${inputCls} resize-y`}
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <Link href="/comms/vault" className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-center text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
            Cancel
          </Link>
          <button type="submit" disabled={loading}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
            {loading ? 'Creating…' : 'Create Account'}
          </button>
        </div>
      </form>

      <p className="text-xs text-slate-600 text-center">
        Credentials (passwords, 2FA codes) are added separately from the account detail page after creation.
      </p>
    </div>
  );
}
