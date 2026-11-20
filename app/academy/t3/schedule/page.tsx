'use client';

import { useState } from 'react';

export default function T3SchedulePage() {
  const [form, setForm] = useState({
    partner: '', day1Date: '', day2Date: '', day3Date: '',
    trainer: 'EPR Compass Trainer', zoomLink: '', waiveFee: true, notes: '',
  });

  function Field({ label, name, type = 'text', placeholder = '' }: { label: string; name: string; type?: string; placeholder?: string }) {
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-slate-400">{label}</label>
        <input type={type} value={(form as any)[name]}
          onChange={e => setForm(f => ({ ...f, [name]: e.target.value }))}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Schedule T3 Program</h1>
        <p className="mt-0.5 text-sm text-slate-500">Create a new 3-day Train-the-Trainer session for a partner.</p>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6 space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">Partner</label>
          <select value={form.partner} onChange={e => setForm(f => ({ ...f, partner: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option value="">Select a partner with LOI signed…</option>
            <option value="priya">Priya Nambiar (ECV-B-002)</option>
            <option value="rahul">Rahul Kapoor (ECV-B-003)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Day 1 — EPR Mastery</label>
            <input type="date" value={form.day1Date} onChange={e => setForm(f => ({ ...f, day1Date: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Day 2 — Pedagogy</label>
            <input type="date" value={form.day2Date} onChange={e => setForm(f => ({ ...f, day2Date: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Day 3 — Platform</label>
            <input type="date" value={form.day3Date} onChange={e => setForm(f => ({ ...f, day3Date: e.target.value }))}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
          </div>
        </div>
        <p className="text-[10px] text-slate-600">Each day: 10:00 AM – 4:00 PM IST (5 hrs instruction + 1 hr lunch)</p>

        <div className="space-y-1">
          <label className="text-xs font-medium text-slate-400">T3 Trainer</label>
          <select value={form.trainer} onChange={e => setForm(f => ({ ...f, trainer: e.target.value }))}
            className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <option>EPR Compass Trainer</option>
            <option>Senior Internal Trainer</option>
          </select>
        </div>

        <Field label="Zoom Meeting Link" name="zoomLink" placeholder="https://zoom.us/j/..." />

        <div className="flex items-center gap-3 rounded-lg border border-slate-700 px-4 py-3">
          <input type="checkbox" id="waive" checked={form.waiveFee} onChange={e => setForm(f => ({ ...f, waiveFee: e.target.checked }))}
            className="h-4 w-4 accent-indigo-500" />
          <label htmlFor="waive" className="text-xs text-slate-300">
            Waive T3 fee (₹4,999) — applies for first-time partner onboarding
          </label>
        </div>

        <Field label="Internal Notes" name="notes" placeholder="Any special instructions or context…" />
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-300 space-y-1">
        <p className="font-semibold">On scheduling:</p>
        <ul className="list-disc list-inside space-y-1 text-slate-400">
          <li>Calendar invites sent to partner and trainer with Zoom link</li>
          <li>Partner receives pre-session briefing document</li>
          <li>Day 3 completion triggers: certificate PDF, LMS login, referral link activation</li>
          <li>Partner automatically upgraded to <span className="text-emerald-400">T3 Certified</span> status</li>
        </ul>
      </div>

      <div className="flex gap-3">
        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
          Schedule & Send Invites
        </button>
        <a href="/academy/t3" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
          Cancel
        </a>
      </div>
    </div>
  );
}
