"use client";

import { useState, useMemo } from "react";
import { Factory, Recycle, MapPin, Phone } from "lucide-react";
import { WASTE_CATEGORIES, STATES, CategoryBadge } from "./constants";
import ConnectModal from "./ConnectModal";
import { submitToGoogleScript } from "@/lib/googleScript";

const MOCK_LISTINGS = [
  { id: 1, facilityName: "GreenCycle Plastics", state: "Maharashtra", categories: ["plastic"], type: "buying", capacity: "500 MT/month", contact: "Amit Desai" },
  { id: 2, facilityName: "E-Waste Solutions Pvt Ltd", state: "Karnataka", categories: ["ewaste", "battery"], type: "buying", capacity: "200 MT/month", contact: "Ravi Kumar" },
  { id: 3, facilityName: "TyreTech Recyclers", state: "Tamil Nadu", categories: ["tyre"], type: "selling", capacity: "300 MT/month", contact: "Suresh M" },
  { id: 4, facilityName: "BatteryBank India", state: "Gujarat", categories: ["battery", "elv"], type: "selling", capacity: "150 MT/month", contact: "Neha Shah" },
  { id: 5, facilityName: "OilReclaim Industries", state: "Rajasthan", categories: ["usedoil"], type: "buying", capacity: "100 MT/month", contact: "Karan Singh" },
  { id: 6, facilityName: "EcoPlast Recycling", state: "Delhi", categories: ["plastic", "ewaste"], type: "selling", capacity: "400 MT/month", contact: "Pooja Verma" },
  { id: 7, facilityName: "ReNew Materials", state: "Punjab", categories: ["plastic", "tyre"], type: "buying", capacity: "250 MT/month", contact: "Harpreet S" },
  { id: 8, facilityName: "CircularTech", state: "Telangana", categories: ["ewaste", "battery"], type: "selling", capacity: "180 MT/month", contact: "Srinivas R" },
  { id: 9, facilityName: "Bharat Recyclers", state: "Uttar Pradesh", categories: ["usedoil", "elv"], type: "buying", capacity: "120 MT/month", contact: "Manoj Tiwari" },
  { id: 10, facilityName: "SouthWaste Corp", state: "Kerala", categories: ["plastic"], type: "selling", capacity: "350 MT/month", contact: "Anitha K" },
  { id: 11, facilityName: "MetalLoop Industries", state: "Maharashtra", categories: ["elv", "battery"], type: "buying", capacity: "220 MT/month", contact: "Rahul Patil" },
  { id: 12, facilityName: "Clean Futures Ltd", state: "West Bengal", categories: ["tyre", "usedoil"], type: "selling", capacity: "270 MT/month", contact: "Debashish Roy" },
];

