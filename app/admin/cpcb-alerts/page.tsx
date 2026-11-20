'use client';

import { useEffect, useState } from 'react';

interface CpcbAlert {
  id: string;
  title: string;
  issued_by: string;
  alert_type: string;
  urgency: string;
  epr_types: string[];
  affected_states: string[];
  effective_date: string | null;
  compliance_deadline: string | null;
  published_at: string;
  source_url: string | null;
  is_active: boolean;
  fan_out_count: number;
}

const EPR_TYPES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
const URGENCY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALERT_TYPES = [
  'RULE_CHANGE', 'DEADLINE', 'PENALTY_NOTICE', 'COMPLIANCE_CIRCULAR',
  'TECHNICAL_GUIDELINE', 'INSPECTION_NOTICE', 'GENERAL_ADVISORY',
];
const URGENCY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-rose-900/30 text-rose-300 border-rose-700/50',
  HIGH: 'bg-orange-900/30 text-orange-800 border-orange-300',
  MEDIUM: 'bg-amber-900/30 text-amber-200 border-amber-700/50',
  LOW: 'bg-blue-900/30 text-blue-300 border-blue-700/50',
};

export default function AdminCpcbAlertsPage() {
  const [alerts, setAlerts] = useState<CpcbAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [form, setForm] = useState({
    title: '',
    summary: '',
    issuedBy: 'CPCB',
    alertType: 'COMPLIANCE_CIRCULAR',
    urgency: 'MEDIUM',
    eprTypes: [] as string[],
    affectedStates: [] as string[],
    effectiveDate: '',
    complianceDeadline: '',
    sourceUrl: '',
  });

  const load = () => {
    setLoading(true);
    fetch('/api/admin/cpcb-alerts')
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  function toggleEprType(t: string) {
    setForm((f) => ({
      ...f,
      eprTypes: f.eprTypes.includes(t) ? f.eprTypes.filter((x) => x !== t) : [...f.eprTypes, t],
    }));
  }

  async function submitAlert() {
    setFormError('');
    setFormSuccess('');
    if (!form.title || !form.issuedBy) {
      setFormError('Title and issuer are required.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/cpcb-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          summary: form.summary,
          issuedBy: form.issuedBy,
          alertType: form.alertType,
          urgency: form.urgency,
          eprTypes: form.eprTypes,
          affectedStates: form.affectedStates.length ? form.affectedStates : null,
          effectiveDate: form.effectiveDate || null,
          complianceDeadline: form.complianceDeadline || null,
          sourceUrl: form.sourceUrl || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? 'Failed to create alert');
      } else {
        setFormSuccess(`Alert created. Fan-out to ${data.fanOutCount ?? 0} recyclers.`);
        setForm({
          title: '', summary: '', issuedBy: 'CPCB', alertType: 'COMPLIANCE_CIRCULAR',
          urgency: 'MEDIUM', eprTypes: [], affectedStates: [], effectiveDate: '',
          complianceDeadline: '', sourceUrl: '',
        });
        setShowForm(false);
        load();
      }
    } catch {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const field = 'w-full rounded-xl border border-slate-700 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500';
  const lbl = 'block text-xs font-medium text-slate-400 mb-1';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">CPCB Alerts</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {showForm ? 'Cancel' : '+ New Alert'}
        </button>
      </div>

      {formSuccess && (
        <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/40 px-4 py-2 text-sm text-emerald-300">
          {formSuccess}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-orange-800/40 bg-orange-950/30 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200">Create Alert & Fan-out to Recyclers</h2>

          <div>
            <label className={lbl}>Title *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className={field} />
          </div>
          <div>
            <label className={lbl}>Summary</label>
            <textarea value={form.summary} onChange={(e) => setForm(f => ({ ...f, summary: e.target.value }))} rows={3} className={`${field} resize-none`} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Issued By</label>
              <input value={form.issuedBy} onChange={(e) => setForm(f => ({ ...f, issuedBy: e.target.value }))} className={field} placeholder="CPCB, MoEFCC…" />
            </div>
            <div>
              <label className={lbl}>Alert Type</label>
              <select value={form.alertType} onChange={(e) => setForm(f => ({ ...f, alertType: e.target.value }))} className={field}>
                {ALERT_TYPES.map((t) => <option key={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className={lbl}>Urgency</label>
            <div className="flex gap-2 flex-wrap">
              {URGENCY_LEVELS.map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, urgency: u }))}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    form.urgency === u ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-900/60 text-slate-400 border-slate-700'
                  }`}
                >
                  {u}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={lbl}>EPR Types (blank = all)</label>
            <div className="flex gap-2 flex-wrap">
              {EPR_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleEprType(t)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    form.eprTypes.includes(t) ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-900/60 text-slate-400 border-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lbl}>Effective Date</label>
              <input type="date" value={form.effectiveDate} onChange={(e) => setForm(f => ({ ...f, effectiveDate: e.target.value }))} className={field} />
            </div>
            <div>
              <label className={lbl}>Compliance Deadline</label>
              <input type="date" value={form.complianceDeadline} onChange={(e) => setForm(f => ({ ...f, complianceDeadline: e.target.value }))} className={field} />
            </div>
          </div>

          <div>
            <label className={lbl}>Source URL</label>
            <input type="url" value={form.sourceUrl} onChange={(e) => setForm(f => ({ ...f, sourceUrl: e.target.value }))} className={field} placeholder="https://cpcb.nic.in/…" />
          </div>

          {formError && (
            <p role="alert" className="text-sm text-rose-300 bg-rose-950/30 px-3 py-2 rounded-lg border border-rose-800/40">
              {formError}
            </p>
          )}

          <button
            onClick={submitAlert}
            disabled={submitting}
            className="rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {submitting ? 'Publishing…' : 'Publish & Fan-out'}
          </button>
        </div>
      )}

      {/* Alerts table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-900 animate-pulse" />)}
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-500 text-sm">No CPCB alerts published yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950">
              <tr className="text-slate-500 border-b border-slate-800/60">
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Urgency</th>
                <th className="px-4 py-3 font-semibold">EPR Types</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Fan-out</th>
                <th className="px-4 py-3 font-semibold">Published</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {alerts.map((a) => (
                <tr key={a.id} className="hover:bg-slate-950 text-slate-200">
                  <td className="px-4 py-3">
                    <p className="font-medium truncate max-w-[220px]">{a.title}</p>
                    <p className="text-slate-500">{a.issued_by}</p>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.alert_type.replace('_', ' ')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] ${URGENCY_COLORS[a.urgency] ?? ''}`}>
                      {a.urgency}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {a.epr_types?.length ? a.epr_types.join(', ') : 'All'}
                  </td>
                  <td className="px-4 py-3">
                    {a.compliance_deadline
                      ? new Date(a.compliance_deadline).toLocaleDateString('en-IN')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">{a.fan_out_count ?? 0}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(a.published_at).toLocaleDateString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
