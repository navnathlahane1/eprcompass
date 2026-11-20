"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

const CRM_DATA = {
  contacts: [
    {
      id: "c1",
      company: "GreenLoop Packaging Pvt Ltd",
      gstin: "27AABCG4512M1Z4",
      type: "PIBO",
      state: "Maharashtra",
      person: "Rohit Bansal",
      email: "rohit@greenloop.in",
      phone: "+91-9876543210",
      wasteCategories: ["Plastic"],
      assignedTo: "Aditi Sharma",
      status: "Active",
      ltv_inr: 1850000,
      lastContact: "2026-04-10",
      nextFollowUp: "2026-04-19",
      tags: ["Key Account", "High Volume"],
    },
    {
      id: "c2",
      company: "EcoVolt Batteries India",
      gstin: "29AACCE1102Q1Z8",
      type: "Importer",
      state: "Karnataka",
      person: "Nitesh Sinha",
      email: "nitesh@ecovolt.in",
      phone: "+91-9988776655",
      wasteCategories: ["Battery"],
      assignedTo: "Nikhil Verma",
      status: "Prospect",
      ltv_inr: 920000,
      lastContact: "2026-04-06",
      nextFollowUp: "2026-04-14",
      tags: ["Battery EPR", "Proposal Sent"],
    },
    {
      id: "c3",
      company: "UrbanTyre Circular LLP",
      gstin: "07AACCU7819R1ZL",
      type: "Recycler",
      state: "Delhi",
      person: "Megha Tandon",
      email: "megha@urbantyre.in",
      phone: "+91-9811122233",
      wasteCategories: ["Tyre"],
      assignedTo: "Aditi Sharma",
      status: "At-Risk",
      ltv_inr: 640000,
      lastContact: "2026-03-28",
      nextFollowUp: "2026-04-11",
      tags: ["Renewal Pending", "Compliance Gap"],
    },
    {
      id: "c4",
      company: "ReNova E-Waste Processors",
      gstin: "33AAECR2201F1Z9",
      type: "Recycler",
      state: "Tamil Nadu",
      person: "Vikram Iyer",
      email: "vikram@renovaewaste.com",
      phone: "+91-9003002200",
      wasteCategories: ["E-Waste"],
      assignedTo: "Priya Nair",
      status: "Active",
      ltv_inr: 1260000,
      lastContact: "2026-04-15",
      nextFollowUp: "2026-04-24",
      tags: ["SLA", "Fast Turnaround"],
    },
    {
      id: "c5",
      company: "Pragati FMCG Brands",
      gstin: "24AABCP8822L1ZP",
      type: "PIBO",
      state: "Gujarat",
      person: "Harsh Desai",
      email: "harsh@pragatifmcg.com",
      phone: "+91-9925004400",
      wasteCategories: ["Plastic"],
      assignedTo: "Nikhil Verma",
      status: "Lead",
      ltv_inr: 0,
      lastContact: "2026-04-16",
      nextFollowUp: "2026-04-20",
      tags: ["New Inbound", "Tier-1"],
    },
    {
      id: "c6",
      company: "BlueRiver Imports",
      gstin: "19AACCB6541H1Z2",
      type: "Importer",
      state: "West Bengal",
      person: "Saurabh Mitra",
      email: "saurabh@blueriver.in",
      phone: "+91-9830044411",
      wasteCategories: ["Plastic", "E-Waste"],
      assignedTo: "Priya Nair",
      status: "Churned",
      ltv_inr: 380000,
      lastContact: "2026-02-21",
      nextFollowUp: "2026-04-05",
      tags: ["Price Sensitive"],
    },
    {
      id: "c7",
      company: "BatteryKart Mobility",
      gstin: "36AACCB9201K1ZR",
      type: "PIBO",
      state: "Telangana",
      person: "Ananya Reddy",
      email: "ananya@batterykart.in",
      phone: "+91-9701234567",
      wasteCategories: ["Battery"],
      assignedTo: "Aditi Sharma",
      status: "Active",
      ltv_inr: 1480000,
      lastContact: "2026-04-12",
      nextFollowUp: "2026-04-18",
      tags: ["Priority", "Quarterly Filing"],
    },
    {
      id: "c8",
      company: "EcoCycle Polymers",
      gstin: "09AACCE3310D1ZX",
      type: "Recycler",
      state: "Uttar Pradesh",
      person: "Kunal Srivastava",
      email: "kunal@ecocycle.in",
      phone: "+91-9450012345",
      wasteCategories: ["Plastic", "Tyre"],
      assignedTo: "Nikhil Verma",
      status: "Prospect",
      ltv_inr: 710000,
      lastContact: "2026-04-08",
      nextFollowUp: "2026-04-17",
      tags: ["Capacity Expansion"],
    },
  ],

  deals: [
    {
      id: "d1",
      contactId: "c1",
      service: "Plastic EPR Annual Filing",
      value_inr: 520000,
      stage: "Negotiation",
      probability: 80,
      expectedClose: "2026-04-27",
      createdAt: "2026-03-29",
    },
    {
      id: "d2",
      contactId: "c2",
      service: "Battery EPR Registration",
      value_inr: 350000,
      stage: "Proposal",
      probability: 60,
      expectedClose: "2026-04-30",
      createdAt: "2026-04-01",
    },
    {
      id: "d3",
      contactId: "c3",
      service: "Tyre Waste Compliance Audit",
      value_inr: 280000,
      stage: "Qualified",
      probability: 45,
      expectedClose: "2026-05-05",
      createdAt: "2026-03-20",
    },
    {
      id: "d4",
      contactId: "c4",
      service: "E-Waste EPR Credit Support",
      value_inr: 610000,
      stage: "Won",
      probability: 100,
      expectedClose: "2026-04-12",
      createdAt: "2026-03-14",
    },
    {
      id: "d5",
      contactId: "c5",
      service: "Plastic EPR Onboarding",
      value_inr: 190000,
      stage: "New",
      probability: 25,
      expectedClose: "2026-05-08",
      createdAt: "2026-04-15",
    },
    {
      id: "d6",
      contactId: "c6",
      service: "Importer Compliance Retainer",
      value_inr: 300000,
      stage: "Lost",
      probability: 0,
      expectedClose: "2026-03-18",
      createdAt: "2026-02-19",
    },
    {
      id: "d7",
      contactId: "c7",
      service: "Battery EPR Quarterly Filing",
      value_inr: 470000,
      stage: "Negotiation",
      probability: 75,
      expectedClose: "2026-04-25",
      createdAt: "2026-03-30",
    },
    {
      id: "d8",
      contactId: "c8",
      service: "Recycler Partnership Program",
      value_inr: 260000,
      stage: "Qualified",
      probability: 50,
      expectedClose: "2026-05-01",
      createdAt: "2026-04-02",
    },
  ],

  activities: [
    {
      id: "a1",
      contactId: "c1",
      type: "Call",
      note: "Discussed filing timeline for Q1 plastic obligations.",
      date: "2026-04-10",
      doneBy: "Aditi Sharma",
      outcome: "Client approved revised schedule",
    },
    {
      id: "a2",
      contactId: "c2",
      type: "Email",
      note: "Shared proposal document and onboarding checklist.",
      date: "2026-04-06",
      doneBy: "Nikhil Verma",
      outcome: "Waiting for legal approval",
    },
    {
      id: "a3",
      contactId: "c3",
      type: "Meeting",
      note: "Risk review meeting for pending tyre filings.",
      date: "2026-04-03",
      doneBy: "Aditi Sharma",
      outcome: "Escalated to compliance team",
    },
    {
      id: "a4",
      contactId: "c4",
      type: "WhatsApp",
      note: "Sent final invoice and payment reminder.",
      date: "2026-04-12",
      doneBy: "Priya Nair",
      outcome: "Payment confirmed",
    },
    {
      id: "a5",
      contactId: "c5",
      type: "Call",
      note: "Initial discovery call for FMCG packaging profile.",
      date: "2026-04-16",
      doneBy: "Nikhil Verma",
      outcome: "Lead qualified",
    },
    {
      id: "a6",
      contactId: "c6",
      type: "Email",
      note: "Retention offer shared after churn signal.",
      date: "2026-04-01",
      doneBy: "Priya Nair",
      outcome: "No response",
    },
    {
      id: "a7",
      contactId: "c7",
      type: "Filing",
      note: "Uploaded battery return support documents.",
      date: "2026-04-11",
      doneBy: "Aditi Sharma",
      outcome: "Filed successfully",
    },
    {
      id: "a8",
      contactId: "c8",
      type: "Meeting",
      note: "Capacity planning call with recycler operations head.",
      date: "2026-04-08",
      doneBy: "Nikhil Verma",
      outcome: "Need revised commercial terms",
    },
    {
      id: "a9",
      contactId: "c1",
      type: "WhatsApp",
      note: "Shared draft compliance tracker.",
      date: "2026-04-13",
      doneBy: "Aditi Sharma",
      outcome: "Client acknowledged",
    },
    {
      id: "a10",
      contactId: "c4",
      type: "Call",
      note: "Post-closure onboarding call.",
      date: "2026-04-14",
      doneBy: "Priya Nair",
      outcome: "Kickoff date finalized",
    },
  ],

  pipeline: ["New", "Qualified", "Proposal", "Negotiation", "Won", "Lost"],
};

