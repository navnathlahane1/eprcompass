'use client';

import { useEffect, useState, useCallback } from 'react';
import type { ClientCompliance } from '@/lib/complianceKnowledge/types';

type ClientRow = { id: string; profiles: { full_name?: string; company_name?: string } | null };
type FrameworkRow = { id: string; name: string; short_name?: string; compliance_countries?: { name: string; flag_emoji?: string }; compliance_types?: { name: string } };

export default function AssignPage() {
  const [assignments, setAssignments] = useState<ClientCompliance[]>([]);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [frameworks, setFrameworks] = useState<FrameworkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterClient, setFilterClient] = useState('');
  const [form, setForm] = useState({
    client_id: '',
    framework_id: '',
    entity_type: '',
    registration_no: '',
    notes: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterClient) params.set('client_id', filterClient);

    const [aRes, cRes, fwRes] = await Promise.all([
      fetch(`/api/admin/compliance-knowledge/assign?${params}`),
      fetch('/api/admin/clients?limit=200&status=active'),
      fetch('/api/admin/compliance-knowledge/frameworks?is_active=true'),
    ]);
    const [aData, cData, fwData] = await Promise.all([aRes.json(), cRes.json(), fwRes.json()]);

    setAssignments(aData.assignments || []);
    setClients(cData.clients || []);
    setFrameworks(fwData.frameworks || []);
    setLoading(false);
  }, [filterClient]);

  useEffect(() => { load(); }, [load]);

  async function handleAssign() {
    if (!form.client_id || !form.framework_id) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/admin/compliance-knowledge/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Assignment failed');
      setSuccess('Framework assigned successfully. Tasks auto-generated for upcoming deadlines.');
      setShowForm(false);
      setForm({ client_id: '', framework_id: '', entity_type: '', registration_no: '', notes: '' });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleSuspend(id: string) {
    if (!confirm('Remove this compliance assignment? Active tasks will remain but no new tasks will be generated.')) return;
    await fetch(`/api/admin/compliance-knowledge/assign?id=${id}`, { method: 'DELETE' });
    await load();
  }

  const ENTITY_TYPES = ['PIBO','Producer','Importer','Brand Owner','Recycler','PRO','Refurbisher','Other'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Assign Compliance to Clients</h1>
          <p className="text-sm text-slate-500 mt-1">
            Link clients to compliance frameworks. Tasks are auto-generated for upcoming deadlines.
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); setSuccess(''); }}
          className="btn-primary"
        >+ Assign Framework</button>
      </div>

      {success && <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-3 text-sm text-emerald-300">{success}</div>}

      {/* Filter */}
      <div>
        <select
          value={filterClient}
          onChange={e => setFilterClient(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
        >
          <option value="">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.profiles?.company_name || c.profiles?.full_name || c.id}
            </option>
          ))}
        </select>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900/60 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Assign Compliance Framework</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-500 hover:text-slate-200">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
            {error && <div className="mb-4 rounded-lg bg-rose-950/30 border border-rose-800/40 p-3 text-sm text-rose-300">{error}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Client *</label>
                <select
                  value={form.client_id}
                  onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                >
                  <option value="">Select client…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.profiles?.company_name || c.profiles?.full_name || c.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Compliance Framework *</label>
                <select
                  value={form.framework_id}
                  onChange={e => setForm(f => ({ ...f, framework_id: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                >
                  <option value="">Select framework…</option>
                  {frameworks.map(fw => (
                    <option key={fw.id} value={fw.id}>
                      {fw.compliance_countries?.flag_emoji} {fw.short_name || fw.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Entity Type</label>
                  <select
                    value={form.entity_type}
                    onChange={e => setForm(f => ({ ...f, entity_type: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  >
                    <option value="">Not specified</option>
                    {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-200 mb-1">Registration No.</label>
                  <input
                    value={form.registration_no}
                    onChange={e => setForm(f => ({ ...f, registration_no: e.target.value }))}
                    placeholder="e.g. CPCB-12345"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="Internal notes about this assignment"
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
                onClick={handleAssign}
                disabled={saving || !form.client_id || !form.framework_id}
                className="btn-primary"
              >
                {saving ? 'Assigning…' : 'Assign & Generate Tasks'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Table */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading assignments…</p>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="border-b border-slate-800/60 bg-slate-950">
              <tr>
                {['Client','Framework','Country','Type','Entity Type','Status','Assigned','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-slate-950">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">
                      {(a as ClientCompliance & { profiles?: { full_name?: string; company_name?: string } }).profiles?.company_name ||
                       (a as ClientCompliance & { profiles?: { full_name?: string; company_name?: string } }).profiles?.full_name || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">
                    {a.compliance_frameworks?.short_name || a.compliance_frameworks?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {a.compliance_frameworks?.compliance_countries?.flag_emoji}{' '}
                    {a.compliance_frameworks?.compliance_countries?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {a.compliance_frameworks?.compliance_types?.name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{a.entity_type || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      a.status === 'active' ? 'bg-emerald-900/30 text-emerald-300' :
                      a.status === 'suspended' ? 'bg-rose-900/30 text-rose-400' :
                      'bg-slate-900 text-slate-500'
                    }`}>{a.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {new Date(a.assigned_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {a.status === 'active' && (
                      <button
                        onClick={() => handleSuspend(a.id)}
                        className="text-xs text-red-500 hover:underline"
                      >Remove</button>
                    )}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No assignments yet. Click &quot;+ Assign Framework&quot; to start.
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
