"use client";

import { useState } from "react";
import { Check, X, ArrowRight, HelpCircle } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Starter",
    price: "₹29,999",
    period: "/year",
    description: "Single-category EPR registration with basic compliance support.",
    highlight: false,
    cta: "Get Started",
    href: "/get-matched",
    features: {
      "EPR Registration (1 category)": true,
      "CPCB Portal Setup": true,
      "Document Preparation": true,
      "Annual Return Filing": true,
      "Certificate Procurement Support": false,
      "Quarterly Progress Reports": false,
      "Multi-Category Management": false,
      "Dedicated Account Manager": false,
      "Audit Readiness Review": false,
      "Recycler Network Access": false,
      "Priority Support (WhatsApp)": false,
      "Compliance Dashboard Access": false,
    },
  },
  {
    name: "Professional",
    price: "₹59,999",
    period: "/year",
    description: "Multi-category compliance with certificate procurement and quarterly filing.",
    highlight: true,
    badge: "Most Popular",
    cta: "Choose Professional",
    href: "/get-matched",
    features: {
      "EPR Registration (1 category)": true,
      "CPCB Portal Setup": true,
      "Document Preparation": true,
      "Annual Return Filing": true,
      "Certificate Procurement Support": true,
      "Quarterly Progress Reports": true,
      "Multi-Category Management": "Up to 3",
      "Dedicated Account Manager": true,
      "Audit Readiness Review": false,
      "Recycler Network Access": false,
      "Priority Support (WhatsApp)": true,
      "Compliance Dashboard Access": true,
    },
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "End-to-end compliance management with audit support and recycler network.",
    highlight: false,
    cta: "Contact Sales",
    href: "/contact",
    features: {
      "EPR Registration (1 category)": true,
      "CPCB Portal Setup": true,
      "Document Preparation": true,
      "Annual Return Filing": true,
      "Certificate Procurement Support": true,
      "Quarterly Progress Reports": true,
      "Multi-Category Management": "Unlimited",
      "Dedicated Account Manager": true,
      "Audit Readiness Review": true,
      "Recycler Network Access": true,
      "Priority Support (WhatsApp)": true,
      "Compliance Dashboard Access": true,
    },
  },
];

const FEATURE_TOOLTIPS = {
  "Certificate Procurement Support": "We source and procure EPR certificates from authorized recyclers on your behalf.",
  "Multi-Category Management": "Manage plastic, e-waste, battery, tyre, used oil, and ELV under one account.",
  "Audit Readiness Review": "Pre-audit compliance check ensuring all documents and records meet CPCB standards.",
  "Recycler Network Access": "Direct access to our verified recycler marketplace for certificate trading.",
  "Compliance Dashboard Access": "Real-time portal showing registration status, targets, certificates, and deadlines.",
};

const FEATURES = Object.keys(PLANS[0].features);

export default function ComparisonMatrix() {
  const [tooltipFeature, setTooltipFeature] = useState(null);

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Pricing
          </span>
          <h1 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Compare Service Plans
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Choose the plan that fits your EPR compliance needs. All plans include expert guidance and CPCB portal assistance.
          </p>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-6">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border p-6 ${
                plan.highlight
                  ? "border-eco-green-4 bg-eco-green-4/5 dark:bg-eco-green-4/5 ring-2 ring-eco-green-4/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              }`}
            >
              {plan.badge && (
                <span className="bg-eco-green-4 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">
                  {plan.badge}
                </span>
              )}
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-2">{plan.name}</h3>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">{plan.description}</p>
              <div className="space-y-2 mb-5">
                {FEATURES.map((feature) => {
                  const value = plan.features[feature];
                  return (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      {value === true ? (
                        <Check size={14} className="text-eco-green-4 flex-shrink-0" />
                      ) : value === false ? (
                        <X size={14} className="text-gray-300 dark:text-gray-600 flex-shrink-0" />
                      ) : (
                        <Check size={14} className="text-eco-green-4 flex-shrink-0" />
                      )}
                      <span className={value ? "text-gray-700 dark:text-gray-200" : "text-gray-400 dark:text-gray-500"}>
                        {feature}
                        {typeof value === "string" && <span className="text-eco-green-4 font-medium ml-1">({value})</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link
                href={plan.href}
                className={`w-full flex items-center justify-center gap-1.5 font-semibold py-3 rounded-lg transition text-sm ${
                  plan.highlight
                    ? "bg-eco-green-4 hover:bg-eco-green-5 text-white"
                    : "border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white"
                }`}
              >
                {plan.cta} <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-5 w-[40%]">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Feature</span>
                </th>
                {PLANS.map((plan) => (
                  <th key={plan.name} className={`p-5 text-center ${plan.highlight ? "bg-eco-green-4/5 dark:bg-eco-green-4/5" : ""}`}>
                    {plan.badge && (
                      <span className="bg-eco-green-4 text-white text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full mb-2 inline-block">
                        {plan.badge}
                      </span>
                    )}
                    <div className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</div>
                    <div className="mt-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{plan.period}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{plan.description}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((feature, i) => (
                <tr key={feature} className={`border-b border-gray-100 dark:border-gray-800 ${i % 2 === 0 ? "bg-gray-50/50 dark:bg-gray-800/30" : ""}`}>
                  <td className="px-5 py-3">
                    <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                      {feature}
                      {FEATURE_TOOLTIPS[feature] && (
                        <button
                          className="relative"
                          onMouseEnter={() => setTooltipFeature(feature)}
                          onMouseLeave={() => setTooltipFeature(null)}
                          aria-label={`Info about ${feature}`}
                        >
                          <HelpCircle size={13} className="text-gray-400 dark:text-gray-500" />
                          {tooltipFeature === feature && (
                            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-10 w-56 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg px-3 py-2 shadow-lg">
                              {FEATURE_TOOLTIPS[feature]}
                            </div>
                          )}
                        </button>
                      )}
                    </span>
                  </td>
                  {PLANS.map((plan) => {
                    const value = plan.features[feature];
                    return (
                      <td key={plan.name} className={`px-5 py-3 text-center ${plan.highlight ? "bg-eco-green-4/5 dark:bg-eco-green-4/5" : ""}`}>
                        {value === true ? (
                          <Check size={16} className="mx-auto text-eco-green-4" />
                        ) : value === false ? (
                          <X size={16} className="mx-auto text-gray-300 dark:text-gray-600" />
                        ) : (
                          <span className="text-xs font-semibold text-eco-green-4">{value}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* CTA Row */}
              <tr>
                <td className="p-5" />
                {PLANS.map((plan) => (
                  <td key={plan.name} className={`p-5 text-center ${plan.highlight ? "bg-eco-green-4/5 dark:bg-eco-green-4/5" : ""}`}>
                    <Link
                      href={plan.href}
                      className={`inline-flex items-center gap-1.5 font-semibold py-2.5 px-5 rounded-lg transition text-sm ${
                        plan.highlight
                          ? "bg-eco-green-4 hover:bg-eco-green-5 text-white"
                          : "border-2 border-eco-green-4 text-eco-green-4 hover:bg-eco-green-4 hover:text-white"
                      }`}
                    >
                      {plan.cta} <ArrowRight size={14} />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bottom Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            All prices exclusive of GST. Annual plans with monthly payment options available for Professional and Enterprise.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Need a custom plan? <Link href="/contact" className="text-eco-green-4 hover:underline">Contact our sales team</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}
