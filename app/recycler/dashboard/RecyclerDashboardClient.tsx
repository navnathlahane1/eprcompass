'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { ComplianceStatusBadge, type ComplianceStatus } from '@/components/eco/ComplianceStatusBadge';
import { EprProgressCard, type WasteCategory } from '@/components/eco/EprProgressCard';
import { CopyableCode } from '@/components/eco/CopyableCode';
import { LocalDateTime } from '@/components/eco/LocalDateTime';
import { getDirection } from '@/lib/i18n/portal';

const WASTE_CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre', 'Oil'];
const ALERT_TYPES = ['above', 'below'] as const;
const CHANNELS = ['email', 'whatsapp', 'both'] as const;

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>{label}</span>;
}

function mapRecyclerStatus(status: string): ComplianceStatus {
  if (status === 'Active') return 'compliant';
  if (status === 'Onboarding') return 'under_review';
  if (status === 'Suspended' || status === 'Blacklisted') return 'overdue';
  return 'pending';
}

function riskColor(flag: string) {
  if (flag === 'High') return 'bg-red-100 text-red-800';
  if (flag === 'Medium') return 'bg-orange-100 text-orange-800';
  if (flag === 'Low') return 'bg-yellow-100 text-yellow-800';
  return 'bg-slate-100 text-slate-600';
}

