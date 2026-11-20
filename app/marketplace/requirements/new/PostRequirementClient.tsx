'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, ChevronRight, ChevronLeft, ClipboardList, Tag, MapPin, Calendar } from 'lucide-react';

const STEPS = [
  { label: 'Company Info', icon: ClipboardList },
  { label: 'Requirement Details', icon: Tag },
  { label: 'Timeline & Budget', icon: Calendar },
  { label: 'Review & Submit', icon: CheckCircle2 },
];

const COMPANY_TYPES = ['PIBO', 'Brand Owner', 'Importer', 'Recycler', 'PRO', 'Manufacturer', 'Other'];
const WASTE_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Other'];
const REQ_TYPES = [
  'EPR Credits',
  'Recycling Service',
  'PRO Partnership',
  'EPR Consultancy',
  'Collection Partner',
  'Technology Provider',
  'Other',
];
const ENGAGEMENT_TYPES = ['One-time', 'Monthly', 'Annual', 'Ongoing'];
const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Chandigarh', 'Other',
];

type FormData = {
  company_type: string;
  waste_category: string;
  requirement_type: string;
  quantity_kg: string;
  quantity_label: string;
  location_state: string;
  location_city: string;
  description: string;
  requirement_deadline: string;
  budget_range: string;
  engagement_type: string;
};

const INITIAL: FormData = {
  company_type: '',
  waste_category: '',
  requirement_type: '',
  quantity_kg: '',
  quantity_label: '',
  location_state: '',
  location_city: '',
  description: '',
  requirement_deadline: '',
  budget_range: '',
  engagement_type: 'One-time',
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-gray-700 mb-1">{children}</label>;
}

function selectCls() {
  return 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600';
}
function inputCls() {
  return 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600';
}

