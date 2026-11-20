'use client';

import { useState } from 'react';
import Link from 'next/link';
import StreamingOutput from '@/components/comms/StreamingOutput';

const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' }, { value: 'twitter', label: 'X / Twitter' },
  { value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },   { value: 'tiktok', label: 'TikTok' },
];

const AUDIENCES = [
  'Producer', 'Importer', 'Brand Owner', 'Recycler', 'PRO (Producer Responsibility Organisation)',
  'All Segments', 'SME Producers', 'MNC Brand Owners',
];

const HORIZONS = ['2 weeks', '1 month', '3 months', '6 months'];
const REGIONS  = ['India', 'UAE', 'SE Asia', 'Africa', 'Global'];

interface Strategy {
  pillars:         string[];
  cadence:         Record<string, string>;
  channel_mix:     Record<string, string>;
  hook_angles:     string[];
  calendar_draft:  Array<{ week: number; day: string; platform: string; topic: string; type: string }>;
  strategic_notes: string;
}

export default function StrategyPage() {
  const [form, setForm] = useState({
    objective: '', audience_segment: '', platforms: [] as string[],
    region: 'India', time_horizon: '1 month', campaign_theme: '',
  });
  const [streaming, setStreaming] = useState(false);
  const [rawText,   setRawText]   = useState('');
  const [strategy,  setStrategy]  = useState<Strategy | null>(null);
  const [error,     setError]     = useState('');
  const [saving,    setSaving]    = useState(false);
  const [savedId,   setSavedId]   = useState('');

  function togglePlatform(p: string) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(p) ? f.platforms.filter(x => x !== p) : [...f.platforms, p],
    }));
  }

  async function handleGenerate() {
    if (!form.objective || !form.audience_segment || !form.platforms.length) {
      setError('Fill in objective, audience, and at least one platform.');
      return;
    }
    setError(''); setRawText(''); setStrategy(null); setStreaming(true); setSavedId('');

    try {
      const res = await fetch('/api/comms/strategy?action=generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok || !res.body) { setError('Generation failed'); setStreaming(false); return; }

      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let acc      = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setRawText(acc);
      }
      // Parse JSON from completed stream
      const json = JSON.parse(acc);
      setStrategy(json);
    } catch (e) {
      setError('Failed to parse strategy. Please try again.');
    } finally {
      setStreaming(false);
    }
  }

  async function handleSave() {
    if (!strategy) return;
    setSaving(true);
    const res = await fetch('/api/comms/strategy?action=save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...form,
        title: `${form.audience_segment} — ${form.campaign_theme || form.objective.slice(0, 40)}`,
        generated_strategy: strategy,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) setSavedId(data.strategyId);
    else setError(data.error || 'Save failed');
  }

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/comms/studio" className="text-slate-500 hover:text-slate-200 transition">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Strategy Generator</h1>
          <p className="text-xs text-slate-500 mt-0.5">AI-powered marketing strategy with content calendar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form */}
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5 space-y-4">
          <div>
            <label className={labelCls}>Campaign Objective <span className="text-rose-400">*</span></label>
            <textarea rows={2} placeholder="e.g. Drive EPR certificate registrations among plastic producers in Q1"
              value={form.objective} onChange={e => setForm(f => ({ ...f, objective: e.target.value }))}
              className={inputCls + ' resize-none'} />
          </div>
          <div>
            <label className={labelCls}>Target Audience <span className="text-rose-400">*</span></label>
            <select value={form.audience_segment} onChange={e => setForm(f => ({ ...f, audience_segment: e.target.value }))} className={inputCls}>
              <option value="">Select audience…</option>
              {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Platforms <span className="text-rose-400">*</span></label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => (
                <button key={p.value} type="button" onClick={() => togglePlatform(p.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition ${
                    form.platforms.includes(p.value)
                      ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800/60 border-slate-700 text-slate-500 hover:text-slate-300'
                  }`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Region</label>
              <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} className={inputCls}>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Time Horizon</label>
              <select value={form.time_horizon} onChange={e => setForm(f => ({ ...f, time_horizon: e.target.value }))} className={inputCls}>
                {HORIZONS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Campaign Theme <span className="text-slate-600">(optional)</span></label>
            <input type="text" placeholder="e.g. Deadline awareness, New CPCB guidelines, Festive season outreach"
              value={form.campaign_theme} onChange={e => setForm(f => ({ ...f, campaign_theme: e.target.value }))} className={inputCls} />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}

          <button onClick={handleGenerate} disabled={streaming}
            className="w-full rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {streaming ? (
              <><span className="h-4 w-4 rounded-full border-2 border-violet-300 border-t-transparent animate-spin"/> Generating…</>
            ) : (
              <><svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> Generate Strategy</>
            )}
          </button>
        </div>

        {/* Output */}
        <div className="space-y-4">
          {/* Raw stream view while generating */}
          {(streaming || (rawText && !strategy)) && (
            <StreamingOutput text={rawText} loading={streaming} className="h-[400px]"
              placeholder="Strategy will stream here…" />
          )}

          {/* Structured strategy display */}
          {strategy && (
            <div className="space-y-4">
              {/* Pillars */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Content Pillars</p>
                <div className="flex flex-wrap gap-2">
                  {strategy.pillars.map((p, i) => (
                    <span key={i} className="rounded-full px-3 py-1 text-xs font-medium bg-violet-500/15 text-violet-300 border border-violet-500/30">{p}</span>
                  ))}
                </div>
              </div>

              {/* Hook angles */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Hook Angles</p>
                <ol className="space-y-1.5">
                  {strategy.hook_angles.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="shrink-0 text-violet-500 font-mono text-xs mt-0.5">{i + 1}.</span>
                      {h}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Cadence */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Posting Cadence</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(strategy.cadence).map(([plat, freq]) => (
                    <div key={plat} className="flex items-center justify-between rounded-lg bg-slate-800/60 px-3 py-2">
                      <p className="text-xs capitalize text-slate-400">{plat}</p>
                      <p className="text-xs font-mono text-slate-200">{freq}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar draft */}
              <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
                  Content Calendar Draft ({strategy.calendar_draft.length} items)
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {strategy.calendar_draft.map((c, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2 bg-slate-800/40">
                      <span className="text-[10px] font-mono text-slate-500 w-12 shrink-0">W{c.week} {c.day}</span>
                      <span className="text-[10px] text-slate-500 w-20 shrink-0 capitalize">{c.platform}</span>
                      <p className="text-xs text-slate-300 flex-1">{c.topic}</p>
                      <span className="text-[9px] text-slate-600 capitalize shrink-0">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {strategy.strategic_notes && (
                <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Strategic Notes</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{strategy.strategic_notes}</p>
                </div>
              )}

              {/* Save */}
              {!savedId ? (
                <button onClick={handleSave} disabled={saving}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                  {saving ? 'Saving…' : 'Save Strategy'}
                </button>
              ) : (
                <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 text-sm text-emerald-400 text-center">
                  Strategy saved ✓ — now generate content from it in the Content Generator.
                </div>
              )}
            </div>
          )}

          {!streaming && !rawText && (
            <div className="rounded-xl border border-dashed border-slate-800 bg-[#0c1022]/40 p-12 text-center">
              <p className="text-sm text-slate-600">Fill in the form and click Generate Strategy.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