export default function RecyclerConnect() {
  const [tab, setTab] = useState("buying");
  const [stateFilter, setStateFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [listModalOpen, setListModalOpen] = useState(false);
  const [listForm, setListForm] = useState({ facilityName: "", state: "", categories: [], type: "buying", capacity: "", contactName: "", email: "", phone: "" });
  const [listSubmitting, setListSubmitting] = useState(false);
  const [listSubmitted, setListSubmitted] = useState(false);

  const filtered = useMemo(() => {
    return MOCK_LISTINGS.filter((l) => {
      if (l.type !== tab) return false;
      if (stateFilter && l.state !== stateFilter) return false;
      if (categoryFilter && !l.categories.includes(categoryFilter)) return false;
      return true;
    });
  }, [tab, stateFilter, categoryFilter]);

  const uniqueStates = [...new Set(MOCK_LISTINGS.map((l) => l.state))].sort();

  const handleListSubmit = async (e) => {
    e.preventDefault();
    if (!listForm.facilityName || !listForm.state || !listForm.email || !listForm.phone || listForm.categories.length === 0) return;
    setListSubmitting(true);
    try {
      await submitToGoogleScript({
        type: "facility_listing_form",
        ...listForm,
        categories: listForm.categories.join(", "),
        submittedAt: new Date().toISOString(),
      });
      setListSubmitted(true);
      setTimeout(() => { setListModalOpen(false); setListSubmitted(false); }, 2500);
    } catch {
      // silent fail – user can retry
    } finally {
      setListSubmitting(false);
    }
  };

  const toggleListCategory = (key) => {
    setListForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(key)
        ? prev.categories.filter((c) => c !== key)
        : [...prev.categories, key],
    }));
  };

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <span className="bg-eco-green-4/10 text-eco-green-4 text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
            <Recycle size={14} /> Recycler Connect
          </span>
          <h2 className="font-tricks text-3xl md:text-4xl font-bold mt-4 mb-3 text-gray-900 dark:text-white">
            EPR Compass Marketplace
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            Connect with verified recyclers to buy or sell EPR certificates. Filter by waste category and location.
          </p>
        </div>

        {/* Tabs + List CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {["buying", "selling"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-2 text-sm font-semibold capitalize transition ${
                  tab === t
                    ? "bg-eco-green-4 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
              >
                {t === "buying" ? "Buying Certificates" : "Selling Certificates"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setListModalOpen(true)}
            className="bg-eco-green-4 hover:bg-eco-green-5 text-white text-sm font-semibold px-5 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Factory size={14} /> List Your Facility
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-eco-green-4 outline-none"
          >
            <option value="">All States</option>
            {uniqueStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-eco-green-4 outline-none"
          >
            <option value="">All Categories</option>
            {WASTE_CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Factory size={40} className="mx-auto mb-3 opacity-50" />
            <p>No listings found. Try different filters or list your facility.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((listing) => (
              <div
                key={listing.id}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-5 hover:border-eco-green-4/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm">{listing.facilityName}</h3>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    listing.type === "buying"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  }`}>
                    {listing.type}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-3">
                  <MapPin size={12} /> {listing.state}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {listing.categories.map((cat) => <CategoryBadge key={cat} categoryKey={cat} />)}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  Capacity: <strong className="text-gray-700 dark:text-gray-200">{listing.capacity}</strong>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-4">
                  <Phone size={11} /> {listing.contact}
                </p>
                <button
                  onClick={() => { setSelectedFacility(listing); setConnectModalOpen(true); }}
                  className="w-full bg-eco-green-4 hover:bg-eco-green-5 text-white text-xs font-semibold py-2 rounded-lg transition"
                >
                  Connect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Modal */}
      <ConnectModal
        open={connectModalOpen}
        onClose={() => setConnectModalOpen(false)}
        recipientName={selectedFacility?.facilityName}
        recipientType="recycler"
      />

      {/* List Facility Modal */}
      {listModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setListModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition" aria-label="Close">✕</button>
            {listSubmitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Factory className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Listing Submitted!</h3>
                <p className="text-sm text-gray-500">Our team will verify and publish your listing shortly.</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">List Your Facility</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Register as a recycler to buy or sell EPR certificates.</p>
                <form onSubmit={handleListSubmit} className="space-y-3">
                  <input value={listForm.facilityName} onChange={(e) => setListForm((p) => ({ ...p, facilityName: e.target.value }))} placeholder="Facility Name *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
                  <select value={listForm.state} onChange={(e) => setListForm((p) => ({ ...p, state: e.target.value }))} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none">
                    <option value="">Select State *</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">Categories *</label>
                    <div className="flex flex-wrap gap-1.5">
                      {WASTE_CATEGORIES.map((cat) => (
                        <button key={cat.key} type="button" onClick={() => toggleListCategory(cat.key)}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                            listForm.categories.includes(cat.key)
                              ? "border-eco-green-4 bg-eco-green-4/10 text-eco-green-4"
                              : "border-gray-200 dark:border-gray-600 text-gray-500"
                          }`}
                        >{cat.label}</button>
                      ))}
                    </div>
                  </div>
                  <select value={listForm.type} onChange={(e) => setListForm((p) => ({ ...p, type: e.target.value }))} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none">
                    <option value="buying">Buying Certificates</option>
                    <option value="selling">Selling Certificates</option>
                  </select>
                  <input value={listForm.capacity} onChange={(e) => setListForm((p) => ({ ...p, capacity: e.target.value }))} placeholder="Capacity (e.g. 200 MT/month)" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
                  <input value={listForm.contactName} onChange={(e) => setListForm((p) => ({ ...p, contactName: e.target.value }))} placeholder="Contact Name *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
                  <input type="email" value={listForm.email} onChange={(e) => setListForm((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
                  <input type="tel" value={listForm.phone} onChange={(e) => setListForm((p) => ({ ...p, phone: e.target.value }))} placeholder="Phone *" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-eco-green-4 outline-none" />
                  <button type="submit" disabled={listSubmitting} className="w-full bg-eco-green-4 hover:bg-eco-green-5 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition text-sm">
                    {listSubmitting ? "Submitting..." : "Submit Listing"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

