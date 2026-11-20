'use client';

import { useEffect, useState, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface Aggregate {
  overall: number | null;
  timeliness: number | null;
  documentation: number | null;
  quantity_accuracy: number | null;
  compliance_score: number | null;
  responsiveness: number | null;
  rating_count: number;
  review_count: number;
}
interface Review {
  id: string;
  reviewer_name: string;
  reviewer_org: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  is_published: boolean;
}
interface RecyclerRep {
  name: string;
  recycler_code: string;
  verification_status: string;
  public_profile_enabled: boolean;
  public_slug: string | null;
  public_bio: string | null;
  public_highlights: string[];
}

const DIMS: { key: keyof Aggregate; label: string }[] = [
  { key: 'timeliness', label: 'Timeliness' },
  { key: 'documentation', label: 'Documentation' },
  { key: 'quantity_accuracy', label: 'Quantity Accuracy' },
  { key: 'compliance_score', label: 'Compliance' },
  { key: 'responsiveness', label: 'Responsiveness' },
];

function Stars({ value, size = 'sm' }: { value: number | null; size?: 'sm' | 'lg' }) {
  const v = value ?? 0;
  const cls = size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`${cls} ${i <= Math.round(v) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      ))}
    </span>
  );
}

function fmt(d: string) { return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }

export default function ReputationPage() {
  const [recycler, setRecycler] = useState<RecyclerRep | null>(null);
  const [aggregate, setAggregate] = useState<Aggregate | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [badges, setBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/recycler-portal/reputation').then(r => r.json())
      .then(d => {
        setRecycler(d.recycler ?? null);
        setAggregate(d.aggregate ?? null);
        setReviews(d.reviews ?? []);
        setBadges(d.badges ?? []);
        setBio(d.recycler?.public_bio ?? '');
      })
      .catch(() => {}).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function togglePublic(enabled: boolean) {
    setSaving(true);
    try {
      await fetch('/api/recycler-portal/reputation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_profile_enabled: enabled }) });
      trackEvent('Recycler Public Profile Toggled', { enabled });
      load();
    } finally { setSaving(false); }
  }
  async function saveBio() {
    setSaving(true); setBanner('');
    try {
      await fetch('/api/recycler-portal/reputation', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ public_bio: bio }) });
      trackEvent('Recycler Public Bio Saved', {});
      setBanner('Saved.'); load();
    } finally { setSaving(false); }
  }

  const publicUrl = recycler?.public_slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${recycler.public_slug}` : '';

  if (loading) return <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reputation & Public Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Your ratings, reviews, and a verified public profile to win new business.</p>
      </div>

      {banner && <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{banner}</div>}

      {/* Overall + badges */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-center gap-6">
          <div className="text-center">
            <p className="text-5xl font-extrabold text-gray-900">{aggregate?.overall != null ? aggregate.overall.toFixed(1) : '—'}</p>
            <Stars value={aggregate?.overall ?? null} size="lg" />
            <p className="text-xs text-gray-500 mt-1">{aggregate?.rating_count ?? 0} client rating{aggregate?.rating_count !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex-1 min-w-[200px] space-y-2">
            {DIMS.map(d => {
              const v = (aggregate?.[d.key] as number | null) ?? null;
              return (
                <div key={d.key} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-32 shrink-0">{d.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden"><div className="h-full bg-amber-400" style={{ width: `${((v ?? 0) / 5) * 100}%` }} /></div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right">{v != null ? v.toFixed(1) : '—'}</span>
                </div>
              );
            })}
          </div>
        </div>
        {badges.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2 pt-4 border-t border-gray-100">
            {badges.map(b => (
              <span key={b} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                {b}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Public profile control */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Public Verified Profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Publish a shareable profile page showing your verification, categories, ratings &amp; reviews.</p>
          </div>
          <button
            onClick={() => togglePublic(!recycler?.public_profile_enabled)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${recycler?.public_profile_enabled ? 'bg-teal-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${recycler?.public_profile_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {recycler?.public_profile_enabled && publicUrl && (
          <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5"/></svg>
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 truncate flex-1">{publicUrl}</a>
            <button onClick={() => navigator.clipboard?.writeText(publicUrl)} className="text-xs font-medium text-gray-500 hover:text-gray-700 shrink-0">Copy</button>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Public Bio</label>
          <textarea rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="Describe your facility, capacity, certifications, and what makes you a reliable partner…" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" />
          <button onClick={saveBio} disabled={saving} className="mt-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{saving ? 'Saving…' : 'Save Bio'}</button>
        </div>
      </div>

      {/* Reviews */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-8 text-center"><p className="text-sm text-gray-500">No reviews yet. Reviews from clients & buyers will appear here.</p></div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="text-sm font-semibold text-gray-900">{r.title || 'Review'}</span>
                  </div>
                  {!r.is_published && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Hidden</span>}
                </div>
                {r.body && <p className="text-sm text-gray-600 mt-1">{r.body}</p>}
                <p className="text-xs text-gray-400 mt-1">— {r.reviewer_name}{r.reviewer_org ? `, ${r.reviewer_org}` : ''} · {fmt(r.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
