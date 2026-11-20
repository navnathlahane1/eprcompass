"use client";

import { useState } from "react";
import { Calculator, TrendingUp, ArrowRight, RotateCcw } from "lucide-react";
import { WASTE_CATEGORIES, CATEGORY_MULTIPLIERS } from "./constants";
import Link from "next/link";

const FINANCIAL_YEARS = ["2024-25", "2025-26", "2026-27", "2027-28"];

export default function EPRCalculator() {
  const [category, setCategory] = useState("");
  const [turnover, setTurnover] = useState("");
  const [productWeight, setProductWeight] = useState("");
  const [fy, setFy] = useState("2024-25");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const t = parseFloat(turnover);
    const w = parseFloat(productWeight);
    if (!category || isNaN(t) || t <= 0 || isNaN(w) || w <= 0) return;

    const multiplier = CATEGORY_MULTIPLIERS[category] || 0.04;
    const eprTarget = w * multiplier * 1000; // kg
    const estimatedCost = eprTarget * 12; // ₹12 per kg baseline
    const complianceFee = Math.max(15000, t * 0.002); // 0.2% of turnover or ₹15k min

    setResult({
      eprTarget: Math.round(eprTarget),
      estimatedCost: Math.round(estimatedCost),
      complianceFee: Math.round(complianceFee),
      totalEstimate: Math.round(estimatedCost + complianceFee),
    });
  };

  const reset = () => {
    setCategory("");
    setTurnover("");
    setProductWeight("");
    setFy("2024-25");
    setResult(null);
  };

  const formatINR = (n) => "₹" + n.toLocaleString("en-IN");

  const inputCls =
    "w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none";

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Calculator size={14} /> EPR Calculator
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Estimate Your EPR Obligation
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Get an instant estimate of your EPR target quantity and compliance costs based on your waste category and production data.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Input Details</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Waste Category *</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
                <option value="">Select category</option>
                {WASTE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Annual Turnover (₹ Lakhs) *</label>
              <input
                type="number"
                min="0"
                value={turnover}
                onChange={(e) => setTurnover(e.target.value)}
                placeholder="e.g. 500"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Product Weight (MT/year) *</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={productWeight}
                onChange={(e) => setProductWeight(e.target.value)}
                placeholder="e.g. 50"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Financial Year</label>
              <select value={fy} onChange={(e) => setFy(e.target.value)} className={inputCls}>
                {FINANCIAL_YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={calculate}
                disabled={!category || !turnover || !productWeight}
                className="flex-1 bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-40 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Calculate
              </button>
              <button
                onClick={reset}
                className="p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Reset"
              >
                <RotateCcw size={16} />
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 flex flex-col justify-between">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400 dark:text-gray-500 py-8">
                <TrendingUp size={48} className="opacity-30 mb-3" />
                <p className="text-sm">Fill in the details and click <strong>Calculate</strong> to see your estimate.</p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm uppercase tracking-wide mb-4">
                    Estimated Results ({fy})
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-300">EPR Target Quantity</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{result.eprTarget.toLocaleString("en-IN")} kg</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Recycling Cost (est.)</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatINR(result.estimatedCost)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                      <span className="text-sm text-gray-600 dark:text-gray-300">Compliance Fee</span>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{formatINR(result.complianceFee)}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 bg-eco-green-4/5 rounded-lg px-3 mt-2">
                      <span className="text-sm font-bold text-eco-green-5 dark:text-eco-green-4">Total Estimate</span>
                      <span className="text-lg font-bold text-eco-green-5 dark:text-eco-green-4">{formatINR(result.totalEstimate)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                    * Estimates are indicative. Actual costs may vary based on CPCB guidelines.
                  </p>
                  <Link
                    href="/get-matched"
                    className="w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold py-2.5 rounded-lg transition text-sm"
                  >
                    Get Expert Help <ArrowRight size={14} />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
