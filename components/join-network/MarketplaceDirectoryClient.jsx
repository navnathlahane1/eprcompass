"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Briefcase, MapPin, Search, Users } from "lucide-react";
import ConnectModal from "@/components/epr-features/ConnectModal";
import { parseProfileBio } from "@/lib/marketplaceProfileSchemas";

function tokenize(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanProfileBio(raw) {
  return parseProfileBio(raw).cleanBio;
}

export default function MarketplaceDirectoryClient({ config, initialProfiles }) {
  const [query, setQuery] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [focusFilter, setFocusFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [connectOpen, setConnectOpen] = useState(false);

  const stateOptions = useMemo(() => {
    return [...new Set((initialProfiles || []).map((profile) => profile.state).filter(Boolean))].sort();
  }, [initialProfiles]);

  const categoryOptions = useMemo(() => {
    const bag = new Set();
    (initialProfiles || []).forEach((profile) => {
      (profile.waste_categories || []).forEach((value) => bag.add(value));
    });
    return [...bag].sort();
  }, [initialProfiles]);

  const focusOptions = useMemo(() => {
    const bag = new Set();
    (initialProfiles || []).forEach((profile) => {
      (profile.focus_areas || []).forEach((value) => bag.add(value));
    });
    return [...bag].sort();
  }, [initialProfiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (initialProfiles || []).filter((profile) => {
      if (stateFilter && profile.state !== stateFilter) return false;
      if (categoryFilter && !(profile.waste_categories || []).includes(categoryFilter)) return false;
      if (focusFilter && !(profile.focus_areas || []).includes(focusFilter)) return false;
      if (!q) return true;

      const searchable = [
        profile.full_name,
        profile.company_name,
        profile.state,
        profile.city,
        profile.bio,
        ...(profile.focus_areas || []),
        ...(profile.waste_categories || []),
        ...(profile.services_offered || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [query, stateFilter, categoryFilter, focusFilter, initialProfiles]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-14 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 bg-eco-green-4/10 text-eco-green-4 text-xs font-semibold px-3 py-1 rounded-full">
            <Users size={14} /> Marketplace
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mt-4 mb-3">{config.title}</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">{config.subtitle}</p>
          <div className="mt-5">
            <Link
              href={`/join-network/register/${config.registerType}`}
              className="inline-flex items-center gap-2 rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white px-4 py-2 text-sm font-semibold transition"
            >
              {config.ctaLabel}
            </Link>
          </div>
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
              {stateOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All Categories</option>
              {categoryOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>

            <select
              value={focusFilter}
              onChange={(event) => setFocusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none"
            >
              <option value="">All Focus Areas</option>
              {focusOptions.map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center bg-white dark:bg-gray-800">
            <Search size={36} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-300">No approved profiles found for the selected filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((profile) => (
              <article key={profile.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <div className="mb-3">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white leading-tight">{profile.full_name}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{profile.company_name || "Independent"}</p>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-2"><MapPin size={13} /> {profile.city ? `${profile.city}, ` : ""}{profile.state || "India"}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3"><Briefcase size={13} /> {profile.years_experience != null ? `${profile.years_experience} years` : "Experience not shared"}</p>

                {cleanProfileBio(profile.bio) ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-3">{cleanProfileBio(profile.bio)}</p>
                ) : null}

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(profile.waste_categories || []).slice(0, 4).map((item) => (
                    <span key={`${profile.id}-w-${item}`} className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300">{item}</span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(profile.focus_areas || []).slice(0, 4).map((item) => (
                    <span key={`${profile.id}-f-${item}`} className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-200">{item}</span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href={`/join-network/profile/${profile.id}`}
                    className="text-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    View Profile
                  </Link>
                  <button
                    onClick={() => {
                      setSelected(profile);
                      setConnectOpen(true);
                    }}
                    className="rounded-lg bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold py-2 transition"
                  >
                    Connect
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <ConnectModal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        recipientName={selected?.full_name}
        recipientType="marketplace_profile"
      />
    </div>
  );
}
