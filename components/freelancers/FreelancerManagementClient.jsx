"use client";

import { useState, useMemo } from "react";
import {
  Users, UserCheck, UserPlus, Briefcase, Star, Plus, Search,
  Clock, Circle, CircleDot, CheckCircle2, X, Wallet,
} from "lucide-react";

const SEED_FREELANCERS = [
  { id: 1, name: "Priya Nair",     skill: "EPR Consultant",   rate: 1500, email: "priya@example.com",  status: "active",    rating: 4.8, joined: "2026-01-12" },
  { id: 2, name: "Arjun Rao",      skill: "Content Writer",   rate: 800,  email: "arjun@example.com",  status: "active",    rating: 4.5, joined: "2026-02-20" },
  { id: 3, name: "Kavya Iyer",     skill: "Graphic Designer", rate: 1000, email: "kavya@example.com",  status: "available", rating: 4.9, joined: "2026-03-05" },
  { id: 4, name: "Sahil Verma",    skill: "Web Developer",    rate: 1800, email: "sahil@example.com",  status: "active",    rating: 4.7, joined: "2025-12-01" },
  { id: 5, name: "Divya Menon",    skill: "SEO Specialist",   rate: 900,  email: "divya@example.com",  status: "available", rating: 4.3, joined: "2026-04-18" },
  { id: 6, name: "Manish Joshi",   skill: "Data Analyst",     rate: 1200, email: "manish@example.com", status: "inactive",  rating: 4.6, joined: "2025-11-10" },
];

const SEED_PROJECTS = [
  { id: 1, freelancerId: 1, title: "Draft battery EPR compliance guide", status: "in-progress", due: "2026-06-28" },
  { id: 2, freelancerId: 2, title: "8 blog posts — plastic EPR",         status: "todo",        due: "2026-06-30" },
  { id: 3, freelancerId: 3, title: "Penalty-checker social creatives",   status: "done",        due: "2026-06-16" },
  { id: 4, freelancerId: 4, title: "Build intern dashboard module",      status: "in-progress", due: "2026-07-02" },
  { id: 5, freelancerId: 5, title: "Keyword audit — academy pages",      status: "todo",        due: "2026-07-01" },
  { id: 6, freelancerId: 1, title: "Review CPCB SCN dataset",            status: "done",        due: "2026-06-14" },
];

const STATUS_STYLE = {
  active:    "bg-emerald-100 text-emerald-700",
  available: "bg-blue-100 text-blue-700",
  inactive:  "bg-gray-200 text-gray-600",
};
const TASK_STYLE = {
  done:          { cls: "text-emerald-600", icon: CheckCircle2, label: "Done" },
  "in-progress": { cls: "text-amber-600",   icon: CircleDot,    label: "In progress" },
  todo:          { cls: "text-gray-400",    icon: Circle,       label: "To do" },
};
const fmt = (n) => `₹${n.toLocaleString("en-IN")}`;

