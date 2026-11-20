"use client";

import { useState } from "react";
import { CheckCircle, Circle, Download, ArrowRight, RotateCcw } from "lucide-react";
import Link from "next/link";

const CHECKLIST_SECTIONS = [
  {
    title: "Pre-Registration",
    items: [
      { id: "pre-1", text: "Identify your waste category (Plastic / E-Waste / Battery / Tyre / Used Oil / ELV)" },
      { id: "pre-2", text: "Determine if you are a Producer, Importer, or Brand Owner (PIBO)" },
      { id: "pre-3", text: "Calculate annual production/import quantity (in MT)" },
      { id: "pre-4", text: "Gather company incorporation certificate & GST registration" },
      { id: "pre-5", text: "Prepare board resolution authorizing EPR registration" },
      { id: "pre-6", text: "Collect product details with HSN codes and waste classification" },
    ],
  },
  {
    title: "Registration & Documentation",
    items: [
      { id: "reg-1", text: "Create account on CPCB centralized portal" },
      { id: "reg-2", text: "Upload all required documents (PAN, GST, incorporation, product info)" },
      { id: "reg-3", text: "Submit EPR registration application online" },
      { id: "reg-4", text: "Pay applicable registration fees" },
      { id: "reg-5", text: "Respond to any CPCB queries within 15 days" },
      { id: "reg-6", text: "Receive EPR registration certificate from CPCB" },
    ],
  },
  {
    title: "Target Fulfillment",
    items: [
      { id: "target-1", text: "Note your annual EPR target quantity (from registration certificate)" },
      { id: "target-2", text: "Identify authorized recyclers/dismantlers for your waste category" },
      { id: "target-3", text: "Procure EPR certificates to meet 100% of your target" },
      { id: "target-4", text: "Verify all certificates are from CPCB-authorized facilities" },
      { id: "target-5", text: "Maintain records of all certificate transactions" },
    ],
  },
  {
    title: "Annual Compliance",
    items: [
      { id: "annual-1", text: "Compile production/import data for the financial year" },
      { id: "annual-2", text: "Aggregate all EPR certificates procured during the year" },
      { id: "annual-3", text: "File annual return on CPCB portal before June 30" },
      { id: "annual-4", text: "Submit quarterly progress reports (if applicable)" },
      { id: "annual-5", text: "Retain all compliance records for minimum 5 years" },
      { id: "annual-6", text: "Plan for next year's increased targets (progressive schedule)" },
    ],
  },
  {
    title: "Audit Readiness",
    items: [
      { id: "audit-1", text: "Organize all certificates in chronological order" },
      { id: "audit-2", text: "Prepare reconciliation of targets vs. certificates procured" },
      { id: "audit-3", text: "Verify recycler authorization validity for the compliance period" },
      { id: "audit-4", text: "Keep SPCB NOC and consent copies accessible" },
      { id: "audit-5", text: "Document waste collection and channelization process" },
    ],
  },
];

export default function ComplianceChecklist() {
  const [checked, setChecked] = useState({});

  const toggle = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = CHECKLIST_SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
  const completedItems = Object.values(checked).filter(Boolean).length;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const resetAll = () => setChecked({});

  const sectionProgress = (section) => {
    const done = section.items.filter((item) => checked[item.id]).length;
    return { done, total: section.items.length };
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Free Tool
          </span>
          <h1 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            EPR Compliance Checklist
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Track your EPR compliance progress step-by-step. Check off items as you complete them.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 mb-8">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Overall Progress</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {completedItems} of {totalItems} items completed
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold text-eco-green-4">{progressPercent}%</span>
              <button
                onClick={resetAll}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Reset all"
                title="Reset all"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className="bg-eco-green-4 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent === 100 && (
            <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium">
              <CheckCircle size={16} /> All compliance items completed!
            </div>
          )}
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {CHECKLIST_SECTIONS.map((section, sIdx) => {
            const { done, total } = sectionProgress(section);
            const sectionComplete = done === total;
            return (
              <div
                key={section.title}
                className={`rounded-2xl border p-6 transition-colors ${
                  sectionComplete
                    ? "border-eco-green-4/40 bg-eco-green-4/5 dark:bg-eco-green-4/5"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-eco-green-4/10 text-eco-green-4 text-xs font-bold flex items-center justify-center">
                      {sIdx + 1}
                    </span>
                    {section.title}
                  </h2>
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {done}/{total}
                  </span>
                </div>
                <div className="space-y-2">
                  {section.items.map((item) => {
                    const isChecked = !!checked[item.id];
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggle(item.id)}
                        className="w-full flex items-start gap-3 text-left py-2 px-3 rounded-lg hover:bg-white dark:hover:bg-gray-700/50 transition group"
                      >
                        {isChecked ? (
                          <CheckCircle size={18} className="text-eco-green-4 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-eco-green-4/50 flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm transition ${
                            isChecked
                              ? "text-gray-400 dark:text-gray-500 line-through"
                              : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {item.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Need help completing your checklist?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our experts handle every step — from registration to audit readiness.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/get-matched" className="bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition flex items-center gap-1.5">
              Get Expert Help <ArrowRight size={14} />
            </Link>
            <Link href="/epr-calculator" className="border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
              Calculate Your EPR Target
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
