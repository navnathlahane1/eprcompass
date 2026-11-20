"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Briefcase, MapPin, Search, SlidersHorizontal, Users } from "lucide-react";
import ConnectModal from "@/components/epr-features/ConnectModal";
import { CategoryBadge, STATES, WASTE_CATEGORIES } from "@/components/epr-features/constants";
import { getLeadAttribution, trackLeadEvent } from "@/lib/leadTracking";

export default function DirectoryHub({ config }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [focusFilter, setFocusFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const [requirementForm, setRequirementForm] = useState({
    name: "",
    email: "",
    phone: "",
    requirement: "",
    website: "",
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const focusOptions = useMemo(() => {
    const set = new Set();
    config.entries.forEach((entry) => {
      entry.focus.forEach((focus) => set.add(focus));
    });
    return [...set].sort();
  }, [config.entries]);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    return config.entries.filter((entry) => {
      if (stateFilter && entry.state !== stateFilter) return false;
      if (categoryFilter && !entry.categories.includes(categoryFilter)) return false;
      if (focusFilter && !entry.focus.includes(focusFilter)) return false;
      if (availabilityFilter && entry.availability !== availabilityFilter) return false;
      if (!q) return true;

      const searchable = [
        entry.name,
        entry.organization,
        entry.state,
        ...entry.focus,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [query, stateFilter, categoryFilter, focusFilter, availabilityFilter, config.entries]);

  const handleRequirementSubmit = async (event) => {
    event.preventDefault();
    setSubmitStatus(null);
    setSubmitMessage("");

    if (!requirementForm.name.trim() || !requirementForm.email.trim() || !requirementForm.phone.trim() || !requirementForm.requirement.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Please fill all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(requirementForm.email.trim())) {
      setSubmitStatus("error");
      setSubmitMessage("Please enter a valid email address.");
      return;
    }

    if (requirementForm.website.trim()) {
      setSubmitStatus("error");
      setSubmitMessage("Request could not be submitted.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/public/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "network_requirement_form",
          source: config.slug,
          lead_surface: `${config.slug}_requirement`,
          name: requirementForm.name.trim(),
          email: requirementForm.email.trim(),
          phone: requirementForm.phone.trim(),
          message: requirementForm.requirement.trim(),
          submitted_at: startedAt,
          website: requirementForm.website,
          selected_state: stateFilter || "not-selected",
          selected_category: categoryFilter || "not-selected",
          selected_focus: focusFilter || "not-selected",
          ...getLeadAttribution(pathname),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not submit request right now.");
      }

      setSubmitStatus("success");
      setSubmitMessage("Requirement submitted. Our network team will contact you shortly.");
      trackLeadEvent("lead_capture_submitted", {
        surface: `${config.slug}_requirement`,
        form_type: "network_requirement_form",
        page_path: pathname || null,
      });
      setRequirementForm({ name: "", email: "", phone: "", requirement: "", website: "" });
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(error?.message || "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-eco-green-4/10 text-eco-green-4 text-xs font-semibold px-3 py-1 rounded-full">
            <Users size={14} /> {config.badge}
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-4 mb-3">{config.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{config.subtitle}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 sm:p-5 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2 relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, company, expertise..."
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(event) => setStateFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All States</option>
              {STATES.map((state) => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All Categories</option>
              {WASTE_CATEGORIES.map((category) => (
                <option key={category.key} value={category.key}>{category.label}</option>
              ))}
            </select>
            <select
              value={focusFilter}
              onChange={(event) => setFocusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All Focus Areas</option>
              {focusOptions.map((focus) => (
                <option key={focus} value={focus}>{focus}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1"><SlidersHorizontal size={14} /> Results: {filteredEntries.length}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAvailabilityFilter(availabilityFilter === "Available" ? "" : "Available")}
                className={`px-2.5 py-1 rounded-full border transition ${availabilityFilter === "Available" ? "border-eco-green-4 text-eco-green-4 bg-eco-green-4/10" : "border-gray-300 dark:border-gray-600"}`}
              >
                Available
              </button>
              <button
                onClick={() => {
                  setQuery("");
                  setStateFilter("");
                  setCategoryFilter("");
                  setFocusFilter("");
                  setAvailabilityFilter("");
                }}
                className="px-2.5 py-1 rounded-full border border-gray-300 dark:border-gray-600"
              >
                Clear filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {filteredEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center bg-white dark:bg-gray-800">
                <Search size={36} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-300">No matches found. Adjust filters and try again.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {filteredEntries.map((entry) => (
                  <article key={entry.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{entry.name}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{entry.organization}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entry.availability === "Available" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"}`}>
                        {entry.availability}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2"><MapPin size={13} /> {entry.state}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3"><Briefcase size={13} /> {entry.experience} years experience</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {entry.categories.map((categoryKey) => (
                        <CategoryBadge key={`${entry.id}-${categoryKey}`} categoryKey={categoryKey} />
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {entry.focus.map((focus) => (
                        <span key={`${entry.id}-${focus}`} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">{focus}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedEntry(entry);
                        setConnectOpen(true);
                      }}
                      className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold py-2 rounded-lg transition"
                    >
                      Connect
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>

          <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 h-fit">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{config.ctaLabel}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Share your requirement and our team will match you with relevant experts.</p>
            <form onSubmit={handleRequirementSubmit} className="space-y-3">
              <input
                value={requirementForm.name}
                onChange={(event) => setRequirementForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Full name *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <input
                type="email"
                value={requirementForm.email}
                onChange={(event) => setRequirementForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <input
                type="tel"
                value={requirementForm.phone}
                onChange={(event) => setRequirementForm((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <textarea
                rows={4}
                value={requirementForm.requirement}
                onChange={(event) => setRequirementForm((prev) => ({ ...prev, requirement: event.target.value }))}
                placeholder="Describe requirement *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none resize-none"
              />
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={requirementForm.website}
                onChange={(event) => setRequirementForm((prev) => ({ ...prev, website: event.target.value }))}
                className="hidden"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-eco-green-4 dark:hover:bg-eco-green-5 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Requirement"}
              </button>
            </form>
            {submitStatus ? (
              <p className={`mt-3 text-xs ${submitStatus === "success" ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                {submitMessage}
              </p>
            ) : null}
          </aside>
        </div>
      </div>

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        recipientName={selectedEntry?.name}
        recipientType={config.recipientType}
      />
    </div>
  );
}