export default function FreelancerManagementClient() {
  const [freelancers, setFreelancers] = useState(SEED_FREELANCERS);
  const [projects, setProjects] = useState(SEED_PROJECTS);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", skill: "", rate: "", email: "" });

  const nameOf = (id) => freelancers.find((f) => f.id === id)?.name || "—";

  const stats = useMemo(() => {
    const active = freelancers.filter((f) => f.status === "active").length;
    const available = freelancers.filter((f) => f.status === "available").length;
    const open = projects.filter((p) => p.status !== "done").length;
    const avg = freelancers.length ? (freelancers.reduce((a, f) => a + f.rating, 0) / freelancers.length).toFixed(1) : 0;
    return { total: freelancers.length, active, available, open, avg };
  }, [freelancers, projects]);

  const visible = useMemo(() => freelancers.filter((f) => {
    const okFilter = filter === "all" ? true : f.status === filter;
    const okQ = !q || `${f.name} ${f.skill}`.toLowerCase().includes(q.toLowerCase());
    return okFilter && okQ;
  }), [freelancers, filter, q]);

  const projCount = (id) => {
    const list = projects.filter((p) => p.freelancerId === id);
    return { done: list.filter((p) => p.status === "done").length, total: list.length };
  };

  const addFreelancer = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setFreelancers((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, name: form.name.trim(), skill: form.skill || "Freelancer", rate: Number(form.rate) || 0, email: form.email, status: "available", rating: 0, joined: new Date().toISOString().slice(0, 10) },
    ]);
    setForm({ name: "", skill: "", rate: "", email: "" });
    setShowAdd(false);
  };

  const cycleProject = (id) => {
    const order = { todo: "in-progress", "in-progress": "done", done: "todo" };
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status: order[p.status] } : p)));
  };

  const card = "rounded-xl border border-gray-200 bg-white";

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Freelancer Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage freelancers, assign projects, and track active engagements.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2.5 transition">
            <Plus size={16} /> Add Freelancer
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { icon: Users,     v: stats.total,     l: "Total freelancers", c: "text-teal-600" },
            { icon: UserCheck, v: stats.active,    l: "Active / engaged",  c: "text-emerald-600" },
            { icon: UserPlus,  v: stats.available, l: "Available",         c: "text-blue-600" },
            { icon: Briefcase, v: stats.open,      l: "Open projects",     c: "text-amber-600" },
            { icon: Star,      v: stats.avg,       l: "Avg rating",        c: "text-fuchsia-600" },
          ].map((s) => (
            <div key={s.l} className={`${card} p-4`}>
              <s.icon className={`${s.c} mb-2`} size={20} />
              <div className="text-2xl font-bold">{s.v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
                {["all", "active", "available", "inactive"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md capitalize transition ${filter === f ? "bg-teal-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search freelancers…"
                  className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-teal-400 outline-none" />
              </div>
            </div>

            <div className={`${card} overflow-hidden`}>
              {visible.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No freelancers match.</p>}
              {visible.map((f) => {
                const pc = projCount(f.id);
                return (
                  <div key={f.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 font-semibold flex items-center justify-center text-sm">
                      {f.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate flex items-center gap-2">{f.name}
                        {f.rating > 0 && <span className="inline-flex items-center gap-0.5 text-[11px] text-amber-500"><Star size={11} className="fill-amber-400 text-amber-400" />{f.rating}</span>}
                      </div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-2"><Briefcase size={11} /> {f.skill} · {fmt(f.rate)}/hr</div>
                    </div>
                    <div className="hidden sm:block text-xs text-gray-500 text-right">
                      <div>Projects {pc.done}/{pc.total}</div>
                      <div className="text-[11px]">Since {f.joined}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[f.status]}`}>{f.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Projects</h2>
              <span className="text-xs text-gray-400">{projects.length} total · tap status</span>
            </div>
            <div className={`${card} divide-y divide-gray-100`}>
              {projects.map((p) => {
                const st = TASK_STYLE[p.status];
                const Icon = st.icon;
                return (
                  <div key={p.id} className="p-3.5 flex items-start gap-3">
                    <button onClick={() => cycleProject(p.id)} className={`${st.cls} mt-0.5`} aria-label="Toggle status"><Icon size={18} /></button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${p.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{p.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">{nameOf(p.freelancerId)} · <Clock size={10} /> due {p.due}</div>
                    </div>
                    <span className={`text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="text-teal-600" size={18} /> Add Freelancer</h3>
            <form onSubmit={addFreelancer} className="space-y-3">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none" placeholder="Full name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none" placeholder="Skill / specialty (e.g. Content Writer)" value={form.skill} onChange={(e) => setForm((f) => ({ ...f, skill: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none" placeholder="Rate ₹/hr" value={form.rate} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} />
                <input className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-teal-400 outline-none" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="w-full rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 text-sm transition">Add Freelancer</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
