"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { MARKETPLACE_FOCUS_OPTIONS, MARKETPLACE_SERVICE_OPTIONS, MARKETPLACE_WASTE_OPTIONS } from "@/lib/marketplaceDirectory";
import {
  composeProfileBio,
  emptyExtraData,
  profileSchemaForListing,
} from "@/lib/marketplaceProfileSchemas";
import { INDIA_STATES_UTS, COUNTRIES } from "@/lib/indiaGeo";

export default function MarketplaceRegistrationClient({ config }) {
  const schema = profileSchemaForListing(config.listingType);
  const [form, setForm] = useState({
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    country: "India",
    state: "",
    city: "",
    years_experience: "",
    website: "",
    bio: "",
    focus_areas: [],
    waste_categories: [],
    services_offered: [],
    valid_documents: [],
    plant_permissions: [],
    interested_in: [],
    extra_data: emptyExtraData(schema),
  });

  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const canSubmit = useMemo(() => {
    return Boolean(form.full_name.trim() && form.email.trim());
  }, [form]);

  function toggleFromList(field, value) {
    setForm((prev) => {
      const existing = prev[field] || [];
      const has = existing.includes(value);
      return {
        ...prev,
        [field]: has ? existing.filter((item) => item !== value) : [...existing, value],
      };
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setStatus(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        listing_type: config.listingType,
        full_name: form.full_name.trim(),
        company_name: form.company_name.trim() || null,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        state: form.state.trim() || null,
        city: form.city.trim() || null,
        bio: composeProfileBio(form.bio, {
          ...form.extra_data,
          country: form.country || "India",
          valid_documents: form.valid_documents.join(", ") || undefined,
          plant_permissions: form.plant_permissions.join(", ") || undefined,
          interested_in: form.interested_in.join(", ") || undefined,
        }),
        years_experience: form.years_experience ? Number(form.years_experience) : null,
        focus_areas: form.focus_areas,
        waste_categories: form.waste_categories,
        services_offered: form.services_offered,
        website: form.website.trim() || null,
        created_by_profile_id: user?.id || null,
        approval_status: "Pending",
      };

      const { error } = await supabase.from("marketplace_profiles").insert(payload);
      if (error) throw error;

      setStatus({ type: "success", message: "Registration submitted. Your profile will be visible after admin approval." });
      setForm({
        full_name: "",
        company_name: "",
        email: "",
        phone: "",
        country: "India",
        state: "",
        city: "",
        years_experience: "",
        website: "",
        bio: "",
        focus_areas: [],
        waste_categories: [],
        services_offered: [],
        valid_documents: [],
        plant_permissions: [],
        interested_in: [],
        extra_data: emptyExtraData(schema),
      });
    } catch (error) {
      setStatus({ type: "error", message: error?.message || "Could not submit registration." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-14 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{config.title}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{config.subtitle}</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name *" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              <input value={form.company_name} onChange={(e) => setForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Company name" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              <input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              <input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              {/* Country selector — defaults to India */}
              <select
                value={form.country}
                onChange={(e) => setForm((p) => ({ ...p, country: e.target.value, state: "" }))}
                className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
              >
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {/* State: dropdown for India, free-text for other countries */}
              {form.country === "India" ? (
                <select
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                >
                  <option value="">Select State / UT</option>
                  {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              ) : (
                <input
                  value={form.state}
                  onChange={(e) => setForm((p) => ({ ...p, state: e.target.value }))}
                  placeholder="State / Province"
                  className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                />
              )}
              <input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} placeholder="City" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              <input type="number" min={0} value={form.years_experience} onChange={(e) => setForm((p) => ({ ...p, years_experience: e.target.value }))} placeholder="Years of experience" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />
              <input value={form.website} onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))} placeholder="Website" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm" />

              {(schema.extraFields || []).map((field) => (
                field.type === "select" ? (
                  <select
                    key={field.key}
                    value={form.extra_data[field.key] || ""}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      extra_data: { ...p.extra_data, [field.key]: e.target.value },
                    }))}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                  >
                    <option value="">{field.label}</option>
                    {(field.options || []).map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    key={field.key}
                    type={field.type === "number" ? "number" : "text"}
                    value={form.extra_data[field.key] || ""}
                    onChange={(e) => setForm((p) => ({
                      ...p,
                      extra_data: { ...p.extra_data, [field.key]: e.target.value },
                    }))}
                    placeholder={field.placeholder || field.label}
                    className="rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm"
                  />
                )
              ))}
            </div>

            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={4} placeholder="Short profile bio" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent px-3 py-2 text-sm resize-none" />

            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.categoryLabel}</p>
              <div className="flex flex-wrap gap-2">
                {(schema.categoryOptions || MARKETPLACE_WASTE_OPTIONS).map((item) => (
                  <button key={item} type="button" onClick={() => toggleFromList("waste_categories", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.waste_categories.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.focusLabel}</p>
              <div className="flex flex-wrap gap-2">
                {(schema.focusOptions || MARKETPLACE_FOCUS_OPTIONS).map((item) => (
                  <button key={item} type="button" onClick={() => toggleFromList("focus_areas", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.focus_areas.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.servicesLabel}</p>
              <div className="flex flex-wrap gap-2">
                {(schema.servicesOptions || MARKETPLACE_SERVICE_OPTIONS).map((item) => (
                  <button key={item} type="button" onClick={() => toggleFromList("services_offered", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.services_offered.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Valid Documents — shown when schema provides these options */}
            {schema.validDocumentsOptions && (
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.validDocumentsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {schema.validDocumentsOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleFromList("valid_documents", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.valid_documents.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Plant Permission Categories */}
            {schema.plantPermissionsOptions && (
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.plantPermissionsLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {schema.plantPermissionsOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleFromList("plant_permissions", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.plant_permissions.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interested In Services */}
            {schema.interestedInOptions && (
              <div>
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{schema.interestedInLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {schema.interestedInOptions.map((item) => (
                    <button key={item} type="button" onClick={() => toggleFromList("interested_in", item)} className={`px-2.5 py-1 text-xs rounded-full border ${form.interested_in.includes(item) ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4" : "border-gray-300 dark:border-gray-600"}`}>
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button disabled={!canSubmit || submitting} type="submit" className="w-full rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white font-semibold py-2.5 disabled:opacity-60">
              {submitting ? "Submitting..." : "Submit Registration"}
            </button>
          </form>

          {status ? (
            <p className={`mt-4 text-sm ${status.type === "success" ? "text-green-600" : "text-red-600"}`}>{status.message}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
