"use client";

import { useState, useMemo } from "react";
import {
  Users, UserCheck, ClipboardList, CheckCircle2, Plus, Search,
  Clock, Circle, CircleDot, X, Mail, Briefcase, TrendingUp,
} from "lucide-react";

const SEED_INTERNS = [
  { id: 1, name: "Aarti Sharma",   role: "EPR Research Intern",     dept: "Compliance",  email: "aarti@example.com",  start: "2026-05-02", status: "active" },
  { id: 2, name: "Rohan Mehta",    role: "Data Intern",             dept: "Intel",       email: "rohan@example.com",  start: "2026-05-15", status: "active" },
  { id: 3, name: "Sneha Patel",    role: "Content Intern",          dept: "Marketing",   email: "sneha@example.com",  start: "2026-04-10", status: "active" },
  { id: 4, name: "Vikram Singh",   role: "Telecalling Intern",      dept: "Sales",       email: "vikram@example.com", start: "2026-03-01", status: "completed" },
  { id: 5, name: "Neha Gupta",     role: "Design Intern",           dept: "Marketing",   email: "neha@example.com",   start: "2026-06-01", status: "active" },
  { id: 6, name: "Imran Khan",     role: "Compliance Intern",       dept: "Compliance",  email: "imran@example.com",  start: "2026-02-12", status: "inactive" },
];

const SEED_TASKS = [
  { id: 1, internId: 1, title: "Compile CPCB plastic SCN list", status: "done",        due: "2026-06-18" },
  { id: 2, internId: 1, title: "Verify 50 company GSTINs",       status: "in-progress", due: "2026-06-25" },
  { id: 3, internId: 2, title: "Clean intel import dataset",     status: "in-progress", due: "2026-06-24" },
  { id: 4, internId: 3, title: "Draft 4 LinkedIn posts",         status: "todo",        due: "2026-06-26" },
  { id: 5, internId: 5, title: "Design penalty-checker banner",  status: "todo",        due: "2026-06-27" },
  { id: 6, internId: 2, title: "Tag 200 recycler records",       status: "done",        due: "2026-06-15" },
];

const STATUS_STYLE = {
  active:    "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  inactive:  "bg-gray-200 text-gray-600",
};
const TASK_STYLE = {
  done:          { cls: "text-emerald-600", icon: CheckCircle2, label: "Done" },
  "in-progress": { cls: "text-amber-600",   icon: CircleDot,    label: "In progress" },
  todo:          { cls: "text-gray-400",    icon: Circle,       label: "To do" },
};

export default function InternManagementClient() {
  const [interns, setInterns] = useState(SEED_INTERNS);
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", dept: "Compliance", email: "" });

  const nameOf = (id) => interns.find((i) => i.id === id)?.name || "—";

  const stats = useMemo(() => {
    const active = interns.filter((i) => i.status === "active").length;
    const completed = interns.filter((i) => i.status === "completed").length;
    const openTasks = tasks.filter((t) => t.status !== "done").length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const rate = tasks.length ? Math.round((doneTasks / tasks.length) * 100) : 0;
    return { total: interns.length, active, completed, openTasks, rate };
  }, [interns, tasks]);

  const visible = useMemo(() => {
    return interns.filter((i) => {
      const okFilter = filter === "all" ? true : i.status === filter;
      const okQ = !q || `${i.name} ${i.role} ${i.dept}`.toLowerCase().includes(q.toLowerCase());
      return okFilter && okQ;
    });
  }, [interns, filter, q]);

  const taskCount = (id) => {
    const list = tasks.filter((t) => t.internId === id);
    return { done: list.filter((t) => t.status === "done").length, total: list.length };
  };

  const addIntern = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setInterns((prev) => [
      ...prev,
      { id: Math.max(0, ...prev.map((p) => p.id)) + 1, name: form.name.trim(), role: form.role || "Intern", dept: form.dept, email: form.email, start: new Date().toISOString().slice(0, 10), status: "active" },
    ]);
    setForm({ name: "", role: "", dept: "Compliance", email: "" });
    setShowAdd(false);
  };

  const cycleTask = (id) => {
    const order = { todo: "in-progress", "in-progress": "done", done: "todo" };
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: order[t.status] } : t)));
  };

  const card = "rounded-xl border border-gray-200 bg-white";

  return (
    <main className="min-h-screen bg-slate-50 text-gray-900 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold">Intern Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">Manage interns, track tasks, and monitor active members.</p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 transition">
            <Plus size={16} /> Add Intern
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { icon: Users,        v: stats.total,         l: "Total interns",   c: "text-indigo-600" },
            { icon: UserCheck,    v: stats.active,        l: "Active now",      c: "text-emerald-600" },
            { icon: CheckCircle2, v: stats.completed,     l: "Completed",       c: "text-blue-600" },
            { icon: ClipboardList,v: stats.openTasks,     l: "Open tasks",      c: "text-amber-600" },
            { icon: TrendingUp,   v: `${stats.rate}%`,    l: "Task completion", c: "text-fuchsia-600" },
          ].map((s) => (
            <div key={s.l} className={`${card} p-4`}>
              <s.icon className={`${s.c} mb-2`} size={20} />
              <div className="text-2xl font-bold">{s.v}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Interns list */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 text-sm">
                {["all", "active", "completed", "inactive"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md capitalize transition ${filter === f ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search interns…"
                  className="rounded-lg border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
            </div>

            <div className={`${card} overflow-hidden`}>
              {visible.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">No interns match.</p>}
              {visible.map((i) => {
                const tc = taskCount(i.id);
                return (
                  <div key={i.id} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-sm">
                      {i.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm truncate">{i.name}</div>
                      <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                        <Briefcase size={11} /> {i.role} · {i.dept}
                      </div>
                    </div>
                    <div className="hidden sm:block text-xs text-gray-500 text-right">
                      <div>Tasks {tc.done}/{tc.total}</div>
                      <div className="text-[11px]">Since {i.start}</div>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLE[i.status]}`}>{i.status}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tasks panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Tasks</h2>
              <span className="text-xs text-gray-400">{tasks.length} total · tap status to update</span>
            </div>
            <div className={`${card} divide-y divide-gray-100`}>
              {tasks.map((t) => {
                const st = TASK_STYLE[t.status];
                const Icon = st.icon;
                return (
                  <div key={t.id} className="p-3.5 flex items-start gap-3">
                    <button onClick={() => cycleTask(t.id)} className={`${st.cls} mt-0.5`} aria-label="Toggle status">
                      <Icon size={18} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm ${t.status === "done" ? "line-through text-gray-400" : "text-gray-800"}`}>{t.title}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-2">
                        {nameOf(t.internId)} · <Clock size={10} /> due {t.due}
                      </div>
                    </div>
                    <span className={`text-[10px] font-semibold ${st.cls}`}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add intern modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowAdd(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close"><X size={18} /></button>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Plus className="text-indigo-600" size={18} /> Add Intern</h3>
            <form onSubmit={addIntern} className="space-y-3">
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Full name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Role (e.g. Research Intern)" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <select className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" value={form.dept} onChange={(e) => setForm((f) => ({ ...f, dept: e.target.value }))}>
                  {["Compliance", "Intel", "Marketing", "Sales", "Design", "Operations"].map((d) => <option key={d}>{d}</option>)}
                </select>
                <input className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" placeholder="Email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
              </div>
              <button type="submit" className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 text-sm transition">Add Intern</button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
