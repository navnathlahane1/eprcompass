'use client';

import { useState } from 'react';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const STEPS = [
  'Basic Info',
  'Partner Type & Tier',
  'Authorised Programs',
  'Revenue Share',
  'T3 Schedule',
  'Review & Generate',
] as const;

const PROGRAMS = [
  { id: 't1', label: 'Tier 1 — EPR Awareness Bootcamp', price: '₹999', duration: '2-day webinar' },
  { id: 't2', label: 'Tier 2 — Certified EPR Consultant (CEPC)', price: '₹5,000', duration: '3-month program' },
  { id: 't3', label: 'Tier 3 — EPR Agency Launch Program (EALP)', price: '₹50,000', duration: '6-month program', note: 'Silver+ only' },
];

export default function CreatePartnerPage() {
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', city: '', linkedin: '',
    type: 'Type B', tier: 'Bronze',
    programs: ['t1'],
    referralShare: 20, deliveryShare: 40, corporateShare: 20,
    t3Needed: true, t3Day1: '', t3Day2: '', t3Day3: '', t3Trainer: 'EPR Compass Trainer',
    notes: '',
  });

  function Field({ label, name, type = 'text', placeholder = '' }: { label: string; name: string; type?: string; placeholder?: string }) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <input
          type={type}
          value={(form as any)[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
    );
  }

  const canPrev = step > 1;
  const canNext = step < 6;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Onboard New Partner</h1>
        <p className="mt-0.5 text-sm text-slate-500">Create a partner profile, configure revenue share, and schedule T3 certification.</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const n = (i + 1) as Step;
          const active = step === n;
          const done = step > n;
          return (
            <div key={s} className="flex items-center flex-1 min-w-0">
              <button onClick={() => done && setStep(n)} disabled={!done}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition
                  ${active ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-400 cursor-pointer' : 'bg-slate-800 text-slate-600'}`}>
                {done ? '✓' : n}
              </button>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 ${done ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />}
            </div>
          );
        })}
      </div>
      <p className="text-xs font-semibold text-indigo-300">{STEPS[step - 1]}</p>

      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-5">
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">Basic Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full Name / Organisation Name" name="name" placeholder="e.g. Gautam Sharma" />
              <Field label="Email Address" name="email" type="email" placeholder="gautam@example.com" />
              <Field label="Phone Number" name="phone" placeholder="+91-XXXXX-XXXXX" />
              <Field label="City" name="city" placeholder="Mumbai" />
              <Field label="LinkedIn Profile URL" name="linkedin" placeholder="linkedin.com/in/..." />
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">Partner Type & Tier</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-2">Partner Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { val: 'Type A', label: 'Type A', desc: 'Training Institute / College — delivers full programs' },
                    { val: 'Type B', label: 'Type B', desc: 'Individual Trainer & Consultant — delivers + refers' },
                    { val: 'Type C', label: 'Type C', desc: 'Referral Partner — refers only, no delivery' },
                  ].map(o => (
                    <button key={o.val} onClick={() => setForm(f => ({ ...f, type: o.val, t3Needed: o.val !== 'Type C' }))}
                      className={`rounded-xl border p-3 text-left transition ${form.type === o.val ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
                      <p className="text-xs font-bold text-slate-200">{o.label}</p>
                      <p className="mt-0.5 text-[10px] text-slate-500">{o.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-2">Starting Tier</label>
                <div className="flex gap-2">
                  {['Bronze', 'Silver', 'Gold', 'Platinum'].map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, tier: t }))}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${form.tier === t ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 text-slate-500 hover:border-slate-600'}`}>
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-600">Bronze = Tier 1+2 programs · Silver = Tier 1+2+3 · Gold/Platinum = all + additional benefits</p>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">Authorised Programs</h2>
            <div className="space-y-3">
              {PROGRAMS.map(p => {
                const checked = form.programs.includes(p.id);
                const locked = p.id === 't3' && form.tier === 'Bronze';
                return (
                  <button key={p.id} disabled={locked}
                    onClick={() => setForm(f => ({ ...f, programs: checked ? f.programs.filter(x => x !== p.id) : [...f.programs, p.id] }))}
                    className={`w-full rounded-xl border p-4 text-left transition ${checked && !locked ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700'} ${locked ? 'opacity-40 cursor-not-allowed' : 'hover:border-slate-600'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{p.label}</p>
                        <p className="mt-0.5 text-[10px] text-slate-500">{p.duration} · {p.price}</p>
                        {p.note && <p className="mt-0.5 text-[10px] text-amber-500">{p.note}</p>}
                      </div>
                      <div className={`h-4 w-4 rounded border flex items-center justify-center ${checked && !locked ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                        {checked && !locked && <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">Revenue Share Configuration</h2>
            <p className="text-xs text-slate-500">Configure the revenue share percentages for this partner. These can be adjusted later.</p>
            <div className="space-y-4">
              {[
                { label: 'Referral Rate (%)', name: 'referralShare', desc: 'Learner enrolls via partner\'s referral link', default: 20 },
                { label: 'Self-Delivery Rate (%)', name: 'deliveryShare', desc: 'Partner personally delivers the batch', default: 40, disabled: form.type === 'Type C' },
                { label: 'Corporate Bulk Rate (%)', name: 'corporateShare', desc: 'Corporate group enrollments referred by partner', default: 20 },
              ].map(r => (
                <div key={r.name} className={r.disabled ? 'opacity-40' : ''}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300">{r.label}</label>
                    <span className="text-xs text-indigo-300 font-bold">{(form as any)[r.name]}%</span>
                  </div>
                  <input type="range" min={0} max={60} value={(form as any)[r.name]} disabled={r.disabled}
                    onChange={e => setForm(f => ({ ...f, [r.name]: Number(e.target.value) }))}
                    className="w-full accent-indigo-500" />
                  <p className="text-[10px] text-slate-600 mt-0.5">{r.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300">
              Revenue share calculated on actual fees received, net of refunds. EMI installments: partner share released per installment.
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">T3 Train-the-Trainer Schedule</h2>
            {form.type === 'Type C' ? (
              <div className="rounded-lg border border-slate-700 bg-slate-900/30 p-4 text-xs text-slate-400">
                T3 certification is not required for Type C (Referral) partners. Skip to next step.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">T3 is a 3-day online certification. Schedule 3 consecutive days. Fee: ₹4,999 (waived for first-time partners).</p>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Day 1 — EPR Mastery</label>
                    <input type="date" value={form.t3Day1} onChange={e => setForm(f => ({ ...f, t3Day1: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-600">10:00 AM – 4:00 PM IST · CPCB portal, EPR rules, PRO ecosystem</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Day 2 — Pedagogy & Delivery</label>
                    <input type="date" value={form.t3Day2} onChange={e => setForm(f => ({ ...f, t3Day2: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-600">Adult learning, live CPCB demo, 30-min microlesson delivery</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">Day 3 — Platform & Assessment</label>
                    <input type="date" value={form.t3Day3} onChange={e => setForm(f => ({ ...f, t3Day3: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                    <p className="text-[10px] text-slate-600">LMS orientation, 20-question final test (≥70%), certificate issued same day</p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-400">T3 Trainer</label>
                    <select value={form.t3Trainer} onChange={e => setForm(f => ({ ...f, t3Trainer: e.target.value }))}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option>EPR Compass Trainer</option>
                      <option>Senior Internal Trainer</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {step === 6 && (
          <>
            <h2 className="text-sm font-semibold text-slate-200">Review & Generate Partner Profile</h2>
            <div className="space-y-3">
              {[
                { label: 'Name',           value: form.name || '—' },
                { label: 'Email',          value: form.email || '—' },
                { label: 'Partner Type',   value: form.type },
                { label: 'Tier',           value: form.tier },
                { label: 'Programs',       value: form.programs.map(p => PROGRAMS.find(x => x.id === p)?.id).join(', ') },
                { label: 'Referral Share', value: `${form.referralShare}%` },
                { label: 'Delivery Share', value: `${form.deliveryShare}%` },
                { label: 'T3 Day 1',       value: form.t3Day1 || 'Not scheduled' },
                { label: 'T3 Day 2',       value: form.t3Day2 || 'Not scheduled' },
                { label: 'T3 Day 3',       value: form.t3Day3 || 'Not scheduled' },
              ].map(r => (
                <div key={r.label} className="flex items-center gap-4 text-xs border-b border-slate-800/50 pb-2 last:border-0">
                  <span className="w-36 shrink-0 text-slate-500">{r.label}</span>
                  <span className="text-slate-200">{r.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3 text-xs text-indigo-300">
              On confirm: Partner ID will be auto-generated, LOI document prepared, referral link activated, and onboarding kit sent to {form.email || 'partner email'}.
            </div>
          </>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button onClick={() => setStep(s => (s - 1) as Step)} disabled={!canPrev}
          className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition disabled:opacity-30">
          Back
        </button>
        {canNext ? (
          <button onClick={() => setStep(s => (s + 1) as Step)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
            Continue
          </button>
        ) : (
          <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
            Create Partner & Send Kit
          </button>
        )}
      </div>
    </div>
  );
}
