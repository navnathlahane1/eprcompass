'use client';

import Link from 'next/link';

const COMPLIANCE_DOCS = [
  { id: 'epr-registration', label: 'EPR Registration Certificate', category: 'Registration', required: true },
  { id: 'plastic-return',   label: 'Plastic Waste Annual Return',  category: 'Filing',       required: true },
  { id: 'ewaste-return',    label: 'E-Waste Annual Return',        category: 'Filing',       required: true },
  { id: 'battery-return',   label: 'Battery Waste Annual Return',  category: 'Filing',       required: false },
  { id: 'tyre-return',      label: 'Tyre Waste Annual Return',     category: 'Filing',       required: false },
  { id: 'cpcb-letter',      label: 'CPCB Communication Log',       category: 'Correspondence', required: true },
  { id: 'noc',              label: 'NOC from State PCB',           category: 'Registration', required: false },
  { id: 'audit-report',     label: 'Third-Party Audit Report',     category: 'Audit',        required: false },
];

const STATUS_OPTIONS = ['Pending', 'Uploaded', 'Verified', 'Not Required'];

export default function OpsDocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Compliance Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track document status and access templates from the Knowledge Hub</p>
        </div>
        <Link href="/knowledge" target="_blank"
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 rounded-lg px-3 py-1.5 transition">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Knowledge Hub
        </Link>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Document</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Category</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Required</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Status</th>
            </tr>
          </thead>
          <tbody>
            {COMPLIANCE_DOCS.map((doc, idx) => (
              <tr key={doc.id} className={`border-b border-slate-800/60 ${idx % 2 === 0 ? '' : 'bg-slate-900/30'}`}>
                <td className="px-4 py-3 font-medium text-slate-200">{doc.label}</td>
                <td className="px-4 py-3 text-slate-500">{doc.category}</td>
                <td className="px-4 py-3">
                  {doc.required
                    ? <span className="text-[10px] font-semibold text-rose-400 bg-rose-900/20 border border-rose-700/30 rounded-full px-2 py-0.5">Required</span>
                    : <span className="text-[10px] text-slate-600">Optional</span>}
                </td>
                <td className="px-4 py-3">
                  <select defaultValue="Pending"
                    className="rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-300 focus:border-rose-500 focus:outline-none">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4">
        <p className="text-xs font-semibold text-slate-500 mb-2">Need a template or guidance?</p>
        <p className="text-xs text-slate-600">
          Access all compliance document templates, regulatory guides, and filing checklists in the{' '}
          <Link href="/knowledge" className="text-rose-400 hover:underline">Knowledge Hub</Link>.
        </p>
      </div>
    </div>
  );
}
