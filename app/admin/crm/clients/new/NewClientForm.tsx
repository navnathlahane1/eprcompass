'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { BUSINESS_ACTIVITIES } from '@/lib/onboarding/clientSetup';
import { authenticatedFetch } from '@/lib/auth/authenticatedFetch';

const CATEGORIES = ['PIBO', 'Recycler', 'Importer', 'Brand Owner'] as const;
const STATUS_OPTIONS = ['Onboarding', 'Active', 'At Risk', 'Churned'] as const;
const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'] as const;
const STATES = INDIA_STATES_UTS;

interface Manager {
  id: string;
  full_name: string | null;
  company_name: string | null;
}

interface Props {
  managers: Manager[];
}

interface FormState {
  email: string;
  full_name: string;
  company_name: string;
  phone: string;
  gstin: string;
  state: string;
  category: string;
  business_activity: string;
  status: string;
  waste_categories: string[];
  assigned_manager_id: string;
  notes: string;
  renewal_date: string;
  password: string;
  autoPassword: boolean;
}

interface Result {
  clientId: string;
  email: string;
  temporaryPassword: string | null;
}

export default function NewClientForm({ managers }: Props) {
  const router = useRouter();

  const [form, setForm] = useState<FormState>({
    email: '',
    full_name: '',
    company_name: '',
    phone: '',
    gstin: '',
    state: '',
    category: '',
    business_activity: '',
    status: 'Onboarding',
    waste_categories: [],
    assigned_manager_id: '',
    notes: '',
    renewal_date: '',
    password: '',
    autoPassword: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [existingUser, setExistingUser] = useState<{ id: string; email: string; canLink: boolean; clientId: string | null } | null>(null);
  const [linkProfileId, setLinkProfileId] = useState<string | null>(null);

  function set(field: keyof FormState, value: unknown) {
    if (field === 'email') { setLinkProfileId(null); setExistingUser(null); }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleWaste(cat: string) {
    setForm((prev) => ({
      ...prev,
      waste_categories: prev.waste_categories.includes(cat)
        ? prev.waste_categories.filter((w) => w !== cat)
        : [...prev.waste_categories, cat],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await authenticatedFetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          existing_profile_id: linkProfileId || undefined,
          full_name: form.full_name.trim(),
          company_name: form.company_name.trim() || undefined,
          phone: form.phone.trim() || undefined,
          gstin: form.gstin.trim() || undefined,
          state: form.state || undefined,
          category: form.category,
          business_activity: form.business_activity,
          status: form.status || 'Onboarding',
          waste_categories: form.waste_categories,
          assigned_manager_id: form.assigned_manager_id || undefined,
          notes: form.notes.trim() || undefined,
          renewal_date: form.renewal_date || undefined,
          password: form.autoPassword ? undefined : form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setExistingUser(res.status === 409 ? data.existingUser || null : null);
        setError(data.error || 'Failed to create client.');
        return;
      }

      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────

  if (result) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-5">
          <h2 className="text-base font-semibold text-emerald-300">Client created successfully</h2>
          <p className="mt-1 text-sm text-emerald-300">
            {result.temporaryPassword ? 'The client portal account has been set up. Share the credentials below with the client.' : 'The existing portal account has been linked. Its password was not changed.'}
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Login Credentials</h3>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
              <span className="text-slate-500">Email</span>
              <span className="font-mono font-medium text-slate-100 select-all">{result.email}</span>
            </div>
            {result.temporaryPassword && <div className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
              <span className="text-slate-500">Temporary Password</span>
              <span className="font-mono font-medium text-slate-100 select-all">{result.temporaryPassword}</span>
            </div>}
            <div className="flex items-center justify-between rounded-lg bg-slate-950 px-3 py-2">
              <span className="text-slate-500">Login URL</span>
              <span className="font-mono text-blue-400 select-all">
                {typeof window !== 'undefined' ? window.location.origin : ''}/portal/login
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Ask the client to change their password after first login.
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/crm/clients/${result.clientId}`}
            className="btn-primary"
          >
            View Client Profile
          </Link>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setExistingUser(null);
              setLinkProfileId(null);
              setForm({
                email: '', full_name: '', company_name: '', phone: '', gstin: '',
                state: '', category: '', business_activity: '', status: 'Onboarding', waste_categories: [], assigned_manager_id: '',
                notes: '', renewal_date: '', password: '', autoPassword: true,
              });
            }}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950"
          >
            Create Another
          </button>
          <Link
            href="/admin/crm/clients"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950"
          >
            Back to Clients
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Contact Info */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Contact Information</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Contact Name <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={form.full_name}
              onChange={(e) => set('full_name', e.target.value)}
              placeholder="Full Name"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="john@company.com"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Company Name</label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Acme Corp Pvt Ltd"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="Enter phone number"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">GSTIN</label>
            <input
              type="text"
              value={form.gstin}
              onChange={(e) => set('gstin', e.target.value.toUpperCase())}
              placeholder="27AAACR5055K1ZS"
              maxLength={15}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">State</label>
            <select
              value={form.state}
              onChange={(e) => set('state', e.target.value)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Compliance Info */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Compliance Profile</h2>
        <label className="block text-sm text-slate-300">Company type
          <select required value={form.business_activity} onChange={e => set('business_activity', e.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 px-3 py-2 text-sm">
            <option value="">Select company type</option>
            {BUSINESS_ACTIVITIES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              CRM category <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('category', c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    form.category === c
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-700 text-slate-400 hover:bg-slate-950'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {!form.category && (
              <p className="mt-1 text-xs text-red-500">Please select a category</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set('status', s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    form.status === s
                      ? 'bg-teal-600 text-white'
                      : 'border border-slate-700 text-slate-400 hover:bg-slate-950'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Assigned Manager</label>
            <select
              value={form.assigned_manager_id}
              onChange={(e) => set('assigned_manager_id', e.target.value)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Unassigned</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name || m.company_name || m.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Renewal Date</label>
            <input
              type="date"
              value={form.renewal_date}
              onChange={(e) => set('renewal_date', e.target.value)}
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2">Waste Categories</label>
          <div className="flex flex-wrap gap-2">
            {WASTE_OPTIONS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => toggleWaste(w)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  form.waste_categories.includes(w)
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-700 text-slate-400 hover:bg-slate-950'
                }`}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            placeholder="Internal notes about this client..."
            className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </section>

      {/* Login Credentials */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wide">Login Credentials</h2>

        <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoPassword}
            onChange={(e) => set('autoPassword', e.target.checked)}
            className="h-4 w-4 rounded border-slate-700 text-blue-400 focus:ring-blue-500"
          />
          Auto-generate a secure temporary password
        </label>

        {!form.autoPassword && (
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Set Password (min 8 chars)</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              minLength={8}
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <p className="text-xs text-slate-500">
          After creation, the generated credentials will be displayed. You can also send a magic login link from the client detail page.
        </p>
      </section>

      {error && (
        <div role="alert" className="rounded-lg border border-rose-800/40 bg-rose-950/30 px-4 py-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {existingUser?.canLink && <button type="button" className="text-sm font-semibold text-blue-400 underline" onClick={() => {
        setLinkProfileId(existingUser.id);
        setExistingUser(null);
        setError('Existing login selected. Review the company details, then submit to link it. The password will stay unchanged.');
      }}>Use existing portal login</button>}
      {existingUser?.clientId && <Link href={`/admin/crm/clients/${existingUser.clientId}`} className="text-sm text-blue-400 underline">Open existing client</Link>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Saving Client…' : linkProfileId ? 'Link Existing Account & Create Client' : 'Create Client'}
        </button>
        <Link
          href="/admin/crm/clients"
          className="rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-950"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
