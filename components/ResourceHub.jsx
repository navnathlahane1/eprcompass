"use client";

import { useState, useMemo, useEffect } from "react";
import { FileText, Download, Calculator, ClipboardCheck, BookOpen, Briefcase, ExternalLink, Search, X, Lock } from "lucide-react";
import Link from "next/link";
import { whatsappUrl } from "@/lib/whatsapp/cta";
import { submitToGoogleScript } from "@/lib/googleScript";

const RESOURCE_CATEGORIES = [
  { key: "all", label: "All Resources", icon: BookOpen },
  { key: "guide", label: "Guides", icon: FileText },
  { key: "research", label: "Research Reports", icon: BookOpen },
  { key: "tool", label: "Tools", icon: Calculator },
  { key: "template", label: "Templates", icon: ClipboardCheck },
  { key: "regulation", label: "Regulations", icon: Briefcase },
];

const RESOURCES = [
  {
    id: "epr-starter-guide",
    title: "EPR Starter Guide 2024",
    description: "Complete beginner's guide to Extended Producer Responsibility — what it is, who needs it, and how to get started.",
    category: "guide",
    format: "PDF",
    pages: 24,
    isNew: true,
  },
  {
    id: "plastic-epr-market-report-2026",
    title: "Plastic EPR Market Research Report 2026",
    description: "Quarterly market insights on certificate pricing, compliance trends, and procurement behavior across India.",
    category: "research",
    format: "PDF",
    pages: 32,
    isNew: true,
  },
  {
    id: "battery-credit-index-q1-2026",
    title: "Battery EPR Credit Index Q1 2026",
    description: "Data-led analysis of battery EPR credit movements, top demand regions, and high-volatility categories.",
    category: "research",
    format: "PDF",
    pages: 28,
  },
  {
    id: "ewaste-compliance-benchmark-2026",
    title: "E-Waste Compliance Benchmark Report",
    description: "Benchmark study comparing filing quality, documentation maturity, and timeline performance across e-waste producers.",
    category: "research",
    format: "PDF",
    pages: 26,
  },
  {
    id: "epr-calculator",
    title: "EPR Obligation Calculator",
    description: "Calculate your EPR target quantity and estimated compliance costs based on waste category and production data.",
    category: "tool",
    format: "Interactive",
    href: "/epr-calculator",
    isInternal: true,
  },
  {
    id: "compliance-checklist",
    title: "EPR Compliance Checklist",
    description: "Step-by-step interactive checklist covering pre-registration through audit readiness. Track your progress in real-time.",
    category: "tool",
    format: "Interactive",
    href: "/compliance-checklist",
    isInternal: true,
  },
  {
    id: "pwm-rules-2022",
    title: "PWM Rules 2022 Summary",
    description: "Condensed summary of Plastic Waste Management Rules 2022 amendments, new targets, and key deadlines.",
    category: "regulation",
    format: "PDF",
    pages: 18,
  },
  {
    id: "ewaste-rules",
    title: "E-Waste Management Rules 2022",
    description: "Complete breakdown of e-waste EPR obligations, target schedules, and CPCB registration requirements.",
    category: "regulation",
    format: "PDF",
    pages: 22,
  },
  {
    id: "battery-rules",
    title: "Battery Waste Management Rules",
    description: "Detailed guide to battery waste EPR — portable, automotive, and industrial battery compliance requirements.",
    category: "regulation",
    format: "PDF",
    pages: 16,
  },
  {
    id: "annual-return-template",
    title: "Annual Return Filing Template",
    description: "Pre-formatted template for preparing your EPR annual return data before filing on the CPCB portal.",
    category: "template",
    format: "Excel",
  },
  {
    id: "target-tracker",
    title: "EPR Target Tracker Template",
    description: "Spreadsheet template to track quarterly EPR certificate procurement against your annual targets.",
    category: "template",
    format: "Excel",
  },
  {
    id: "certificate-log",
    title: "Certificate Procurement Log",
    description: "Template to maintain records of all EPR certificate transactions — dates, quantities, recycler details, and costs.",
    category: "template",
    format: "Excel",
  },
  {
    id: "roi-calculator",
    title: "CEPC ROI Calculator",
    description: "Calculate your potential earnings as a Certified EPR Professional Consultant based on client volume and specialization.",
    category: "tool",
    format: "Interactive",
    href: "/become-a-cepc",
    isInternal: true,
  },
  {
    id: "recycler-directory",
    title: "CEPC Consultant Directory",
    description: "Browse our network of CPCB-verified EPR consultants. Filter by state, waste category, and availability.",
    category: "tool",
    format: "Interactive",
    href: "/cepc-directory",
    isInternal: true,
  },
  {
    id: "tyre-used-oil-guide",
    title: "Tyre & Used Oil EPR Guide",
    description: "EPR obligations for tyre manufacturers, retreaders, and used oil producers — registration, targets, and compliance.",
    category: "guide",
    format: "PDF",
    pages: 20,
  },
];

