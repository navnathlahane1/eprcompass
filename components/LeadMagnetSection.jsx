"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, Download, ShieldCheck } from "lucide-react";
import { getLeadAttribution, getPageCluster, trackLeadEvent } from "@/lib/leadTracking";

const collateralOptions = [
  "EPR Compliance Starter Kit",
  "CPCB Audit Readiness Checklist",
  "Annual Return Template Pack",
  "EPR Credit Cost Optimizer Sheet",
];

export default function LeadMagnetSection() {
  const pathname = usePathname();
  const cluster = getPageCluster(pathname);
  const copyByCluster = {
    services: {
      title: "Get service-ready EPR playbooks for faster implementation",
      subtitle: "Use execution templates and audit packs tailored for active service workflows.",
      bullets: [
        "Service-side filing workflow checklist with owner mapping",
        "Vendor and recycler documentation readiness template",
        "Escalation matrix for deadline-risk accounts",
      ],
      cta: "Send My Service Pack",
    },
    blog: {
      title: "Download practical templates that turn insights into action",
      subtitle: "Move from reading to execution with checklists and reporting packs your team can use today.",
      bullets: [
        "CPCB audit checklist linked to operational tasks",
        "Quarterly and annual return prep templates",
        "Quick advisor callback to customize your roadmap",
      ],
      cta: "Send My Execution Pack",
    },
    about: {
      title: "Explore our most-used EPR collateral stack",
      subtitle: "See how teams use our compliance frameworks before onboarding.",
      bullets: [
        "Onboarding-ready compliance starter toolkit",
        "Reporting and evidence templates used by real clients",
        "Consultant callback for category-specific planning",
      ],
      cta: "Send My Collateral Pack",
    },
    training: {
      title: "Get training-aligned EPR practice sheets",
      subtitle: "Access templates and checklists aligned with our workshop and webinar modules.",
      bullets: [
        "Session-ready worksheets for filing and target planning",
        "Audit-revision checklists for team practice",
        "Expert callback for implementation support after training",
      ],
      cta: "Send My Training Pack",
    },
    general: {
      title: "Turn your EPR compliance into a predictable growth engine",
      subtitle: "Get practical collaterals your team can use immediately: gap-check templates, audit checklists, reporting packs, and cost optimization sheets.",
      bullets: [
        "CPCB audit-ready checklist for internal reviews",
        "Annual return and tracker templates for faster filings",
        "Expert callback for your custom target and credit strategy",
      ],
      cta: "Send My Resource Pack",
    },
  };
  const activeCopy = copyByCluster[cluster] || copyByCluster.general;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    collateral: collateralOptions[0],
    website: "",
  });
  const [startedAt] = useState(() => Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setStatus("error");
      setMessage("Please provide name, email, and phone.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setStatus("error");
      setMessage("Please enter a valid email.");
      return;
    }

    if (!/^\+?[0-9\s()-]{10,15}$/.test(form.phone.trim())) {
      setStatus("error");
      setMessage("Please enter a valid phone number.");
      return;
    }

    if (form.website.trim()) {
      setStatus("error");
      setMessage("Request could not be processed.");
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setMessage("");

    try {
      const response = await fetch("/api/public/forms/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "contact_form",
          name: form.name,
          email: form.email,
          phone: form.phone,
          company: form.company,
          message: `Requested collateral: ${form.collateral}.`,
          source: "global_inline_lead_magnet",
          lead_surface: "global_inline_lead_magnet",
          lead_cluster: cluster,
          submitted_at: startedAt,
          website: form.website,
          ...getLeadAttribution(pathname),
        }),
      });

      const result = await response.json();
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || "Unable to submit your request.");
      }

      setStatus("success");
      setMessage("Request submitted. Our team will share your resources soon.");
      trackLeadEvent("lead_capture_submitted", {
        surface: "global_inline_lead_magnet",
        cluster,
        form_type: "contact_form",
        page_path: pathname || null,
      });
      setForm((prev) => ({
        ...prev,
        name: "",
        email: "",
        phone: "",
        company: "",
        website: "",
      }));
    } catch (error) {
      setStatus("error");
      setMessage(error?.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-gradient-to-br from-eco-green-4 to-eco-green-3 text-white py-14 px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold mb-4">
            <ShieldCheck size={16} />
            Free Compliance Value Pack
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-3 font-tangent">
            {activeCopy.title}
          </h2>
          <p className="text-white/90 mb-6 max-w-xl">
            {activeCopy.subtitle}
          </p>
          <ul className="space-y-2 text-white/95">
            <li className="inline-flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5" />
              {activeCopy.bullets[0]}
            </li>
            <li className="inline-flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5" />
              {activeCopy.bullets[1]}
            </li>
            <li className="inline-flex items-start gap-2">
              <CheckCircle2 size={18} className="mt-0.5" />
              {activeCopy.bullets[2]}
            </li>
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white text-gray-900 p-6 shadow-2xl border border-white/30"
        >
          <h3 className="text-xl font-bold mb-1">Get your free resources</h3>
          <p className="text-sm text-gray-600 mb-4">
            Share your details and we will send the selected collateral.
          </p>

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Full Name"
              value={form.name}
              onChange={(event) => handleChange("name", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
            <input
              type="email"
              placeholder="Work Email"
              value={form.email}
              onChange={(event) => handleChange("email", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
            <input
              type="text"
              placeholder="Phone Number"
              value={form.phone}
              onChange={(event) => handleChange("phone", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
            <input
              type="text"
              placeholder="Company"
              value={form.company}
              onChange={(event) => handleChange("company", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-eco-green-4 outline-none"
            />
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              placeholder="Website"
              value={form.website}
              onChange={(event) => handleChange("website", event.target.value)}
              className="hidden"
            />
            <select
              value={form.collateral}
              onChange={(event) => handleChange("collateral", event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              {collateralOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {status ? (
            <p className={`mt-3 text-sm ${status === "success" ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-eco-green-4 px-4 py-3 text-white font-semibold hover:bg-eco-green-3 transition disabled:opacity-70"
          >
            <Download size={16} />
            {isSubmitting ? "Submitting..." : activeCopy.cta}
          </button>
        </form>
      </div>
    </section>
  );
}
