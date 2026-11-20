'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ContentCard, { type ContentCardData } from '@/components/comms/ContentCard';
import StreamingOutput from '@/components/comms/StreamingOutput';

const STATUSES = ['', 'draft', 'in_review', 'approved', 'scheduled', 'published'];
const STATUS_LABELS: Record<string, string> = {
  '': 'All', draft: 'Draft', in_review: 'In Review',
  approved: 'Approved', scheduled: 'Scheduled', published: 'Published',
};
const PLATFORMS = [
  { value: 'linkedin', label: 'LinkedIn' }, { value: 'twitter', label: 'X/Twitter' },
  { value: 'facebook', label: 'Facebook' }, { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },   { value: 'tiktok', label: 'TikTok' },
  { value: 'threads', label: 'Threads' },
];
const AUDIENCES = [
  'Producer', 'Importer', 'Brand Owner', 'Recycler',
  'PRO (Producer Responsibility Organisation)', 'All Segments',
];
const CONTENT_TYPES = ['post', 'story', 'reel', 'thread', 'article', 'video_script'];

interface Template {
  label:    string;
  category: string;
  platform: string;
  content_type: string;
  audience_segment: string;
  topic:    string;
  notes:    string;
}

const EPR_TEMPLATES: Template[] = [
  {
    label: 'Regulatory Deadline Alert',
    category: 'Compliance',
    platform: 'linkedin', content_type: 'post',
    audience_segment: 'Producer',
    topic: 'Upcoming CPCB EPR registration / target deadline',
    notes: 'Use urgency framing. Include the exact deadline, consequence of non-compliance, and a clear CTA to book a consultation.',
  },
  {
    label: 'Plastic Waste Rules Update',
    category: 'Compliance',
    platform: 'linkedin', content_type: 'post',
    audience_segment: 'Brand Owner',
    topic: 'Recent amendment or clarification to Plastic Waste Management Rules',
    notes: 'Explain what changed, who it affects, and what action is needed. Cite the official CPCB notification.',
  },
  {
    label: 'E-Waste Compliance Guide',
    category: 'Education',
    platform: 'linkedin', content_type: 'article',
    audience_segment: 'Importer',
    topic: 'Step-by-step E-Waste (Management) Rules registration for importers',
    notes: 'Educational tone. Cover registration, targets, PRO options. Include common mistakes to avoid.',
  },
  {
    label: 'Battery EPR Awareness',
    category: 'Education',
    platform: 'twitter', content_type: 'thread',
    audience_segment: 'Producer',
    topic: 'Battery Waste Management Rules — what producers need to know in 2025',
    notes: 'Thread format. 5–7 punchy tweets. End with CTA to DM or visit EPR Compass.',
  },
  {
    label: 'Client Success Story',
    category: 'Social Proof',
    platform: 'linkedin', content_type: 'post',
    audience_segment: 'All Segments',
    topic: 'How a [brand/producer] achieved CPCB EPR compliance with EPR Compass',
    notes: 'Story format — problem, solution, result. Use anonymised or consented client details. No unverifiable claims.',
  },
  {
    label: 'Sustainability Milestone',
    category: 'Brand',
    platform: 'instagram', content_type: 'post',
    audience_segment: 'All Segments',
    topic: 'EPR Compass milestone — number of clients certified / waste recycled / targets met',
    notes: 'Celebratory but credibility-grounded. Use real numbers. Include image brief for infographic.',
  },
  {
    label: 'Tyre Waste Compliance Post',
    category: 'Compliance',
    platform: 'facebook', content_type: 'post',
    audience_segment: 'Producer',
    topic: 'Tyre Waste Management Rules — EPR obligations for tyre manufacturers',
    notes: 'Plain language. Cover targets, collection, and documentation. CTA to download compliance checklist.',
  },
  {
    label: 'PRO Partnership Explainer',
    category: 'Education',
    platform: 'linkedin', content_type: 'post',
    audience_segment: 'Recycler',
    topic: 'What is a PRO and how recyclers can partner with EPR Compass for EPR credit',
    notes: 'Position EPR Compass as the bridge between producers and recyclers. Include eligibility criteria.',
  },
];

interface GeneratedContent {
  hook: string; body: string; cta: string; hashtags: string[]; image_brief: string;
  variants: Array<{ label: string; hook: string; body: string; cta: string; hashtags: string[] }>;
}

interface Props {
  initialItems: ContentCardData[];
  activeStatus: string;
  userRole: string;
  canCreate: boolean;
  canApprove: boolean;
}

