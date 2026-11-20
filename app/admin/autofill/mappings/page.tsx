'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link2, Plus, AlertTriangle, CheckCircle, Pencil, X, Save, Shield } from 'lucide-react';
import {
  FILL_ACTION_LABELS, SELECTOR_TYPE_LABELS, VALUE_TRANSFORMS,
  getConfidenceColor, getConfidenceLabel,
} from '@/lib/autofill/constants';
import type { PortalFieldMapping, FillAction, SelectorType } from '@/lib/autofill/types';

interface PortalOption { id: string; name: string; short_name: string }
interface FieldOption { id: string; field_key: string; display_name: string }

function MappingsInner() {
  const searchParams = useSearchParams();
  const initPortalId = searchParams?.get('portal_id') || '';
  const initLowConf = searchParams?.get('low_confidence') === 'true';

  const [mappings, setMappings] = useState<PortalFieldMapping[]>([]);
  const [portals, setPortals] = useState<PortalOption[]>([]);
  const [fields, setFields] = useState<FieldOption[]>([]);
  const [portalId, setPortalId] = useState(initPortalId);
  const [pageContext, setPageContext] = useState('');
  const [lowConfidence, setLowConfidence] = useState(initLowConf);
  const [showForm, setShowForm] = useState(false);
  const [editingMapping, setEditingMapping] = useState<PortalFieldMapping | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Record<string, unknown>>({});

  const load = () => {
    const params = new URLSearchParams();
    if (portalId) params.set('portal_id', portalId);
    if (pageContext) params.set('page_context', pageContext);
    if (lowConfidence) params.set('low_confidence', 'true');
    fetch(`/api/admin/autofill/mappings?${params}`)
      .then(r => r.json())
      .then(d => setMappings(d.mappings || []));
  };

  useEffect(() => {
    fetch('/api/admin/autofill/portals').then(r => r.json()).then(d => setPortals(d.portals || []));
    fetch('/api/admin/autofill/global-fields').then(r => r.json()).then(d => setFields(d.fields || []));
  }, []);

  useEffect(load, [portalId, pageContext, lowConfidence]);

  const openCreate = () => {
    setForm({ portal_id: portalId || '', global_field_id: '', page_context: pageContext || '', selector_type: 'css', selector_value: '', fill_action: 'clear_type', confidence_score: 80, required_on_portal: false });
    setEditingMapping(null); setShowForm(true); setError('');
  };

  const openEdit = (m: PortalFieldMapping) => {
    setForm({ ...m, page_context: m.page_context || '' });
    setEditingMapping(m); setShowForm(true); setError('');
  };

  const save = async () => {
    setSaving(true); setError('');
    const payload = editingMapping ? { ...form, id: editingMapping.id } : form;
    const res = await fetch('/api/admin/autofill/mappings', {
      method: editingMapping ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Save failed'); return; }
    setShowForm(false); load();
  };

  const verify = async (m: PortalFieldMapping) => {
    await fetch('/api/admin/autofill/mappings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: m.id, verify: true }),
    });
    load();
  };

  const deactivate = async (m: PortalFieldMapping) => {
    await fetch(`/api/admin/autofill/mappings?id=${m.id}`, { method: 'DELETE' });
    load();
  };

  // Unique page contexts from loaded mappings
  const contexts = [...new Set(mappings.map(m => m.page_context).filter(Boolean))];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Field Mappings</h1>
          <p className="text-sm text-slate-500 mt-0.5">{mappings.length} mappings{portalId ? ' for selected portal' : ''}</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Mapping
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="border border-slate-800 rounded-lg px-3 py-2 text-sm" value={portalId} onChange={e => setPortalId(e.target.value)}>
          <option value="">All Portals</option>
          {portals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="border border-slate-800 rounded-lg px-3 py-2 text-sm" value={pageContext} onChange={e => setPageContext(e.target.value)}>
          <option value="">All Pages</option>
          {contexts.map(c => <option key={c!} value={c!}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm border border-slate-800 rounded-lg px-3 py-2">
          <input type="checkbox" checked={lowConfidence} onChange={e => setLowConfidence(e.target.checked)} />
          Low confidence only (&lt;70%)
        </label>
      </div>

      {/* Alerts */}
      {mappings.filter(m => m.confidence_score < 70).length > 0 && (
        <div className="bg-amber-950/30 border border-amber-800/40 rounded-lg p-3 flex items-center gap-2 text-sm text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {mappings.filter(m => m.confidence_score < 70).length} mappings have confidence &lt;70% and need review.
        </div>
      )}

      {/* Mappings Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950 border-b border-slate-800 text-xs text-slate-500 uppercase">
            <tr>
              {['Global Field', 'Portal', 'Page', 'Selector', 'Action', 'Confidence', 'Verified', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {mappings.map(m => {
              const gfd = m.global_field_definitions as unknown as Record<string, unknown> | undefined;
              const portal = (m as unknown as Record<string, unknown>).compliance_portals as Record<string, unknown> | undefined;
              return (
                <tr key={m.id} className={`hover:bg-slate-950 ${!m.is_active ? 'opacity-40' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="font-mono text-xs text-indigo-300">{gfd?.field_key as string}</div>
                    <div className="text-xs text-slate-500">{gfd?.display_name as string}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-200 text-xs">{(portal?.short_name || portal?.name) as string || '—'}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{m.page_context || '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="font-mono text-xs bg-slate-900 rounded px-1.5 py-0.5 inline-block max-w-[180px] truncate" title={m.selector_value}>
                      {m.selector_value}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{SELECTOR_TYPE_LABELS[m.selector_type]}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-400">{FILL_ACTION_LABELS[m.fill_action]}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1">
                      <div className="w-12 bg-slate-900 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${m.confidence_score >= 90 ? 'bg-green-500' : m.confidence_score >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${m.confidence_score}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${getConfidenceColor(m.confidence_score)}`}>{m.confidence_score}%</span>
                    </div>
                    <div className="text-xs text-slate-500">{getConfidenceLabel(m.confidence_score)}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs">
                    {m.last_verified_at
                      ? <span className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3 h-3" />{new Date(m.last_verified_at).toLocaleDateString()}</span>
                      : <button onClick={() => verify(m)} className="text-indigo-500 hover:underline text-xs">Mark verified</button>
                    }
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(m)} className="text-slate-500 hover:text-indigo-400"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deactivate(m)} className="text-slate-500 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {mappings.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <Link2 className="w-8 h-8 mx-auto mb-2" />
            No mappings found. Add one to enable autofill on a portal.
          </div>
        )}
      </div>

      {/* Add/Edit Mapping Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold">{editingMapping ? 'Edit' : 'New'} Field Mapping</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-rose-950/30 text-rose-300 px-3 py-2 rounded text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Portal <span className="text-red-500">*</span></label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.portal_id as string || ''} onChange={e => setForm(p => ({ ...p, portal_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {portals.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Global Field <span className="text-red-500">*</span></label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.global_field_id as string || ''} onChange={e => setForm(p => ({ ...p, global_field_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {fields.map(f => <option key={f.id} value={f.id}>{f.display_name} ({f.field_key})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Page Context</label>
                  <input className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.page_context as string || ''} onChange={e => setForm(p => ({ ...p, page_context: e.target.value }))} placeholder="registration, login, annual_return…" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Selector Type</label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.selector_type as string || 'css'} onChange={e => setForm(p => ({ ...p, selector_type: e.target.value as SelectorType }))}>
                    {Object.entries(SELECTOR_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-400">Selector Value <span className="text-red-500">*</span></label>
                  <input className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono" value={form.selector_value as string || ''} onChange={e => setForm(p => ({ ...p, selector_value: e.target.value }))} placeholder='input[formcontrolname="gstin"] or //input[@name="pan"]' />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Fill Action</label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.fill_action as string || 'clear_type'} onChange={e => setForm(p => ({ ...p, fill_action: e.target.value as FillAction }))}>
                    {Object.entries(FILL_ACTION_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Value Transform</label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.value_transform as string || ''} onChange={e => setForm(p => ({ ...p, value_transform: e.target.value || null }))}>
                    <option value="">None</option>
                    {Object.entries(VALUE_TRANSFORMS).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Confidence Score (0-100)</label>
                  <input type="number" min="0" max="100" className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.confidence_score as number ?? 80} onChange={e => setForm(p => ({ ...p, confidence_score: parseInt(e.target.value) }))} />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-sm pb-2">
                    <input type="checkbox" checked={!!form.required_on_portal} onChange={e => setForm(p => ({ ...p, required_on_portal: e.target.checked }))} />
                    Required on portal
                  </label>
                </div>
                <div className="space-y-1 col-span-2">
                  <label className="text-xs font-medium text-slate-400">Notes</label>
                  <input className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.notes as string || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Mapping'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MappingsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading…</div>}>
      <MappingsInner />
    </Suspense>
  );
}
