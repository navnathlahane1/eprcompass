"use client";

import { useState, useMemo } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
import { WASTE_CATEGORIES, STATES, CategoryBadge } from "./constants";
import ConnectModal from "./ConnectModal";

const MOCK_CONSULTANTS = [
  { id: 1, name: "Rajesh Sharma", state: "Maharashtra", categories: ["plastic", "ewaste", "battery"], experience: 12, availability: "Active" },
  { id: 2, name: "Priya Nair", state: "Karnataka", categories: ["plastic", "tyre", "usedoil"], experience: 8, availability: "Active" },
  { id: 3, name: "Anil Gupta", state: "Delhi", categories: ["ewaste", "battery", "elv"], experience: 15, availability: "Full" },
  { id: 4, name: "Sunita Reddy", state: "Tamil Nadu", categories: ["plastic", "usedoil", "elv"], experience: 6, availability: "Active" },
  { id: 5, name: "Vikram Joshi", state: "Gujarat", categories: ["tyre", "battery", "ewaste"], experience: 10, availability: "Active" },
  { id: 6, name: "Meera Patel", state: "Rajasthan", categories: ["plastic", "elv", "usedoil"], experience: 9, availability: "Full" },
];

export default function CEPCDirectory() {
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);

  const filtered = useMemo(() => {
    return MOCK_CONSULTANTS.filter((c) => {
      if (stateFilter && c.state !== stateFilter) return false;
      if (categoryFilter && !c.categories.includes(categoryFilter)) return false;
      if (availabilityFilter && c.availability !== availabilityFilter) return false;
      return true;
    });
  }, [stateFilter, categoryFilter, availabilityFilter]);

  const uniqueStates = [...new Set(MOCK_CONSULTANTS.map((c) => c.state))].sort();

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full">
            CEPC Network
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            Find a Certified EPR Consultant
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Browse our network of CPCB-verified EPR consultants. Filter by state, waste category, or availability to find the right expert.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-eco-green-4 outline-none"
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-eco-green-4 outline-none"
          >
            <option value="">All Categories</option>
            {WASTE_CATEGORIES.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-eco-green-4 outline-none"
          >
            <option value="">All Availability</option>
            <option value="Active">Active</option>
            <option value="Full">Full</option>
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Search size={40} className="mx-auto mb-3 opacity-50" />
            <p>No consultants match your filters. Try adjusting criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((consultant) => (
              <div
                key={consultant.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-6 hover:border-eco-green-4/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{consultant.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin size={13} /> {consultant.state}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                      consultant.availability === "Active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    }`}
                  >
                    {consultant.availability}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {consultant.categories.map((cat) => (
                    <CategoryBadge key={cat} categoryKey={cat} />
                  ))}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-4">
                  <Briefcase size={13} /> {consultant.experience} years experience
                </p>
                <button
                  onClick={() => {
                    setSelectedConsultant(consultant);
                    setModalOpen(true);
                  }}
                  className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold py-2 rounded-lg transition"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConnectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        recipientName={selectedConsultant?.name}
        recipientType="consultant"
      />
    </section>
  );
}
