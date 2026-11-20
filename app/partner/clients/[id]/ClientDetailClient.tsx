'use client';

import { useState } from 'react';
import Link from 'next/link';

const TABS = ['Overview', 'Compliance', 'Opportunities', 'Timeline'] as const;
type Tab = (typeof TABS)[number];

export interface Opportunity {
  key: string;
  name: string;
  description: string;
  riskLevel: string | null;
  source: 'intel' | 'category';
}

function riskBadgeClass(riskLevel: string | null) {
  switch (riskLevel) {
    case 'critical': return 'bg-rose-100 text-rose-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-amber-100 text-amber-700';
    case 'low': return 'bg-emerald-100 text-emerald-700';
    default: return 'bg-slate-100 text-slate-600';
  }
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatINR(v: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
}

function statusBadge(status: string, dueDate?: string | null) {
  const today = new Date();
  const isOverdue = dueDate && new Date(dueDate) < today && !['approved', 'completed', 'Certificate Issued'].includes(status?.toLowerCase());
  if (isOverdue) return 'bg-rose-100 text-rose-700';
  if (['approved', 'Certificate Issued', 'completed'].includes(status?.toLowerCase())) return 'bg-emerald-100 text-emerald-700';
  if (status === 'Filed') return 'bg-blue-100 text-blue-700';
  if (status === 'Registered') return 'bg-indigo-100 text-indigo-700';
  if (['In Progress', 'in_progress'].includes(status)) return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
}

function clientStatusBadge(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Churned') return 'bg-rose-100 text-rose-800';
  if (status === 'At Risk') return 'bg-orange-100 text-orange-800';
  return 'bg-amber-100 text-amber-800';
}

interface ServiceRow {
  id: string;
  service_type: string;
  waste_category: string;
  status: string;
  filed_at: string | null;
  approved_at: string | null;
  certificate_number: string | null;
  certificate_expiry: string | null;
  due_date: string | null;
}

interface ClientDetail {
  id: string;
  companyName: string;
  email: string | null;
  status: string;
  wasteCategories: string[];
  ltv: number;
  renewalDate: string | null;
  onboardingComplete: boolean;
}

export default function ClientDetailClient({
  client,
  services,
  opportunities,
}: {
  client: ClientDetail;
  services: ServiceRow[];
  opportunities: Opportunity[];
}) {
  const [tab, setTab] = useState<Tab>('Overview');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Group services by category for Compliance tab
  const byCategory: Record<string, ServiceRow[]> = {};
  for (const s of services) {
    const cat = s.waste_category || 'General';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(s);
  }

  // Timeline events
  const timelineItems: { date: string; label: string; detail: string }[] = [];
  for (const s of services) {
    if (s.filed_at) timelineItems.push({ date: s.filed_at, label: 'Filed', detail: `${s.waste_category} — ${s.service_type}` });
    if (s.approved_at) timelineItems.push({ date: s.approved_at, label: 'Approved', detail: `${s.waste_category} — ${s.service_type}` });
    if (s.due_date) timelineItems.push({ date: s.due_date, label: 'Due', detail: `${s.waste_category} — ${s.service_type}` });
  }
  timelineItems.sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-4">
      {/* Back + header */}
      <div>
        <Link href="/partner/clients" className="text-xs text-indigo-600 hover:underline mb-2 inline-block">
          ← Back to Clients
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{client.companyName}</h1>
            {client.email && <p className="text-sm text-slate-500">{client.email}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${clientStatusBadge(client.status)}`}>
            {client.status}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t ? 'border-b-2 border-indigo-600 text-indigo-700' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Company Info</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Company', client.companyName],
                ['Email', client.email],
                ['Status', client.status],
                ['Renewal Date', formatDate(client.renewalDate)],
                ['Lifetime Value', formatINR(client.ltv)],
                ['Onboarding', client.onboardingComplete ? 'Complete' : 'In Progress'],
              ].map(([k, v]) => (
                <div key={k as string} className="flex gap-2">
                  <dt className="w-32 shrink-0 text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-900">{(v as string) || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-slate-900">Waste Categories</h2>
            <div className="flex flex-wrap gap-2">
              {client.wasteCategories.length === 0 ? (
                <p className="text-sm text-slate-400">No categories assigned.</p>
              ) : (
                client.wasteCategories.map(cat => (
                  <span key={cat} className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{cat}</span>
                ))
              )}
            </div>
            <div className="mt-4">
              <p className="text-xs text-slate-500 mb-1">Total Services</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{services.length}</p>
            </div>
          </div>
        </div>
      )}

      {/* Compliance tab */}
      {tab === 'Compliance' && (
        <div className="space-y-4">
          {Object.keys(byCategory).length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-sm text-slate-400">No services found for this client.</p>
            </div>
          ) : (
            Object.entries(byCategory).map(([cat, svcs]) => (
              <div key={cat} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                  <h3 className="text-sm font-semibold text-slate-900">{cat}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-2">Service Type</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2">Filed At</th>
                        <th className="px-4 py-2">Approved At</th>
                        <th className="px-4 py-2">Cert #</th>
                        <th className="px-4 py-2">Cert Expiry</th>
                        <th className="px-4 py-2">Due Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {svcs.map(s => (
                        <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-900">{s.service_type || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusBadge(s.status, s.due_date)}`}>
                              {s.status || 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-slate-600">{formatDate(s.filed_at)}</td>
                          <td className="px-4 py-2.5 text-slate-600">{formatDate(s.approved_at)}</td>
                          <td className="px-4 py-2.5 text-slate-600 font-mono text-xs">{s.certificate_number || '—'}</td>
                          <td className="px-4 py-2.5 text-slate-600">{formatDate(s.certificate_expiry)}</td>
                          <td className="px-4 py-2.5 text-slate-600">{formatDate(s.due_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Opportunities tab */}
      {tab === 'Opportunities' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-sm font-semibold text-slate-900">Additional Opportunities</h2>
          <p className="mb-4 text-xs text-slate-500">
            Certifications and compliances applicable to this client that haven't been sold yet. Click one to see why it's applicable.
          </p>
          {opportunities.length === 0 ? (
            <p className="text-sm text-slate-400">No additional opportunities right now — this client is covered across all applicable categories.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {opportunities.map(o => (
                <button
                  key={o.key}
                  onClick={() => setSelectedOpportunity(o)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">+</span>
                  {o.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Timeline tab */}
      {tab === 'Timeline' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold text-slate-900">Service Timeline</h2>
          {timelineItems.length === 0 ? (
            <p className="text-sm text-slate-400">No timeline events yet.</p>
          ) : (
            <div className="relative space-y-0">
              <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />
              {timelineItems.map((item, i) => {
                const dotColor = item.label === 'Approved' ? 'bg-emerald-500' : item.label === 'Filed' ? 'bg-blue-500' : 'bg-amber-400';
                return (
                  <div key={i} className="relative pl-8 pb-4">
                    <div className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-white ${dotColor}`} />
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                        <p className="text-xs text-slate-500 mt-0.5">{item.detail}</p>
                      </div>
                      <span className="text-[11px] text-slate-400 shrink-0">{formatDate(item.date)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Opportunity detail popup */}
      {selectedOpportunity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setSelectedOpportunity(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-900">{selectedOpportunity.name}</h3>
              <button
                onClick={() => setSelectedOpportunity(null)}
                className="text-slate-400 hover:text-slate-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {selectedOpportunity.riskLevel && (
              <span className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${riskBadgeClass(selectedOpportunity.riskLevel)}`}>
                {selectedOpportunity.riskLevel} risk if unaddressed
              </span>
            )}
            <p className="mt-3 text-sm font-medium text-indigo-700">This certification/compliance is applicable to this client.</p>
            <p className="mt-2 text-sm text-slate-600">{selectedOpportunity.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
