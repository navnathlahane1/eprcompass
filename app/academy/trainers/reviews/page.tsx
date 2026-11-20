'use client';

import { useEffect, useState, useCallback } from 'react';
import ShareProfileModal from '@/components/academy/ShareProfileModal';

interface TrainerService {
  id: string;
  trainer_id: string;
  title: string;
  category: string;
  description: string;
  delivery_mode: string[];
  duration_hours: number | null;
  pricing_model: string;
  price_amount: number | null;
  price_currency: string;
  price_notes: string;
  key_topics: string[];
  submitted_at: string;
  status: string;
  profiles?: { full_name: string; email: string };
}

interface TrainerProfile {
  id: string;
  user_id: string;
  headline: string;
  bio: string;
  location: string;
  website_url: string;
  linkedin_url: string;
  twitter_url: string;
  education: unknown[];
  achievements: unknown[];
  certifications: unknown[];
  languages: string[];
  profile_status: string;
  submitted_at: string;
  review_notes: string;
  profiles?: { full_name: string; email: string };
}

const PRICING_LABELS: Record<string, string> = {
  per_session:     'Per Session',
  per_participant: 'Per Participant',
  per_day:         'Per Day',
  custom:          'Custom',
};

type Tab = 'profiles' | 'services';

export default function TrainerReviewsPage() {
  const [tab, setTab]                     = useState<Tab>('services');
  const [services, setServices]           = useState<TrainerService[]>([]);
  const [profiles, setProfiles]           = useState<TrainerProfile[]>([]);
  const [loading, setLoading]             = useState(true);
  const [expandedId, setExpandedId]       = useState<string | null>(null);
  const [reviewNotes, setReviewNotes]     = useState<Record<string, string>>({});
  const [acting, setActing]               = useState<string | null>(null);
  const [toast, setToast]                 = useState('');
  const [statusFilter, setStatusFilter]   = useState('pending_approval');
  const [shareTarget, setShareTarget]     = useState<{ id: string; name: string } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
    void ok; // suppress lint
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/academy/trainer-services?status=${statusFilter}`),
      fetch('/api/academy/trainer-profile/pending'),
    ]);
    if (sRes.ok) { const { services: s } = await sRes.json(); setServices(s ?? []); }
    if (pRes.ok) { const { profiles: p } = await pRes.json(); setProfiles(p ?? []); }
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  async function reviewService(id: string, action: 'approve' | 'reject') {
    setActing(id);
    const res = await fetch('/api/academy/trainer-services', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, service_id: id, review_notes: reviewNotes[id] ?? '' }),
    });
    setActing(null);
    if (res.ok) { showToast(action === 'approve' ? 'Service approved and added to offerings' : 'Service returned to trainer'); load(); }
    else showToast('Action failed');
  }

  async function reviewProfile(userId: string, action: 'approve' | 'reject') {
    setActing(userId);
    const res = await fetch('/api/academy/trainer-profile/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action, review_notes: reviewNotes[userId] ?? '' }),
    });
    setActing(null);
    if (res.ok) { showToast(action === 'approve' ? 'Profile approved' : 'Profile returned for revision'); load(); }
    else showToast('Action failed');
  }

  const pendingProfiles = profiles.filter(p => p.profile_status === 'submitted');

  return (
    <div className="p-4 md:p-6 space-y-5 text-slate-100">
      {shareTarget && (
        <ShareProfileModal
          trainerId={shareTarget.id}
          trainerName={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-white">Trainer Reviews</h1>
        <p className="text-sm text-slate-400 mt-1">Review submitted trainer profiles and service offerings before they go live</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['services', 'profiles'] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${tab === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
            {t === 'services' ? 'Service Offerings' : 'Trainer Profiles'}
            {t === 'services' && services.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-300 px-1.5 text-xs">{services.length}</span>
            )}
            {t === 'profiles' && pendingProfiles.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 text-amber-300 px-1.5 text-xs">{pendingProfiles.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Services Tab ── */}
      {tab === 'services' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {['pending_approval','approved','rejected'].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                {s === 'pending_approval' ? 'Pending' : s}
              </button>
            ))}
          </div>

          {loading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

          {!loading && services.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">
              No services in this status
            </div>
          )}

          {services.map(s => {
            const exp = expandedId === s.id;
            return (
              <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{s.title}</h3>
                        <span className="text-xs rounded-full bg-slate-700 text-slate-300 px-2 py-0.5">{s.category}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        by <span className="text-slate-300">{s.profiles?.full_name ?? s.trainer_id}</span>
                        {s.profiles?.email && <span className="ml-1 text-slate-500">({s.profiles.email})</span>}
                        {s.submitted_at && <span className="ml-2">· Submitted {new Date(s.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-400">
                        {(s.delivery_mode ?? []).map(m => <span key={m} className="rounded bg-slate-800 px-2 py-0.5">{m}</span>)}
                        {s.duration_hours && <span>{s.duration_hours}h</span>}
                        {s.price_amount && <span className="text-emerald-400">₹{Number(s.price_amount).toLocaleString('en-IN')} {PRICING_LABELS[s.pricing_model] ?? s.pricing_model}</span>}
                      </div>
                    </div>
                    <button onClick={() => setExpandedId(exp ? null : s.id)}
                      className="text-xs text-slate-400 hover:text-slate-200 flex-shrink-0 mt-1">
                      {exp ? 'Collapse' : 'Review'}
                    </button>
                  </div>

                  {exp && (
                    <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
                      {s.description && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Description</p>
                          <p className="text-sm text-slate-300">{s.description}</p>
                        </div>
                      )}
                      {s.key_topics?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Key Topics</p>
                          <div className="flex flex-wrap gap-1.5">
                            {s.key_topics.map(t => <span key={t} className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{t}</span>)}
                          </div>
                        </div>
                      )}
                      {s.price_notes && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pricing Notes</p>
                          <p className="text-sm text-slate-300">{s.price_notes}</p>
                        </div>
                      )}

                      {statusFilter === 'pending_approval' && (
                        <div className="space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-400">Review Notes (shown to trainer on rejection)</label>
                            <textarea
                              value={reviewNotes[s.id] ?? ''}
                              onChange={e => setReviewNotes(prev => ({ ...prev, [s.id]: e.target.value }))}
                              rows={2} placeholder="Optional notes…"
                              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                            />
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => reviewService(s.id, 'approve')} disabled={acting === s.id}
                              className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
                              {acting === s.id ? 'Processing…' : 'Approve & Publish'}
                            </button>
                            <button onClick={() => reviewService(s.id, 'reject')} disabled={acting === s.id}
                              className="rounded-lg border border-red-800 hover:border-red-600 disabled:opacity-50 px-4 py-2 text-sm text-red-400 transition-colors">
                              Return to Trainer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Profiles Tab ── */}
      {tab === 'profiles' && (
        <div className="space-y-4">
          {loading && <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

          {!loading && pendingProfiles.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-700 p-10 text-center text-slate-500">No pending profile submissions</div>
          )}

          {pendingProfiles.map(p => {
            const exp = expandedId === p.user_id;
            return (
              <div key={p.user_id} className="rounded-xl border border-slate-800 bg-slate-900">
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white">{p.profiles?.full_name ?? p.user_id}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {p.profiles?.email}
                        {p.headline && <span className="ml-2 text-slate-400">· {p.headline}</span>}
                        {p.submitted_at && <span className="ml-2">· Submitted {new Date(p.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                      </p>
                      <div className="flex gap-3 mt-1 text-xs text-slate-500">
                        {p.education?.length > 0 && <span>{p.education.length} education{p.education.length > 1 ? 's' : ''}</span>}
                        {p.achievements?.length > 0 && <span>{p.achievements.length} achievement{p.achievements.length > 1 ? 's' : ''}</span>}
                        {p.certifications?.length > 0 && <span>{p.certifications.length} cert{p.certifications.length > 1 ? 's' : ''}</span>}
                        {p.languages?.length > 0 && <span>{p.languages.join(', ')}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => setShareTarget({ id: p.user_id, name: p.profiles?.full_name ?? 'Trainer' })}
                        className="flex items-center gap-1 rounded-lg border border-emerald-700/60 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-400 hover:border-emerald-500 transition-colors">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/></svg>
                        Share
                      </button>
                      <button onClick={() => setExpandedId(exp ? null : p.user_id)}
                        className="text-xs text-slate-400 hover:text-slate-200">
                        {exp ? 'Collapse' : 'Review'}
                      </button>
                    </div>
                  </div>

                  {exp && (
                    <div className="mt-4 space-y-4 border-t border-slate-800 pt-4">
                      {p.bio && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Bio</p>
                          <p className="text-sm text-slate-300">{p.bio}</p>
                        </div>
                      )}
                      {(p.location || p.website_url) && (
                        <div className="flex gap-4 text-sm text-slate-400">
                          {p.location && <span>📍 {p.location}</span>}
                          {p.website_url && <a href={p.website_url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{p.website_url}</a>}
                        </div>
                      )}
                      {[p.linkedin_url, p.twitter_url].filter(Boolean).length > 0 && (
                        <div className="flex gap-3 text-xs text-emerald-400">
                          {p.linkedin_url && <a href={p.linkedin_url} target="_blank" rel="noopener noreferrer" className="hover:underline">LinkedIn ↗</a>}
                          {p.twitter_url && <a href={p.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:underline">Twitter ↗</a>}
                        </div>
                      )}

                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-slate-400">Review Notes (shown to trainer on rejection)</label>
                          <textarea
                            value={reviewNotes[p.user_id] ?? ''}
                            onChange={e => setReviewNotes(prev => ({ ...prev, [p.user_id]: e.target.value }))}
                            rows={2} placeholder="Optional feedback…"
                            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => reviewProfile(p.user_id, 'approve')} disabled={acting === p.user_id}
                            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-2 text-sm font-medium text-white transition-colors">
                            {acting === p.user_id ? 'Processing…' : 'Approve Profile'}
                          </button>
                          <button onClick={() => reviewProfile(p.user_id, 'reject')} disabled={acting === p.user_id}
                            className="rounded-lg border border-red-800 hover:border-red-600 disabled:opacity-50 px-4 py-2 text-sm text-red-400 transition-colors">
                            Return for Revision
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
