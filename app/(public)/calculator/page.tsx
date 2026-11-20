'use client';

import { useMemo, useState } from 'react';

// OBLIGATION_RATES: update these constants to change calculator logic.
const OBLIGATION_RATES = {
  plastic: {
    rigid: { fy2425: 0.5, fy2526: 0.6 },
    flexible: { fy2425: 0.3, fy2526: 0.45 },
    multilayer: { fy2425: 0.2, fy2526: 0.3 }
  },
  ewaste: { default: 0.6 },
  battery: { default: 0.7 },
  tyre: { default: 0.6 }
} as const;

const CATEGORY_OPTIONS = [
  { key: 'plastic', label: 'Plastic Packaging' },
  { key: 'ewaste', label: 'E-Waste (EEE)' },
  { key: 'battery', label: 'Battery Waste' },
  { key: 'tyre', label: 'Tyre Waste' },
  { key: 'oil', label: 'Oil Waste' }
] as const;

const PLASTIC_SUBCATEGORIES = [
  { key: 'rigid', label: 'Rigid' },
  { key: 'flexible', label: 'Flexible' },
  { key: 'multilayer', label: 'Multi-layer' },
  { key: 'compostable', label: 'Compostable' }
] as const;

const EEE_OPTIONS = ['IT', 'Telecom', 'Large', 'Small', 'Lighting', 'Electrical tools'];
const UNITS = ['MT', 'KG', 'Tonnes'] as const;
const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Delhi'
];

type CategoryKey = (typeof CATEGORY_OPTIONS)[number]['key'];
type Unit = (typeof UNITS)[number];

type CategoryInput = {
  qty: string;
  unit: Unit;
  plasticSubcategories: string[];
  eeeCategory: string;
};

const EMPTY_CATEGORY_INPUT: CategoryInput = {
  qty: '',
  unit: 'MT',
  plasticSubcategories: [],
  eeeCategory: ''
};

const COMPANY_TYPES = [
  { key: 'Producer/Manufacturer', icon: 'circle' },
  { key: 'Importer', icon: 'square' },
  { key: 'Brand Owner', icon: 'triangle' },
  { key: 'Retailer/E-commerce', icon: 'diamond' }
] as const;

function toMt(qty: number, unit: Unit) {
  if (unit === 'KG') return qty / 1000;
  return qty;
}

