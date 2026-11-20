'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics';

interface EditableFields {
  phone: string;
  city: string;
  state: string;
  address_line1: string;
  address_line2: string;
  pincode: string;
}

export function ProfileEditSection({ initial }: { initial: EditableFields }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>(initial);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function save() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/partner/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'Failed to update profile.');
      } else {
        trackEvent('Partner Profile Updated', {});
        setSuccess(true);
        setEditing(false);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof EditableFields; label: string; placeholder: string }[] = [
    { key: 'phone', label: 'Phone', placeholder: 'Enter phone number' },
    { key: 'city', label: 'City', placeholder: 'Mumbai' },
    { key: 'state', label: 'State', placeholder: 'Maharashtra' },
    { key: 'pincode', label: 'Pincode', placeholder: '400001' },
    { key: 'address_line1', label: 'Address Line 1', placeholder: 'Building, Street' },
    { key: 'address_line2', label: 'Address Line 2', placeholder: 'Area, Landmark' },
  ];

  if (!editing) {
    return (
      <div className="flex justify-end gap-2 items-center">
        {success && <span className="text-xs text-emerald-600 font-semibold">Profile updated!</span>}
        <button
          onClick={() => setEditing(true)}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
        >
          Edit Profile
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-slate-900">Edit Profile</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map(f => (
          <div key={f.key}>
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 block mb-1">{f.label}</label>
            <input
              type="text"
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-rose-600">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          onClick={save}
          disabled={loading}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Saving…' : 'Save Changes'}
        </button>
        <button
          onClick={() => { setEditing(false); setForm(initial); setError(''); }}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function MessageRMSection({ rmProfileId }: { rmProfileId: string | null }) {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);

  async function send() {
    if (!message.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/partner/profile/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      setResult(res.ok ? 'success' : 'error');
      if (res.ok) { trackEvent('Partner Messaged RM', {}); setMessage(''); }
    } catch {
      setResult('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-900">Message My RM</h2>
      {!rmProfileId ? (
        <p className="text-sm text-slate-400">No Relationship Manager assigned yet.</p>
      ) : (
        <div className="space-y-3">
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Write your message to your Relationship Manager…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-none"
          />
          {result === 'success' && <p className="text-xs text-emerald-600 font-semibold">Message sent to your RM!</p>}
          {result === 'error' && <p className="text-xs text-rose-600">Failed to send message. Please try again.</p>}
          <button
            onClick={send}
            disabled={loading || !message.trim()}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send Message'}
          </button>
        </div>
      )}
    </div>
  );
}
