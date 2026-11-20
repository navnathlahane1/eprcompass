'use client';

import { useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';

interface AddCompanyModalProps {
  onClose: () => void;
  onSaved: () => void;
}

const INDIAN_STATES = INDIA_STATES_UTS;

const INDUSTRIES = [
  'Plastic Manufacturing', 'Electronics / E-Waste', 'Battery Manufacturing', 'Tyre Manufacturing',
  'Pharmaceutical', 'FMCG / Packaging', 'Automobile', 'Recycling / Waste Management',
  'Import / Export', 'Retail / Distribution', 'Other',
];

const EMPTY_FORM = {
  company_name: '',
  contact_name: '',
  phone: '',
  email: '',
  state: '',
  city: '',
  industry: '',
  gst_number: '',
  website: '',
  notes: '',
};

export default function AddCompanyModal({ onClose, onSaved }: AddCompanyModalProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  function set(field: keyof typeof EMPTY_FORM) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company_name.trim()) { setError('Company name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/telecalling/companies/add', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to add company');
      }
      setDone(true);
      setTimeout(() => { onSaved(); }, 1200);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700/60 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Add New Company</h2>
            <p className="text-xs text-slate-500 mt-0.5">Saved lead + instantly queued for Intel enrichment</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>

        {done ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">✓</div>
            <p className="text-teal-400 font-medium">Company added &amp; sent to Intel</p>
            <p className="text-sm text-slate-500 mt-1">Enrichment is running in the background.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Company Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.company_name}
                onChange={set('company_name')}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                placeholder="e.g. Acme Plastics Pvt Ltd"
                autoFocus
              />
            </div>

            {/* Contact + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contact Person</label>
                <input
                  type="text"
                  value={form.contact_name}
                  onChange={set('contact_name')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>
            </div>

            {/* Email + Website */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  placeholder="contact@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Website</label>
                <input
                  type="text"
                  value={form.website}
                  onChange={set('website')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  placeholder="www.company.com"
                />
              </div>
            </div>

            {/* State + City */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State</label>
                <select
                  value={form.state}
                  onChange={set('state')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={set('city')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  placeholder="City"
                />
              </div>
            </div>

            {/* Industry + GST */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Industry</label>
                <select
                  value={form.industry}
                  onChange={set('industry')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 focus:outline-none focus:border-teal-500"
                >
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">GST Number</label>
                <input
                  type="text"
                  value={form.gst_number}
                  onChange={set('gst_number')}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500 font-mono tracking-wide"
                  placeholder="27AAPFU0939F1ZV"
                  maxLength={15}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={set('notes')}
                className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-800/60 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-teal-500"
                placeholder="Anything notable from the call or conversation…"
              />
            </div>

            {/* Intel notice */}
            <div className="flex items-start gap-2 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-2 text-xs text-teal-300">
              <span className="mt-0.5">⚡</span>
              <span>This company will be immediately added to Intel and queued for AI enrichment — segment, EPR applicability score, compliance category, and sales pitch.</span>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 border border-slate-700 text-slate-300 rounded-lg py-2 text-sm font-medium hover:bg-slate-800/40"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-teal-500/20 border border-teal-500/40 text-teal-200 rounded-lg py-2 text-sm font-semibold hover:bg-teal-500/30 disabled:opacity-40 transition-colors"
              >
                {saving ? 'Adding…' : 'Add Company + Enrich'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
