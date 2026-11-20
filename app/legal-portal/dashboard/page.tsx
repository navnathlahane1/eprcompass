'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TourTarget from '@/components/portal/tour/TourTarget';

interface DocSummary {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

interface Recycler {
  id: string;
  name: string;
  company_name: string;
  recycler_code: string;
  verification_status: string;
  state: string;
  epr_categories: string[];
  doc_summary: DocSummary;
}

export default function LegalDashboardPage() {
  const [recyclers, setRecyclers] = useState<Recycler[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legal-portal/recyclers')
      .then((r) => r.json())
      .then((d) => setRecyclers(d.recyclers ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalRecyclers = recyclers.length;
  const docsPending = recyclers.reduce((s, r) => s + r.doc_summary.pending, 0);
  const docsVerified = recyclers.reduce((s, r) => s + r.doc_summary.verified, 0);
  const docsRejected = recyclers.reduce((s, r) => s + r.doc_summary.rejected, 0);

  const needsReview = recyclers.filter((r) => r.doc_summary.pending > 0);

  const statCards = [
    { label: 'Total Recyclers', value: totalRecyclers, color: 'text-violet-400' },
    { label: 'Docs Pending Review', value: docsPending, color: 'text-amber-400' },
    { label: 'Docs Verified', value: docsVerified, color: 'text-emerald-400' },
    { label: 'Docs Rejected', value: docsRejected, color: 'text-red-400' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">Legal Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of recycler document verification status.</p>
      </div>

      {loading ? (
        <div className="text-slate-500 text-sm">Loading…</div>
      ) : (
        <>
          <TourTarget id="dash-summary-cards" className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-2">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </TourTarget>

          <TourTarget id="dash-review-queue">
            <h2 className="text-lg font-medium text-slate-200 mb-3">Recyclers Needing Review</h2>
            {needsReview.length === 0 ? (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 text-slate-500 text-sm">
                No recyclers with pending documents.
              </div>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Company</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">State</th>
                      <th className="text-left text-slate-400 font-medium px-4 py-3">Pending / Total</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {needsReview.map((r) => (
                      <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-100 font-medium">{r.company_name || r.name}</td>
                        <td className="px-4 py-3 text-slate-400">{r.state}</td>
                        <td className="px-4 py-3">
                          <span className="text-amber-400 font-semibold">{r.doc_summary.pending}</span>
                          <span className="text-slate-500"> / {r.doc_summary.total}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/legal-portal/recyclers/${r.id}`}
                            className="inline-flex items-center px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium transition-colors"
                          >
                            Review
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TourTarget>
        </>
      )}
    </div>
  );
}