function docStatusColor(status: string) {
  if (status === 'Approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Expired') return 'bg-red-100 text-red-800';
  if (status === 'Pending') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function daysUntil(date: string | null | undefined) {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00Z`).getTime() - Date.now();
  return Math.ceil(d / (1000 * 60 * 60 * 24));
}

const NAV_TABS = ['Overview', 'Documents', 'EPR Credits', 'Capacity', 'Price Alerts', 'Onboarding'] as const;
type Tab = (typeof NAV_TABS)[number];

export default function RecyclerDashboardClient({
  recycler, documents, credits, capacityLogs, priceAlerts: initialAlerts, latestPrices, checklist: initialChecklist
}: {
  recycler: any;
  documents: any[];
  credits: any[];
  capacityLogs: any[];
  priceAlerts: any[];
  latestPrices: Record<string, number>;
  checklist: any;
}) {
  const dir = getDirection('en');
  const [tab, setTab] = useState<Tab>('Overview');
  const [alerts, setAlerts] = useState(initialAlerts);
  const [checklist, setChecklist] = useState(initialChecklist);
  const [alertForm, setAlertForm] = useState({ waste_category: WASTE_CATEGORIES[0], target_rate_inr: '', alert_type: 'below' as 'above' | 'below', channel: 'email' as 'email' | 'whatsapp' | 'both' });
  const [saving, setSaving] = useState(false);
  const [alertError, setAlertError] = useState('');
  const [stepsLoading, setStepsLoading] = useState(false);

  const certExpiry = recycler.cpcb_cert_expiry;
  const daysToExpiry = daysUntil(certExpiry);

  const creditStats = useMemo(() => {
    const total = credits.length;
    const sold = credits.filter((c) => c.status === 'Sold' || c.status === 'Transferred').length;
    const pending = credits.filter((c) => c.status === 'Available').length;
    const totalValue = credits.reduce((s, c) => s + Number(c.total_value_inr || 0), 0);
    return { total, sold, pending, totalValue };
  }, [credits]);

  const latestCapacity = capacityLogs[capacityLogs.length - 1];

  const progressCards = useMemo(() => {
    const categories = ['plastic', 'e-waste', 'battery', 'tyre'] as WasteCategory[];
    return categories.map((category) => {
      const matchedCredits = credits.filter((c) => {
        const normalized = String(c.waste_category || '').toLowerCase();
        if (category === 'e-waste') return normalized === 'e-waste' || normalized === 'ewaste';
        return normalized === category;
      });
      const totalKg = matchedCredits.reduce((sum, item) => sum + Number(item.quantity_kg || 0), 0);

      return {
        category,
        actualKg: totalKg,
        targetKg: Math.max(1200, matchedCredits.length * 500),
        filingYear: 'FY 2025-26'
      };
    });
  }, [credits]);

  async function addAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!alertForm.target_rate_inr || isNaN(Number(alertForm.target_rate_inr))) {
      setAlertError('Enter a valid target rate');
      return;
    }
    setSaving(true);
    setAlertError('');
    const { data, error } = await (supabase as any)
      .from('credit_price_alerts')
      .insert({
        client_id: recycler.id,
        waste_category: alertForm.waste_category,
        target_rate_inr: Number(alertForm.target_rate_inr),
        alert_type: alertForm.alert_type,
        channel: alertForm.channel,
        status: 'Active',
      })
      .select()
      .single();
    setSaving(false);
    if (error) { setAlertError(error.message); return; }
    setAlerts((prev: any[]) => [data, ...prev]);
    setAlertForm((f) => ({ ...f, target_rate_inr: '' }));
  }

  async function pauseAlert(id: string, current: string) {
    const newStatus = current === 'Active' ? 'Paused' : 'Active';
    await (supabase as any).from('credit_price_alerts').update({ status: newStatus }).eq('id', id);
    setAlerts((prev: any[]) => prev.map((a) => a.id === id ? { ...a, status: newStatus } : a));
  }

  async function deleteAlert(id: string) {
    await (supabase as any).from('credit_price_alerts').delete().eq('id', id);
    setAlerts((prev: any[]) => prev.filter((a) => a.id !== id));
  }

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
    setChecklist((prev: any) => ({ ...prev, steps: json.steps, completion_pct: json.completion_pct }));
  }

  return (
    <div dir={dir}>
      {/* Page header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{recycler.company_name}</h1>
          <p className="text-sm text-slate-500">{recycler.state}{recycler.city ? `, ${recycler.city}` : ''} · Recycler Portal</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <ComplianceStatusBadge status={mapRecyclerStatus(recycler.status || 'Unknown')} />
          {recycler.risk_flag && recycler.risk_flag !== 'None' && (
            <Badge label={`Risk: ${recycler.risk_flag}`} color={riskColor(recycler.risk_flag)} />
          )}
        </div>
      </div>

      {/* Cert expiry warning */}
      {daysToExpiry !== null && daysToExpiry <= 60 && (
        <div className={`mb-4 rounded-lg px-4 py-2.5 text-sm font-medium ${daysToExpiry <= 0 ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
          {daysToExpiry <= 0
            ? `⚠ CPCB Certificate expired ${Math.abs(daysToExpiry)} day(s) ago. Renew immediately.`
            : `⚠ CPCB Certificate expires in ${daysToExpiry} days (${formatDate(certExpiry)}). Schedule renewal.`}
        </div>
      )}

      <div>
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {progressCards.map((item) => (
            <EprProgressCard
              key={item.category}
              category={item.category}
              filingYear={item.filingYear}
              actualKg={item.actualKg}
              targetKg={item.targetKg}
              href="/recycler/dashboard"
              ctaLabel="View credits"
            />
          ))}
        </div>

        {/* Stat cards */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Credits', value: creditStats.total },
            { label: 'Available Credits', value: creditStats.pending },
            { label: 'Transferred', value: creditStats.sold },
            { label: 'Total Credit Value', value: `₹${Number(creditStats.totalValue).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
          {NAV_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`shrink-0 px-4 py-2 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-teal-600 text-teal-700' : 'text-slate-500 hover:text-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Overview ── */}
        {tab === 'Overview' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">Company Details</h2>
              <dl className="space-y-2 text-sm">
                {[
                  ['Contact', recycler.contact_person],
                  ['Email', recycler.email],
                  ['Phone', recycler.phone],
                  ['State', recycler.state],
                  ['City', recycler.city],
                  ['Capacity (MT/yr)', recycler.capacity_mt_pa ? Number(recycler.capacity_mt_pa).toLocaleString('en-IN') : '—'],
                  ['CPCB Expiry', certExpiry ? <LocalDateTime value={certExpiry} locale="en-IN" /> : '—'],
                  ['Waste Categories', (recycler.waste_categories || []).join(', ') || '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex gap-2">
                    <dt className="w-40 shrink-0 text-slate-500">{k}</dt>
                    <dd className="text-slate-900 font-medium">{v || '—'}</dd>
                  </div>
                ))}
                <div className="flex gap-2">
                  <dt className="w-40 shrink-0 text-slate-500">Recycler ID</dt>
                  <dd className="text-slate-900 font-medium"><CopyableCode value={recycler.id || ''} label="Recycler ID" /></dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-900">Capacity Summary</h2>
              {latestCapacity ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-500">Month: {formatDate(latestCapacity.month)}</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Utilization</span>
                      <span className="font-semibold">{Number(latestCapacity.utilization_pct || 0).toFixed(1)}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-teal-500" style={{ width: `${Math.min(100, Number(latestCapacity.utilization_pct || 0))}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Utilized: {Number(latestCapacity.utilized_mt || 0).toFixed(1)} MT</span>
                      <span>Total: {Number(latestCapacity.capacity_mt || 0).toFixed(1)} MT</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">No capacity data yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        {tab === 'Documents' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {documents.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No documents on file. Contact support to upload your compliance documents.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Document Type</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Expiry Date</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Uploaded</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => {
                    const dl = daysUntil(doc.expiry_date);
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{doc.doc_type}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDate(doc.expiry_date)}</td>
                        <td className="px-4 py-3"><Badge label={doc.status || 'Pending'} color={docStatusColor(doc.status)} /></td>
                        <td className="px-4 py-3 text-slate-500">{formatDate(doc.uploaded_at)}</td>
                        <td className="px-4 py-3">
                          {dl === null ? '—' : (
                            <span className={dl <= 0 ? 'font-bold text-red-600' : dl <= 30 ? 'text-amber-600 font-medium' : 'text-slate-600'}>
                              {dl <= 0 ? 'Expired' : `${dl}d`}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── EPR Credits ── */}
        {tab === 'EPR Credits' && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {credits.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No EPR credit transactions yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Qty (KG)</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Rate (₹/KG)</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Total Value</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-600">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credits.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{c.waste_category}</td>
                      <td className="px-4 py-3 text-slate-600">{c.credit_type}</td>
                      <td className="px-4 py-3 text-slate-900">{Number(c.quantity_kg || (Number(c.quantity_mt || 0) * 1000)).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3 text-slate-900">₹{Number(c.rate_per_kg_inr || (Number(c.rate_per_mt_inr || 0) / 1000)).toLocaleString('en-IN')}/KG</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">₹{Number(c.total_value_inr || 0).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3"><Badge label={c.status} color={c.status === 'Transferred' ? 'bg-emerald-100 text-emerald-800' : c.status === 'Available' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'} /></td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                          {c.transaction_ref ? <CopyableCode value={c.transaction_ref} label="Transaction Reference" /> : '—'}
                        </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ── Capacity ── */}
        {tab === 'Capacity' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">Monthly Capacity Utilization</h2>
            {capacityLogs.length === 0 ? (
              <p className="text-sm text-slate-400">No capacity data available.</p>
            ) : (
              <div className="space-y-3">
                {capacityLogs.map((log) => {
                  const pct = Math.min(100, Number(log.utilization_pct || 0));
                  return (
                    <div key={log.id}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-slate-600">{formatDate(log.month)}</span>
                        <span className="font-semibold text-slate-900">{pct.toFixed(1)}% — {Number(log.utilized_mt || 0).toFixed(1)} / {Number(log.capacity_mt || 0).toFixed(1)} MT</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-teal-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Price Alerts ── */}
        {tab === 'Price Alerts' && (
          <div className="space-y-4">
            {/* Current rates */}
            {Object.keys(latestPrices).length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h2 className="mb-3 font-semibold text-slate-900">Current Market Rates</h2>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(latestPrices).map(([cat, rate]) => (
                    <div key={cat} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                      <p className="text-xs text-slate-500">{cat}</p>
                      <p className="font-bold text-slate-900">₹{rate.toLocaleString('en-IN')}/KG</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add alert form */}
            <form onSubmit={addAlert} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 font-semibold text-slate-900">Set New Price Alert</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Category</label>
                  <select value={alertForm.waste_category} onChange={(e) => setAlertForm((f) => ({ ...f, waste_category: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    {WASTE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Target Rate (₹/KG)</label>
                  <input type="number" placeholder="e.g. 12" value={alertForm.target_rate_inr} onChange={(e) => setAlertForm((f) => ({ ...f, target_rate_inr: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Alert When</label>
                  <select value={alertForm.alert_type} onChange={(e) => setAlertForm((f) => ({ ...f, alert_type: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="below">Price goes below target</option>
                    <option value="above">Price goes above target</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Notify via</label>
                  <select value={alertForm.channel} onChange={(e) => setAlertForm((f) => ({ ...f, channel: e.target.value as any }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                    <option value="email">Email</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>
              {alertError && <p className="mt-2 text-sm text-red-600">{alertError}</p>}
              <button type="submit" disabled={saving} className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Add Alert'}</button>
            </form>

            {/* Existing alerts */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {alerts.length === 0 ? (
                <p className="p-6 text-center text-sm text-slate-400">No price alerts set.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-slate-600">Category</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Target</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Condition</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Channel</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                      <th className="px-4 py-3 font-semibold text-slate-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alerts.map((a: any) => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{a.waste_category}</td>
                        <td className="px-4 py-3 font-mono text-slate-900">₹{Number(a.target_rate_inr).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-slate-600 capitalize">{a.alert_type}</td>
                        <td className="px-4 py-3 text-slate-600 capitalize">{a.channel}</td>
                        <td className="px-4 py-3"><Badge label={a.status} color={a.status === 'Active' ? 'bg-emerald-100 text-emerald-800' : a.status === 'Triggered' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-600'} /></td>
                        <td className="px-4 py-3 flex gap-2">
                          <button onClick={() => pauseAlert(a.id, a.status)} className="text-xs text-blue-600 hover:underline">{a.status === 'Active' ? 'Pause' : 'Resume'}</button>
                          <button onClick={() => deleteAlert(a.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── Onboarding ── */}
        {tab === 'Onboarding' && (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900">Onboarding Checklist</h2>
              {checklist && (
                <span className={`text-sm font-semibold ${checklist.completion_pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {checklist.completion_pct}% Complete
                </span>
              )}
            </div>
            {!checklist ? (
              <p className="text-sm text-slate-400">No onboarding checklist assigned. Contact support.</p>
            ) : (
              <div className="space-y-2">
                {(checklist.steps || []).map((step: any) => (
                  <label key={step.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${step.done ? 'bg-emerald-50' : 'bg-slate-50'} ${stepsLoading ? 'pointer-events-none opacity-60' : ''}`}>
                    <input type="checkbox" checked={!!step.done} onChange={(e) => toggleStep(step.id, e.target.checked)} className="h-4 w-4 accent-teal-600" />
                    <span className={`flex-1 ${step.done ? 'line-through text-slate-400' : 'text-slate-800'}`}>{step.label}</span>
                    {step.done && step.done_at && (
                      <span className="text-xs text-slate-400"><LocalDateTime value={step.done_at} locale="en-IN" /></span>
                    )}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
