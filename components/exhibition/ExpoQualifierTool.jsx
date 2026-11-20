"use client";

import React, { useMemo, useState } from "react";

const EXHIBITION_INFO = {
  name: "Exhibition Name Pending",
  dates: "Dates Pending",
  location: "Location Pending",
  industryFocus: "Renewable energy, electronics and packaging compliance",
  attendeeTypes: [
    "Manufacturers",
    "Importers",
    "Brand owners",
    "Channel partners",
    "Distributors",
    "Compliance managers"
  ],
  exhibitorsOrSponsors: ["Data unavailable until exhibition URL is added"]
};

const BRAND_LINE = "EPR Compass | IIM Bangalore Alumni Network";
const HEADER_NAME = "EPR Compass";

const BUSINESS_TYPES = [
  "Manufacturer",
  "Importer",
  "Brand Owner",
  "OEM / EMS",
  "Distributor",
  "Retail / E-commerce",
  "Recycler / PRO",
  "Consultant / Service Provider",
  "Other"
];

const REVENUE_RANGES = [
  "Below 5 Cr",
  "5 Cr - 25 Cr",
  "25 Cr - 100 Cr",
  "100 Cr - 500 Cr",
  "500 Cr+",
  "Prefer not to say"
];

function buildProductsByIndustry(industryFocus) {
  const focus = (industryFocus || "").toLowerCase();

  const base = [
    "Solar modules / panels",
    "Lithium battery packs",
    "Lead-acid batteries",
    "Inverters / UPS",
    "EV chargers",
    "Cables & wires",
    "Electronic components",
    "Plastic packaging (rigid)",
    "Plastic packaging (flexible)",
    "MLP packaging"
  ];

  if (focus.includes("solar") || focus.includes("renewable")) {
    return [
      "Solar PV modules",
      "Inverters",
      "Energy storage systems",
      "Lithium battery packs",
      "EV chargers",
      "Cables & connectors",
      "Plastic packaging for components",
      "Electronic control boards"
    ];
  }

  if (focus.includes("battery") || focus.includes("ev")) {
    return [
      "Lithium battery packs",
      "Lead-acid batteries",
      "Battery management systems",
      "Chargers and adapters",
      "EV chargers",
      "Wiring harnesses",
      "Power electronics",
      "Plastic packaging"
    ];
  }

  if (focus.includes("packaging") || focus.includes("plastic")) {
    return [
      "Rigid plastic packaging",
      "Flexible plastic packaging",
      "Multilayer packaging",
      "Compostable packaging",
      "Label and laminate structures",
      "Secondary / tertiary packaging",
      "Imported packaged products"
    ];
  }

  return base;
}

