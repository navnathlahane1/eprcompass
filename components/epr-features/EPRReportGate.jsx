"use client";

import { useState, useEffect } from "react";
import { FileText, Download, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { WASTE_CATEGORIES, CategoryBadge } from "./constants";
import { submitToGoogleScript } from "@/lib/googleScript";

const REPORTS = [
  { id: "plastic-2024", title: "Plastic Waste EPR Framework 2024", category: "plastic", pages: 42, description: "Complete guide to plastic waste EPR regulations, targets, and compliance roadmap." },
  { id: "ewaste-recycler", title: "E-Waste Recycler Directory", category: "ewaste", pages: 28, description: "State-wise directory of authorized e-waste recyclers with capacity data." },
  { id: "battery-guidelines", title: "Battery Waste Management Rules", category: "battery", pages: 35, description: "Detailed breakdown of battery waste obligations and EPR certificate requirements." },
  { id: "tyre-compliance", title: "Tyre EPR Compliance Handbook", category: "tyre", pages: 30, description: "Step-by-step tyre waste EPR registration, filing, and audit process." },
  { id: "usedoil-2024", title: "Used Oil Management Report", category: "usedoil", pages: 22, description: "CPCB guidelines for used oil collection, recycling targets, and EPR obligations." },
  { id: "elv-industry", title: "ELV Industry Analysis 2024", category: "elv", pages: 38, description: "End-of-life vehicle waste trends, regulatory outlook, and compliance strategies." },
];

const STORAGE_KEY = "epr_report_unlocked";

export default function EPRReportGate() {
  const [unlocked, setUnlocked] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [targetReport, setTargetReport] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", company: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === "true") setUnlocked(true);
    } catch {
      // localStorage not available
    }
  }, []);

  const handleDownload = (report) => {
    if (unlocked) {
      // In production, this would trigger actual download
      window.alert(`Download started: ${report.title}`);
      return;
    }
    setTargetReport(report);
    setGateOpen(true);
  };

  const handleGateSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill in all fields.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setSubmitStatus("error");
      setSubmitMessage("Please enter a valid email.");
      return;
    }
    setIsSubmitting(true);
    setSubmitStatus(null);
    try {
      await submitToGoogleScript({
        type: "report_download_form",
        ...form,
        reportId: targetReport?.id,
        reportTitle: targetReport?.title,
        submittedAt: new Date().toISOString(),
      });
      try { localStorage.setItem(STORAGE_KEY, "true"); } catch {}
      setUnlocked(true);
      setSubmitStatus("success");
      setSubmitMessage("Access granted! You can now download all reports.");
      setTimeout(() => { setGateOpen(false); setSubmitStatus(null); }, 2000);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <FileText size={14} /> EPR Reports
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Free EPR Industry Reports
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Download in-depth reports on EPR regulations, compliance frameworks, and industry analysis — all free with a quick sign-up.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REPORTS.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 flex flex-col hover:border-eco-green-4/40 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <CategoryBadge categoryKey={report.category} />
                <span className="text-[10px] text-gray-400 dark:text-gray-500">{report.pages} pages</span>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2 flex-grow">
                {report.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                {report.description}
              </p>
              <button
                onClick={() => handleDownload(report)}
                className="w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-semibold py-2 rounded-lg transition"
              >
                {unlocked ? (
                  <><Download size={13} /> Download PDF</>
                ) : (
                  <><Lock size={13} /> Unlock &amp; Download</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Gate Modal */}
      {gateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-5 sm:p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setGateOpen(false); setSubmitStatus(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition" aria-label="Close">✕</button>
            <div className="w-12 h-12 bg-eco-green-4/10 rounded-xl flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-eco-green-4" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Unlock Free Reports
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              Enter your details once to get unlimited access to all EPR reports.
            </p>
            {submitStatus === "success" && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 rounded-lg p-3 mb-4 text-sm">
                <CheckCircle size={16} className="flex-shrink-0" /> {submitMessage}
              </div>
            )}
            {submitStatus === "error" && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 mb-4 text-sm">
                <AlertCircle size={16} className="flex-shrink-0" /> {submitMessage}
              </div>
            )}
            <form onSubmit={handleGateSubmit} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Full Name *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Work Email *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
              <input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} placeholder="Company Name *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
              <button type="submit" disabled={isSubmitting} className="w-full bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                {isSubmitting ? "Verifying..." : "Get Free Access"}
              </button>
            </form>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-3">
              We respect your privacy. No spam, ever.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