function inr(n: number) {
  return n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

function getRiskLevel(totalQtyMt: number, categoryCount: number) {
  if (totalQtyMt > 1000 || categoryCount >= 4) return { label: 'High Risk', cls: 'bg-red-100 text-red-700' };
  if (totalQtyMt > 300 || categoryCount >= 2) return { label: 'Medium Risk', cls: 'bg-amber-100 text-amber-700' };
  return { label: 'Low Risk', cls: 'bg-emerald-100 text-emerald-700' };
}

function ShapeIcon({ type }: { type: 'circle' | 'square' | 'triangle' | 'diamond' }) {
  if (type === 'circle') return <span className="h-10 w-10 rounded-full bg-teal-500" />;
  if (type === 'square') return <span className="h-10 w-10 rounded-md bg-blue-500" />;
  if (type === 'diamond') return <span className="h-10 w-10 rotate-45 rounded-sm bg-purple-500" />;
  return (
    <span
      className="h-0 w-0 border-l-[20px] border-r-[20px] border-b-[34px] border-l-transparent border-r-transparent border-b-orange-500"
      aria-hidden
    />
  );
}

export default function CalculatorPage() {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [companyType, setCompanyType] = useState('');
  const [categories, setCategories] = useState<Record<CategoryKey, CategoryInput>>({
    plastic: { ...EMPTY_CATEGORY_INPUT },
    ewaste: { ...EMPTY_CATEGORY_INPUT },
    battery: { ...EMPTY_CATEGORY_INPUT },
    tyre: { ...EMPTY_CATEGORY_INPUT },
    oil: { ...EMPTY_CATEGORY_INPUT }
  });
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([]);
  const [contact, setContact] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    gstin: '',
    state: '',
    waOptIn: false
  });

  const result = useMemo(() => {
    const perCategory = selectedCategories.map((category) => {
      const row = categories[category];
      const qty = Number(row.qty || 0);
      const qtyMt = toMt(qty, row.unit);

      let rate = 0;
      if (category === 'plastic') {
        const selectedSub = row.plasticSubcategories.length ? row.plasticSubcategories : ['rigid'];
        const rateValues = selectedSub.map((sub) => {
          if (sub === 'rigid') return OBLIGATION_RATES.plastic.rigid.fy2526;
          if (sub === 'flexible') return OBLIGATION_RATES.plastic.flexible.fy2526;
          if (sub === 'multilayer') return OBLIGATION_RATES.plastic.multilayer.fy2526;
          return OBLIGATION_RATES.plastic.flexible.fy2526;
        });
        rate = rateValues.reduce((a, b) => a + b, 0) / rateValues.length;
      } else if (category === 'ewaste') {
        rate = OBLIGATION_RATES.ewaste.default;
      } else if (category === 'battery') {
        rate = OBLIGATION_RATES.battery.default;
      } else if (category === 'tyre') {
        rate = OBLIGATION_RATES.tyre.default;
      } else {
        rate = 0.6;
      }

      const obligationMt = qtyMt * rate;
      const creditsRequired = obligationMt;
      const estimatedCost = obligationMt * 4500;
      const penalty = obligationMt * 10000;

      return {
        category,
        qtyMt,
        rate,
        obligationMt,
        creditsRequired,
        estimatedCost,
        penalty
      };
    });

    const totalQtyMt = perCategory.reduce((sum, row) => sum + row.qtyMt, 0);
    const totalCost = perCategory.reduce((sum, row) => sum + row.estimatedCost, 0);
    const totalPenalty = perCategory.reduce((sum, row) => sum + row.penalty, 0);
    const potentialSaving = totalPenalty - totalCost;
    const risk = getRiskLevel(totalQtyMt, selectedCategories.length);

    return { perCategory, totalQtyMt, totalCost, totalPenalty, potentialSaving, risk };
  }, [categories, selectedCategories]);

  function toggleCategory(category: CategoryKey) {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((x) => x !== category) : [...prev, category]
    );
  }

  function togglePlasticSubcategory(sub: string) {
    setCategories((prev) => {
      const current = prev.plastic.plasticSubcategories;
      const next = current.includes(sub) ? current.filter((x) => x !== sub) : [...current, sub];
      return {
        ...prev,
        plastic: { ...prev.plastic, plasticSubcategories: next }
      };
    });
  }

  async function submitLead() {
    setSubmitting(true);
    try {
      const response = await fetch('/api/public/calculator-submit', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          companyType,
          selectedCategories,
          categories,
          totals: {
            annual_qty_mt: result.totalQtyMt,
            obligation_mt: result.perCategory.reduce((sum, r) => sum + r.obligationMt, 0),
            credits_required: result.perCategory.reduce((sum, r) => sum + r.creditsRequired, 0),
            estimated_cost_inr: result.totalCost
          },
          contact,
          source_url: typeof window !== 'undefined' ? window.location.href : ''
        })
      });

      const data = await response.json();
      if (!response.ok || !data?.success) {
        alert(data?.error || 'Submission failed');
        return;
      }

      setSubmissionId(String(data.submission_id));
      setStep(5);
    } finally {
      setSubmitting(false);
    }
  }

  const progressWidth = `${((Math.min(step, 4) - 1) / 3) * 100}%`;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="no-print mb-4">
          <h1 className="text-2xl font-bold">EPR Obligation Calculator</h1>
          <p className="mt-1 text-sm text-slate-600">Estimate your obligations, costs, and compliance risk in minutes.</p>
          {step <= 4 ? (
            <div className="mt-4">
              <div className="h-2 w-full rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-teal-500 transition-all" style={{ width: progressWidth }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">Step {step} of 4</p>
            </div>
          ) : null}
        </div>

        {step === 1 ? (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Step 1: Company Type</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {COMPANY_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => {
                    setCompanyType(type.key);
                    setStep(2);
                  }}
                  className="flex min-h-11 items-center gap-4 rounded-xl border border-slate-200 p-4 text-left hover:border-teal-400"
                >
                  <ShapeIcon type={type.icon} />
                  <span className="font-semibold">{type.key}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 2: Waste Categories and Annual Quantity</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CATEGORY_OPTIONS.map((category) => {
                const selected = selectedCategories.includes(category.key);
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => toggleCategory(category.key)}
                    className={`min-h-11 rounded-xl border p-3 text-left font-semibold ${
                      selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200'
                    }`}
                  >
                    {category.label}
                  </button>
                );
              })}
            </div>

            {selectedCategories.map((category) => (
              <div key={category} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{CATEGORY_OPTIONS.find((c) => c.key === category)?.label}</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <label className="text-sm">
                    Annual quantity placed on market
                    <input
                      type="number"
                      min="0"
                      value={categories[category].qty}
                      onChange={(e) =>
                        setCategories((prev) => ({
                          ...prev,
                          [category]: { ...prev[category], qty: e.target.value }
                        }))
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                    />
                  </label>

                  <label className="text-sm">
                    Unit
                    <select
                      value={categories[category].unit}
                      onChange={(e) =>
                        setCategories((prev) => ({
                          ...prev,
                          [category]: { ...prev[category], unit: e.target.value as Unit }
                        }))
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                    >
                      {UNITS.map((unit) => (
                        <option key={unit}>{unit}</option>
                      ))}
                    </select>
                  </label>
                </div>

                {category === 'plastic' ? (
                  <div className="mt-4">
                    <p className="mb-2 text-sm font-medium">Plastic sub-categories</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {PLASTIC_SUBCATEGORIES.map((sub) => {
                        const selected = categories.plastic.plasticSubcategories.includes(sub.key);
                        return (
                          <button
                            key={sub.key}
                            type="button"
                            onClick={() => togglePlasticSubcategory(sub.key)}
                            className={`min-h-11 rounded-lg border px-3 text-sm ${
                              selected ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-300'
                            }`}
                          >
                            {sub.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                {category === 'ewaste' ? (
                  <label className="mt-4 block text-sm">
                    EEE category
                    <select
                      value={categories.ewaste.eeeCategory}
                      onChange={(e) =>
                        setCategories((prev) => ({
                          ...prev,
                          ewaste: { ...prev.ewaste, eeeCategory: e.target.value }
                        }))
                      }
                      className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                    >
                      <option value="">Select EEE category</option>
                      {EEE_OPTIONS.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ))}

            <div className="no-print flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-11 rounded-lg border border-slate-300 px-4"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!selectedCategories.length}
                className="min-h-11 rounded-lg bg-teal-600 px-4 font-semibold text-white disabled:opacity-50"
              >
                See Results
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-4 print-results">
            <h2 className="text-lg font-semibold">Step 3: Calculation Results</h2>

            {result.perCategory.map((row) => (
              <article key={row.category} className="rounded-xl border border-slate-200 p-4">
                <h3 className="font-semibold">{CATEGORY_OPTIONS.find((c) => c.key === row.category)?.label}</h3>
                <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <p>Annual Quantity: <strong>{row.qtyMt.toFixed(2)} MT</strong></p>
                  <p>EPR Obligation: <strong>{row.obligationMt.toFixed(2)} MT</strong></p>
                  <p>Est. Credits Required: <strong>{row.creditsRequired.toFixed(2)} MT</strong></p>
                  <p>Est. Credit Cost: <strong>{inr(row.estimatedCost)}</strong></p>
                  <p>Penalty if non-compliant: <strong>{inr(row.penalty)}</strong></p>
                  <p>Applied Rate: <strong>{(row.rate * 100).toFixed(0)}%</strong></p>
                </div>
              </article>
            ))}

            <section className="rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <h3 className="text-base font-bold text-teal-800">Summary</h3>
              <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p>Total Est. Compliance Cost: <strong>{inr(result.totalCost)}</strong></p>
                <p>Total Penalty Exposure: <strong>{inr(result.totalPenalty)}</strong></p>
                <p>Potential Saving: <strong>{inr(result.potentialSaving)}</strong></p>
                <p>
                  Risk Level:{' '}
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${result.risk.cls}`}>
                    {result.risk.label}
                  </span>
                </p>
              </div>
            </section>

            <div className="no-print flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="min-h-11 rounded-lg border border-slate-300 px-4"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="min-h-11 rounded-lg bg-teal-600 px-4 font-semibold text-white"
              >
                Get Detailed Report
              </button>
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Step 4: Get Your Detailed Report</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">
                Name*
                <input
                  value={contact.name}
                  onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="text-sm">
                Company*
                <input
                  value={contact.company}
                  onChange={(e) => setContact((p) => ({ ...p, company: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="text-sm">
                Email*
                <input
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="text-sm">
                Phone*
                <input
                  value={contact.phone}
                  onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="text-sm">
                GSTIN (optional)
                <input
                  value={contact.gstin}
                  onChange={(e) => setContact((p) => ({ ...p, gstin: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                />
              </label>
              <label className="text-sm">
                State*
                <select
                  value={contact.state}
                  onChange={(e) => setContact((p) => ({ ...p, state: e.target.value }))}
                  className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3"
                >
                  <option value="">Select State</option>
                  {STATES.map((state) => (
                    <option key={state}>{state}</option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm">
              <input
                type="checkbox"
                checked={contact.waOptIn}
                onChange={(e) => setContact((p) => ({ ...p, waOptIn: e.target.checked }))}
              />
              Get updates on WhatsApp
            </label>

            <div className="no-print flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="min-h-11 rounded-lg border border-slate-300 px-4"
              >
                Back
              </button>
              <button
                type="button"
                disabled={
                  submitting ||
                  !contact.name.trim() ||
                  !contact.company.trim() ||
                  !contact.email.trim() ||
                  !contact.phone.trim() ||
                  !contact.state.trim()
                }
                onClick={submitLead}
                className="min-h-11 rounded-lg bg-teal-600 px-4 font-semibold text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        ) : null}

        {step === 5 ? (
          <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-bold text-emerald-800">Thank You</h2>
            <p className="text-sm text-emerald-900">
              Your EPR obligation report will be emailed within 24 hours. Our consultant will contact you.
            </p>
            <p className="text-sm font-semibold">Submission ID: {submissionId}</p>

            <div className="no-print flex flex-wrap gap-3">
              <a
                href="/contact"
                className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white"
              >
                Contact us
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 font-semibold"
              >
                Download Summary as PDF
              </button>
            </div>
          </section>
        ) : null}
      </section>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          header, footer, nav, button, a { display: none !important; }
          .print-results { border: 0 !important; box-shadow: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </main>
  );
}

