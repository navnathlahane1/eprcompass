"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { WASTE_CATEGORIES } from "./constants";
import { INDIA_STATES_UTS, COUNTRIES } from "@/lib/indiaGeo";
import { submitToGoogleScript } from "@/lib/googleScript";
import { trackEvent } from "@/lib/analytics";

const STEP_NAMES = { 1: "Company", 2: "EPR Need", 3: "Contact" };

const REQUIREMENT_TYPES = [
  "New Registration",
  "Annual Filing",
  "Renewal",
  "Audit",
  "Training",
];

const INDUSTRY_TYPES = [
  "FMCG / Consumer Goods",
  "Electronics / IT",
  "Automotive",
  "Pharmaceuticals",
  "Packaging / Plastics",
  "Import / Export",
  "Other",
];

export default function GetMatchedForm() {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    companyName: "",
    country: "India",
    state: "",
    industryType: "",
    wasteCategories: [],
    requirementType: "",
    name: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const toggleCategory = (key) => {
    setForm((prev) => ({
      ...prev,
      wasteCategories: prev.wasteCategories.includes(key)
        ? prev.wasteCategories.filter((c) => c !== key)
        : [...prev.wasteCategories, key],
    }));
    setErrors((prev) => ({ ...prev, wasteCategories: "" }));
  };

  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.companyName.trim()) e.companyName = "Required";
      if (!form.state) e.state = "Required";
      if (!form.industryType) e.industryType = "Required";
    } else if (s === 2) {
      if (form.wasteCategories.length === 0) e.wasteCategories = "Select at least one";
      if (!form.requirementType) e.requirementType = "Required";
    } else if (s === 3) {
      if (!form.name.trim()) e.name = "Required";
      if (!form.email.trim()) e.email = "Required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Invalid email";
      if (!form.phone.trim()) e.phone = "Required";
      else if (!/^\+?[0-9\s()-]{10,15}$/.test(form.phone.replace(/\s/g, ""))) e.phone = "Invalid phone";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) {
      trackEvent("Registration Step Completed", { step, step_name: STEP_NAMES[step] });
      setStep(step + 1);
    }
  };

  const handleSubmit = async () => {
    if (!validate(3)) return;
    setIsSubmitting(true);
    setError("");
    try {
      await submitToGoogleScript({
        type: "get_matched_form",
        ...form,
        wasteCategories: form.wasteCategories.join(", "),
        submittedAt: new Date().toISOString(),
      });
      trackEvent("Registration Completed", {
        waste_categories: form.wasteCategories,
        requirement_type: form.requirementType,
        industry_type: form.industryType,
        state: form.state,
        country: form.country,
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="py-16 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="font-tricks text-3xl font-bold text-gray-900 dark:text-white mb-3">Requirement Posted!</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Our team will match you with the best-fit EPR consultant within <strong>24 hours</strong>.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Check your email ({form.email}) for confirmation and next steps.
          </p>
        </div>
      </section>
    );
  }

  const inputCls = (field) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none ${
      errors[field] ? "border-red-400" : "border-gray-300 dark:border-gray-600"
    }`;

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Post a Requirement
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Get Matched with an EPR Expert
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Tell us about your compliance needs and we&apos;ll connect you with the right consultant.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${s <= step ? "bg-eco-green-4" : "bg-gray-200 dark:bg-gray-700"}`} />
              <p className={`text-[10px] mt-1 text-center font-medium ${s <= step ? "text-eco-green-4" : "text-gray-400"}`}>
                {s === 1 ? "Company" : s === 2 ? "EPR Need" : "Contact"}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6">
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Company Name *</label>
                <input value={form.companyName} onChange={(e) => set("companyName", e.target.value)} placeholder="Your company name" className={inputCls("companyName")} />
                {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Country</label>
                <select value={form.country} onChange={(e) => { set("country", e.target.value); set("state", ""); }} className={inputCls("country")}>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">State *</label>
                {form.country === "India" ? (
                  <select value={form.state} onChange={(e) => set("state", e.target.value)} className={inputCls("state")}>
                    <option value="">Select state / UT</option>
                    {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                ) : (
                  <input value={form.state} onChange={(e) => set("state", e.target.value)} placeholder="State / Province" className={inputCls("state")} />
                )}
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Industry Type *</label>
                <select value={form.industryType} onChange={(e) => set("industryType", e.target.value)} className={inputCls("industryType")}>
                  <option value="">Select industry</option>
                  {INDUSTRY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {errors.industryType && <p className="text-xs text-red-500 mt-1">{errors.industryType}</p>}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Waste Category * (select all that apply)</label>
                <div className="flex flex-wrap gap-2">
                  {WASTE_CATEGORIES.map((cat) => {
                    const selected = form.wasteCategories.includes(cat.key);
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => toggleCategory(cat.key)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 transition-colors ${
                          selected
                            ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4"
                            : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-eco-green-4/40"
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                {errors.wasteCategories && <p className="text-xs text-red-500 mt-1">{errors.wasteCategories}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Requirement Type *</label>
                <div className="space-y-2">
                  {REQUIREMENT_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="requirementType"
                        value={type}
                        checked={form.requirementType === type}
                        onChange={(e) => set("requirementType", e.target.value)}
                        className="accent-eco-green-4"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-200">{type}</span>
                    </label>
                  ))}
                </div>
                {errors.requirementType && <p className="text-xs text-red-500 mt-1">{errors.requirementType}</p>}
              </div>
            </div>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Full Name *</label>
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" className={inputCls("name")} />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@company.com" className={inputCls("email")} />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Phone *</label>
                <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Enter phone number" className={inputCls("phone")} />
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  {error}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}
            {step < 3 ? (
              <button
                type="button"
                onClick={next}
                className="flex-1 flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                Next <ArrowRight size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm"
              >
                {isSubmitting ? "Submitting..." : "Submit Requirement"}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
