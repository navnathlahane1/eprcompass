"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { BookOpen, Clock3, Layers, Search, Users } from "lucide-react";
import { CategoryBadge, WASTE_CATEGORIES } from "@/components/epr-features/constants";
import { getLeadAttribution, trackLeadEvent } from "@/lib/leadTracking";

export default function ProgramsHub({ config }) {
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [trackFilter, setTrackFilter] = useState("");
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [startedAt] = useState(() => Date.now());

  const [application, setApplication] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
    website: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState(null);

  const trackOptions = useMemo(() => {
    return [...new Set(config.programs.map((program) => program.track))].sort();
  }, [config.programs]);

  const filteredPrograms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return config.programs.filter((program) => {
      if (categoryFilter && !program.categories.includes(categoryFilter)) return false;
      if (trackFilter && program.track !== trackFilter) return false;
      if (!q) return true;

      const searchable = [program.name, program.track, program.mode, ...program.outcomes].join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [query, categoryFilter, trackFilter, config.programs]);

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!selectedProgram) return;

    if (!application.company.trim() || !application.contactName.trim() || !application.email.trim() || !application.phone.trim()) {
      setSubmitState({ type: "error", message: "Please fill all required fields." });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(application.email.trim())) {
      setSubmitState({ type: "error", message: "Please enter a valid email address." });
      return;
    }

    if (application.website.trim()) {
      setSubmitState({ type: "error", message: "Application could not be submitted." });
      return;
    }

    setSubmitting(true);
    setSubmitState(null);
    try {
      const response = await fetch("/api/public/forms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "service_provider_program_application",
          source: config.slug,
          lead_surface: "service_provider_programs",
          program_name: selectedProgram.name,
          company: application.company.trim(),
          name: application.contactName.trim(),
          email: application.email.trim(),
          phone: application.phone.trim(),
          message: application.message.trim(),
          submitted_at: startedAt,
          website: application.website,
          ...getLeadAttribution(pathname),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Could not submit application right now.");
      }

      setSubmitState({ type: "success", message: "Application submitted successfully. Our team will contact you." });
      trackLeadEvent("lead_capture_submitted", {
        surface: "service_provider_programs",
        form_type: "service_provider_program_application",
        page_path: pathname || null,
      });
      setApplication({ company: "", contactName: "", email: "", phone: "", message: "", website: "" });
      setTimeout(() => {
        setSelectedProgram(null);
        setSubmitState(null);
      }, 1800);
    } catch (error) {
      setSubmitState({ type: "error", message: error?.message || "Submission failed. Please try again." });
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search programs, tracks, outcomes"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
            </div>
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
              value={trackFilter}
              onChange={(event) => setTrackFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All Tracks</option>
              {trackOptions.map((track) => (
                <option key={track} value={track}>{track}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredPrograms.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center bg-white dark:bg-gray-800">
            <Search size={36} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">No programs match the current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPrograms.map((program) => (
              <article key={program.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{program.name}</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-eco-green-4/10 text-eco-green-4 font-medium">{program.track}</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="inline-flex items-center gap-1"><Layers size={13} /> {program.mode}</span>
                  <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {program.duration}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {program.categories.map((category) => (
                    <CategoryBadge key={`${program.id}-${category}`} categoryKey={category} />
                  ))}
                </div>
                <ul className="space-y-1.5 mb-4">
                  {program.outcomes.map((outcome) => (
                    <li key={`${program.id}-${outcome}`} className="text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
                      <BookOpen size={14} className="text-eco-green-4 shrink-0 mt-0.5" />
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => setSelectedProgram(program)}
                  className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  Apply Now
                </button>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedProgram && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setSelectedProgram(null);
                setSubmitState(null);
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              x
            </button>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Apply for {selectedProgram.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Submit details to join this provider growth program.</p>
            <form onSubmit={submitApplication} className="space-y-3">
              <input
                value={application.company}
                onChange={(event) => setApplication((prev) => ({ ...prev, company: event.target.value }))}
                placeholder="Company name *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <input
                value={application.contactName}
                onChange={(event) => setApplication((prev) => ({ ...prev, contactName: event.target.value }))}
                placeholder="Contact person *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <input
                type="email"
                value={application.email}
                onChange={(event) => setApplication((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="Email *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <input
                type="tel"
                value={application.phone}
                onChange={(event) => setApplication((prev) => ({ ...prev, phone: event.target.value }))}
                placeholder="Phone *"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
              />
              <textarea
                rows={4}
                value={application.message}
                onChange={(event) => setApplication((prev) => ({ ...prev, message: event.target.value }))}
                placeholder="Tell us your current services and growth goals"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none resize-none"
              />
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                value={application.website}
                onChange={(event) => setApplication((prev) => ({ ...prev, website: event.target.value }))}
                className="hidden"
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gray-900 hover:bg-gray-800 dark:bg-eco-green-4 dark:hover:bg-eco-green-5 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </button>
            </form>
            {submitState ? (
              <p className={`mt-3 text-xs ${submitState.type === "success" ? "text-green-600 dark:text-green-300" : "text-red-600 dark:text-red-300"}`}>
                {submitState.message}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
