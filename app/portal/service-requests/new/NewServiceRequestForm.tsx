'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SERVICE_CATEGORIES, PRIORITIES } from '@/lib/serviceRequests/constants';
import { trackEvent } from '@/lib/analytics';

export default function NewServiceRequestForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'Normal',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/portal/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to submit request');
        return;
      }
      trackEvent('Service Request Submitted', { category: form.category, priority: form.priority });
      setSuccess(true);
      setTimeout(() => router.push('/portal/service-requests'), 1800);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="font-semibold text-emerald-800">Request Submitted!</p>
        <p className="mt-1 text-sm text-emerald-600">Our team will review and respond shortly. Redirecting…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Service Category <span className="text-red-500">*</span>
        </label>
        <select
          required
          value={form.category}
          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        >
          <option value="">Select a category…</option>
          {SERVICE_CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Subject */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Subject <span className="text-red-500">*</span>
        </label>
        <input
          required
          minLength={5}
          maxLength={200}
          value={form.subject}
          onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
          placeholder="Brief title describing your requirement"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          required
          minLength={10}
          rows={5}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
          placeholder="Describe your requirements, any relevant details, deadlines, or documents needed…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-slate-400">{form.description.length}/2000 characters</p>
      </div>

      {/* Priority */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setForm(f => ({ ...f, priority: p }))}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                form.priority === p
                  ? 'border-teal-600 bg-teal-50 text-teal-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60 transition"
        >
          {loading ? 'Submitting…' : 'Submit Request'}
        </button>
        <Link
          href="/portal/service-requests"
          className="text-sm font-medium text-slate-500 hover:text-slate-700 transition"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
