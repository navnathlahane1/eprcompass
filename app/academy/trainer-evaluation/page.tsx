'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DOMAIN_OPTIONS = [
  { value: 'e-waste',   label: 'E-Waste' },
  { value: 'plastic',   label: 'Plastic Waste' },
  { value: 'battery',   label: 'Battery Waste' },
  { value: 'tyre',      label: 'Tyre Waste' },
  { value: 'oil',       label: 'Used Oil' },
  { value: 'corporate', label: 'Corporate Sustainability' },
  { value: 'regulatory',label: 'Regulatory / Legal' },
  { value: 'other',     label: 'Other' },
];

const REGULATION_OPTIONS = [
  { value: 'e-waste',  label: 'E-Waste (Management) Rules' },
  { value: 'plastic',  label: 'Plastic Waste Management Rules' },
  { value: 'battery',  label: 'Battery Waste Management Rules' },
  { value: 'tyre',     label: 'Tyre Waste Management Rules' },
  { value: 'oil',      label: 'Used Oil Management Rules' },
];

const DELIVERY_OPTIONS = [
  { value: 'online',      label: 'Online Live' },
  { value: 'classroom',   label: 'Classroom / In-Person' },
  { value: 'hybrid',      label: 'Hybrid' },
  { value: 'self-paced',  label: 'Self-Paced / Recorded' },
];

const TOOLS_OPTIONS = [
  { value: 'slides',      label: 'Slides (PPT / Google Slides)' },
  { value: 'video',       label: 'Pre-recorded Video' },
  { value: 'lms',         label: 'LMS Platform' },
  { value: 'whiteboard',  label: 'Whiteboard / Flipchart' },
  { value: 'simulation',  label: 'Simulations / Case Studies' },
  { value: 'quizzes',     label: 'Quizzes / Assessments' },
];