export default function PostRequirementClient({
  role,
  userId,
  companyName,
}: {
  role: string;
  userId: string;
  companyName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.company_type) return 'Please select your company type.';
      if (!form.waste_category) return 'Please select the waste category.';
    }
    if (step === 1) {
      if (!form.requirement_type) return 'Please select the requirement type.';
      if (!form.description.trim()) return 'Please describe your requirement.';
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setError(null);
    setStep((s) => s - 1);
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const payload: any = {
        posted_by: userId,
        company_name: companyName,
        poster_role: role,
        company_type: form.company_type,
        waste_category: form.waste_category,
        requirement_type: form.requirement_type,
        description: form.description.trim(),
        engagement_type: form.engagement_type || 'One-time',
      };
      if (form.quantity_kg) payload.quantity_kg = Number(form.quantity_kg);
      if (form.quantity_label.trim()) payload.quantity_label = form.quantity_label.trim();
      if (form.location_state) payload.location_state = form.location_state;
      if (form.location_city.trim()) payload.location_city = form.location_city.trim();
      if (form.requirement_deadline) payload.requirement_deadline = form.requirement_deadline;
      if (form.budget_range.trim()) payload.budget_range = form.budget_range.trim();

      const { error: insertErr } = await (supabase as any)
        .from('requirements_board')
        .insert(payload);

      if (insertErr) throw insertErr;
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Could not submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center">
        <div className="max-w-md w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 size={48} className="mx-auto text-green-600" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Requirement Posted!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your requirement is now live on the board. Other companies can see and express interest.
            Contact details are never shared.
          </p>
          <button
            onClick={() => router.push('/marketplace/requirements')}
            className="mt-6 w-full rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            View Requirements Board
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-4">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Post a Requirement</h1>
        <p className="mt-1 text-sm text-gray-600">
          Let other companies know what you need. Your contact details will never be shown.
        </p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <div key={s.label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-colors ${
                    done
                      ? 'border-green-600 bg-green-600 text-white'
                      : active
                      ? 'border-green-600 bg-white text-green-700'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {done ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span className={`hidden text-[10px] font-medium sm:block ${active ? 'text-green-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-green-600' : 'bg-gray-200'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Step 1 — Company Information</h2>
            <div>
              <FieldLabel>Company Type *</FieldLabel>
              <select value={form.company_type} onChange={(e) => set('company_type', e.target.value)} className={selectCls()}>
                <option value="">Select company type</option>
                {COMPANY_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Waste Category *</FieldLabel>
              <select value={form.waste_category} onChange={(e) => set('waste_category', e.target.value)} className={selectCls()}>
                <option value="">Select waste category</option>
                {WASTE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <p className="rounded-md bg-amber-50 p-3 text-xs text-amber-800">
              Your company name and contact details are stored securely but will <strong>never be displayed</strong> to other users.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Step 2 — Requirement Details</h2>
            <div>
              <FieldLabel>Requirement Type *</FieldLabel>
              <select value={form.requirement_type} onChange={(e) => set('requirement_type', e.target.value)} className={selectCls()}>
                <option value="">Select requirement type</option>
                {REQ_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel>Description *</FieldLabel>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={4}
                placeholder="Describe what you need — e.g. looking for a PRO to handle 50 MT/month of plastic waste in Maharashtra..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Quantity (KG)</FieldLabel>
                <input
                  type="number"
                  min="0"
                  value={form.quantity_kg}
                  onChange={(e) => set('quantity_kg', e.target.value)}
                  placeholder="e.g. 50000"
                  className={inputCls()}
                />
              </div>
              <div>
                <FieldLabel>Quantity Label</FieldLabel>
                <input
                  type="text"
                  value={form.quantity_label}
                  onChange={(e) => set('quantity_label', e.target.value)}
                  placeholder="e.g. ~50 MT/month"
                  className={inputCls()}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>State</FieldLabel>
                <select value={form.location_state} onChange={(e) => set('location_state', e.target.value)} className={selectCls()}>
                  <option value="">Select state</option>
                  {INDIA_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>City</FieldLabel>
                <input
                  type="text"
                  value={form.location_city}
                  onChange={(e) => set('location_city', e.target.value)}
                  placeholder="e.g. Mumbai"
                  className={inputCls()}
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Step 3 — Timeline & Budget</h2>
            <div>
              <FieldLabel>Needed By (Date)</FieldLabel>
              <input
                type="date"
                value={form.requirement_deadline}
                onChange={(e) => set('requirement_deadline', e.target.value)}
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel>Budget Range</FieldLabel>
              <input
                type="text"
                value={form.budget_range}
                onChange={(e) => set('budget_range', e.target.value)}
                placeholder="e.g. ₹10L–₹25L or Open to quotes"
                className={inputCls()}
              />
            </div>
            <div>
              <FieldLabel>Engagement Type</FieldLabel>
              <select value={form.engagement_type} onChange={(e) => set('engagement_type', e.target.value)} className={selectCls()}>
                {ENGAGEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900">Step 4 — Review & Submit</h2>
            <dl className="divide-y divide-gray-100 rounded-lg border border-gray-200">
              {[
                ['Company Type', form.company_type],
                ['Waste Category', form.waste_category],
                ['Requirement Type', form.requirement_type],
                ['Quantity', form.quantity_label || (form.quantity_kg ? `${form.quantity_kg} KG` : '—')],
                ['Location', [form.location_city, form.location_state].filter(Boolean).join(', ') || '—'],
                ['Needed By', form.requirement_deadline || '—'],
                ['Budget', form.budget_range || '—'],
                ['Engagement', form.engagement_type],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-4 px-4 py-2.5">
                  <dt className="w-36 shrink-0 text-xs font-medium text-gray-500">{k}</dt>
                  <dd className="text-sm text-gray-900">{v}</dd>
                </div>
              ))}
              <div className="px-4 py-2.5">
                <dt className="mb-1 text-xs font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{form.description}</dd>
              </div>
            </dl>
            <p className="rounded-md bg-blue-50 p-3 text-xs text-blue-800">
              By submitting, you confirm that you are authorised to post this requirement on behalf of your organisation.
              Your contact details will <strong>not</strong> be shown to any other user.
            </p>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        {step > 0 ? (
          <button
            onClick={back}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft size={15} /> Back
          </button>
        ) : (
          <div />
        )}
        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            className="inline-flex items-center gap-1 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1 rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Requirement'}
          </button>
        )}
      </div>
    </main>
  );
}
