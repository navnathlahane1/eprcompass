'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ComplianceFramework, ComplianceFilingCycle, ComplianceDeadline, ComplianceDocumentRequirement } from '@/lib/complianceKnowledge/types';
import { FILING_TYPE_LABELS, CYCLE_TYPE_LABELS } from '@/lib/complianceKnowledge/constants';

type RefData = {
  countries: { id: string; name: string; iso2: string; flag_emoji?: string }[];
  types: { id: string; name: string; code: string; category: string; region: string }[];
  authorities: { id: string; name: string; acronym?: string; country_id: string }[];
  financial_years: { id: string; country_id: string; label: string; short_label: string; is_current: boolean }[];
};

const EMPTY_FW = {
  country_id: '', compliance_type_id: '', authority_id: '',
  name: '', short_name: '', description: '', legal_reference: '',
  portal_url: '', applicability_criteria: '', filing_notes: '',
  internal_notes: '', effective_from: '', is_active: true,
  registration_parameters: '[]',
};

export default function FrameworksPage() {
  const searchParams = useSearchParams();
  const preselectedId = searchParams?.get('id') || '';

  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selected, setSelected] = useState<ComplianceFramework | null>(null);
  const [cycles, setCycles] = useState<ComplianceFilingCycle[]>([]);
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([]);
  const [docReqs, setDocReqs] = useState<ComplianceDocumentRequirement[]>([]);
  const [ref, setRef] = useState<RefData>({ countries: [], types: [], authorities: [], financial_years: [] });
  const [form, setForm] = useState(EMPTY_FW);
  const [mode, setMode] = useState<'list' | 'create' | 'edit' | 'detail'>('list');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'cycles' | 'deadlines' | 'documents'>('overview');

  const loadFrameworks = useCallback(async () => {
    setLoading(true);
    const [fwRes, refRes] = await Promise.all([
      fetch('/api/admin/compliance-knowledge/frameworks'),
      fetch('/api/admin/compliance-knowledge/reference'),
    ]);
    const fwData = await fwRes.json();
    const refData = await refRes.json();
    setFrameworks(fwData.frameworks || []);
    setRef(refData);
    setLoading(false);
  }, []);

  useEffect(() => { loadFrameworks(); }, [loadFrameworks]);

  useEffect(() => {
    if (preselectedId && frameworks.length) {
      const fw = frameworks.find(f => f.id === preselectedId);
      if (fw) openDetail(fw);
    }
  }, [preselectedId, frameworks]);

  async function openDetail(fw: ComplianceFramework) {
    setSelected(fw);
    setMode('detail');
    setActiveTab('overview');
    const res = await fetch(`/api/admin/compliance-knowledge/frameworks/${fw.id}`);
    if (res.ok) {
      const d = await res.json();
      setSelected(d.framework);
      setCycles(d.cycles);
      setDeadlines(d.deadlines);
      setDocReqs(d.document_requirements);
    }
  }

  function startCreate() {
    setForm(EMPTY_FW);
    setSelected(null);
    setMode('create');
    setError('');
    setSuccess('');
  }

  function startEdit(fw: ComplianceFramework) {
    setForm({
      country_id: fw.country_id,
      compliance_type_id: fw.compliance_type_id,
      authority_id: fw.authority_id || '',
      name: fw.name,
      short_name: fw.short_name || '',
      description: fw.description || '',
      legal_reference: fw.legal_reference || '',
      portal_url: fw.portal_url || '',
      applicability_criteria: fw.applicability_criteria || '',
      filing_notes: fw.filing_notes || '',
      internal_notes: fw.internal_notes || '',
      effective_from: fw.effective_from || '',
      is_active: fw.is_active,
      registration_parameters: JSON.stringify(fw.registration_parameters || [], null, 2),
    });
    setSelected(fw);
    setMode('edit');
    setError('');
    setSuccess('');
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      let regParams;
      try { regParams = JSON.parse(form.registration_parameters); } catch { regParams = []; }

      const payload = {
        ...form,
        registration_parameters: regParams,
        authority_id: form.authority_id || null,
        effective_from: form.effective_from || null,
      };

      let res;
      if (mode === 'create') {
        res = await fetch('/api/admin/compliance-knowledge/frameworks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/compliance-knowledge/frameworks/${selected!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');

      setSuccess(mode === 'create' ? 'Framework created successfully.' : 'Framework updated.');
      await loadFrameworks();
      setMode('list');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(id: string) {
    if (!confirm('Deactivate this framework? Clients with this assignment will no longer see active deadlines.')) return;
    await fetch(`/api/admin/compliance-knowledge/frameworks/${id}`, { method: 'DELETE' });
    await loadFrameworks();
    if (mode === 'detail') setMode('list');
  }

  const filteredAuthorities = ref.authorities.filter(a =>
    !form.country_id || a.country_id === form.country_id
  );

  if (mode === 'detail' && selected) {
    return (
      <div className="space-y-6">
        {/* Back + actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setMode('list')}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-100 transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
            Back to frameworks
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => startEdit(selected)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm font-medium hover:bg-slate-950 transition"
            >Edit</button>
            <button
              onClick={() => handleDeactivate(selected.id)}
              className="rounded-lg border border-rose-800/40 px-3 py-1.5 text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition"
            >Deactivate</button>
          </div>
        </div>

        {/* Header */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selected.compliance_countries?.flag_emoji}</span>
                <h1 className="text-xl font-bold text-slate-100">{selected.name}</h1>
                {selected.is_active ? (
                  <span className="rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs font-medium text-emerald-300">Active</span>
                ) : (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium text-slate-500">Inactive</span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-500">{selected.compliance_countries?.name} · {selected.compliance_types?.name}</p>
              {selected.legal_reference && (
                <p className="mt-1 text-xs text-slate-500">{selected.legal_reference}</p>
              )}
            </div>
            {selected.portal_url && (
              <a
                href={selected.portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition"
              >
                Open Portal ↗
              </a>
            )}
          </div>
          {selected.description && (
            <p className="mt-4 text-sm text-slate-400">{selected.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1">
          {(['overview','cycles','deadlines','documents'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'bg-slate-900/60 text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-200'
              }`}
            >
              {tab}
              {tab === 'deadlines' && deadlines.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 text-[10px]">{deadlines.length}</span>
              )}
              {tab === 'documents' && docReqs.length > 0 && (
                <span className="ml-1.5 rounded-full bg-slate-800 px-1.5 text-[10px]">{docReqs.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoCard label="Authority" value={selected.regulatory_authorities ? `${selected.regulatory_authorities.name}${selected.regulatory_authorities.acronym ? ` (${selected.regulatory_authorities.acronym})` : ''}` : '—'} />
            <InfoCard label="Applicability" value={selected.applicability_criteria || '—'} />
            <InfoCard label="Filing Notes" value={selected.filing_notes || '—'} />
            <InfoCard label="Effective From" value={selected.effective_from ? new Date(selected.effective_from).toLocaleDateString() : '—'} />
            <div className="sm:col-span-2">
              <InfoCard label="Registration Parameters" value={`${Array.isArray(selected.registration_parameters) ? selected.registration_parameters.length : 0} parameters configured`} />
              {Array.isArray(selected.registration_parameters) && selected.registration_parameters.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selected.registration_parameters.map((p: { key: string; label: string; required: boolean }) => (
                    <span key={p.key} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.required ? 'bg-teal-100 text-teal-700' : 'bg-slate-900 text-slate-400'}`}>
                      {p.label}{p.required ? ' *' : ''}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'cycles' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-800/60 bg-slate-950">
                <tr>
                  {['Code','Label','Type','Period','Order'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {cycles.map(c => (
                  <tr key={c.id} className="hover:bg-slate-950">
                    <td className="px-4 py-3 font-mono text-xs text-teal-700">{c.cycle_code}</td>
                    <td className="px-4 py-3 font-medium text-slate-100">{c.cycle_label}</td>
                    <td className="px-4 py-3 text-slate-500">{CYCLE_TYPE_LABELS[c.cycle_type] || c.cycle_type}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {c.period_start_month && c.period_end_month
                        ? `M${c.period_start_month} – M${c.period_end_month}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{c.sort_order}</td>
                  </tr>
                ))}
                {cycles.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">No filing cycles configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <a
                href="/admin/compliance-knowledge/deadlines"
                className="btn-primary"
              >+ Add Deadline</a>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <table className="min-w-full text-sm">
                <thead className="border-b border-slate-800/60 bg-slate-950">
                  <tr>
                    {['Title','Type','Cycle','Due Date','FY','Grace'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {deadlines.map(d => {
                    const due = new Date(d.due_date);
                    const today = new Date();
                    const isPast = due < today;
                    return (
                      <tr key={d.id} className={`hover:bg-slate-950 ${isPast ? 'opacity-60' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-100">{d.title}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-900/30 px-2 py-0.5 text-xs text-blue-300">
                            {FILING_TYPE_LABELS[d.filing_type] || d.filing_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {d.compliance_filing_cycles?.cycle_label || '—'}
                        </td>
                        <td className={`px-4 py-3 font-mono text-xs ${isPast ? 'text-red-500' : 'text-slate-200'}`}>
                          {new Date(d.due_date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {d.financial_year_structures?.short_label || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {d.grace_period_days}d
                        </td>
                      </tr>
                    );
                  })}
                  {deadlines.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">No deadlines configured.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-3">
            {docReqs.map(doc => (
              <div key={doc.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-100">{doc.document_name}</p>
                      {doc.is_mandatory && (
                        <span className="rounded-full bg-rose-900/30 px-2 py-0.5 text-[10px] font-medium text-rose-400">Required</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-500">{doc.description || '—'}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xs text-slate-500">Formats: {doc.accepted_formats.join(', ')}</p>
                    {doc.validity_period_months && (
                      <p className="text-xs text-slate-500">Valid: {doc.validity_period_months}mo</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {docReqs.length === 0 && (
              <p className="rounded-xl border-2 border-dashed border-slate-800 p-8 text-center text-slate-500">No document requirements configured.</p>
            )}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-100">
            {mode === 'create' ? 'Add Compliance Framework' : 'Edit Framework'}
          </h1>
          <button onClick={() => setMode('list')} className="text-sm text-slate-500 hover:text-slate-100 transition">
            Cancel
          </button>
        </div>

        {error && <div className="rounded-lg bg-rose-950/30 border border-rose-800/40 p-3 text-sm text-rose-300">{error}</div>}
        {success && <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-3 text-sm text-emerald-300">{success}</div>}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Country *</label>
              <select
                value={form.country_id}
                onChange={e => setForm(f => ({ ...f, country_id: e.target.value, authority_id: '' }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              >
                <option value="">Select country…</option>
                {ref.countries.map(c => (
                  <option key={c.id} value={c.id}>{c.flag_emoji} {c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Compliance Type *</label>
              <select
                value={form.compliance_type_id}
                onChange={e => setForm(f => ({ ...f, compliance_type_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              >
                <option value="">Select type…</option>
                {ref.types.map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.region})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Framework Name *</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. India Plastic EPR – CPCB"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Short Name</label>
              <input
                value={form.short_name}
                onChange={e => setForm(f => ({ ...f, short_name: e.target.value }))}
                placeholder="Plastic EPR (India)"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Regulatory Authority</label>
              <select
                value={form.authority_id}
                onChange={e => setForm(f => ({ ...f, authority_id: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              >
                <option value="">None / Unknown</option>
                {filteredAuthorities.map(a => (
                  <option key={a.id} value={a.id}>{a.name}{a.acronym ? ` (${a.acronym})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Legal Reference</label>
              <input
                value={form.legal_reference}
                onChange={e => setForm(f => ({ ...f, legal_reference: e.target.value }))}
                placeholder="E-Waste Rules, 2022"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Portal URL</label>
              <input
                value={form.portal_url}
                onChange={e => setForm(f => ({ ...f, portal_url: e.target.value }))}
                placeholder="https://..."
                type="url"
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Applicability Criteria</label>
            <input
              value={form.applicability_criteria}
              onChange={e => setForm(f => ({ ...f, applicability_criteria: e.target.value }))}
              placeholder="e.g. Applicable to PIBOs placing plastic packaging in Indian market"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Filing Notes (visible to clients)</label>
            <textarea
              value={form.filing_notes}
              onChange={e => setForm(f => ({ ...f, filing_notes: e.target.value }))}
              rows={2}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-200 mb-1">Registration Parameters (JSON)</label>
            <textarea
              value={form.registration_parameters}
              onChange={e => setForm(f => ({ ...f, registration_parameters: e.target.value }))}
              rows={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 font-mono text-xs"
              placeholder='[{"key":"gst_number","label":"GST Number","required":true,"field_type":"text"}]'
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-200 mb-1">Effective From</label>
              <input
                type="date"
                value={form.effective_from}
                onChange={e => setForm(f => ({ ...f, effective_from: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="h-4 w-4 rounded text-teal-600"
                />
                <span className="text-sm text-slate-200">Active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => setMode('list')}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-950 transition"
          >Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving || !form.country_id || !form.compliance_type_id || !form.name}
            className="btn-primary"
          >
            {saving ? 'Saving…' : (mode === 'create' ? 'Create Framework' : 'Save Changes')}
          </button>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">Compliance Frameworks</h1>
        <div className="flex gap-2">
          <button
            onClick={startCreate}
            className="btn-primary"
          >+ New Framework</button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-950">
              <tr>
                {['Framework','Country','Type','Authority','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {frameworks.map(fw => (
                <tr key={fw.id} className="hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{fw.name}</p>
                    {fw.short_name && <p className="text-xs text-slate-500">{fw.short_name}</p>}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {fw.compliance_countries?.flag_emoji} {fw.compliance_countries?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {fw.compliance_types?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {fw.regulatory_authorities?.acronym || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fw.is_active ? 'bg-emerald-900/30 text-emerald-300' : 'bg-slate-900 text-slate-500'}`}>
                      {fw.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openDetail(fw)}
                        className="text-xs text-teal-600 hover:underline"
                      >View</button>
                      <button
                        onClick={() => startEdit(fw)}
                        className="text-xs text-slate-500 hover:underline"
                      >Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
              {frameworks.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No frameworks yet. Click &quot;+ New Framework&quot; to start.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-100">{value}</p>
    </div>
  );
}