const CATEGORY_COLORS = {
  guide: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  research: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  tool: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300",
  template: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  regulation: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const defaultDownloadForm = {
  fullName: "",
  email: "",
  phone: "",
  company: "",
  designation: "",
  purpose: ""
};

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!value) return "PDF";
  const kb = 1024;
  const mb = kb * 1024;
  if (value >= mb) return `PDF · ${(value / mb).toFixed(2)} MB`;
  if (value >= kb) return `PDF · ${(value / kb).toFixed(1)} KB`;
  return `PDF · ${value} B`;
}

export default function ResourceHub() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);
  const [downloadForm, setDownloadForm] = useState(defaultDownloadForm);
  const [isSubmittingDownload, setIsSubmittingDownload] = useState(false);
  const [downloadMessage, setDownloadMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [requestComplete, setRequestComplete] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReports() {
      setReportsLoading(true);
      setReportsError("");

      try {
        const response = await fetch("/api/public/resources/reports", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load downloadable reports");
        }

        if (!active) return;
        setReports(Array.isArray(payload?.reports) ? payload.reports : []);
      } catch (error) {
        if (!active) return;
        setReportsError("Published reports are temporarily unavailable. You can still request a resource below.");
      } finally {
        if (active) setReportsLoading(false);
      }
    }

    loadReports();
    return () => {
      active = false;
    };
  }, []);

  function openDownloadGate(report) {
    setSelectedReport(report);
    setDownloadForm(defaultDownloadForm);
    setDownloadMessage("");
    setDownloadUrl("");
    setRequestComplete(false);
  }

  function closeDownloadGate() {
    setSelectedReport(null);
    setDownloadForm(defaultDownloadForm);
    setIsSubmittingDownload(false);
    setDownloadMessage("");
    setDownloadUrl("");
    setRequestComplete(false);
  }

  async function submitDownloadRequest(event) {
    event.preventDefault();
    if (!selectedReport) return;

    setIsSubmittingDownload(true);
    setDownloadMessage("");

    try {
      if (selectedReport.requestOnly) {
        await submitToGoogleScript({
          type: "report_download_form",
          ...downloadForm,
          resourceId: selectedReport.id,
          resourceTitle: selectedReport.title,
          message: `Resource request: ${selectedReport.title}. ${downloadForm.purpose}`,
        });
        setRequestComplete(true);
        setDownloadMessage("Your resource request has been sent. Our team will contact you about availability.");
        return;
      }
      const response = await fetch("/api/public/resources/reports/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          reportId: selectedReport.id,
          fullName: downloadForm.fullName,
          email: downloadForm.email,
          phone: downloadForm.phone,
          company: downloadForm.company,
          designation: downloadForm.designation,
          purpose: downloadForm.purpose
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to process your request right now.");
      }

      if (!payload?.downloadUrl) {
        throw new Error("The download link is unavailable. Please try again.");
      }
      // A visible link avoids popup blockers after the asynchronous request.
      setDownloadUrl(payload.downloadUrl);
      setDownloadMessage("Your download is ready. Use the link below within 3 minutes.");
    } catch (error) {
      setDownloadMessage(error?.message || "Unable to start download right now.");
    } finally {
      setIsSubmittingDownload(false);
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return RESOURCES.filter((r) => {
      if (activeCategory !== "all" && r.category !== activeCategory) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [activeCategory, search]);

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            Knowledge Base
          </span>
          <h1 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            EPR Resource Hub
          </h1>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Guides, tools, templates, and regulatory summaries — everything you need for EPR compliance.
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-6">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search resources..."
            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {RESOURCE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition ${
                  activeCategory === cat.key
                    ? "bg-eco-green-4 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon size={13} /> {cat.label}
              </button>
            );
          })}
        </div>

        <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Report Downloads</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Download the latest compliance reports. Access is provided after a quick details form.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wide px-3 py-1 rounded-full bg-eco-green-4/10 text-eco-green-4 uppercase">
              <Lock size={12} /> Gated Access
            </span>
          </div>

          {reportsLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading reports...</p>
          ) : reportsError ? (
            <p className="text-sm text-red-600">{reportsError}</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No reports are published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => (
                <article
                  key={report.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4"
                >
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-eco-green-4 mb-2">
                    {report.category || "General"}
                  </p>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{report.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 min-h-[38px]">
                    {report.description || "Detailed compliance report in PDF format."}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
                    <span>{formatBytes(report.file_size_bytes)}</span>
                    <span>{Number(report.download_count || 0)} downloads</span>
                  </div>
                  <button
                    onClick={() => openDownloadGate(report)}
                    className="mt-4 w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-semibold py-2 rounded-lg transition"
                  >
                    <Download size={13} /> Unlock & Download
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-40" />
            <p>No resources match your search. Try different keywords.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((resource) => (
              <div
                key={resource.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 flex flex-col hover:border-eco-green-4/40 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[resource.category]}`}>
                    {resource.category}
                  </span>
                  <div className="flex items-center gap-2">
                    {resource.isNew && (
                      <span className="text-[10px] font-bold bg-eco-green-4 text-white px-2 py-0.5 rounded-full">NEW</span>
                    )}
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {resource.format}{resource.pages ? ` · ${resource.pages}p` : ""}
                    </span>
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{resource.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 flex-grow line-clamp-2">{resource.description}</p>
                {resource.isInternal ? <Link
                  href={resource.href}
                  className="w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  <ExternalLink size={13} /> Open Tool
                </Link> : <button
                  onClick={() => openDownloadGate(reports.find((report) => report.slug === resource.id) || { ...resource, requestOnly: true })}
                  className="w-full flex items-center justify-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  <Download size={13} /> {reports.some((report) => report.slug === resource.id) ? "Download" : "Request Resource"}
                </button>}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 text-center rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-8">
          <h3 className="font-bold text-gray-900 dark:text-white mb-2">Looking for something specific?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Our EPR experts can create custom compliance documents for your business.</p>
          <a href={whatsappUrl('Hi, I need a custom EPR compliance document for my business.')} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition">
            Talk to an Expert <ExternalLink size={14} />
          </a>
        </div>
      </div>

      {selectedReport ? (
        <div className="fixed inset-0 z-50 bg-black/55 px-4 py-8 overflow-y-auto">
          <div role="dialog" aria-modal="true" aria-labelledby="resource-dialog-title" className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-eco-green-4 font-semibold">{selectedReport.requestOnly ? "Resource Request" : "Download Access"}</p>
                <h3 id="resource-dialog-title" className="text-lg font-bold text-gray-900">{selectedReport.title}</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedReport.requestOnly ? "This file is not currently published. Share your details to request it from our team." : "Share your details to prepare a download link."}</p>
              </div>
              <button
                onClick={closeDownloadGate}
                className="inline-flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 h-8 w-8"
                aria-label="Close download form"
              >
                <X size={14} />
              </button>
            </div>

            {!requestComplete && !downloadUrl ? <form onSubmit={submitDownloadRequest} className="space-y-3">
              <input
                autoFocus
                required
                placeholder="Full name"
                value={downloadForm.fullName}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="email"
                required
                placeholder="Email"
                value={downloadForm.email}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, email: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                required
                placeholder="Phone number"
                value={downloadForm.phone}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, phone: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Company (optional)"
                value={downloadForm.company}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, company: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                placeholder="Designation (optional)"
                value={downloadForm.designation}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, designation: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <textarea
                placeholder="What are you looking for in this report? (optional)"
                value={downloadForm.purpose}
                onChange={(e) => setDownloadForm((prev) => ({ ...prev, purpose: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                rows={3}
              />

              {downloadMessage ? (
                <p role="alert" className="text-xs text-red-600">
                  {downloadMessage}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmittingDownload}
                className="w-full rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white py-2 text-sm font-semibold disabled:opacity-60"
              >
                {isSubmittingDownload ? "Submitting..." : selectedReport.requestOnly ? "Send Resource Request" : "Prepare Download"}
              </button>
            </form> : <div role="status" className="space-y-4">
              <p className="text-sm text-emerald-700">{downloadMessage}</p>
              {downloadUrl ? <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-eco-green-4 px-5 py-3 text-sm font-semibold text-white"><Download size={16} />Download File</a> : null}
            </div>}
          </div>
        </div>
      ) : null}
    </section>
  );
}
