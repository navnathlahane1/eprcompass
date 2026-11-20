'use client';
import { useEffect, useState } from 'react';
import { Globe, Plus, ChevronRight, ExternalLink, Shield, Zap, AlertTriangle, X, Save } from 'lucide-react';
import { AUTOMATION_TIER_CONFIG } from '@/lib/autofill/constants';
import type { CompliancePortal, AutomationTier } from '@/lib/autofill/types';

interface PortalDetail extends CompliancePortal {
  detectionRules?: Record<string, unknown>[];
  mappingCount?: number;
  formSteps?: Record<string, unknown>[];
}

export default function PortalsPage() {
  const [portals, setPortals] = useState<CompliancePortal[]>([]);
  const [selected, setSelected] = useState<PortalDetail | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Partial<CompliancePortal>>({});

  const load = () => {
    fetch('/api/admin/autofill/portals?active=false')
      .then(r => r.json())
      .then(d => setPortals(d.portals || []));
  };

  const loadDetail = (id: string) => {
    fetch(`/api/admin/autofill/portals?id=${id}`)
      .then(r => r.json())
      .then(d => setSelected({ ...d.portal, detectionRules: d.detectionRules, mappingCount: d.mappingCount, formSteps: d.formSteps }));
  };

  useEffect(load, []);

  const openCreate = () => {
    setForm({ portal_type: 'government', automation_tier: 'manual', is_active: true, has_captcha: false, has_otp: false, has_2fa: false });
    setShowForm(true); setError('');
  };

  const save = async () => {
    setSaving(true); setError('');
    const method = form.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/admin/autofill/portals', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || 'Save failed'); return; }
    setShowForm(false); load();
  };

  const tierCounts: Record<string, number> = {};
  for (const p of portals) tierCounts[p.automation_tier] = (tierCounts[p.automation_tier] || 0) + 1;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Portal Registry</h1>
          <p className="text-sm text-slate-500 mt-0.5">{portals.length} portals registered</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Add Portal
        </button>
      </div>

      {/* Tier Summary */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(AUTOMATION_TIER_CONFIG).map(([tier, cfg]) => (
          <span key={tier} className={`px-3 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
            {cfg.label}: {tierCounts[tier] || 0}
          </span>
        ))}
      </div>

      <div className="flex gap-6">
        {/* Portal List */}
        <div className="flex-1 space-y-2">
          {portals.map(p => {
            const tierCfg = AUTOMATION_TIER_CONFIG[p.automation_tier];
            return (
              <div
                key={p.id}
                onClick={() => loadDetail(p.id)}
                className={`bg-slate-900/60 border rounded-xl p-4 cursor-pointer hover:border-indigo-300 transition-all ${selected?.id === p.id ? 'border-indigo-400 shadow-sm' : 'border-slate-800'} ${!p.is_active ? 'opacity-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-900/30 rounded-lg flex items-center justify-center">
                      <Globe className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-100">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.base_url}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tierCfg.color}`}>{tierCfg.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {p.has_captcha && <span className="px-1.5 py-0.5 bg-orange-900/30 text-orange-300 text-xs rounded">Captcha</span>}
                  {p.has_otp && <span className="px-1.5 py-0.5 bg-amber-900/30 text-amber-300 text-xs rounded">OTP</span>}
                  {p.has_2fa && <span className="px-1.5 py-0.5 bg-rose-900/30 text-rose-300 text-xs rounded">2FA</span>}
                  {p.tech_stack && <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 text-xs rounded">{p.tech_stack}</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="w-80 shrink-0 bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 self-start sticky top-6">
            <div className="flex items-start justify-between">
              <h2 className="font-semibold text-slate-100">{selected.name}</h2>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>

            <a href={selected.base_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 hover:underline">
              <ExternalLink className="w-3 h-3" /> {selected.base_url}
            </a>

            {selected.description && <p className="text-xs text-slate-500">{selected.description}</p>}

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-950 rounded-lg p-2">
                <div className="text-slate-500">Tier</div>
                <div className="font-medium mt-0.5">{AUTOMATION_TIER_CONFIG[selected.automation_tier].label}</div>
              </div>
              <div className="bg-slate-950 rounded-lg p-2">
                <div className="text-slate-500">Field Mappings</div>
                <div className="font-medium mt-0.5">{selected.mappingCount ?? '—'}</div>
              </div>
            </div>

            {selected.notes && (
              <div className="bg-amber-950/30 border border-yellow-100 rounded-lg p-3 text-xs text-amber-200 flex gap-2">
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                {selected.notes}
              </div>
            )}

            {selected.detectionRules?.length ? (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Detection Rules ({selected.detectionRules.length})</p>
                <div className="space-y-1">
                  {selected.detectionRules.map((r: Record<string, unknown>) => (
                    <div key={r.id as string} className="font-mono text-xs bg-slate-950 rounded px-2 py-1 text-slate-200 truncate">
                      {r.match_type as string}: {r.match_pattern as string}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {selected.formSteps?.length ? (
              <div>
                <p className="text-xs font-medium text-slate-400 mb-1">Form Steps ({selected.formSteps.length})</p>
                <div className="space-y-0.5">
                  {selected.formSteps.map((s: Record<string, unknown>) => (
                    <div key={s.id as string} className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="w-4 h-4 rounded-full bg-indigo-900/30 text-indigo-300 text-center leading-4 text-xs font-medium">{s.step_number as number}</span>
                      {s.step_name as string}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <a href={`/admin/autofill/mappings?portal_id=${selected.id}`} className="block text-center text-xs font-medium text-indigo-400 border border-indigo-800/40 rounded-lg py-2 hover:bg-indigo-950/30">
              View / Edit Field Mappings →
            </a>
          </div>
        )}
      </div>

      {/* Add Portal Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900/60 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold">Add Portal</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-6 space-y-4">
              {error && <div className="bg-rose-950/30 text-rose-300 px-3 py-2 rounded text-sm">{error}</div>}
              <div className="grid grid-cols-2 gap-4">
                {[['name','Portal Name',true],['short_name','Short Name (CPCB-Plastic)',false],['base_url','Base URL',true],['login_url','Login URL',false]].map(([k,l,r]) => (
                  <div key={k as string} className={`space-y-1 ${k === 'base_url' || k === 'login_url' ? 'col-span-2' : ''}`}>
                    <label className="text-xs font-medium text-slate-400">{l as string}{r && <span className="text-red-500 ml-1">*</span>}</label>
                    <input className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={(form as Record<string,unknown>)[k as string] as string || ''} onChange={e => setForm(p => ({ ...p, [k as string]: e.target.value }))} />
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Automation Tier</label>
                  <select className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.automation_tier || 'manual'} onChange={e => setForm(p => ({ ...p, automation_tier: e.target.value as AutomationTier }))}>
                    {Object.entries(AUTOMATION_TIER_CONFIG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-400">Tech Stack</label>
                  <input className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" value={form.tech_stack || ''} onChange={e => setForm(p => ({ ...p, tech_stack: e.target.value }))} placeholder="Angular, React, JSP…" />
                </div>
              </div>
              <div className="flex gap-4">
                {[['has_captcha','Has Captcha'],['has_otp','Has OTP'],['has_2fa','Has 2FA']].map(([k,l]) => (
                  <label key={k} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={!!(form as Record<string,unknown>)[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.checked }))} /> {l}
                  </label>
                ))}
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-400">Notes (admin only)</label>
                <textarea className="w-full border border-slate-800 rounded-lg px-3 py-2 text-sm" rows={2} value={form.notes || ''} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400">Cancel</button>
              <button onClick={save} disabled={saving} className="btn-primary">
                <Save className="w-4 h-4" />{saving ? 'Saving…' : 'Save Portal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
