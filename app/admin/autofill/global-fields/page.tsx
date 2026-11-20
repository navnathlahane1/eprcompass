'use client';
import { useEffect, useState } from 'react';
import { Plus, Search, Pencil, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { DATA_TYPE_LABELS, FIELD_CATEGORY_ICONS } from '@/lib/autofill/constants';
import type { GlobalFieldDefinition, GlobalFieldCategory, FieldDataType } from '@/lib/autofill/types';

interface FormState {
  field_key: string;
  display_name: string;
  category_id: string;
  data_type: FieldDataType;
  description: string;
  placeholder: string;
  validation_regex: string;
  validation_function: string;
  is_required: boolean;
  is_sensitive: boolean;
  applicable_countries: string;
  account_column: string;
  help_text: string;
  sort_order: string;
}

const EMPTY_FORM: FormState = {
  field_key: '', display_name: '', category_id: '', data_type: 'text',
  description: '', placeholder: '', validation_regex: '', validation_function: '',
  is_required: false, is_sensitive: false, applicable_countries: '',
  account_column: '', help_text: '', sort_order: '0',
};

export default function GlobalFieldsPage() {
  const [fields, setFields] = useState<GlobalFieldDefinition[]>([]);
  const [categories, setCategories] = useState<GlobalFieldCategory[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    const params = new URLSearchParams({ active: 'false' });
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);
    fetch(`/api/admin/autofill/global-fields?${params}`)
      .then(r => r.json())
      .then(d => { setFields(d.fields || []); setCategories(d.categories || []); });
  };

  useEffect(load, [search, selectedCategory]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setError(''); };
  const openEdit = (f: GlobalFieldDefinition) => {
    setForm({
      field_key: f.field_key, display_name: f.display_name,
      category_id: f.category_id, data_type: f.data_type,
      description: f.description || '', placeholder: f.placeholder || '',
      validation_regex: f.validation_regex || '', validation_function: f.validation_function || '',
      is_required: f.is_required, is_sensitive: f.is_sensitive,
      applicable_countries: (f.applicable_countries || []).join(','),
      account_column: f.account_column || '', help_text: f.help_text || '',
      sort_order: String(f.sort_order),
    });
    setEditingId(f.id); setShowForm(true); setError('');
  };

  const save = async () => {
    setSaving(true); setError('');
    const payload = {
      ...form,
      sort_order: parseInt(form.sort_order) || 0,
      applicable_countries: form.applicable_countries ? form.applicable_countries.split(',').map(s => s.trim()).filter(Boolean) : [],
      ...(editingId ? { id: editingId } : {}),
    };
    const method = editingId ? 'PATCH' : 'POST';
    const res = await fetch('/api/admin/autofill/global-fields', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Save failed'); return; }
    setShowForm(false); load();
  };

  const toggleActive = async (f: GlobalFieldDefinition) => {
    await fetch('/api/admin/autofill/global-fields', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: f.id, is_active: !f.is_active }),
    });
    load();
  };

  const grouped: Record<string, GlobalFieldDefinition[]> = {};
  for (const f of fields) {
    const catCode = (f.global_field_categories as GlobalFieldCategory | undefined)?.code || 'OTHER';
    if (!grouped[catCode]) grouped[catCode] = [];
    grouped[catCode].push(f);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Global Field Definitions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{fields.length} fields across {categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> New Field
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="w-full pl-9 pr-3 py-2 border border-slate-800 rounded-lg text-sm" placeholder="Search fields..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-slate-800 rounded-lg px-3 py-2 text-sm" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.code}>{c.name}</option>)}
        </select>
      </div>

      {/* Field list grouped by category */}
      {Object.entries(grouped).map(([catCode, catFields]) => {
        const cat = categories.find(c => c.code === catCode);
        return (
          <div key={catCode} className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
              <span className="text-base">{cat?.icon ? '●' : '●'}</span>
              <span className="text-sm font-semibold text-slate-200">{cat?.name || catCode}</span>
              <span className="ml-auto text-xs text-slate-500">{catFields.length} fields</span>
            </div>
            <table className="min-w-full text-sm">
              <thead className="text-xs text-slate-500 uppercase bg-slate-950 border-b border-slate-800/60">
                <tr>
                  {['Field Key', 'Display Name', 'Type', 'Countries', 'Flags', ''].map(h => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {catFields.map(f => (
                  <tr key={f.id} className={`hover:bg-slate-950 ${!f.is_active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-2.5 font-mono text-xs text-indigo-300">{f.field_key}</td>
                    <td className="px-4 py-2.5 text-slate-100">{f.display_name}</td>
                    <td className="px-4 py-2.5 text-slate-500">{DATA_TYPE_LABELS[f.data_type] || f.data_type}</td>
                    <td className="px-4 py-2.5 text-slate-500">
                      {f.applicable_countries?.length ? f.applicable_countries.join(', ') : 'Global'}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1">
                        {f.is_required && <span className="px-1.5 py-0.5 bg-rose-900/30 text-rose-300 text-xs rounded">Required</span>}
                        {f.is_sensitive && <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-300 text-xs rounded">Sensitive</span>}
                        {f.account_column && <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 text-xs rounded">Account</span>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 justify-end">
                        <button onClick={() => openEdit(f)} className="text-slate-500 hover:text-indigo-400">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleActive(f)} className={f.is_active ? 'text-green-500 hover:text-red-400' : 'text-slate-600 hover:text-green-500'}>
                          {f.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-slate-100">{editingId ? 'Edit' : 'New'} Global Field</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-rose-950/30 text-rose-300 px-3 py-2 rounded-lg text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Field Key (GLOBAL_*)" required>
                  <input className="input" value={form.field_key} onChange={e => setForm(p => ({ ...p, field_key: e.target.value.toUpperCase() }))} placeholder="GLOBAL_MY_FIELD" />
                </FormField>
                <FormField label="Display Name" required>
                  <input className="input" value={form.display_name} onChange={e => setForm(p => ({ ...p, display_name: e.target.value }))} placeholder="My Field" />
                </FormField>
                <FormField label="Category" required>
                  <select className="input" value={form.category_id} onChange={e => setForm(p => ({ ...p, category_id: e.target.value }))}>
                    <option value="">Select…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FormField>
                <FormField label="Data Type" required>
                  <select className="input" value={form.data_type} onChange={e => setForm(p => ({ ...p, data_type: e.target.value as FieldDataType }))}>
                    {Object.entries(DATA_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </FormField>
                <FormField label="Applicable Countries (ISO2, comma)">
                  <input className="input" value={form.applicable_countries} onChange={e => setForm(p => ({ ...p, applicable_countries: e.target.value }))} placeholder="IN,AE (blank = global)" />
                </FormField>
                <FormField label="Account Column (accounts table)">
                  <input className="input" value={form.account_column} onChange={e => setForm(p => ({ ...p, account_column: e.target.value }))} placeholder="gstin, pan, company_name…" />
                </FormField>
                <FormField label="Validation Regex">
                  <input className="input font-mono text-xs" value={form.validation_regex} onChange={e => setForm(p => ({ ...p, validation_regex: e.target.value }))} placeholder="^[A-Z]{5}[0-9]{4}[A-Z]{1}$" />
                </FormField>
                <FormField label="Validation Function">
                  <input className="input font-mono text-xs" value={form.validation_function} onChange={e => setForm(p => ({ ...p, validation_function: e.target.value }))} placeholder="validate_gstin" />
                </FormField>
              </div>
              <FormField label="Description">
                <input className="input" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </FormField>
              <FormField label="Help Text">
                <input className="input" value={form.help_text} onChange={e => setForm(p => ({ ...p, help_text: e.target.value }))} />
              </FormField>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_required} onChange={e => setForm(p => ({ ...p, is_required: e.target.checked }))} />
                  Required
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.is_sensitive} onChange={e => setForm(p => ({ ...p, is_sensitive: e.target.checked }))} />
                  Sensitive (encrypted at rest)
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-100">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Field'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-400">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {children}
    </div>
  );
}