export default function ContentClient({ initialItems, activeStatus, userRole, canCreate, canApprove }: Props) {
  const router = useRouter();
  const [items, setItems]         = useState(initialItems);
  const [showGen, setShowGen]     = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [rawText, setRawText]     = useState('');
  const [generated, setGenerated] = useState<GeneratedContent | null>(null);
  const [genError, setGenError]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [form, setForm]             = useState({
    platform: 'linkedin', content_type: 'post',
    audience_segment: 'Producer', topic: '', notes: '',
  });

  const inputCls = 'w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30';

  async function handleGenerate() {
    if (!form.topic) { setGenError('Topic is required'); return; }
    setGenError(''); setRawText(''); setGenerated(null); setStreaming(true);
    try {
      const res = await fetch('/api/comms/content?action=generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok || !res.body) { setGenError('Generation failed'); setStreaming(false); return; }
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let acc      = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setRawText(acc);
      }
      setGenerated(JSON.parse(acc));
    } catch { setGenError('Failed to parse response. Try again.'); }
    finally { setStreaming(false); }
  }

  async function handleSave() {
    if (!generated) return;
    setSaving(true);
    const res = await fetch('/api/comms/content?action=save', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...form, ...generated }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      router.push(`/comms/studio/content/${data.contentId}`);
    } else {
      setGenError(data.error || 'Save failed');
    }
  }

  async function handleApprove(id: string, action: string) {
    const res = await fetch(`/api/comms/content/${id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems(prev => prev.map(i => i.id === id ? { ...i, status: data.newStatus } : i));
    }
  }

  const filtered = activeStatus ? items.filter(i => i.status === activeStatus) : items;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/comms/studio" className="text-slate-500 hover:text-slate-200 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Content</h1>
            <p className="text-xs text-slate-500 mt-0.5">{items.length} item{items.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        {canCreate && (
          <button onClick={() => { setShowGen(!showGen); setGenerated(null); setRawText(''); }}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition shrink-0">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
            {showGen ? 'Close' : 'Generate Content'}
          </button>
        )}
      </div>

      {/* Generator panel */}
      {showGen && (
        <div className="rounded-xl border border-emerald-500/20 bg-[#0c1022] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-emerald-400">AI Content Generator</p>
            <button
              onClick={() => setShowTemplates(t => !t)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/40 px-2.5 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {showTemplates ? 'Hide Templates' : 'Use Template'}
            </button>
          </div>

          {/* Template picker */}
          {showTemplates && (
            <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">EPR Content Templates</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {EPR_TEMPLATES.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setForm({ platform: t.platform, content_type: t.content_type, audience_segment: t.audience_segment, topic: t.topic, notes: t.notes });
                      setShowTemplates(false);
                    }}
                    className="flex flex-col items-start gap-0.5 rounded-lg border border-slate-700/40 bg-slate-900/60 px-3 py-2.5 text-left hover:border-emerald-500/40 hover:bg-slate-800/60 transition"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="rounded px-1.5 py-0.5 text-[9px] font-semibold bg-slate-800 text-slate-500 uppercase tracking-wide">{t.category}</span>
                      <span className="text-[10px] text-slate-500 capitalize">{t.platform} · {t.content_type}</span>
                    </div>
                    <p className="text-xs font-medium text-slate-200">{t.label}</p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{t.topic}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))} className={inputCls}>
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <select value={form.content_type} onChange={e => setForm(f => ({ ...f, content_type: e.target.value }))} className={inputCls}>
              {CONTENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
            </select>
            <select value={form.audience_segment} onChange={e => setForm(f => ({ ...f, audience_segment: e.target.value }))} className={inputCls}>
              {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <input type="text" placeholder="Topic / theme…" value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} className={inputCls} />
          </div>
          <input type="text" placeholder="Extra notes, tone hints, data points to include…"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className={inputCls} />

          {genError && <p className="text-xs text-rose-400">{genError}</p>}

          <button onClick={handleGenerate} disabled={streaming}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
            {streaming
              ? <><span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin"/>Generating…</>
              : 'Generate'
            }
          </button>

          {/* Streaming view */}
          {(streaming || (rawText && !generated)) && (
            <StreamingOutput text={rawText} loading={streaming} className="h-48" />
          )}

          {/* Structured result */}
          {generated && (
            <div className="space-y-3 border-t border-slate-800/60 pt-4">
              <div className="rounded-lg border border-slate-700/60 bg-slate-900/40 p-4 space-y-2">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Hook</p>
                <p className="text-sm font-medium text-slate-100">{generated.hook}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-2">Body</p>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{generated.body}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-2">CTA</p>
                <p className="text-sm text-slate-300">{generated.cta}</p>
                {generated.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {generated.hashtags.map((h, i) => (
                      <span key={i} className="rounded px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400">{h}</span>
                    ))}
                  </div>
                )}
                {generated.image_brief && (
                  <>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mt-2">Image Brief</p>
                    <p className="text-xs text-amber-400/80 italic">{generated.image_brief}</p>
                  </>
                )}
              </div>

              {/* Variants */}
              {generated.variants?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-400">A/B Variants</p>
                  {generated.variants.map((v, i) => (
                    <div key={i} className="rounded-lg border border-slate-700/40 bg-slate-900/30 p-3 space-y-1">
                      <p className="text-[10px] font-semibold text-violet-400">{v.label || `Variant ${String.fromCharCode(65 + i)}`}</p>
                      <p className="text-xs font-medium text-slate-200">{v.hook}</p>
                      <p className="text-xs text-slate-400 line-clamp-2">{v.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleSave} disabled={saving}
                className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 transition">
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 border-b border-slate-800/60 overflow-x-auto">
        {STATUSES.map(s => (
          <Link key={s} href={s ? `/comms/studio/content?status=${s}` : '/comms/studio/content'}
            className={`px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              activeStatus === s ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}>
            {STATUS_LABELS[s]}
          </Link>
        ))}
      </div>

      {/* Content grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-12 text-center">
          <p className="text-sm text-slate-500">No content{activeStatus ? ` with status "${activeStatus}"` : ''} yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(item => (
            <ContentCard
              key={item.id}
              item={item}
              canApprove={canApprove}
              onApprove={handleApprove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
