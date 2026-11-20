'use client';

import { useMemo, useState } from 'react';

function inr(value: number) {
  return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
}

export default function RoiCalculatorPage() {
  const [qtyMt, setQtyMt] = useState(250);
  const [categories, setCategories] = useState(2);
  const [currentSpend, setCurrentSpend] = useState(0);
  const [years, setYears] = useState(5);

  const output = useMemo(() => {
    const obligationMt = qtyMt * 0.6;
    const ourCost = qtyMt * 4500 * categories * 0.85;
    const diyCost = qtyMt * 4500 * categories * 1.4;
    const penaltyAvoided = obligationMt * 10000;
    const totalRoi = diyCost + penaltyAvoided - ourCost;
    const roiMultiple = ourCost > 0 ? totalRoi / ourCost : 0;
    const savings = diyCost - ourCost;

    return { obligationMt, ourCost, diyCost, penaltyAvoided, totalRoi, roiMultiple, savings };
  }, [qtyMt, categories]);

  const maxCost = Math.max(output.ourCost, output.diyCost, 1);
  const ourWidth = (output.ourCost / maxCost) * 100;
  const diyWidth = (output.diyCost / maxCost) * 100;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6">
      <section className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-2xl font-bold">ROI Calculator</h1>
        <p className="mt-1 text-sm text-slate-600">Embeddable calculator widget for quick EPR savings estimation.</p>

        <h2 className="mt-5 text-3xl font-extrabold text-teal-700">Save {inr(output.savings)} this year</h2>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            Annual plastic quantity (MT)
            <input
              type="range"
              min={0}
              max={5000}
              value={qtyMt}
              onChange={(e) => setQtyMt(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <input
              type="number"
              min={0}
              max={5000}
              value={qtyMt}
              onChange={(e) => setQtyMt(Number(e.target.value || 0))}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>

          <label className="text-sm">
            Number of EPR categories
            <input
              type="range"
              min={1}
              max={4}
              value={categories}
              onChange={(e) => setCategories(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <input
              type="number"
              min={1}
              max={4}
              value={categories}
              onChange={(e) => setCategories(Math.max(1, Math.min(4, Number(e.target.value || 1))))}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>

          <label className="text-sm">
            Current compliance spend ₹
            <input
              type="number"
              min={0}
              value={currentSpend}
              onChange={(e) => setCurrentSpend(Number(e.target.value || 0))}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>

          <label className="text-sm">
            Years in business
            <input
              type="range"
              min={1}
              max={20}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="mt-2 w-full"
            />
            <input
              type="number"
              min={1}
              max={20}
              value={years}
              onChange={(e) => setYears(Math.max(1, Math.min(20, Number(e.target.value || 1))))}
              className="mt-2 min-h-11 w-full rounded-lg border border-slate-300 px-3"
            />
          </label>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <article className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs uppercase text-emerald-700">Our Cost</p>
            <p className="mt-2 text-2xl font-bold text-emerald-800">{inr(output.ourCost)}</p>
          </article>
          <article className="rounded-xl border border-orange-200 bg-orange-50 p-4">
            <p className="text-xs uppercase text-orange-700">DIY Cost</p>
            <p className="mt-2 text-2xl font-bold text-orange-800">{inr(output.diyCost)}</p>
          </article>
          <article className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-xs uppercase text-red-700">Penalty Avoided</p>
            <p className="mt-2 text-2xl font-bold text-red-800">{inr(output.penaltyAvoided)}</p>
          </article>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 p-4">
          <h3 className="text-sm font-semibold">Cost Comparison</h3>
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>Our Cost</span>
                <span>{inr(output.ourCost)}</span>
              </div>
              <div className="h-4 rounded-full bg-slate-100">
                <div className="h-4 rounded-full bg-emerald-500" style={{ width: `${ourWidth}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span>DIY Cost</span>
                <span>{inr(output.diyCost)}</span>
              </div>
              <div className="h-4 rounded-full bg-slate-100">
                <div className="h-4 rounded-full bg-orange-500" style={{ width: `${diyWidth}%` }} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p>EPR Compliance Cost (via our service): <strong>{inr(output.ourCost)}</strong></p>
          <p>DIY Compliance Cost: <strong>{inr(output.diyCost)}</strong></p>
          <p>Penalty Avoided: <strong>{inr(output.penaltyAvoided)}</strong></p>
          <p>Total ROI: <strong>{inr(output.totalRoi)}</strong></p>
          <p>ROI multiple: <strong>{output.roiMultiple.toFixed(2)}x</strong></p>
          <p>Current spend entered: <strong>{inr(currentSpend)}</strong></p>
        </section>

        <a
          href="/calculator"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-teal-600 px-5 py-2 font-semibold text-white hover:bg-teal-700"
        >
          Get This Price for Your Company →
        </a>
      </section>
    </main>
  );
}
