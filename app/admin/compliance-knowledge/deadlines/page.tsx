'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ComplianceDeadline } from '@/lib/complianceKnowledge/types';
import { FILING_TYPE_LABELS, daysUntil, formatDaysRemaining, getUrgency, URGENCY_CONFIG } from '@/lib/complianceKnowledge/constants';

type RefData = {
  frameworks: { id: string; name: string; short_name?: string; compliance_countries?: { name: string; flag_emoji?: string }; compliance_types?: { name: string } }[];
  cycles: { id: string; framework_id: string; cycle_code: string; cycle_label: string }[];
  financial_years: { id: string; country_id: string; label: string; short_label: string; is_current: boolean }[];
};

const ENTITY_OPTIONS = ['PIBO','Producer','Importer','Brand Owner','Recycler','PRO','Other'];

const EMPTY_FORM = {
  framework_id: '', cycle_id: '', financial_year_id: '',
  filing_type: 'quarterly_return', title: '', description: '',
  due_date: '', submission_open_date: '', grace_period_days: '0',
  penalty_info: '', applicable_entity_types: [] as string[],
  reminder_days_before: '30,15,7,1', is_active: true,
};

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [ref, setRef] = useState<RefData>({ frameworks: [], cycles: [], financial_years: [] });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState<ComplianceDeadline | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterFw, setFilterFw] = useState('');
  const [filterFY, setFilterFY] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterFw) params.set('framework_id', filterFw);
    if (filterFY) params.set('financial_year_id', filterFY);

    const [dlRes, fwRes, refRes] = await Promise.all([
      fetch(`/api/admin/compliance-knowledge/deadlines?${params}&upcoming=365`),
      fetch('/api/admin/compliance-knowledge/frameworks'),
      fetch('/api/admin/compliance-knowledge/reference'),
    ]);
    const [dlData, fwData, refData] = await Promise.all([dlRes.json(), fwRes.json(), refRes.json()]);
    setDeadlines(dlData.deadlines || []);
    setRef({
      frameworks: fwData.frameworks || [],
      cycles: [],
      financial_years: refData.financial_years || [],
    });
    setLoading(false);
  }, [filterFw, filterFY]);

  useEffect(() => { load(); }, [load]);

  async function loadCycles(frameworkId: string) {
    if (!frameworkId) return;
    const res = await fetch(`/api/admin/compliance-knowledge/frameworks/${frameworkId}`);
    if (res.ok) {
      const d = await res.json();
      setRef(r => ({ ...r, cycles: d.cycles || [] }));
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditing(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(d: ComplianceDeadline) {
    setForm({
      framework_id: d.framework_id,
      cycle_id: d.cycle_id || '',
      financial_year_id: d.financial_year_id || '',
      filing_type: d.filing_type,
      title: d.title,
      description: d.description || '',
      due_date: d.due_date,
      submission_open_date: d.submission_open_date || '',
      grace_period_days: String(d.grace_period_days),
      penalty_info: d.penalty_info || '',
      applicable_entity_types: d.applicable_entity_types || [],
      reminder_days_before: (d.reminder_days_before || [30,15,7,1]).join(','),
      is_active: d.is_active,
    });
    setEditing(d);
    setShowForm(true);
    setError('');
    loadCycles(d.framework_id);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        grace_period_days: parseInt(form.grace_period_days) || 0,
        reminder_days_before: form.reminder_days_before.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
        cycle_id: form.cycle_id || null,
        financial_year_id: form.financial_year_id || null,
        submission_open_date: form.submission_open_date || null,
      };

      let res;
      if (editing) {
        res = await fetch('/api/admin/compliance-knowledge/deadlines', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
      } else {
        res = await fetch('/api/admin/compliance-knowledge/deadlines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  const filteredFYs = ref.financial_years.filter(fy =>
    !form.framework_id || (() => {
      const fw = ref.frameworks.find(f => f.id === form.framework_id);
      return !fw; // show all if can't match country
    })()
  );

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Compliance Deadlines</h1>
          <p className="text-sm text-slate-500 mt-1">Configure filing deadlines for all compliance frameworks.</p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary"
        >+ Add Deadline</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterFw}
          onChange={e => setFilterFw(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
        >
          <option value="">All Frameworks</option>
          {ref.frameworks.map(f => (
            <option key={f.id} value={f.id}>{f.compliance_countries?.flag_emoji} {f.short_name || f.name}</option>
          ))}
        </select>
        <select
          value={filterFY}
          onChange={e => setFilterFY(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
        >
          <option value="">All Financial Years</option>
          {ref.financial_years.map(fy => (
            <option key={fy.id} value={fy.id}>{fy.label}{fy.is_current ? ' (Current)' : ''}</option>
          ))}
        </select>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-100">
                {editing ? 'Edit Deadline' : 'Add Compliance Deadline'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200 transition">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {error && <div className="mb-4 rounded-lg bg-rose-950/30 border border-rose-800/40 p-3 text-sm text-rose-300">{error}</div>}

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Framework *</label>
                  <select
                    value={form.framework_id}
                    onChange={e => {
                      setForm(f => ({ ...f, framework_id: e.target.value, cycle_id: '', financial_year_id: '' }));
                      loadCycles(e.target.value);
                    }}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    <option value="">Select framework…</option>
                    {ref.frameworks.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.compliance_countries?.flag_emoji} {f.short_name || f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Filing Type *</label>
                  <select
                    value={form.filing_type}
                    onChange={e => setForm(f => ({ ...f, filing_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    {Object.entries(FILING_TYPE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Cycle (optional)</label>
                  <select
                    value={form.cycle_id}
                    onChange={e => setForm(f => ({ ...f, cycle_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    <option value="">No specific cycle</option>
                    {ref.cycles.filter(c => c.framework_id === form.framework_id).map(c => (
                      <option key={c.id} value={c.id}>{c.cycle_label} ({c.cycle_code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Financial Year</label>
                  <select
                    value={form.financial_year_id}
                    onChange={e => setForm(f => ({ ...f, financial_year_id: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    <option value="">Not FY-specific</option>
                    {ref.financial_years.map(fy => (
                      <option key={fy.id} value={fy.id}>{fy.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Title *</label>
                <input
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Q1 Plastic EPR Return – FY 2025-26"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Open Date</label>
                  <input
                    type="date"
                    value={form.submission_open_date}
                    onChange={e => setForm(f => ({ ...f, submission_open_date: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Grace Period (days)</label>
                  <input
                    type="number"
                    value={form.grace_period_days}
                    onChange={e => setForm(f => ({ ...f, grace_period_days: e.target.value }))}
                    min="0"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Penalty Info</label>
                <input
                  value={form.penalty_info}
                  onChange={e => setForm(f => ({ ...f, penalty_info: e.target.value }))}
                  placeholder="e.g. ₹10,000/day after grace period"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-2">Applicable Entity Types</label>
                <div className="flex flex-wrap gap-2">
                  {ENTITY_OPTIONS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setForm(f => ({
                        ...f,
                        applicable_entity_types: f.applicable_entity_types.includes(e)
                          ? f.applicable_entity_types.filter(x => x !== e)
                          : [...f.applicable_entity_types, e],
                      }))}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        form.applicable_entity_types.includes(e)
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >{e}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Reminder Days Before Due (comma-separated)</label>
                <input
                  value={form.reminder_days_before}
                  onChange={e => setForm(f => ({ ...f, reminder_days_before: e.target.value }))}
                  placeholder="30,15,7,1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-950 transition"
              >Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.framework_id || !form.filing_type || !form.title || !form.due_date}
                className="btn-primary"
              >
                {saving ? 'Saving…' : (editing ? 'Save Changes' : 'Add Deadline')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading deadlines…</p>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-950">
              <tr>
                {['Deadline','Framework','Type','Due Date','FY','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {deadlines.map(d => {
                const days = daysUntil(d.due_date);
                const urgency = getUrgency(days);
                const uc = URGENCY_CONFIG[urgency];
                const isPast = days < 0;
                return (
                  <tr key={d.id} className="hover:bg-slate-950">
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-100 truncate">{d.title}</p>
                      {d.compliance_filing_cycles && (
                        <p className="text-xs text-slate-500">{d.compliance_filing_cycles.cycle_label}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {d.compliance_frameworks?.compliance_countries?.flag_emoji}{' '}
                      {d.compliance_frameworks?.short_name || d.compliance_frameworks?.name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300">
                        {FILING_TYPE_LABELS[d.filing_type] || d.filing_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className={`font-mono text-xs ${isPast ? 'text-red-500' : 'text-slate-200'}`}>
                        {new Date(d.due_date).toLocaleDateString()}
                      </p>
                      <p className={`text-[10px] ${uc.color} rounded px-1`}>
                        {formatDaysRemaining(days)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {d.financial_year_structures?.short_label || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${d.is_active ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-xs text-teal-600 hover:underline"
                      >Edit</button>
                    </td>
                  </tr>
                );
              })}
              {deadlines.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No deadlines found. Click &quot;+ Add Deadline&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
