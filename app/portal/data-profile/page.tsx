'use client';
import { useEffect, useState, useCallback } from 'react';
import { Database, CheckCircle, Circle, AlertCircle, Save, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { FIELD_CATEGORY_ICONS, DATA_TYPE_LABELS, getCompletenessBadge } from '@/lib/autofill/constants';
import type { GlobalFieldCategory, GlobalFieldDefinition } from '@/lib/autofill/types';
import { trackEvent } from '@/lib/analytics';

interface EnrichedField extends GlobalFieldDefinition {
  stored_value: string | number | boolean | null;
  file_url: string | null;
  file_name: string | null;
  validity_expires: string | null;
  is_verified: boolean;
  source: string | null;
  last_updated: string | null;
  is_complete: boolean;
}

interface CategoryStat {
  category: GlobalFieldCategory;
  total: number;
  filled: number;
  verified: number;
  percentage: number;
}

interface CompletenessData {
  overall: { total: number; filled: number; verified: number; percentage: number };
  by_category: CategoryStat[];
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Manual', import: 'Imported', ocr: 'OCR', api: 'API', auto_mapped: 'Auto-mapped',
};

export default function DataProfilePage() {
  const [fields, setFields] = useState<EnrichedField[]>([]);
  const [categories, setCategories] = useState<GlobalFieldCategory[]>([]);
  const [completeness, setCompleteness] = useState<CompletenessData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null); // field_key being saved
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const loadFields = useCallback(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    Promise.all([
      fetch(`/api/portal/data-profile?${params}`).then(r => r.json()),
      fetch('/api/portal/data-profile/completeness').then(r => r.json()),
    ]).then(([data, comp]) => {
      setFields(data.fields || []);
      setCategories(data.categories || []);
      setCompleteness(comp);
      // Auto-expand categories with incomplete required fields
      if (!activeCategory) {
        const toExpand = new Set<string>();
        for (const f of (data.fields || []) as EnrichedField[]) {
          if (f.is_required && !f.is_complete) {
            const catCode = (f.global_field_categories as GlobalFieldCategory | undefined)?.code || '';
            if (catCode) toExpand.add(catCode);
          }
        }
        setExpandedCats(prev => new Set([...prev, ...toExpand]));
      }
    });
  }, [activeCategory]);

  useEffect(() => { loadFields(); }, [loadFields]);

  const getValue = (f: EnrichedField): string => {
    if (f.field_key in editValues) return editValues[f.field_key];
    if (f.stored_value === null || f.stored_value === undefined) return '';
    if (Array.isArray(f.stored_value)) return (f.stored_value as string[]).join(', ');
    return String(f.stored_value);
  };

  const saveField = async (field: EnrichedField) => {
    const raw = editValues[field.field_key];
    if (raw === undefined) return; // nothing changed

    setSaving(field.field_key);
    setErrors(e => ({ ...e, [field.field_key]: '' }));

    const valuePayload: Record<string, unknown> = { field_key: field.field_key };
    const dt = field.data_type;
    if (dt === 'number') valuePayload.value_number = parseFloat(raw) || null;
    else if (dt === 'date') valuePayload.value_date = raw || null;
    else if (dt === 'boolean') valuePayload.value_boolean = raw === 'true';
    else if (dt === 'multiselect' || dt === 'json') valuePayload.value_json = raw.split(',').map(s => s.trim()).filter(Boolean);
    else valuePayload.value_text = raw || null;

    const res = await fetch('/api/portal/data-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(valuePayload),
    });
    const data = await res.json();
    setSaving(null);

    if (!res.ok) {
      setErrors(e => ({ ...e, [field.field_key]: data.error || 'Save failed' }));
      return;
    }

    trackEvent('Client Data Profile Field Saved', { field_key: field.field_key });
    setSaveSuccess(field.field_key);
    setEditValues(e => { const n = { ...e }; delete n[field.field_key]; return n; });
    setTimeout(() => setSaveSuccess(s => s === field.field_key ? null : s), 2000);
    loadFields();
  };

  const toggleCat = (code: string) => {
    setExpandedCats(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  // Group fields by category
  const grouped: Record<string, EnrichedField[]> = {};
  for (const f of fields) {
    const code = (f.global_field_categories as GlobalFieldCategory | undefined)?.code || 'OTHER';
    if (!grouped[code]) grouped[code] = [];
    grouped[code].push(f);
  }

  const overallBadge = completeness ? getCompletenessBadge(completeness.overall.percentage) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-6 h-6 text-indigo-600" />
            Data Profile
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Your compliance data — enter once, autofill any government portal automatically.
          </p>
        </div>
        {completeness && (
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900">{completeness.overall.percentage}%</div>
            {overallBadge && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${overallBadge.color}`}>{overallBadge.label}</span>
            )}
            <div className="text-xs text-slate-500 mt-1">{completeness.overall.filled}/{completeness.overall.total} fields</div>
          </div>
        )}
      </div>

      {/* Overall Progress Bar */}
      {completeness && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Overall Completeness</span>
            <span className="text-sm text-slate-500">{completeness.overall.verified} verified</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-3 rounded-full transition-all" style={{ width: `${completeness.overall.percentage}%` }} />
          </div>
          {/* Category bars */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {completeness.by_category.slice(0, 8).map(cs => (
              <button
                key={cs.category.code}
                onClick={() => setActiveCategory(prev => prev === cs.category.code ? '' : cs.category.code)}
                className={`text-left p-2 rounded-lg border transition-colors ${activeCategory === cs.category.code ? 'border-indigo-400 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="text-xs font-medium text-slate-700 truncate">{cs.category.name}</div>
                <div className="mt-1 w-full bg-slate-100 rounded-full h-1.5">
                  <div className={`h-1.5 rounded-full ${cs.percentage >= 80 ? 'bg-green-500' : cs.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${cs.percentage}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{cs.percentage}%</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3 text-sm text-indigo-800">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-indigo-500" />
        <span>
          Fields marked <strong>Sensitive</strong> are stored encrypted. Your portal credentials (passwords) are never stored here — only usernames and registration numbers.
        </span>
      </div>

      {/* Field Groups */}
      {(activeCategory ? categories.filter(c => c.code === activeCategory) : categories).map(cat => {
        const catFields = grouped[cat.code] || [];
        if (!catFields.length) return null;
        const isExpanded = expandedCats.has(cat.code);
        const catStat = completeness?.by_category.find(cs => cs.category.code === cat.code);
        const incomplete = catFields.filter(f => !f.is_complete).length;

        return (
          <div key={cat.code} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              onClick={() => toggleCat(cat.code)}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{FIELD_CATEGORY_ICONS[cat.code] ? '●' : '●'}</span>
                <div className="text-left">
                  <div className="font-medium text-slate-900">{cat.name}</div>
                  <div className="text-xs text-slate-500">
                    {catStat ? `${catStat.filled}/${catStat.total} filled` : `${catFields.length} fields`}
                    {incomplete > 0 && <span className="text-orange-500 ml-2">· {incomplete} incomplete</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {catStat && (
                  <div className="w-16 bg-slate-100 rounded-full h-1.5">
                    <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${catStat.percentage}%` }} />
                  </div>
                )}
                {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {catFields.map(f => {
                  const currentVal = getValue(f);
                  const isDirty = f.field_key in editValues;
                  const isSavingThis = saving === f.field_key;
                  const isSuccess = saveSuccess === f.field_key;
                  const fieldError = errors[f.field_key];

                  return (
                    <div key={f.id} className="px-5 py-4">
                      <div className="flex items-start justify-between mb-1.5">
                        <div>
                          <span className="text-sm font-medium text-slate-800">{f.display_name}</span>
                          {f.is_required && <span className="ml-1.5 text-xs text-red-500">Required</span>}
                          {f.is_sensitive && <span className="ml-1.5 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">Encrypted</span>}
                        </div>
                        <div className="flex items-center gap-2 text-xs shrink-0 ml-4">
                          {f.is_verified && <span className="flex items-center gap-0.5 text-green-600"><CheckCircle className="w-3 h-3" />Verified</span>}
                          {f.source && <span className="text-slate-400">{SOURCE_LABELS[f.source] || f.source}</span>}
                          {f.last_updated && <span className="text-slate-400">{new Date(f.last_updated).toLocaleDateString()}</span>}
                        </div>
                      </div>

                      {f.help_text && <p className="text-xs text-slate-400 mb-2">{f.help_text}</p>}

                      <div className="flex items-center gap-2">
                        {f.data_type === 'boolean' ? (
                          <select
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            value={currentVal}
                            onChange={e => setEditValues(p => ({ ...p, [f.field_key]: e.target.value }))}
                          >
                            <option value="">— Select —</option>
                            <option value="true">Yes</option>
                            <option value="false">No</option>
                          </select>
                        ) : f.data_type === 'select' ? (
                          <select
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            value={currentVal}
                            onChange={e => setEditValues(p => ({ ...p, [f.field_key]: e.target.value }))}
                          >
                            <option value="">— Select —</option>
                            {(f.options || []).map((opt: { value: string; label: string }) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        ) : f.data_type === 'textarea' ? (
                          <textarea
                            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
                            rows={2}
                            value={currentVal}
                            placeholder={f.placeholder || ''}
                            onChange={e => setEditValues(p => ({ ...p, [f.field_key]: e.target.value }))}
                          />
                        ) : (
                          <input
                            type={f.data_type === 'date' ? 'date' : f.data_type === 'number' ? 'number' : f.data_type === 'email' ? 'email' : 'text'}
                            className={`flex-1 border rounded-lg px-3 py-2 text-sm ${fieldError ? 'border-red-300 bg-red-50' : 'border-slate-200'} ${f.is_complete && !isDirty ? 'bg-green-50 border-green-200' : ''}`}
                            value={currentVal}
                            placeholder={f.placeholder || ''}
                            onChange={e => setEditValues(p => ({ ...p, [f.field_key]: e.target.value }))}
                          />
                        )}

                        {/* Status indicator */}
                        <div className="w-6 shrink-0">
                          {isSuccess ? <CheckCircle className="w-5 h-5 text-green-500" /> :
                           f.is_complete && !isDirty ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                           f.is_required && !f.is_complete && !isDirty ? <AlertCircle className="w-5 h-5 text-orange-400" /> :
                           <Circle className="w-5 h-5 text-slate-200" />}
                        </div>

                        {isDirty && (
                          <button
                            onClick={() => saveField(f)}
                            disabled={isSavingThis}
                            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 shrink-0"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSavingThis ? 'Saving…' : 'Save'}
                          </button>
                        )}
                      </div>

                      {fieldError && <p className="text-xs text-red-600 mt-1">{fieldError}</p>}

                      {/* File field hint */}
                      {f.data_type === 'file' && f.file_url && (
                        <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 block">
                          {f.file_name || 'View uploaded file'} →
                        </a>
                      )}

                      {/* Validity expiry */}
                      {f.validity_expires && (
                        <div className="mt-1 text-xs text-slate-400">
                          Expires: {new Date(f.validity_expires).toLocaleDateString()}
                          {new Date(f.validity_expires) < new Date() && <span className="text-red-500 ml-1">EXPIRED</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {fields.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <Database className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <p className="font-medium">No fields found</p>
        </div>
      )}
    </div>
  );
}
