'use client';

import { useState } from 'react';

interface BrandVoice {
  id: string;
  brand_entity: string;
  tone_descriptors: string[];
  content_pillars: string[];
  trust_anchors: string[];
  epr_terminology: Record<string, string>;
  guardrail_list: string[];
  hashtag_sets: Record<string, string[]>;
}

interface Props {
  initialData: BrandVoice | null;
  canEdit: boolean;
}

type Tab = 'tone' | 'guardrails' | 'hashtags' | 'terminology';

export default function BrandVoiceEditor({ initialData, canEdit }: Props) {
  const [tab, setTab] = useState<Tab>('tone');
  const [data, setData] = useState<BrandVoice | null>(initialData);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Local edit state for array/object fields
  const [toneInput, setToneInput]      = useState(initialData?.tone_descriptors.join(', ') ?? '');
  const [pillarsInput, setPillarsInput] = useState(initialData?.content_pillars.join('\n') ?? '');
  const [anchorsInput, setAnchorsInput] = useState(initialData?.trust_anchors.join('\n') ?? '');
  const [guardrailInput, setGuardrailInput] = useState(initialData?.guardrail_list.join('\n') ?? '');

  const TABS: { id: Tab; label: string }[] = [
    { id: 'tone',        label: 'Tone & Pillars' },
    { id: 'guardrails',  label: 'Guardrails' },
    { id: 'hashtags',    label: 'Hashtags' },
    { id: 'terminology', label: 'EPR Terminology' },
  ];

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 resize-y';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  async function handleSave() {
    setSaving(true); setError(''); setSaved(false);

    const updates: Record<string, unknown> = {
      tone_descriptors: toneInput.split(',').map(s => s.trim()).filter(Boolean),
      content_pillars:  pillarsInput.split('\n').map(s => s.trim()).filter(Boolean),
      trust_anchors:    anchorsInput.split('\n').map(s => s.trim()).filter(Boolean),
      guardrail_list:   guardrailInput.split('\n').map(s => s.trim()).filter(Boolean),
    };

    try {
      const res = await fetch('/api/comms/brand-voice', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Save failed'); }
      else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } catch { setError('Network error'); }
    finally { setSaving(false); }
  }

  const PLATFORM_LABELS: Record<string, string> = {
    linkedin:'LinkedIn', twitter:'X/Twitter', facebook:'Facebook', instagram:'Instagram',
    youtube:'YouTube', tiktok:'TikTok', threads:'Threads', facebook2:'Facebook',
  };

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800/60">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              tab === t.id ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5 space-y-5">
        {/* Tone & Pillars */}
        {tab === 'tone' && (
          <>
            <div>
              <label className={labelCls}>Tone Descriptors <span className="text-slate-600">(comma-separated)</span></label>
              <input type="text" value={toneInput} onChange={e => setToneInput(e.target.value)} disabled={!canEdit}
                className={inputCls + (!canEdit ? ' opacity-50 cursor-not-allowed' : '')}
                placeholder="authoritative, educational, compliance-first, trustworthy" />
            </div>
            <div>
              <label className={labelCls}>Content Pillars <span className="text-slate-600">(one per line)</span></label>
              <textarea rows={5} value={pillarsInput} onChange={e => setPillarsInput(e.target.value)} disabled={!canEdit}
                className={inputCls + (!canEdit ? ' opacity-50 cursor-not-allowed' : '')}
                placeholder={'EPR Compliance & Registration\nRegulatory Updates & Alerts\nSustainability Leadership'} />
            </div>
            <div>
              <label className={labelCls}>Trust Anchors <span className="text-slate-600">(one per line)</span></label>
              <textarea rows={4} value={anchorsInput} onChange={e => setAnchorsInput(e.target.value)} disabled={!canEdit}
                className={inputCls + (!canEdit ? ' opacity-50 cursor-not-allowed' : '')}
                placeholder={'IIM Bangalore partnership\nCPCB registered EPR consultant\n10,000+ certificates issued'} />
            </div>
          </>
        )}

        {/* Guardrails */}
        {tab === 'guardrails' && (
          <div>
            <label className={labelCls}>
              Banned / Unverifiable Claims
              <span className="ml-2 text-amber-500/70 text-[10px]">Injected into every AI prompt — Claude will never use these</span>
            </label>
            <textarea rows={10} value={guardrailInput} onChange={e => setGuardrailInput(e.target.value)} disabled={!canEdit}
              className={inputCls + (!canEdit ? ' opacity-50 cursor-not-allowed' : '')}
              placeholder={'100% eco-friendly\nzero waste\ncarbon neutral by [year]\nnet zero\nsaves the planet'} />
            <p className="mt-2 text-[10px] text-slate-600">One claim or phrase per line. These are injected verbatim into the system prompt.</p>
          </div>
        )}

        {/* Hashtags */}
        {tab === 'hashtags' && (
          <div className="space-y-4">
            {Object.entries(PLATFORM_LABELS).map(([platform, label]) => {
              const current = data?.hashtag_sets?.[platform] ?? [];
              return (
                <div key={platform}>
                  <label className={labelCls}>{label}</label>
                  <input type="text"
                    defaultValue={current.join(', ')}
                    disabled={!canEdit}
                    className={inputCls + (!canEdit ? ' opacity-50 cursor-not-allowed' : '')}
                    placeholder={`#EPR, #SustainableBusiness, #EPRCompass`}
                    onBlur={e => {
                      if (!data) return;
                      const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                      setData(prev => prev ? {
                        ...prev,
                        hashtag_sets: { ...prev.hashtag_sets, [platform]: tags }
                      } : null);
                    }}
                  />
                </div>
              );
            })}
            {canEdit && (
              <button onClick={async () => {
                setSaving(true); setError('');
                const res = await fetch('/api/comms/brand-voice', {
                  method: 'PATCH',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ hashtag_sets: data?.hashtag_sets }),
                });
                setSaving(false);
                if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
              }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Hashtags'}
              </button>
            )}
          </div>
        )}

        {/* Terminology */}
        {tab === 'terminology' && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 mb-3">Key EPR terms and definitions injected into every AI prompt for accurate usage.</p>
            {Object.entries(data?.epr_terminology ?? {}).map(([term, def]) => (
              <div key={term} className="flex gap-3 rounded-lg border border-slate-800/60 px-3 py-2.5">
                <p className="w-32 shrink-0 text-xs font-semibold text-emerald-400">{term}</p>
                <p className="text-xs text-slate-400">{def}</p>
              </div>
            ))}
            <p className="text-[10px] text-slate-700 pt-2">Terminology edits require a DB migration to ensure prompt stability. Contact admin to add new terms.</p>
          </div>
        )}

        {/* Save bar (for tone/guardrails tabs) */}
        {canEdit && ['tone', 'guardrails'].includes(tab) && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800/60">
            {error && <p className="text-xs text-rose-400 flex-1">{error}</p>}
            {saved && <p className="text-xs text-emerald-400 flex-1">Saved ✓</p>}
            {!error && !saved && <span className="flex-1" />}
            <button onClick={handleSave} disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        )}

        {!canEdit && (
          <p className="text-xs text-amber-500/70 pt-2 border-t border-slate-800/60">
            Read-only — CMO or Admin can edit the brand voice profile.
          </p>
        )}
      </div>
    </div>
  );
}