const STATUS_COLORS = {
  Lead: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  Prospect: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  Active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  "At-Risk": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  Churned: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

const CATEGORY_COLORS = {
  Plastic: "bg-sky-100 border-sky-300 text-sky-900 dark:bg-sky-900/30 dark:border-sky-700 dark:text-sky-200",
  "E-Waste":
    "bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-200",
  Battery: "bg-amber-100 border-amber-300 text-amber-900 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200",
  Tyre: "bg-emerald-100 border-emerald-300 text-emerald-900 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-200",
};

const PIE_COLORS = ["#0ea5e9", "#a855f7", "#f59e0b", "#10b981"];
const ACTIVITY_TYPES = ["Call", "Email", "WhatsApp", "Meeting", "Filing"];

const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const daysBetween = (from, to = new Date()) => {
  const f = new Date(from);
  const t = new Date(to);
  return Math.max(0, Math.floor((t - f) / (1000 * 60 * 60 * 24)));
};

const stageOrder = CRM_DATA.pipeline;

export default function CRMModule() {
  const [activeTab, setActiveTab] = useState("pipeline");
  const [dismissedNudges, setDismissedNudges] = useState([]);
  const [contactSearch, setContactSearch] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterWaste, setFilterWaste] = useState("All");
  const [expandedContactId, setExpandedContactId] = useState(null);

  const [activityFilter, setActivityFilter] = useState("All");
  const [activities, setActivities] = useState(CRM_DATA.activities);
  const [activityForm, setActivityForm] = useState({
    contactId: CRM_DATA.contacts[0]?.id || "",
    type: "Call",
    note: "",
    date: new Date().toISOString().slice(0, 10),
    doneBy: "Aditi Sharma",
  });

  const contactsById = useMemo(
    () =>
      Object.fromEntries(CRM_DATA.contacts.map((c) => [c.id, c])),
    []
  );

  const dealsByStage = useMemo(() => {
    const grouped = Object.fromEntries(stageOrder.map((s) => [s, []]));
    for (const d of CRM_DATA.deals) grouped[d.stage].push(d);
    return grouped;
  }, []);

  const activePipelineDeals = useMemo(
    () => CRM_DATA.deals.filter((d) => !["Won", "Lost"].includes(d.stage)),
    []
  );

  const conversionRate = useMemo(() => {
    const won = CRM_DATA.deals.filter((d) => d.stage === "Won").length;
    const closed = CRM_DATA.deals.filter((d) =>
      ["Won", "Lost"].includes(d.stage)
    ).length;
    return closed ? (won / closed) * 100 : 0;
  }, []);

  const avgDealSize = useMemo(() => {
    if (!CRM_DATA.deals.length) return 0;
    return (
      CRM_DATA.deals.reduce((sum, d) => sum + d.value_inr, 0) / CRM_DATA.deals.length
    );
  }, []);

  const avgDaysToClose = useMemo(() => {
    const wonDeals = CRM_DATA.deals.filter((d) => d.stage === "Won");
    if (!wonDeals.length) return 0;
    const total = wonDeals.reduce(
      (sum, d) => sum + daysBetween(d.createdAt, d.expectedClose),
      0
    );
    return total / wonDeals.length;
  }, []);

  const kpiTotalPipeline = useMemo(
    () => activePipelineDeals.reduce((sum, d) => sum + d.value_inr, 0),
    [activePipelineDeals]
  );

  const stageBarData = useMemo(
    () =>
      stageOrder.map((stage) => ({
        stage,
        count: dealsByStage[stage]?.length || 0,
      })),
    [dealsByStage]
  );

  const revenueByWasteData = useMemo(() => {
    const agg = { Plastic: 0, "E-Waste": 0, Battery: 0, Tyre: 0 };
    for (const deal of CRM_DATA.deals) {
      const contact = contactsById[deal.contactId];
      const primary = contact?.wasteCategories?.[0] || "Plastic";
      agg[primary] += deal.value_inr;
    }
    return Object.entries(agg).map(([name, value]) => ({ name, value }));
  }, [contactsById]);

  const leadsLast6Months = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        month: dt.toLocaleString("en-IN", { month: "short" }),
        leads: 0,
      });
    }

    for (const d of CRM_DATA.deals) {
      const created = new Date(d.createdAt);
      const key = `${created.getFullYear()}-${String(created.getMonth() + 1).padStart(2, "0")}`;
      const match = months.find((m) => m.key === key);
      if (match) match.leads += 1;
    }

    return months.map(({ month, leads }) => ({ month, leads }));
  }, []);

  const topDeals = useMemo(
    () =>
      [...CRM_DATA.deals]
        .sort((a, b) => b.value_inr - a.value_inr)
        .slice(0, 5)
        .map((d) => ({ ...d, company: contactsById[d.contactId]?.company || "Unknown" })),
    [contactsById]
  );

  const uniqueWaste = useMemo(
    () => ["All", ...Array.from(new Set(CRM_DATA.contacts.flatMap((c) => c.wasteCategories)))],
    []
  );

  const filteredContacts = useMemo(() => {
    return CRM_DATA.contacts.filter((c) => {
      const matchesSearch = c.company.toLowerCase().includes(contactSearch.toLowerCase());
      const matchesType = filterType === "All" || c.type === filterType;
      const matchesStatus = filterStatus === "All" || c.status === filterStatus;
      const matchesWaste =
        filterWaste === "All" || c.wasteCategories.includes(filterWaste);
      return matchesSearch && matchesType && matchesStatus && matchesWaste;
    });
  }, [contactSearch, filterType, filterStatus, filterWaste]);

  const filteredActivities = useMemo(() => {
    const list =
      activityFilter === "All"
        ? activities
        : activities.filter((a) => a.type === activityFilter);
    return [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [activities, activityFilter]);

  const nudges = useMemo(() => {
    const now = new Date();

    const overdueFollowups = CRM_DATA.contacts.filter(
      (c) => new Date(c.nextFollowUp) < now
    ).length;

    const stalledDeals = CRM_DATA.deals.filter(
      (d) => !["Won", "Lost"].includes(d.stage) && daysBetween(d.createdAt, now) > 14
    ).length;

    const atRiskClients = CRM_DATA.contacts.filter((c) => c.status === "At-Risk").length;

    const wonThisMonthDeals = CRM_DATA.deals.filter((d) => {
      const close = new Date(d.expectedClose);
      return (
        d.stage === "Won" &&
        close.getMonth() === now.getMonth() &&
        close.getFullYear() === now.getFullYear()
      );
    });

    const wonRevenue = wonThisMonthDeals.reduce((sum, d) => sum + d.value_inr, 0);
    const wonRevenueL = (wonRevenue / 100000).toFixed(1);

    return [
      { id: "n1", text: `⚠ ${overdueFollowups} follow-ups overdue` },
      { id: "n2", text: `🕐 ${stalledDeals} deals stalled` },
      { id: "n3", text: `🔴 ${atRiskClients} clients need attention` },
      { id: "n4", text: `✅ ${wonThisMonthDeals.length} deals closed — ₹${wonRevenueL}L revenue` },
    ];
  }, []);

  const visibleNudges = nudges.filter((n) => !dismissedNudges.includes(n.id));

  const addActivity = (e) => {
    e.preventDefault();
    if (!activityForm.contactId || !activityForm.type || !activityForm.note.trim()) return;

    const newActivity = {
      id: `a${Date.now()}`,
      contactId: activityForm.contactId,
      type: activityForm.type,
      note: activityForm.note.trim(),
      date: activityForm.date,
      doneBy: activityForm.doneBy.trim() || "Unassigned",
      outcome: "Logged",
    };

    setActivities((prev) => [newActivity, ...prev]);
    setActivityForm((prev) => ({ ...prev, note: "" }));
  };

  const tabClass = (id) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      activeTab === id
        ? "bg-blue-600 text-white"
        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
    }`;

  const getContact = (id) => contactsById[id];

  return (
    <section className="w-full space-y-5">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">CRM Module</h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          Manage contacts, deals, activities, and pipeline health in one place.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className={tabClass("pipeline")} onClick={() => setActiveTab("pipeline")}>
          Pipeline
        </button>
        <button className={tabClass("contacts")} onClick={() => setActiveTab("contacts")}>
          Contacts
        </button>
        <button className={tabClass("activities")} onClick={() => setActiveTab("activities")}>
          Activities
        </button>
        <button className={tabClass("analytics")} onClick={() => setActiveTab("analytics")}>
          CRM Analytics
        </button>
      </div>

      {activeTab === "pipeline" && (
        <div className="space-y-4">
          {visibleNudges.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {visibleNudges.map((n) => (
                <div
                  key={n.id}
                  className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex items-start justify-between gap-3"
                >
                  <p className="text-sm text-amber-900 dark:text-amber-200">{n.text}</p>
                  <button
                    className="text-xs px-2 py-1 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                    onClick={() => setDismissedNudges((prev) => [...prev, n.id])}
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
            {stageOrder.map((stage) => {
              const deals = dealsByStage[stage] || [];
              const stageValue = deals.reduce((sum, d) => sum + d.value_inr, 0);

              return (
                <div
                  key={stage}
                  className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                >
                  <div className="mb-3 border-b border-gray-200 dark:border-gray-700 pb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{stage}</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      {formatINR(stageValue)} • {deals.length} deal(s)
                    </p>
                  </div>

                  <div className="space-y-2">
                    {deals.map((deal) => {
                      const contact = getContact(deal.contactId);
                      const category = contact?.wasteCategories?.[0] || "Plastic";
                      const colorClass = CATEGORY_COLORS[category] || CATEGORY_COLORS.Plastic;
                      return (
                        <div
                          key={deal.id}
                          className={`border rounded-md p-2 text-xs ${colorClass}`}
                        >
                          <p className="font-semibold">{contact?.company || "Unknown"}</p>
                          <p>{deal.service}</p>
                          <p className="font-medium mt-1">{formatINR(deal.value_inr)}</p>
                          <p className="text-[11px] mt-1">
                            {daysBetween(deal.createdAt)} day(s) in stage
                          </p>
                        </div>
                      );
                    })}
                    {deals.length === 0 && (
                      <p className="text-xs text-gray-400 dark:text-gray-500">No deals</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search company..."
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            />

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            >
              <option>All</option>
              <option>PIBO</option>
              <option>Recycler</option>
              <option>Importer</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            >
              <option>All</option>
              <option>Lead</option>
              <option>Prospect</option>
              <option>Active</option>
              <option>At-Risk</option>
              <option>Churned</option>
            </select>

            <select
              value={filterWaste}
              onChange={(e) => setFilterWaste(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
            >
              {uniqueWaste.map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-3">Company</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">State</th>
                  <th className="py-2 pr-3">Waste Categories</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Assigned To</th>
                  <th className="py-2 pr-3">LTV</th>
                  <th className="py-2 pr-3">Last Contact</th>
                  <th className="py-2">Next Follow-Up</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((c) => {
                  const isExpanded = expandedContactId === c.id;
                  const cActivities = activities
                    .filter((a) => a.contactId === c.id)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 3);

                  const openDeals = CRM_DATA.deals.filter(
                    (d) => d.contactId === c.id && !["Won", "Lost"].includes(d.stage)
                  );

                  return (
                    <>
                      <tr
                        key={c.id}
                        className="border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40"
                        onClick={() =>
                          setExpandedContactId(isExpanded ? null : c.id)
                        }
                      >
                        <td className="py-2 pr-3 font-medium text-gray-900 dark:text-gray-100">
                          {c.company}
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.type}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.state}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">
                          {c.wasteCategories.join(", ")}
                        </td>
                        <td className="py-2 pr-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              STATUS_COLORS[c.status]
                            }`}
                          >
                            {c.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.assignedTo}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{formatINR(c.ltv_inr)}</td>
                        <td className="py-2 pr-3 text-gray-700 dark:text-gray-300">{c.lastContact}</td>
                        <td className="py-2 text-gray-700 dark:text-gray-300">{c.nextFollowUp}</td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="bg-gray-50 dark:bg-gray-800/40 p-4">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              <div className="lg:col-span-1 space-y-2 text-sm">
                                <p className="font-semibold text-gray-900 dark:text-white">Contact Details</p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Person:</span> {c.person}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Email:</span> {c.email}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Phone:</span> {c.phone}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">GSTIN:</span> {c.gstin}
                                </p>
                                <p className="text-gray-700 dark:text-gray-300">
                                  <span className="font-medium">Tags:</span> {c.tags.join(", ")}
                                </p>
                              </div>

                              <div className="lg:col-span-1">
                                <p className="font-semibold text-gray-900 dark:text-white mb-2">Recent Activities</p>
                                <div className="space-y-2">
                                  {cActivities.map((a) => (
                                    <div
                                      key={a.id}
                                      className="text-xs border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-700 dark:text-gray-300"
                                    >
                                      <p className="font-medium">{a.type} • {a.date}</p>
                                      <p>{a.note}</p>
                                    </div>
                                  ))}
                                  {cActivities.length === 0 && (
                                    <p className="text-xs text-gray-500">No activities yet.</p>
                                  )}
                                </div>
                              </div>

                              <div className="lg:col-span-1">
                                <p className="font-semibold text-gray-900 dark:text-white mb-2">Open Deals</p>
                                <div className="space-y-2">
                                  {openDeals.map((d) => (
                                    <div
                                      key={d.id}
                                      className="text-xs border border-gray-200 dark:border-gray-700 rounded p-2 text-gray-700 dark:text-gray-300"
                                    >
                                      <p className="font-medium">{d.service}</p>
                                      <p>
                                        {formatINR(d.value_inr)} • {d.stage} • {d.probability}%
                                      </p>
                                    </div>
                                  ))}
                                  {openDeals.length === 0 && (
                                    <p className="text-xs text-gray-500">No open deals.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "activities" && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex flex-wrap items-center gap-2">
              {["All", ...ACTIVITY_TYPES].map((t) => (
                <button
                  key={t}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                    activityFilter === t
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                  }`}
                  onClick={() => setActivityFilter(t)}
                >
                  {t === "Filing" ? "Filings" : t === "Call" ? "Calls" : t === "Email" ? "Emails" : t}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Log Activity</h3>
            <form onSubmit={addActivity} className="grid grid-cols-1 md:grid-cols-6 gap-3">
              <select
                value={activityForm.contactId}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, contactId: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
              >
                {CRM_DATA.contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company}
                  </option>
                ))}
              </select>

              <select
                value={activityForm.type}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, type: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
              >
                {ACTIVITY_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>

              <input
                value={activityForm.note}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, note: e.target.value }))
                }
                placeholder="Activity note"
                className="md:col-span-2 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
              />

              <input
                type="date"
                value={activityForm.date}
                onChange={(e) =>
                  setActivityForm((p) => ({ ...p, date: e.target.value }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
              />

              <div className="flex gap-2">
                <input
                  value={activityForm.doneBy}
                  onChange={(e) =>
                    setActivityForm((p) => ({ ...p, doneBy: e.target.value }))
                  }
                  placeholder="Done by"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm whitespace-nowrap"
                >
                  Save
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Activity Timeline</h3>
            <div className="space-y-3">
              {filteredActivities.map((a) => {
                const contact = getContact(a.contactId);
                const icon =
                  a.type === "Call"
                    ? "📞"
                    : a.type === "Email"
                    ? "✉️"
                    : a.type === "WhatsApp"
                    ? "💬"
                    : a.type === "Meeting"
                    ? "📅"
                    : "📁";

                return (
                  <div
                    key={a.id}
                    className="relative pl-6 pb-3 border-l-2 border-gray-200 dark:border-gray-700"
                  >
                    <span className="absolute -left-3 top-0 h-5 w-5 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs">
                      {icon}
                    </span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {contact?.company || "Unknown"} • {a.type}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{a.note}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {a.date} • by {a.doneBy}
                    </p>
                  </div>
                );
              })}
              {filteredActivities.length === 0 && (
                <p className="text-sm text-gray-500">No activities found.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Pipeline ₹</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatINR(kpiTotalPipeline)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Conversion Rate %</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {conversionRate.toFixed(1)}%
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Deal Size ₹</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {formatINR(avgDealSize)}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Days to Close</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {avgDaysToClose.toFixed(1)} days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-80">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Deals by Stage (Count)
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={stageBarData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-80">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Revenue by Waste Category
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={revenueByWasteData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={95}
                    label
                  >
                    {revenueByWasteData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 h-80">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                New Leads per Month (Last 6 Months)
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={leadsLast6Months}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="leads" stroke="#16a34a" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Top 5 Deals by Value
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                      <th className="py-2 pr-2">Company</th>
                      <th className="py-2 pr-2">Service</th>
                      <th className="py-2 pr-2">Value</th>
                      <th className="py-2">Probability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDeals.map((d) => (
                      <tr key={d.id} className="border-b border-gray-100 dark:border-gray-800">
                        <td className="py-2 pr-2 text-gray-900 dark:text-gray-100 font-medium">
                          {d.company}
                        </td>
                        <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{d.service}</td>
                        <td className="py-2 pr-2 text-gray-700 dark:text-gray-300">{formatINR(d.value_inr)}</td>
                        <td className="py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              d.probability >= 75
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                : d.probability >= 50
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {d.probability}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
