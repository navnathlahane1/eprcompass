'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';

const MOCK: Record<string, {
  name: string; email: string; phone: string; city: string;
  program: string; tier: string; batch: string;
  totalFee: number; paid: number; payType: 'Full' | 'EMI';
  source: 'Organic' | 'Partner'; partner?: string; partnerId?: string;
  status: string;
}> = {};

const COHORTS = ['CEPC-Batch-07', 'CEPC-Batch-08', 'EALP-Batch-03', 'EALP-Batch-04', 'T1-May-2026', 'T3TR-Jun-2026'];

const EMI_SCHEDULE: { inst: number; date: string; amount: number; status: string }[] = [];

export default function EnrollmentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const enrollment = MOCK[id];

  const [cohort, setCohort]   = useState(enrollment?.batch || COHORTS[0]);
  const [checklist, setChecklist] = useState([false, false, false, false]);
  const [confirmed, setConfirmed] = useState(false);
  const [toast, setToast]     = useState('');

  if (!enrollment) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-slate-400 text-sm">No enrollment data. Records will populate from real enrollments.</p>
          <p className="font-mono text-xs text-slate-600">{id}</p>
        </div>
      </div>
    );
  }

  const balance = enrollment.totalFee - enrollment.paid;
  const revenueShare = Math.round(enrollment.totalFee * 0.2);

  const checklistItems = ['LMS login sent', 'WhatsApp group added', 'Joining instructions sent', 'Welcome email sent'];

  function toggleCheck(i: number) {
    setChecklist(c => c.map((v, idx) => idx === i ? !v : v));
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-sm font-semibold text-emerald-300">{toast}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs text-slate-500 mb-0.5 font-mono">{id}</p>
          <h1 className="text-xl font-semibold text-slate-100">{enrollment.name}</h1>
          <p className="mt-0.5 text-sm text-slate-500">{enrollment.program} · {enrollment.tier}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => showToast('Welcome Kit sent!')}
            className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">Send Welcome Kit</button>
          <button className="rounded-lg border border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-400 hover:bg-rose-500/10 transition">Reject</button>
          <button onClick={() => { setConfirmed(true); showToast('Enrollment confirmed!'); }}
            className={`rounded-lg px-3 py-2 text-sm font-semibold text-white transition ${confirmed ? 'bg-emerald-700 cursor-default' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
            {confirmed ? '✓ Confirmed' : 'Confirm Enrollment'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Personal Details */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Personal Details</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Full Name', enrollment.name],
                ['Email',     enrollment.email],
                ['Phone',     enrollment.phone],
                ['City',      enrollment.city],
                ['Program',   enrollment.program],
                ['Tier',      enrollment.tier],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">{l}</p>
                  <p className="text-sm text-slate-200">{v}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Section */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Payment Details</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="rounded-lg border border-slate-800 p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Total Fee</p>
                <p className="text-lg font-bold text-slate-200">₹{enrollment.totalFee.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-lg border border-emerald-500/20 p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Amount Paid</p>
                <p className="text-lg font-bold text-emerald-400">₹{enrollment.paid.toLocaleString('en-IN')}</p>
              </div>
              <div className={`rounded-lg border p-3 ${balance > 0 ? 'border-amber-500/20' : 'border-slate-800'}`}>
                <p className="text-[10px] text-slate-500 uppercase tracking-wide">Balance</p>
                <p className={`text-lg font-bold ${balance > 0 ? 'text-amber-400' : 'text-slate-500'}`}>₹{balance.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Payment proof upload */}
            <div className="rounded-lg border-2 border-dashed border-slate-700 p-4 text-center">
              <svg viewBox="0 0 24 24" className="mx-auto h-8 w-8 text-slate-600 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
              <p className="text-xs text-slate-500">Upload payment proof (screenshot, receipt)</p>
              <button className="mt-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 transition">Choose File</button>
            </div>

            {/* EMI Schedule */}
            {enrollment.payType === 'EMI' && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-slate-400 mb-2">EMI Schedule</p>
                <div className="overflow-x-auto rounded-lg border border-slate-800">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-800">
                        {['Instalment','Due Date','Amount','Status'].map(h => (
                          <th key={h} className="px-3 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {EMI_SCHEDULE.map(e => (
                        <tr key={e.inst} className="border-b border-slate-800/40">
                          <td className="px-3 py-2 text-slate-400">#{e.inst}</td>
                          <td className="px-3 py-2 text-slate-400">{new Date(e.date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</td>
                          <td className="px-3 py-2 font-semibold text-slate-200">₹{e.amount.toLocaleString('en-IN')}</td>
                          <td className="px-3 py-2">
                            <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${e.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{e.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Assign Cohort */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-3">Assign to Cohort</h2>
            <div className="flex gap-3 items-center">
              <select value={cohort} onChange={e => setCohort(e.target.value)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                {COHORTS.map(c => <option key={c}>{c}</option>)}
              </select>
              <button onClick={() => showToast(`Assigned to ${cohort}`)}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition whitespace-nowrap">Assign</button>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Welcome Kit Checklist */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Welcome Kit Checklist</h2>
            <div className="space-y-3">
              {checklistItems.map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer group">
                  <div onClick={() => toggleCheck(i)}
                    className={`h-5 w-5 shrink-0 rounded border-2 flex items-center justify-center transition ${checklist[i] ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600 group-hover:border-slate-400'}`}>
                    {checklist[i] && <svg viewBox="0 0 24 24" className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>}
                  </div>
                  <span className={`text-sm transition ${checklist[i] ? 'line-through text-slate-500' : 'text-slate-300'}`}>{item}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-500">{checklist.filter(Boolean).length}/{checklistItems.length} completed</div>
          </div>

          {/* Partner Attribution */}
          {enrollment.source === 'Partner' && enrollment.partner && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-5">
              <h2 className="text-sm font-semibold text-violet-300 mb-4">Partner Attribution</h2>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Partner Name</p>
                  <p className="text-sm font-semibold text-slate-200">{enrollment.partner}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Partner ID</p>
                  <p className="text-sm font-mono text-violet-300">{enrollment.partnerId}</p>
                </div>
                <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/10 p-3">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Revenue Share (20%)</p>
                  <p className="text-xl font-bold text-violet-300">₹{revenueShare.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">of ₹{enrollment.totalFee.toLocaleString('en-IN')} program fee</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
