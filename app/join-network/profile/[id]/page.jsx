import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerComponentClient } from "@/lib/supabase/createServerComponentClient";
import { parseProfileBio, profileSchemaForListing } from "@/lib/marketplaceProfileSchemas";

function renderList(values = []) {
  if (!values.length) return "Not specified";
  return values.join(", ");
}

export default async function MarketplaceProfileDetailPage({ params }) {
  const { id } = await params;
  const supabase = await createServerComponentClient();

  const { data: profile } = await supabase
    .from("marketplace_profiles")
    .select("id, listing_type, full_name, company_name, email, phone, state, city, bio, years_experience, focus_areas, waste_categories, services_offered, website, approval_status, is_active, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!profile) notFound();

  const parsed = parseProfileBio(profile.bio);
  const schema = profileSchemaForListing(profile.listing_type);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-14 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{profile.full_name}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{profile.company_name || "Independent"}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{profile.city ? `${profile.city}, ` : ""}{profile.state || "India"}</p>
            </div>
            <span className={`text-xs rounded-full px-2.5 py-1 font-semibold ${profile.approval_status === "Approved" ? "bg-green-100 text-green-700" : profile.approval_status === "Rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
              {profile.approval_status}
            </span>
          </div>

          {parsed.cleanBio ? <p className="mt-5 text-gray-700 dark:text-gray-200">{parsed.cleanBio}</p> : null}

          {Object.keys(parsed.extraData || {}).length > 0 ? (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(schema.extraFields || []).map((field) => {
                const value = parsed.extraData?.[field.key];
                if (!value) return null;
                return (
                  <div key={field.key} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <p className="text-xs text-gray-500 mb-1">{field.label}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 mb-1">Experience</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile.years_experience != null ? `${profile.years_experience} years` : "Not specified"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
              <p className="text-xs text-gray-500 mb-1">Contact</p>
              <p className="font-medium text-gray-900 dark:text-white">{profile.email || "-"}</p>
              <p className="text-gray-700 dark:text-gray-300">{profile.phone || "Phone not provided"}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Waste Categories</p>
              <p className="font-medium text-gray-900 dark:text-white">{renderList(profile.waste_categories || [])}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Focus Areas</p>
              <p className="font-medium text-gray-900 dark:text-white">{renderList(profile.focus_areas || [])}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Services Offered</p>
              <p className="font-medium text-gray-900 dark:text-white">{renderList(profile.services_offered || [])}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {profile.website ? (
              <a href={profile.website} target="_blank" rel="noreferrer" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Visit Website
              </a>
            ) : null}
            <Link href="/contact" className="rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white px-4 py-2 text-sm font-semibold">
              Contact Team
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