function CheckGroup({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (v: string) =>
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v]);
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {options.map(o => (
        <label key={o.value} className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm transition-colors ${value.includes(o.value) ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 hover:border-slate-500 text-slate-300'}`}>
          <input type="checkbox" className="hidden" checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
          <span className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center ${value.includes(o.value) ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
            {value.includes(o.value) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8"><path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </span>
          {o.label}
        </label>
      ))}
    </div>
  );
}

function Select({ value, onChange, options, placeholder }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[]; placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export default function TrainerEvaluationPage() {
  const router = useRouter();
  const [step, setStep]       = useState(0);
  const [submitting, setSub]  = useState(false);
  const [submitted, setDone]  = useState(false);
  const [error, setError]     = useState('');

  // Section A
  const [yearsExp, setYearsExp]     = useState('');
  const [domains, setDomains]       = useState<string[]>([]);
  const [qualification, setQual]    = useState('');
  const [organisation, setOrg]      = useState('');

  // Section B
  const [eprLevel, setEprLevel]     = useState('');
  const [regsKnown, setRegsKnown]   = useState<string[]>([]);
  const [deliveredEpr, setDelivEpr] = useState(false);

  // Section C
  const [delivery, setDelivery]     = useState<string[]>([]);
  const [batchSize, setBatchSize]   = useState('');
  const [tools, setTools]           = useState<string[]>([]);

  // Section D
  const [motivation, setMotiv]      = useState('');
  const [hoursPerWeek, setHours]    = useState('');
  const [ownContent, setOwnContent] = useState(false);

  const steps = [
    { title: 'Background', subtitle: 'Tell us about your professional experience' },
    { title: 'EPR Knowledge', subtitle: 'Your familiarity with EPR regulations' },
    { title: 'Training Style', subtitle: 'How you deliver training' },
    { title: 'Expectations', subtitle: 'What you bring and what you expect' },
  ];

  function validateStep() {
    if (step === 0) {
      if (!yearsExp) return 'Select years of experience';
      if (!domains.length) return 'Select at least one domain';
      if (!qualification) return 'Select your qualification';
    }
    if (step === 1) {
      if (!eprLevel) return 'Select your EPR familiarity level';
    }
    if (step === 2) {
      if (!delivery.length) return 'Select at least one delivery mode';
      if (!batchSize) return 'Select average batch size';
    }
    if (step === 3) {
      if (!motivation.trim()) return 'Please describe your motivation';
      if (!hoursPerWeek) return 'Select weekly availability';
    }
    return null;
  }

  function nextStep() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  async function submit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setSub(true);
    try {
      const res = await fetch('/api/academy/trainer-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          years_experience: yearsExp,
          domain_expertise: domains,
          highest_qualification: qualification,
          current_organisation: organisation || null,
          epr_familiarity: eprLevel,
          regulations_known: regsKnown,
          delivered_epr_training: deliveredEpr,
          preferred_delivery: delivery,
          avg_batch_size: batchSize,
          tools_used: tools,
          motivation: motivation.trim(),
          availability_hours_pw: hoursPerWeek,
          has_own_content: ownContent,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || 'Submission failed');
      } else {
        setDone(true);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSub(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Evaluation Submitted</h1>
            <p className="mt-2 text-slate-400">
              Thank you! Your trainer evaluation is under review. You will receive access to the full trainer portal once it has been approved — usually within 1–2 business days.
            </p>
          </div>
          <button
            onClick={() => router.push('/academy/dashboard')}
            className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-medium uppercase tracking-widest text-emerald-500">Trainer Portal</p>
          <h1 className="text-2xl font-bold text-white">Trainer Evaluation Form</h1>
          <p className="text-slate-400 text-sm">Complete this one-time evaluation to unlock your trainer portal</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={i} className="flex-1 flex items-center gap-1">
              <div className={`h-1.5 w-full rounded-full transition-colors ${i <= step ? 'bg-emerald-500' : 'bg-slate-700'}`} />
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Step {step + 1} of {steps.length}</span>
          <span className="text-slate-300 font-medium">{steps[step].title}</span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white">{steps[step].title}</h2>
            <p className="text-sm text-slate-400">{steps[step].subtitle}</p>
          </div>

          {/* Step 0 – Background */}
          {step === 0 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Years of Training Experience *</label>
                <Select value={yearsExp} onChange={setYearsExp} placeholder="Select range" options={[
                  { value: '0-1',  label: 'Less than 1 year' },
                  { value: '1-3',  label: '1 – 3 years' },
                  { value: '3-5',  label: '3 – 5 years' },
                  { value: '5-10', label: '5 – 10 years' },
                  { value: '10+',  label: '10+ years' },
                ]} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Domain Expertise * <span className="text-slate-500 font-normal">(select all that apply)</span></label>
                <CheckGroup options={DOMAIN_OPTIONS} value={domains} onChange={setDomains} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Highest Qualification *</label>
                <Select value={qualification} onChange={setQual} placeholder="Select qualification" options={[
                  { value: 'diploma',     label: 'Diploma' },
                  { value: 'bachelors',   label: "Bachelor's Degree" },
                  { value: 'masters',     label: "Master's Degree" },
                  { value: 'phd',         label: 'PhD / Doctorate' },
                  { value: 'professional',label: 'Professional Certification' },
                  { value: 'other',       label: 'Other' },
                ]} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Current Organisation <span className="text-slate-500 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={organisation}
                  onChange={e => setOrg(e.target.value)}
                  placeholder="Company / Institution name"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Step 1 – EPR Knowledge */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">EPR Familiarity Level *</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[
                    { value: 'none',         label: 'None',         desc: 'New to EPR' },
                    { value: 'basic',        label: 'Basic',        desc: 'General awareness' },
                    { value: 'intermediate', label: 'Intermediate', desc: 'Working knowledge' },
                    { value: 'expert',       label: 'Expert',       desc: 'In-depth expertise' },
                  ].map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => setEprLevel(o.value)}
                      className={`rounded-lg border p-3 text-left transition-colors ${eprLevel === o.value ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`}
                    >
                      <div className="text-sm font-medium text-white">{o.label}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{o.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Regulations You Are Familiar With <span className="text-slate-500 font-normal">(select all that apply)</span></label>
                <CheckGroup options={REGULATION_OPTIONS} value={regsKnown} onChange={setRegsKnown} />
              </div>
              <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${deliveredEpr ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                <input type="checkbox" className="mt-0.5" checked={deliveredEpr} onChange={e => setDelivEpr(e.target.checked)} />
                <div>
                  <div className="text-sm font-medium text-white">I have previously delivered EPR training</div>
                  <div className="text-xs text-slate-400">Check if you have facilitated at least one session on EPR topics</div>
                </div>
              </label>
            </div>
          )}

          {/* Step 2 – Training Style */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Preferred Delivery Mode * <span className="text-slate-500 font-normal">(select all that apply)</span></label>
                <CheckGroup options={DELIVERY_OPTIONS} value={delivery} onChange={setDelivery} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Average Batch Size *</label>
                <Select value={batchSize} onChange={setBatchSize} placeholder="Select range" options={[
                  { value: '1-10',  label: '1 – 10 participants' },
                  { value: '11-30', label: '11 – 30 participants' },
                  { value: '31-60', label: '31 – 60 participants' },
                  { value: '60+',   label: '60+ participants' },
                ]} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Training Tools & Methods <span className="text-slate-500 font-normal">(select all that apply)</span></label>
                <CheckGroup options={TOOLS_OPTIONS} value={tools} onChange={setTools} />
              </div>
            </div>
          )}

          {/* Step 3 – Expectations */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Why do you want to train with us? *</label>
                <textarea
                  value={motivation}
                  onChange={e => setMotiv(e.target.value.slice(0, 500))}
                  rows={4}
                  placeholder="Describe your motivation, goals, and what you hope to contribute..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-slate-500 text-right">{motivation.length}/500</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm text-slate-300 font-medium">Weekly Availability *</label>
                <Select value={hoursPerWeek} onChange={setHours} placeholder="Select range" options={[
                  { value: '1-5',   label: '1 – 5 hours/week' },
                  { value: '6-10',  label: '6 – 10 hours/week' },
                  { value: '11-20', label: '11 – 20 hours/week' },
                  { value: '20+',   label: '20+ hours/week' },
                ]} />
              </div>
              <label className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${ownContent ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-500'}`}>
                <input type="checkbox" className="mt-0.5" checked={ownContent} onChange={e => setOwnContent(e.target.checked)} />
                <div>
                  <div className="text-sm font-medium text-white">I have my own training content / materials</div>
                  <div className="text-xs text-slate-400">Slide decks, workbooks, videos, or other learning materials you created</div>
                </div>
              </label>
            </div>
          )}

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => { setError(''); setStep(s => s - 1); }}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-slate-500 transition-colors"
              >
                Back
              </button>
            ) : <div />}

            {step < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-2 text-sm font-medium text-white transition-colors"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-6 py-2 text-sm font-medium text-white transition-colors"
              >
                {submitting ? 'Submitting…' : 'Submit Evaluation'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
