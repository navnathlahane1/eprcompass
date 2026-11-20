'use client';

import { useState } from 'react';
import { submitToGoogleScript } from '@/lib/googleScript';
import { INDIA_STATES_UTS, COUNTRIES } from '@/lib/indiaGeo';

const initialState = {
  name: '',
  email: '',
  phone: '',
  company: '',
  city: '',
  country: 'India',
  state: '',
  partnerType: '',
  experience: '',
  message: '',
};

function validate(f) {
  const errors = {};
  if (!f.name.trim()) errors.name = 'Name is required';
  if (!f.email.trim()) errors.email = 'Email is required';
  else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) errors.email = 'Invalid email';
  if (!f.phone.trim()) errors.phone = 'Phone is required';
  else if (!/^\+?[0-9\s()-]{10,15}$/.test(f.phone.trim())) errors.phone = 'Enter a valid phone number (10–15 characters)';
  if (!f.company.trim()) errors.company = 'Company name is required';
  if (!f.partnerType) errors.partnerType = 'Please select a partner type';
  return errors;
}

export default function PartnerApplicationForm() {
  const [fields, setFields] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const set = (key, value) => setFields((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const v = validate(fields);
    setErrors(v);
    if (Object.keys(v).length) return;

    setStatus('submitting');
    try {
      await submitToGoogleScript({
        type: 'contact_form',
        formType: 'partner_application',
        intent: 'partner',
        subject: 'Partnership application',
        ...fields,
        submittedAt: new Date().toISOString(),
      });
      setStatus('success');
      setFields(initialState);
    } catch (error) {
      setErrors({ submit: error?.message || 'Unable to submit your application. Please try again.' });
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center dark:border-emerald-800 dark:bg-emerald-950">
        <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200">Application Submitted!</p>
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-300">
          Our partner team will review your application and get back to you within 2 business days.
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
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Partnership application" aria-busy={status === 'submitting'}>
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
          Company / Firm Name *
          <input value={fields.company} onChange={(e) => set('company', e.target.value)} className={inputClass('company')} />
          {errors.company && <p className="mt-1 text-xs text-red-600">{errors.company}</p>}
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
        Partner Type *
        <select value={fields.partnerType} onChange={(e) => set('partnerType', e.target.value)} className={inputClass('partnerType')}>
          <option value="">Select type…</option>
          <option value="CA/CS Firm">CA / CS Firm</option>
          <option value="Environmental Consultant">Environmental Consultant</option>
          <option value="Legal / Compliance Firm">Legal / Compliance Firm</option>
          <option value="PRO / Waste Management Company">PRO / Waste Management Company</option>
          <option value="Industry Association">Industry Association</option>
          <option value="Individual Consultant">Individual Consultant</option>
          <option value="Other">Other</option>
          <option value="Recycler / Aggregator">Recycler / Aggregator</option>
          <option value="Waste Processor">Waste Processor</option>
          <option value="Credit Provider">Credit Provider</option>
          <option value="Technology Partner">Technology Partner</option>
          <option value="Logistics Partner">Logistics Partner</option>
        </select>
        {errors.partnerType && <p className="mt-1 text-xs text-red-600">{errors.partnerType}</p>}
      </label>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Relevant Experience
        <input value={fields.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 5 years in EPR compliance consulting" className={inputClass('experience')} />
      </label>

      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Message (optional)
        <textarea rows={3} value={fields.message} onChange={(e) => set('message', e.target.value)} className={inputClass('message')} />
      </label>

      {status === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {errors.submit} Please use our contact page for support.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full rounded-xl bg-eco-green-4 py-3 font-semibold text-white transition hover:bg-eco-green-3 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {status === 'submitting' ? 'Submitting…' : 'Apply Now'}
      </button>
    </form>
  );
}


