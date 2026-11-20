'use client';

import { useState } from 'react';
import RazorpayModal from '@/components/academy/RazorpayModal';

const PROGRAMS = [
  { label: 'Tier 1 — EPR Awareness Bootcamp',              price: 4999 },
  { label: 'Tier 2 — Certified EPR Consultant (CEPC)',     price: 14999 },
  { label: 'Tier 3 — EPR Agency Launch Program (EALP)',    price: 29999 },
  { label: 'PWM Rules 2016 & 2022 — Essentials',           price: 1499 },
  { label: 'EPR Portal Navigation & Filing',               price: 999 },
];

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

type Step = 'form' | 'payment' | 'success';

export default function EnrollPage() {
  const [step, setStep]       = useState<Step>('form');
  const [form, setForm]       = useState({
    name: '', email: '', phone: '', org: '', program: PROGRAMS[0].label, promo: '', partner: '',
  });
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [paymentId, setPaymentId] = useState('');

  function set(k: keyof typeof form, v: string) {
    setForm(f => ({ ...f, [k]: v }));
    setErrors(e => ({ ...e, [k]: '' }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim())  e.name  = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.phone.trim()) e.phone = 'Phone is required';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setStep('payment');
  }

  const selectedProgram = PROGRAMS.find(p => p.label === form.program) ?? PROGRAMS[0];

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-[#060910] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Enrolment Confirmed!</h1>
          <p className="text-slate-400 text-sm">
            Thank you, <span className="text-white font-medium">{form.name}</span>. Your payment was successful and
            your seat in <span className="text-indigo-300 font-medium">{form.program}</span> has been confirmed.
          </p>
          <p className="text-xs text-slate-500">Payment ID: {paymentId}</p>
          <p className="text-xs text-slate-500">A confirmation will be sent to <span className="text-slate-400">{form.email}</span>.</p>
          <a href="/academy/dashboard" className="inline-block mt-4 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition">
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060910] text-white flex items-start justify-center p-6 pt-12">
      {step === 'payment' && (
        <RazorpayModal
          programTitle={form.program}
          participantName={form.name}
          participantEmail={form.email}
          participantPhone={form.phone}
          organization={form.org || undefined}
          promoCode={form.promo || undefined}
          partnerCode={form.partner || undefined}
          onSuccess={(pid) => { setPaymentId(pid); setStep('success'); }}
          onFailure={(msg) => alert(`Payment failed: ${msg}`)}
          onClose={() => setStep('form')}
        />
      )}

      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">EPR Compass Academy</p>
          <h1 className="text-2xl font-bold text-white">Programme Enrolment</h1>
          <p className="text-sm text-slate-400 mt-1">Select your programme, fill in your details, and pay securely via Razorpay.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 bg-[#0c1022] border border-slate-800/80 rounded-2xl p-6">
          {/* Programme selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">Programme</label>
            <div className="space-y-2">
              {PROGRAMS.map(p => (
                <label key={p.label}
                  className={`flex items-center justify-between cursor-pointer rounded-xl border px-4 py-3 transition
                    ${form.program === p.label ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="program" value={p.label}
                      checked={form.program === p.label} onChange={() => set('program', p.label)}
                      className="accent-indigo-500"/>
                    <span className="text-sm text-slate-200">{p.label}</span>
                  </div>
                  <span className="text-xs font-semibold text-indigo-300 shrink-0 ml-3">{fmt(p.price)}<span className="text-slate-500"> +GST</span></span>
                </label>
              ))}
            </div>
          </div>

          {/* Learner details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { k: 'name' as const,  label: 'Full Name *',        type: 'text',  ph: 'Rajesh Sharma' },
              { k: 'email' as const, label: 'Email *',            type: 'email', ph: 'you@company.com' },
              { k: 'phone' as const, label: 'Phone *',            type: 'tel',   ph: 'Enter phone number' },
              { k: 'org' as const,   label: 'Organisation',       type: 'text',  ph: 'Optional' },
            ].map(({ k, label, type, ph }) => (
              <div key={k}>
                <label className="block text-xs text-slate-500 mb-1">{label}</label>
                <input type={type} value={form[k]} onChange={e => set(k, e.target.value)}
                  placeholder={ph}
                  className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-200 bg-slate-800/60 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition
                    ${errors[k] ? 'border-rose-500' : 'border-slate-700'}`}/>
                {errors[k] && <p className="mt-1 text-[10px] text-rose-400">{errors[k]}</p>}
              </div>
            ))}
          </div>

          {/* Promo + partner in one row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Promo Code</label>
              <input type="text" value={form.promo} onChange={e => set('promo', e.target.value.toUpperCase())}
                placeholder="LAUNCH25"
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 bg-slate-800/60 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition uppercase"/>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Partner Code</label>
              <input type="text" value={form.partner} onChange={e => set('partner', e.target.value.toUpperCase())}
                placeholder="PARTNER-XXX"
                className="w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 bg-slate-800/60 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500 transition uppercase"/>
            </div>
          </div>

          {/* Price summary */}
          <div className="rounded-xl bg-slate-800/40 border border-slate-700 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Estimated total (incl. 18% GST)</p>
              <p className="text-lg font-bold text-indigo-300 mt-0.5">
                {fmt(selectedProgram.price + Math.round(selectedProgram.price * 0.18))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-600">Secured by</p>
              <p className="text-xs font-semibold text-slate-400">Razorpay</p>
            </div>
          </div>

          <button type="submit"
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-900/30">
            Proceed to Payment →
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-600">
          By enrolling you agree to our <a href="/terms-and-conditions" className="text-slate-400 underline">Terms</a> and{' '}
          <a href="/refund-cancellation-policy" className="text-slate-400 underline">Refund Policy</a>.
        </p>
      </div>
    </div>
  );
}

