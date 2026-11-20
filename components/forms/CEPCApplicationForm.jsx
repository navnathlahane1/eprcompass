'use client';

import { useState } from 'react';
import { submitToGoogleScript } from '@/lib/googleScript';
import { INDIA_STATES_UTS, COUNTRIES } from '@/lib/indiaGeo';

const initialState = {
  name: '',
  email: '',
  phone: '',
  city: '',
  country: 'India',
  state: '',
  qualification: '',
  experience: '',
  wasteCategories: [],
  message: '',
};

function validate(f) {
  const errors = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  if (!f.email.trim()) errors.email = 'Email is required';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) errors.email = 'Invalid email';
  if (!f.phone.trim()) errors.phone = 'Phone is required';
  else if (!/^\d{7,15}$/.test(f.phone.replace(/\D/g, ''))) errors.phone = 'Invalid phone';
  if (!f.qualification.trim()) errors.qualification = 'Qualification is required';
  return errors;
}

const WASTE_OPTIONS = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];

export default function CEPCApplicationForm({ moduleKey = 'cepc_application', audienceSegment = '' }) {
  const [fields, setFields] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const set = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  function toggleCategory(cat) {
    setFields((prev) => ({
      ...prev,
      wasteCategories: prev.wasteCategories.includes(cat)
        ? prev.wasteCategories.filter((c) => c !== cat)
        : [...prev.wasteCategories, cat],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(fields);
    setErrors(v);
    if (Object.keys(v).length) return;

    setStatus('submitting');
    try {
      await submitToGoogleScript({
        type: moduleKey,
        ...(audienceSegment && { audience_segment: audienceSegment }),
        ...fields,
        wasteCategories: fields.wasteCategories.join(', '),
        submittedAt: Date.now(),
      });
      setStatus('success');
      setFields(initialState);
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Application Received!</p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Our CEPC team will review your application and contact you within 3 business days about the certification process.
        </p>
        <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-medium text-emerald-700 underline dark:text-emerald-300">
          Submit another
        </button>
      </div>
    );
  }

  const inputClass = (key) =>
    `mt-1 w-full rounded-xl border bg-white px-4 py-2.5 text-sm transition focus:outline-none focus:ring-2 dark:bg-gray-900 dark:text-white ${
      errors[key] ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-eco-green-4 dark:border-gray-700'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — not shown to real users */}
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Full Name *
          <input value={fields.name} onChange={(e) => set('name', e.target.value)} className={inputClass('name')} />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Email *
          <input type="email" value={fields.email} onChange={(e) => set('email', e.target.value)} className={inputClass('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Phone *
          <input type="tel" value={fields.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass('phone')} />
          {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Qualification *
          <input value={fields.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="e.g. M.Sc Environment, B.Tech Chemical" className={inputClass('qualification')} />
          {errors.qualification && <p className="mt-1 text-xs text-red-600">{errors.qualification}</p>}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          City
          <input value={fields.city} onChange={(e) => set('city', e.target.value)} className={inputClass('city')} />
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Country
          <select value={fields.country} onChange={(e) => { set('country', e.target.value); set('state', ''); }} className={inputClass('country')}>
            {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          State
          {fields.country === 'India' ? (
            <select value={fields.state} onChange={(e) => set('state', e.target.value)} className={inputClass('state')}>
              <option value="">Select State / UT</option>
              {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          ) : (
            <input value={fields.state} onChange={(e) => set('state', e.target.value)} placeholder="State / Province" className={inputClass('state')} />
          )}
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Years of Relevant Experience
        <input value={fields.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 3 years in waste management" className={inputClass('experience')} />
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Waste Categories of Interest
        </legend>
        <div className="flex flex-wrap gap-2">
          {WASTE_OPTIONS.map((cat) => {
            const active = fields.wasteCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'border-eco-green-4 bg-eco-green-4 text-white'
                    : 'border-gray-300 text-gray-600 hover:border-eco-green-4 dark:border-gray-600 dark:text-gray-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Message (optional)
        <textarea rows={3} value={fields.message} onChange={(e) => set('message', e.target.value)} className={inputClass('message')} />
      </label>

      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Something went wrong. Please try again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-xl bg-eco-green-4 py-3 font-semibold text-white transition hover:bg-eco-green-3 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {status === 'submitting' ? 'Submitting…' : 'Apply for CEPC Certification'}
      </button>
    </form>
  );
}
