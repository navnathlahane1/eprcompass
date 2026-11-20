'use client';

import { use, useState } from 'react';
import Link from 'next/link';

interface Assignment {
  name: string;
  submitted: string | null;
  grade: number | null;
  maxGrade: number;
  feedback: string;
  status: 'Graded' | 'Submitted' | 'Pending';
}

interface Program {
  name: string;
  enrolledDate: string;
  completionDate: string | null;
  progress: number;
  modules: { name: string; completed: boolean }[];
}

interface Payment {
  date: string;
  description: string;
  amount: number;
  mode: string;
  receipt: string;
}

interface Message {
  date: string;
  from: string;
  subject: string;
  preview: string;
}

interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  tier: string;
  upsellEligible: boolean;
  cohort: string;
  programs: Program[];
  assignments: Assignment[];
  certificates: { name: string; issued: string; id: string }[];
  payments: Payment[];
  messages: Message[];
}

const PROFILES: Record<string, LearnerProfile> = {};

const DEFAULT_PROFILE: LearnerProfile = {
  id: '0',
  name: 'Learner Not Found',
  email: '—',
  phone: '—',
  city: '—',
  tier: '—',
  upsellEligible: false,
  cohort: '—',
  programs: [],
  assignments: [],
  certificates: [],
  payments: [],
  messages: [],
};

type Tab = 'overview' | 'assignments' | 'certificates' | 'payments' | 'messages';

export default function LearnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const learner = PROFILES[resolvedParams.id] ?? DEFAULT_PROFILE;
  const [tab, setTab] = useState<Tab>('overview');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview',     label: 'Overview' },
    { key: 'assignments',  label: 'Assignments' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'payments',     label: 'Payments' },
    { key: 'messages',     label: 'Messages' },
  ];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/academy/learners" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Back to Learner Directory
      </Link>

      {/* Upsell Banner */}
      {learner.upsellEligible && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-4 py-3">
          <span className="text-lg">🎉</span>
          <div>
            <p className="text-sm font-bold text-emerald-300">Eligible for Tier 2 Upgrade</p>
            <p className="text-xs text-emerald-400/70">Tier 1 complete — qualifies for ₹500 discount on CEPC (₹5,000 → ₹4,500)</p>
          </div>
          <button className="ml-auto shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition">
            Send Upgrade Offer
          </button>
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300 text-xl font-bold">
            {learner.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-slate-100">{learner.name}</h1>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-bold text-violet-300">{learner.tier}</span>
              {learner.upsellEligible && (
                <span className="rounded bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-300">Upsell Eligible</span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-500">
              <span>{learner.email}</span>
              <span>{learner.phone}</span>
              <span>{learner.city}</span>
              <span>Cohort: {learner.cohort}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
              Send Message
            </button>
            <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${tab === t.key ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {learner.programs.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">No records yet.</div>
          )}
          {learner.programs.map((prog, pi) => (
            <div key={pi} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h2 className="text-sm font-semibold text-slate-200">{prog.name}</h2>
                <span className={`rounded px-2 py-0.5 text-xs font-bold ${prog.progress === 100 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                  {prog.progress === 100 ? 'Completed' : `${prog.progress}% Complete`}
                </span>
              </div>
              <div className="text-xs text-slate-500 flex gap-4">
                <span>Enrolled: {new Date(prog.enrolledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                {prog.completionDate && <span>Completed: {new Date(prog.completionDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>
              {/* Overall progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Overall Progress</span><span>{prog.progress}%</span></div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div className={`h-full rounded-full ${prog.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${prog.progress}%` }} />
                </div>
              </div>
              {/* Module checklist */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {prog.modules.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-3 py-2">
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${m.completed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-600'}`}>
                      {m.completed ? '✓' : `${mi + 1}`}
                    </div>
                    <span className={`text-xs ${m.completed ? 'text-slate-300' : 'text-slate-500'}`}>{m.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignments Tab */}
      {tab === 'assignments' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['Assignment', 'Submitted', 'Score', 'Status', 'Feedback'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {learner.assignments.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {learner.assignments.map((a, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-xs font-medium text-slate-200">{a.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{a.submitted ? new Date(a.submitted).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-200">
                    {a.grade !== null ? <span className={a.grade >= 7 ? 'text-emerald-400' : 'text-rose-400'}>{a.grade}/{a.maxGrade}</span> : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-[9px] font-semibold ${
                      a.status === 'Graded' ? 'bg-emerald-500/15 text-emerald-300' :
                      a.status === 'Submitted' ? 'bg-amber-500/15 text-amber-300' :
                      'bg-slate-700 text-slate-500'}`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500 max-w-[280px] truncate">{a.feedback || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Certificates Tab */}
      {tab === 'certificates' && (
        <div className="space-y-3">
          {learner.certificates.length === 0 ? (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">No certificates earned yet.</div>
          ) : learner.certificates.map((cert, i) => (
            <div key={i} className="flex items-center justify-between gap-4 rounded-xl border border-slate-800/80 bg-[#0c1022] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{cert.name}</p>
                  <p className="text-xs text-slate-500">Issued: {new Date(cert.issued).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} · ID: {cert.id}</p>
                </div>
              </div>
              <button className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
                Download PDF
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Payments Tab */}
      {tab === 'payments' && (
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['Date', 'Description', 'Amount', 'Mode', 'Receipt'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {learner.payments.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {learner.payments.map((p, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition">
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(p.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3 text-xs text-slate-200">{p.description}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-400">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{p.mode}</td>
                  <td className="px-4 py-3">
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition">{p.receipt}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Messages Tab */}
      {tab === 'messages' && (
        <div className="space-y-2">
          {learner.messages.length === 0 && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-12 text-center text-sm text-slate-600">No records yet.</div>
          )}
          {learner.messages.map((m, i) => (
            <div key={i} className="rounded-xl border border-slate-800/80 bg-[#0c1022] px-4 py-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-slate-200">{m.subject}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">From: {m.from} · {new Date(m.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-2 line-clamp-2">{m.preview}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