function toCsv(logs) {
  const headers = ["timestamp", "company", "categories", "urgency", "needs_epr", "confidence"];
  const rows = logs.map((item) => [
    item.timestamp,
    item.company,
    item.categories.join(" | "),
    item.urgency,
    String(item.needs_epr),
    String(item.confidence)
  ]);

  return [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell || "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function ResultCard({ result, onCopy }) {
  if (!result) return null;

  const isYes = Boolean(result.needs_epr);
  const verdictClass = isYes
    ? "border-red-200 bg-red-50 text-red-800"
    : "border-emerald-200 bg-emerald-50 text-emerald-800";

  const urgencyClass =
    result.urgency_level === "Hot"
      ? "bg-red-100 text-red-700"
      : result.urgency_level === "Warm"
      ? "bg-amber-100 text-amber-800"
      : "bg-emerald-100 text-emerald-800";

  return (
    <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className={`rounded-lg border p-3 ${verdictClass}`}>
        <p className="text-xs font-semibold uppercase tracking-wide">EPR Verdict</p>
        <p className="mt-1 text-lg font-bold">{isYes ? "Needs EPR: Yes" : "Needs EPR: No"}</p>
        <p className="mt-1 text-sm">{result.verdict_reason}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {safeArray(result.categories).map((cat) => (
          <span
            key={cat}
            className="rounded-full border border-green-700 bg-green-50 px-3 py-1 text-xs font-medium text-green-800"
          >
            {cat}
          </span>
        ))}
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${urgencyClass}`}>
          {result.urgency_level || "Cold"} Lead
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Penalty Exposure</p>
          <p className="mt-1 text-base font-bold text-red-800">{result.penalty_amount || "Not specified"}</p>
          <p className="mt-1 text-sm text-red-700">{result.penalty_details}</p>
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Urgency Reason</p>
          <p className="mt-1 text-sm text-amber-800">{result.urgency_reason}</p>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Pain Question</p>
          <button
            type="button"
            onClick={() => onCopy(result.pain_question)}
            className="rounded-md bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800"
          >
            Copy
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-800">{result.pain_question}</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">3-Sentence Pitch</p>
          <button
            type="button"
            onClick={() => onCopy(result.pitch)}
            className="rounded-md bg-green-700 px-2 py-1 text-xs font-semibold text-white hover:bg-green-800"
          >
            Copy
          </button>
        </div>
        <p className="mt-2 whitespace-pre-line text-sm text-gray-800">{result.pitch}</p>
      </div>

      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Objection Handling</p>
        <p className="mt-2 text-sm text-gray-800">
          <span className="font-semibold">Likely objection:</span> {result.likely_objection}
        </p>
        <p className="mt-1 text-sm text-gray-800">
          <span className="font-semibold">Response:</span> {result.objection_handle}
        </p>
      </div>
    </section>
  );
}

export default function ExpoQualifierTool() {
  const [activeTab, setActiveTab] = useState("qualifier");
  const [form, setForm] = useState({
    companyName: "",
    whatTheyDo: "",
    businessType: "",
    revenueRange: "",
    products: []
  });
  const [result, setResult] = useState(null);
  const [leadLogs, setLeadLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const products = useMemo(
    () => buildProductsByIndustry(EXHIBITION_INFO.industryFocus),
    []
  );

  function toggleProduct(product) {
    setForm((prev) => {
      const exists = prev.products.includes(product);
      const productsList = exists
        ? prev.products.filter((item) => item !== product)
        : [...prev.products, product];
      return { ...prev, products: productsList };
    });
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setCopyStatus("");

    if (!form.companyName || !form.whatTheyDo || !form.businessType || form.products.length === 0) {
      setError("Please fill mandatory fields and pick at least one product.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/exhibition/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exhibition: EXHIBITION_INFO,
          lead: form
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Analysis failed");
      }

      const analysis = payload.analysis;
      setResult(analysis);

      const logItem = {
        timestamp: new Date().toLocaleString(),
        company: form.companyName,
        categories: safeArray(analysis.categories),
        urgency: analysis.urgency_level || "Cold",
        needs_epr: Boolean(analysis.needs_epr),
        confidence: analysis.confidence || 0
      };

      setLeadLogs((prev) => [logItem, ...prev]);
      setActiveTab("qualifier");
    } catch (submitError) {
      setError(submitError.message || "Unable to analyze lead");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy(text) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("Copied");
      setTimeout(() => setCopyStatus(""), 1500);
    } catch {
      setCopyStatus("Copy failed");
      setTimeout(() => setCopyStatus(""), 1500);
    }
  }

  function exportLogs() {
    if (!leadLogs.length) return;
    const csv = toCsv(leadLogs);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expo-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 rounded-2xl border border-gray-200 bg-white p-4 md:p-6">
      <header className="rounded-xl border border-green-200 bg-green-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Exhibition Qualifier</p>
        <h1 className="mt-1 text-xl font-bold text-green-900 md:text-2xl">{EXHIBITION_INFO.name}</h1>
        <p className="mt-1 text-sm text-green-800">
          {EXHIBITION_INFO.dates} | {EXHIBITION_INFO.location}
        </p>
        <p className="mt-2 text-sm font-medium text-green-900">{HEADER_NAME} | {BRAND_LINE}</p>
      </header>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("qualifier")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            activeTab === "qualifier"
              ? "bg-green-700 text-white"
              : "border border-gray-300 bg-white text-gray-700"
          }`}
        >
          Lead Qualifier
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("logs")}
          className={`rounded-md px-3 py-2 text-sm font-semibold ${
            activeTab === "logs"
              ? "bg-green-700 text-white"
              : "border border-gray-300 bg-white text-gray-700"
          }`}
        >
          Lead Log
        </button>
      </div>

      {activeTab === "qualifier" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Company name</label>
              <input
                name="companyName"
                value={form.companyName}
                onChange={updateField}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none"
                placeholder="ABC Energies Pvt Ltd"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">What they do</label>
              <textarea
                name="whatTheyDo"
                value={form.whatTheyDo}
                onChange={updateField}
                rows={4}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none"
                placeholder="Describe products, customer segment, manufacturing/import details"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Business type</label>
                <select
                  name="businessType"
                  value={form.businessType}
                  onChange={updateField}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none"
                >
                  <option value="">Select</option>
                  {BUSINESS_TYPES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Revenue range</label>
                <select
                  name="revenueRange"
                  value={form.revenueRange}
                  onChange={updateField}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-700 focus:outline-none"
                >
                  <option value="">Select</option>
                  {REVENUE_RANGES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Products involved</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {products.map((product) => (
                  <label key={product} className="flex items-start gap-2 rounded-md border border-gray-200 p-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={form.products.includes(product)}
                      onChange={() => toggleProduct(product)}
                      className="mt-0.5 h-4 w-4 accent-green-700"
                    />
                    <span>{product}</span>
                  </label>
                ))}
              </div>
            </div>

            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {copyStatus ? <p className="text-sm text-green-700">{copyStatus}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyzing lead..." : "Analyze lead now"}
            </button>
          </form>

          <ResultCard result={result} onCopy={handleCopy} />
        </div>
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-gray-900">Lead Log</h2>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={exportLogs}
                className="rounded-md bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
                disabled={!leadLogs.length}
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={() => setLeadLogs([])}
                className="rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                disabled={!leadLogs.length}
              >
                Clear Session
              </button>
            </div>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="px-2 py-2">Company</th>
                  <th className="px-2 py-2">EPR Categories</th>
                  <th className="px-2 py-2">Urgency</th>
                  <th className="px-2 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {leadLogs.map((log) => (
                  <tr key={`${log.company}-${log.timestamp}`} className="border-b border-gray-100 text-gray-800">
                    <td className="px-2 py-2 font-medium">{log.company}</td>
                    <td className="px-2 py-2">{log.categories.join(", ") || "N/A"}</td>
                    <td className="px-2 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          log.urgency === "Hot"
                            ? "bg-red-100 text-red-700"
                            : log.urgency === "Warm"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {log.urgency}
                      </span>
                    </td>
                    <td className="px-2 py-2">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!leadLogs.length ? (
              <p className="py-6 text-center text-sm text-gray-500">No qualified leads in this session yet.</p>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

