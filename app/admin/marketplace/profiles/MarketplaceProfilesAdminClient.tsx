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

type ProfileRow = {
  id: string;
  listing_type: string;
  full_name: string;
  company_name: string | null;
  email: string;
  phone: string | null;
  state: string | null;
  city: string | null;
  approval_status: "Pending" | "Approved" | "Rejected";
  approval_notes: string | null;
  years_experience: number | null;
  focus_areas: string[];
  waste_categories: string[];
  services_offered: string[];
  created_at: string;
  approved_at: string | null;
};

const LISTING_LABELS: Record<string, string> = {
  brand_buyers_marketplace: "Brand / Client Buyers",
  consultants_marketplace: "Consultants Marketplace",
  service_providers_directory: "Service Companies Directory",
  compliance_consultants: "EPR Consultants",
  recyclers_pro_network: "Recyclers & PRO Network",
};

export default function MarketplaceProfilesAdminClient({
  initialRows,
  initialListingFilter = 'All'
}: {
  initialRows: ProfileRow[];
  initialListingFilter?: string;
}) {
  const [rows, setRows] = useState<ProfileRow[]>(initialRows || []);
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [listingFilter, setListingFilter] = useState<string>(initialListingFilter);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    listing_type: "consultants_marketplace",
    full_name: "",
    company_name: "",
    email: "",
    phone: "",
    country: "India",
    state: "",
    city: "",
    bio: "",
    years_experience: "",
    focus_areas: [] as string[],
    waste_categories: [] as string[],
    services_offered: [] as string[],
    extra_data: emptyExtraData(profileSchemaForListing("consultants_marketplace")) as Record<string, string>,
  });
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "All" && row.approval_status !== statusFilter) return false;
      if (listingFilter !== "All" && row.listing_type !== listingFilter) return false;
      if (!q) return true;
      const searchable = [row.full_name, row.company_name, row.email, row.phone, row.state, row.city].filter(Boolean).join(" ").toLowerCase();
      return searchable.includes(q);
    });
  }, [rows, statusFilter, listingFilter, search]);

  const listingOptions = useMemo(() => {
    return Object.keys(LISTING_LABELS);
  }, []);

  const createSchema = useMemo(() => profileSchemaForListing(createForm.listing_type), [createForm.listing_type]);

  async function updateStatus(row: ProfileRow, nextStatus: "Approved" | "Rejected", notes?: string) {
    setSavingId(row.id);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload: any = {
        approval_status: nextStatus,
        approval_notes: notes || null,
      };

      if (nextStatus === "Approved") {
        payload.approved_by_profile_id = user?.id || null;
        payload.approved_at = new Date().toISOString();
      } else {
        payload.approved_by_profile_id = null;
        payload.approved_at = null;
      }

      const { error } = await (supabase as any).from("marketplace_profiles").update(payload).eq("id", row.id);
      if (error) throw error;

      setRows((prev) =>
        prev.map((item) =>
          item.id === row.id
            ? {
                ...item,
                approval_status: nextStatus,
                approval_notes: notes || null,
                approved_at: nextStatus === "Approved" ? payload.approved_at : null,
              }
            : item
        )
      );
    } finally {
      setSavingId(null);
    }
  }

  function toggleArrayField(field: "focus_areas" | "waste_categories" | "services_offered", value: string) {
    setCreateForm((prev) => {
      const has = prev[field].includes(value);
      return {
        ...prev,
        [field]: has ? prev[field].filter((item) => item !== value) : [...prev[field], value],
      };
    });
  }

  async function createMarketplaceUser(event: React.FormEvent) {
    event.preventDefault();
    if (!createForm.full_name.trim() || !createForm.email.trim()) return;

    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const payload = {
        listing_type: createForm.listing_type,
        full_name: createForm.full_name.trim(),
        company_name: createForm.company_name.trim() || null,
        email: createForm.email.trim(),
        phone: createForm.phone.trim() || null,
        state: createForm.state.trim() || null,
        city: createForm.city.trim() || null,
        bio: composeProfileBio(createForm.bio, createForm.extra_data),
        years_experience: createForm.years_experience ? Number(createForm.years_experience) : null,
        focus_areas: createForm.focus_areas,
        waste_categories: createForm.waste_categories,
        services_offered: createForm.services_offered,
        approval_status: "Pending",
        created_by_profile_id: user?.id || null,
      };

      const { data, error } = await (supabase as any)
        .from("marketplace_profiles")
        .insert(payload)
        .select("id, listing_type, full_name, company_name, email, phone, state, city, approval_status, approval_notes, years_experience, focus_areas, waste_categories, services_offered, created_at, approved_at")
        .single();

      if (error) throw error;

      setRows((prev) => [data, ...prev]);
      setCreateForm({
        listing_type: "consultants_marketplace",
        full_name: "",
        company_name: "",
        email: "",
        phone: "",
        country: "",
        state: "",
        city: "",
        bio: "",
        years_experience: "",
        focus_areas: [],
        waste_categories: [],
        services_offered: [],
        extra_data: emptyExtraData(profileSchemaForListing("consultants_marketplace")) as Record<string, string>,
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-lg font-semibold text-slate-100">Marketplace Users</h2>
        <p className="mt-1 text-sm text-slate-400">Approve or reject profile visibility. Only approved profiles appear on public marketplace pages.</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h3 className="text-sm font-semibold text-slate-100">Create Marketplace User (Admin)</h3>
        <form onSubmit={createMarketplaceUser} className="mt-3 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select
              value={createForm.listing_type}
              onChange={(e) => {
                const listingType = e.target.value;
                setCreateForm((p) => ({
                  ...p,
                  listing_type: listingType,
                  focus_areas: [],
                  waste_categories: [],
                  services_offered: [],
                  extra_data: emptyExtraData(profileSchemaForListing(listingType)) as Record<string, string>,
                }));
              }}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {Object.entries(LISTING_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input value={createForm.full_name} onChange={(e) => setCreateForm((p) => ({ ...p, full_name: e.target.value }))} placeholder="Full name *" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            <input type="email" value={createForm.email} onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            <input value={createForm.company_name} onChange={(e) => setCreateForm((p) => ({ ...p, company_name: e.target.value }))} placeholder="Company" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            <input value={createForm.phone} onChange={(e) => setCreateForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            {/* Country selector */}
            <select
              value={createForm.country}
              onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value, state: "" }))}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
            >
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* State: dropdown for India, free text otherwise */}
            {createForm.country === "India" ? (
              <select
                value={createForm.state}
                onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              >
                <option value="">Select State / UT</option>
                {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input value={createForm.state} onChange={(e) => setCreateForm((p) => ({ ...p, state: e.target.value }))} placeholder="State / Province" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
            )}
          </div>

          <textarea
            value={createForm.bio}
            onChange={(e) => setCreateForm((p) => ({ ...p, bio: e.target.value }))}
            placeholder="Business summary"
            rows={3}
            className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(createSchema.extraFields || []).map((field: any) => (
              field.type === "select" ? (
                <select
                  key={field.key}
                  value={createForm.extra_data[field.key] || ""}
                  onChange={(e) => setCreateForm((p) => ({
                    ...p,
                    extra_data: { ...p.extra_data, [field.key]: e.target.value },
                  }))}
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm"
                >
                  <option value="">{field.label}</option>
                  {(field.options || []).map((option: string) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <input
                  key={field.key}
                  type={field.type === "number" ? "number" : "text"}
                  value={createForm.extra_data[field.key] || ""}
                  onChange={(e) => setCreateForm((p) => ({
                    ...p,
                    extra_data: { ...p.extra_data, [field.key]: e.target.value },
                  }))}
                  placeholder={field.placeholder || field.label}
                  className="rounded-md border border-slate-700 px-3 py-2 text-sm"
                />
              )
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{createSchema.categoryLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(createSchema.categoryOptions || MARKETPLACE_WASTE_OPTIONS).map((item) => (
                <button key={item} type="button" onClick={() => toggleArrayField("waste_categories", item)} className={`rounded-full border px-2.5 py-1 text-xs ${createForm.waste_categories.includes(item) ? "border-blue-600 bg-blue-950/30 text-blue-300" : "border-slate-700 text-slate-400"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{createSchema.focusLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(createSchema.focusOptions || MARKETPLACE_FOCUS_OPTIONS).map((item) => (
                <button key={item} type="button" onClick={() => toggleArrayField("focus_areas", item)} className={`rounded-full border px-2.5 py-1 text-xs ${createForm.focus_areas.includes(item) ? "border-blue-600 bg-blue-950/30 text-blue-300" : "border-slate-700 text-slate-400"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{createSchema.servicesLabel}</p>
            <div className="flex flex-wrap gap-2">
              {(createSchema.servicesOptions || MARKETPLACE_SERVICE_OPTIONS).map((item) => (
                <button key={item} type="button" onClick={() => toggleArrayField("services_offered", item)} className={`rounded-full border px-2.5 py-1 text-xs ${createForm.services_offered.includes(item) ? "border-blue-600 bg-blue-950/30 text-blue-300" : "border-slate-700 text-slate-400"}`}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          <button disabled={creating} className="btn-primary">
            {creating ? "Creating..." : "Create Marketplace User"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name/company/email" className="rounded-md border border-slate-700 px-3 py-2 text-sm" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            {['All', 'Pending', 'Approved', 'Rejected'].map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={listingFilter} onChange={(e) => setListingFilter(e.target.value)} className="rounded-md border border-slate-700 px-3 py-2 text-sm">
            <option value="All">All Listings</option>
            {listingOptions.map((item) => <option key={item} value={item}>{LISTING_LABELS[item] || item}</option>)}
          </select>
          <div className="text-sm text-slate-400 flex items-center">Total: {filtered.length}</div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-left text-slate-400">
                <th className="px-2 py-2">User</th>
                <th className="px-2 py-2">Listing</th>
                <th className="px-2 py-2">Location</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Created</th>
                <th className="px-2 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-slate-800/60">
                  <td className="px-2 py-2">
                    <p className="font-semibold text-slate-100">{row.full_name}</p>
                    <p className="text-xs text-slate-500">{row.company_name || "Independent"}</p>
                    <p className="text-xs text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-2 py-2 text-slate-200">{LISTING_LABELS[row.listing_type] || row.listing_type}</td>
                  <td className="px-2 py-2 text-slate-200">{[row.city, row.state].filter(Boolean).join(", ") || "-"}</td>
                  <td className="px-2 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${row.approval_status === "Approved" ? "bg-emerald-900/30 text-emerald-300" : row.approval_status === "Rejected" ? "bg-rose-900/30 text-rose-300" : "bg-amber-900/30 text-amber-300"}`}>
                      {row.approval_status}
                    </span>
                  </td>
                  <td className="px-2 py-2 text-slate-200">{new Date(row.created_at).toLocaleDateString("en-IN")}</td>
                  <td className="px-2 py-2">
                    <div className="flex flex-wrap gap-2">
                      <button disabled={savingId === row.id || row.approval_status === "Approved"} onClick={() => updateStatus(row, "Approved")} className="rounded border border-emerald-700/50 px-2 py-1 text-xs font-semibold text-emerald-300 disabled:opacity-60">Approve</button>
                      <button disabled={savingId === row.id || row.approval_status === "Rejected"} onClick={() => updateStatus(row, "Rejected", "Rejected by admin review")} className="rounded border border-rose-700/50 px-2 py-1 text-xs font-semibold text-rose-300 disabled:opacity-60">Reject</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
