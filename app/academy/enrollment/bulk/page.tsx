'use client';

import { useState } from 'react';

const CSV_COLUMNS = ['Full Name', 'Email', 'Phone', 'City', 'Organization'];
const SYSTEM_FIELDS = ['name', 'email', 'phone', 'city', 'company'];
const FIELD_LABELS: Record<string, string> = {
  name: 'Learner Name', email: 'Email Address', phone: 'Phone Number', city: 'City', company: 'Organisation'
};


const PROGRAMS = [
  { id: 't1', label: 'E-Waste Awareness (Tier 1)', price: 999 },
  { id: 'cepc', label: 'CEPC — E-Waste Compliance (Tier 2)', price: 5000 },
  { id: 'ealp', label: 'EALP — Sustainability Leadership (Tier 3)', price: 50000 },
];

const BATCHES = ['T1-May-2026', 'T1-Jun-2026', 'CEPC-Batch-07', 'CEPC-Batch-08', 'EALP-Batch-03'];

function getDiscount(count: number): number {
  if (count >= 26) return 0.20;
  if (count >= 11) return 0.15;
  if (count >= 5)  return 0.10;
  return 0;
}

export default function BulkEnrollmentPage() {
  const [step, setStep]         = useState(1);
  const [dragging, setDragging] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [mapping, setMapping]   = useState<Record<string, string>>({
    'Full Name': 'name', 'Email': 'email', 'Phone': 'phone', 'City': 'city', 'Organization': 'company'
  });
  const [program, setProgram]   = useState(PROGRAMS[0].id);
  const [batch, setBatch]       = useState(BATCHES[0]);
  const [count, setCount]       = useState(1);
  const [showToast, setShowToast] = useState(false);

  const selectedProg = PROGRAMS.find(p => p.id === program) || PROGRAMS[0];
  const discount     = getDiscount(count);
  const original     = selectedProg.price * count;
  const discountAmt  = Math.round(original * discount);
  const finalPrice   = original - discountAmt;
  const discountPct  = Math.round(discount * 100);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    setUploaded(true);
  }

  function handleInvoice() {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3 shadow-lg">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <p className="text-sm font-semibold text-emerald-300">Invoice generated and sent to your email!</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Corporate / Bulk Enrollment</h1>
        <p className="mt-0.5 text-sm text-slate-500">Upload a CSV to enroll multiple learners at once</p>
      </div>

      {/* Progress Tracker */}
      <div className="flex items-center gap-0">
        {['Upload & Map', 'Review', 'Confirm'].map((s, i) => {
          const n = i + 1;
          const active = step === n;
          const done   = step > n;
          return (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition
                ${active ? 'bg-indigo-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-500'}`}>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold
                  ${active ? 'bg-white/20' : done ? 'bg-emerald-500/30' : 'bg-slate-700'}`}>
                  {done ? '✓' : n}
                </span>
                {s}
              </div>
              {i < 2 && <div className={`mx-1 h-px w-8 ${step > n ? 'bg-emerald-500/50' : 'bg-slate-700'}`}/>}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload & Map */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Upload Area */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-10 text-center transition cursor-pointer
              ${dragging ? 'border-indigo-500 bg-indigo-500/5' : uploaded ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-800/20'}`}
            onClick={() => setUploaded(true)}>
            {uploaded ? (
              <div className="space-y-1">
                <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <p className="text-sm font-semibold text-emerald-300">CSV file selected</p>
                <p className="text-xs text-slate-500">Click "Continue to Review" to map columns</p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-600" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                <p className="text-sm font-semibold text-slate-400">Drag & drop CSV here, or click to browse</p>
                <p className="text-xs text-slate-600">Supported: .csv — max 500 rows</p>
              </div>
            )}
          </div>

          {/* Column Mapping */}
          {uploaded && (
            <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
              <h2 className="text-sm font-semibold text-slate-300 mb-4">Column Mapping</h2>
              <p className="text-xs text-slate-500 mb-3">Map your CSV columns to the system fields below.</p>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">CSV Column</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">Maps To</th>
                      <th className="px-4 py-2 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">Sample Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CSV_COLUMNS.map((col, i) => (
                      <tr key={col} className="border-b border-slate-800/40">
                        <td className="px-4 py-2 text-xs font-mono text-amber-300">{col}</td>
                        <td className="px-4 py-2">
                          <select value={mapping[col]} onChange={e => setMapping(m => ({ ...m, [col]: e.target.value }))}
                            className="rounded border border-slate-700 bg-slate-800/60 px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                            {SYSTEM_FIELDS.map(f => <option key={f} value={f}>{FIELD_LABELS[f]}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500 font-mono">
                          —
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button onClick={() => setStep(2)}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">
                Continue to Review →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Review */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Learner Preview Table */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">Learner Preview</h2>
              <span className="rounded-full bg-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-400">From uploaded CSV</span>
            </div>
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              <p className="text-sm text-slate-500">Learner data will appear here after CSV parsing is complete.</p>
              <p className="text-xs text-slate-600 mt-1">Upload and map your CSV columns in Step 1, then validate before proceeding.</p>
            </div>
          </div>

          {/* Program + Batch */}
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Program & Batch Assignment</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-400">Program</label>
                <select value={program} onChange={e => setProgram(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {PROGRAMS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-400">Batch</label>
                <select value={batch} onChange={e => setBatch(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {BATCHES.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-xs font-medium text-slate-400">Learner Count</label>
                <input type="number" min={1} max={500} value={count} onChange={e => setCount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                <p className="mt-1 text-[10px] text-slate-600">5–10: 10% off · 11–25: 15% off · 26+: 20% off</p>
              </div>
            </div>
          </div>

          {/* Pricing Calculator */}
          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
            <h2 className="text-sm font-semibold text-indigo-300 mb-4">Bulk Pricing Calculator</h2>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">{count} × ₹{selectedProg.price.toLocaleString('en-IN')} ({selectedProg.label})</span>
                <span className="text-sm text-slate-300">₹{original.toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-400">Bulk discount ({discountPct}%)</span>
                  <span className="text-sm font-semibold text-emerald-400">- ₹{discountAmt.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="border-t border-indigo-500/20 pt-2 flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-300">Final Price</span>
                <span className="text-xl font-bold text-indigo-300">₹{finalPrice.toLocaleString('en-IN')}</span>
              </div>
              {discount === 0 && count < 5 && (
                <p className="text-[10px] text-slate-500">Add {5 - count} more learner{5 - count > 1 ? 's' : ''} to unlock 10% bulk discount</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition">← Back</button>
            <button onClick={() => setStep(3)} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">Continue to Confirm →</button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-6">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Confirm Bulk Enrollment</h2>
            <div className="space-y-3">
              {[
                ['Program',       selectedProg.label],
                ['Batch',         batch],
                ['Learners',      `${count} learners`],
                ['Original Total',`₹${original.toLocaleString('en-IN')}`],
                ['Discount',      discountPct > 0 ? `${discountPct}% (₹${discountAmt.toLocaleString('en-IN')})` : 'None'],
                ['Final Amount',  `₹${finalPrice.toLocaleString('en-IN')}`],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-xs text-slate-500">{l}</span>
                  <span className="text-xs font-semibold text-slate-200">{v}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <button onClick={() => setStep(2)} className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 hover:bg-slate-800 transition">← Back</button>
              <button onClick={handleInvoice}
                className="flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                Generate Invoice
              </button>
              <button className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
                Confirm & Enroll {count} Learners
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
