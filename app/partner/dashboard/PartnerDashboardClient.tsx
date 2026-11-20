'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ComplianceAlert } from './page';
import { ComplianceStatusBadge, type ComplianceStatus } from '@/components/eco/ComplianceStatusBadge';
import { CopyableCode } from '@/components/eco/CopyableCode';
import { LocalDateTime } from '@/components/eco/LocalDateTime';
import { getDirection } from '@/lib/i18n/portal';
import TourTarget from '@/components/portal/tour/TourTarget';
import { trackEvent } from '@/lib/analytics';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{label}</span>;
}

function mapStageToComplianceStatus(stage: string): ComplianceStatus {
  if (stage === 'Active') return 'compliant';
  if (stage === 'Onboarding') return 'under_review';
  if (stage === 'Prospect') return 'draft';
  if (stage === 'Inactive') return 'pending';
  return 'pending';
}

function CheckItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${done ? 'bg-emerald-50' : 'bg-slate-50'}`}>
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300'}`}>
        {done && (
          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className={done ? 'text-slate-400 line-through' : 'text-slate-800'}>{label}</span>
    </div>
  );
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

const NAV_TABS = ['Overview', 'Onboarding', 'Resources'] as const;
type Tab = (typeof NAV_TABS)[number];

// ─── Props ────────────────────────────────────────────────────────────────────

interface Stats {
  totalClients: number;
  openLeads: number;
  pendingEarnings: number;
  totalEarned: number;
  openTasks: number;
}

export default function PartnerDashboardClient({
  partner,
  manager,
  portalUser,
  csm,
  checklist: initialChecklist,
  stats,
  alerts = [],
  conversionRate = 0,
}: {
  partner: any;
  manager: any;
  portalUser: any;
  csm: any;
  checklist: any;
  stats: Stats;
  alerts?: ComplianceAlert[];
  conversionRate?: number;
}) {
  const dir = getDirection('en');
  const [tab, setTab] = useState<Tab>('Overview');
  const [checklist, setChecklist] = useState(initialChecklist);
  const [stepsLoading, setStepsLoading] = useState(false);

  const commissionText = partner.commission_type
    ? `${partner.commission_type}${partner.commission_value ? ` — ${formatINR(Number(partner.commission_value))}` : ''}`
    : '—';

  const readinessItems = [
    { label: 'Agreement Signed', done: !!partner.agreement_signed },
    { label: 'Welcome Kit Sent', done: !!partner.kit_sent },
    { label: 'Training Completed', done: !!partner.training_completed },
    { label: 'Portal Access Granted', done: !!partner.portal_access },
  ];
  const readinessPct = Math.round((readinessItems.filter((i) => i.done).length / readinessItems.length) * 100);

  async function toggleStep(stepId: string, done: boolean) {
    if (!checklist?.id) return;
    setStepsLoading(true);
    const res = await fetch(`/api/onboarding/${checklist.id}/step`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, done }),
    });
    const json = await res.json();
    setStepsLoading(false);
    if (!res.ok) return;
    trackEvent('Partner Onboarding Step Completed', { step_id: stepId, done, completion_pct: json.completion_pct });
    setChecklist((prev: any) => ({ ...prev, steps: json.steps, completion_pct: json.completion_pct }));
  }

  // Stat cards config
  const statCards = [
    {
      label: 'Active Clients',
      value: stats.totalClients,
      sub: 'referred through you',
      href: '/partner/clients',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Open Leads',
      value: stats.openLeads,
      sub: 'in pipeline',
      href: '/partner/leads',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      accent: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Pending Payout',
      value: formatINR(stats.pendingEarnings),
      sub: 'awaiting payment',
      href: '/partner/commissions',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Open Tasks',
      value: stats.openTasks,
      sub: 'need attention',
      href: '/partner/tasks',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      accent: 'text-rose-600 bg-rose-50',
    },
  ];

  return (
    <div dir={dir} className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{partner.company_name}</h1>
          <p className="text-sm text-slate-500">
            {[partner.city, partner.state].filter(Boolean).join(', ')}
            {partner.partner_type ? ` · ${partner.partner_type}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge label={partner.partner_type || 'Partner'} color="bg-indigo-100 text-indigo-800" />
          <ComplianceStatusBadge status={mapStageToComplianceStatus(partner.stage || 'Active')} />
        </div>
      </div>

      {/* Needs Attention */}
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm font-semibold text-emerald-800">All clients compliant — no immediate actions required.</p>
        </div>
      ) : (
        <TourTarget id="dash-alerts" className="rounded-xl border border-rose-200 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 border-b border-rose-200 bg-rose-50 px-4 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-600 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-sm font-semibold text-rose-800">Needs Attention ({alerts.length})</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {alerts.map((a, i) => {
              const isOverdue = a.issueType === 'overdue';
              const days = Math.abs(a.daysUntil);
              const issueLabel = a.issueType === 'overdue' ? `Overdue by ${days}d` : a.issueType === 'cert_expiring' ? `Cert expiring in ${days}d` : `Renewal in ${days}d`;
              const badgeCls = isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
              return (
                <div key={i} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-slate-900">{a.clientName}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badgeCls}`}>{issueLabel}</span>
                  </div>
                  <Link href={`/partner/clients/${a.clientId}`} className="text-xs text-indigo-600 hover:underline">View →</Link>
                </div>
              );
            })}
          </div>
        </TourTarget>
      )}

      {/* Stat cards */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
          >
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.accent} mb-3`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
              </svg>
            </div>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-0.5 text-xl font-bold text-slate-900 tabular-nums">{s.value}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.sub}</p>
          </Link>
        ))}
      </TourTarget>

      {/* Readiness bar */}
      <TourTarget id="dash-readiness" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-800">Partner Readiness</p>
          <span className={`text-sm font-bold ${readinessPct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {readinessPct}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all ${readinessPct === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${readinessPct}%` }}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {readinessItems.map((item) => (
            <CheckItem key={item.label} label={item.label} done={item.done} />
          ))}
        </div>
      </TourTarget>

      {/* Tabs */}
      <div>
        <TourTarget id="dash-tabs" className="flex gap-1 border-b border-slate-200 mb-4">
          {NAV_TABS.map((t) => (
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
        </TourTarget>

        {/* ── Overview ── */}
        {tab === 'Overview' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Partner details */}
            <TourTarget id="dash-partner-details" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Partner Details</h2>
              <dl className="space-y-2 text-sm">
                {[
                  ['Contact', partner.contact_person],
                  ['Email', partner.email],
                  ['Phone', partner.phone],
                  ['Location', [partner.city, partner.state].filter(Boolean).join(', ')],
                  ['Partner Type', partner.partner_type],
                  ['Outreach Tier', partner.outreach_tier],
                  ['Commission', commissionText],
                  ['Contract Renewal', partner.contract_renewal_date
                    ? new Date(partner.contract_renewal_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : null],
                  ['Relationship Manager', manager?.full_name],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex gap-2">
                    <dt className="w-40 shrink-0 text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900 break-all">{(v as any) || '—'}</dd>
                  </div>
                ))}
                <div className="flex gap-2">
                  <dt className="w-40 shrink-0 text-slate-500">Partner ID</dt>
                  <dd><CopyableCode value={partner.id || ''} label="Partner ID" /></dd>
                </div>
              </dl>
            </TourTarget>

            {/* Earnings summary */}
            <div className="space-y-3">
              <TourTarget id="dash-earnings-summary" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Earnings Summary</h2>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-emerald-50 p-3">
                    <p className="text-xs text-emerald-700">Total Earned</p>
                    <p className="mt-0.5 text-lg font-bold text-emerald-800">{formatINR(stats.totalEarned)}</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">Pending Payout</p>
                    <p className="mt-0.5 text-lg font-bold text-amber-800">{formatINR(stats.pendingEarnings)}</p>
                  </div>
                </div>
                <Link href="/partner/commissions" className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition">
                  View commission history
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </TourTarget>

              {/* Performance Benchmarks */}
              <TourTarget id="dash-performance" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="mb-3 text-sm font-semibold text-slate-900">Your Performance</h2>
                {(() => {
                  const count = stats.totalClients;
                  const tier = count >= 50 ? 'Platinum' : count >= 11 ? 'Gold' : 'Silver';
                  const tierColor = tier === 'Platinum' ? 'bg-purple-100 text-purple-800' : tier === 'Gold' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700';
                  const nextTier = tier === 'Silver' ? { name: 'Gold', at: 11 } : tier === 'Gold' ? { name: 'Platinum', at: 50 } : null;
                  const pct = nextTier ? Math.min(100, Math.round((count / nextTier.at) * 100)) : 100;
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${tierColor}`}>{tier} Partner</span>
                        {nextTier && <span className="text-xs text-slate-500">{nextTier.at - count} more clients to {nextTier.name}</span>}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-slate-500">Conversion Rate</p>
                          <p className="font-bold text-slate-900 tabular-nums">{conversionRate}%</p>
                        </div>
                        <div className="rounded-lg bg-slate-50 p-2">
                          <p className="text-slate-500">Total Clients</p>
                          <p className="font-bold text-slate-900 tabular-nums">{count}</p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </TourTarget>

              {/* Contact RM */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Your Relationship Manager</h2>
                {manager ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                      {(manager.full_name || 'RM').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{manager.full_name}</p>
                      {manager.email && (
                        <a href={`mailto:${manager.email}`} className="text-xs text-indigo-600 hover:underline">{manager.email}</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No RM assigned yet.</p>
                )}
                <p className="mt-3 text-xs text-slate-500">
                  For support: <a href="mailto:supporteprcompass@gmail.com" className="font-medium text-indigo-600 hover:underline">supporteprcompass@gmail.com</a>
                </p>
              </div>

              {/* Portal support contact */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Your Portal Support Contact</h2>
                {portalUser ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                      {(portalUser.full_name || 'PS').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{portalUser.full_name}</p>
                      {portalUser.email && (
                        <a href={`mailto:${portalUser.email}`} className="text-xs text-teal-600 hover:underline">{portalUser.email}</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not assigned yet.</p>
                )}
                <p className="mt-3 text-xs text-slate-500">For questions about using the portal.</p>
              </div>

              {/* Customer success manager contact */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-2 text-sm font-semibold text-slate-900">Your Customer Success Manager</h2>
                {csm ? (
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                      {(csm.full_name || 'CS').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{csm.full_name}</p>
                      {csm.email && (
                        <a href={`mailto:${csm.email}`} className="text-xs text-amber-600 hover:underline">{csm.email}</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Not assigned yet.</p>
                )}
                <p className="mt-3 text-xs text-slate-500">For business-related questions.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Onboarding ── */}
        {tab === 'Onboarding' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-900">Your Onboarding Steps</h2>
              {checklist && (
                <span className={`text-sm font-semibold ${checklist.completion_pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {checklist.completion_pct}% done
                </span>
              )}
            </div>
            {!checklist ? (
              <p className="text-sm text-slate-400">No onboarding checklist assigned yet. Your relationship manager will set this up shortly.</p>
            ) : (
              <div className="space-y-2">
                {(checklist.steps || []).map((step: any) => (
                  <label
                    key={step.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      step.done ? 'bg-emerald-50' : 'bg-slate-50 hover:bg-slate-100'
                    } ${stepsLoading ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!step.done}
                      onChange={(e) => toggleStep(step.id, e.target.checked)}
                      className="h-4 w-4 accent-indigo-600"
                    />
                    <span className={`flex-1 ${step.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                      {step.label}
                    </span>
                    {step.done && step.done_at && (
                      <span className="text-xs text-slate-400">
                        <LocalDateTime value={step.done_at} locale="en-IN" />
                      </span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Resources ── */}
        {tab === 'Resources' && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                title: 'EPR Regulations Overview',
                desc: 'Summary of EPR obligations across plastic, e-waste, battery, tyre, used oil, ELV, and non-ferrous material categories.',
                href: '/services',
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
              },
              {
                title: 'Partner Pitch Deck',
                desc: 'Co-branded pitch materials to present EPR solutions to your clients.',
                href: '/contact',
                icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z',
              },
              {
                title: 'Submit a New Lead',
                desc: 'Refer a new prospect directly through your portal for EPR registration or credit services.',
                href: '/partner/leads',
                icon: 'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
              },
              {
                title: 'Training & Certification',
                desc: 'Enroll in EPR compliance certification courses to strengthen your advisory practice.',
                href: '/trainings',
                icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
              },
            ].map((r) => (
              <a
                key={r.title}
                href={r.href}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 mt-0.5">
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth={1.75}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={r.icon} />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors">{r.title}</h3>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{r.desc}</p>
                    <span className="mt-2 inline-block text-xs font-medium text-indigo-600">View →</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
