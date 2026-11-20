'use client';

import { useState, useEffect } from 'react';
import ShareProfileModal from '@/components/academy/ShareProfileModal';

type Trainer = {
  id: string; name: string; type: string; expertise: string[];
  rating: number; sessions: number; participants: number;
  certifications: string[]; status: string; email: string;
  t3Cert: string | null; partnerId: string | null;
  photoUrl: string | null; headline: string | null;
  resumeUrl: string | null; profileStatus: string;
};

type FullProfile = {
  profile: {
    headline: string | null; bio: string | null; location: string | null;
    website_url: string | null; linkedin_url: string | null; twitter_url: string | null;
    youtube_url: string | null; instagram_url: string | null;
    education: { degree: string; institution: string; year_from: string; year_to: string; description: string }[];
    achievements: { title: string; issuer: string; year: string; description: string; url: string }[];
    certifications: { name: string; issuer: string; year: string; credential_id: string; url: string }[];
    languages: string[];
    resume_url: string | null;
    profile_status: string;
  } | null;
  clients: { company_name: string; industry: string; engagement_type: string; year_from: number; year_to: number; description: string; can_reference: boolean }[];
  name: string; email: string; role: string; avatarUrl: string | null;
} | null;

const TRAINER_TYPES = ['Internal', 'External', 'Guest', 'Academic', 'Partner Trainer'];

const TYPE_META: Record<string, string> = {
  Internal:          'bg-indigo-500/15 text-indigo-300',
  External:          'bg-violet-500/15 text-violet-300',
  Guest:             'bg-amber-500/15 text-amber-300',
  Academic:          'bg-teal-500/15 text-teal-300',
  'Partner Trainer': 'bg-emerald-500/15 text-emerald-300',
};

const STATUS_PILL: Record<string, { cls: string; label: string }> = {
  approved:  { cls: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30', label: 'Approved' },
  submitted: { cls: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',   label: 'Under Review' },
  rejected:  { cls: 'bg-red-500/15 text-red-300 border border-red-500/30',          label: 'Needs Revision' },
  draft:     { cls: 'bg-slate-700 text-slate-400',                                  label: 'Draft' },
};

function Stars({ r }: { r: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`h-3 w-3 ${i <= Math.round(r) ? 'text-amber-400' : 'text-slate-700'}`} fill="currentColor">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
      <span className="ml-0.5 text-[10px] text-slate-400">{r.toFixed(1)}</span>
    </span>
  );
}

const AVATAR_SIZE: Record<number, { box: string; text: string }> = {
  10: { box: 'h-10 w-10', text: 'text-sm' },
  16: { box: 'h-16 w-16', text: 'text-xl' },
};

function Avatar({ name, photoUrl, size = 10 }: { name: string; photoUrl: string | null; size?: 10 | 16 }) {
  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';
  const { box, text } = AVATAR_SIZE[size] ?? AVATAR_SIZE[10];
  const base = `${box} rounded-full border-2 border-slate-700`;
  return photoUrl
    ? <img src={photoUrl} alt={name} className={`${base} object-cover`} />
    : <div className={`${base} bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold ${text}`}>{initials}</div>;
}

// ── Full profile drawer ────────────────────────────────────────────────────────
function ProfileDrawer({ trainer, onClose }: { trainer: Trainer; onClose: () => void }) {
  const [fp, setFp]         = useState<FullProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/academy/trainer-profile/${trainer.id}`)
      .then(r => r.json())
      .then(d => { setFp(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [trainer.id]);

  const profile = fp?.profile;
  const pill = STATUS_PILL[profile?.profile_status ?? 'draft'] ?? STATUS_PILL.draft;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="w-full max-w-lg bg-[#0a0f1e] border-l border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 shrink-0">
          <h2 className="text-sm font-semibold text-slate-100">Trainer Profile</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-10 rounded-lg bg-slate-800/50 animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Identity */}
              <div className="flex items-start gap-4">
                <Avatar name={trainer.name} photoUrl={fp?.avatarUrl ?? trainer.photoUrl} size={16} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{fp?.name ?? trainer.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${pill.cls}`}>{pill.label}</span>
                  </div>
                  {profile?.headline && <p className="text-sm text-slate-400 mt-0.5">{profile.headline}</p>}
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_META[trainer.type] ?? 'bg-slate-800 text-slate-400'}`}>{trainer.type}</span>
                    {profile?.location && <span className="text-[11px] text-slate-500">📍 {profile.location}</span>}
                  </div>
                  <div className="mt-1.5 flex items-center gap-3">
                    <Stars r={trainer.rating} />
                    <span className="text-[11px] text-slate-500">{trainer.sessions} sessions · {fp?.email ?? trainer.email}</span>
                  </div>
                </div>
              </div>

              {/* Social links */}
              {(profile?.linkedin_url || profile?.twitter_url || profile?.youtube_url || profile?.website_url) && (
                <div className="flex flex-wrap gap-2">
                  {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-blue-400 hover:border-blue-500/50 transition">LinkedIn ↗</a>}
                  {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-sky-400 hover:border-sky-500/50 transition">Twitter ↗</a>}
                  {profile.youtube_url && <a href={profile.youtube_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-red-400 hover:border-red-500/50 transition">YouTube ↗</a>}
                  {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500 transition">Website ↗</a>}
                </div>
              )}

              {/* Bio */}
              {profile?.bio && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">About</h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                </div>
              )}

              {/* Languages */}
              {(profile?.languages ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {profile!.languages.map(l => (
                      <span key={l} className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{l}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {(profile?.education ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Education</h4>
                  <div className="space-y-3">
                    {profile!.education.map((e, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <p className="text-sm font-semibold text-slate-200">{e.degree}</p>
                        <p className="text-xs text-slate-400">{e.institution}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{e.year_from}{e.year_to ? ` – ${e.year_to}` : ''}</p>
                        {e.description && <p className="text-xs text-slate-500 mt-1">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certifications */}
              {(profile?.certifications ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Certifications</h4>
                  <div className="space-y-2">
                    {profile!.certifications.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                          <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-200">{c.name}</p>
                          <p className="text-[11px] text-slate-400">{c.issuer}{c.year ? ` · ${c.year}` : ''}</p>
                          {c.url && <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">Verify ↗</a>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Achievements */}
              {(profile?.achievements ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Achievements</h4>
                  <div className="space-y-2">
                    {profile!.achievements.map((a, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <p className="text-sm font-semibold text-slate-200">{a.title}</p>
                        <p className="text-[11px] text-slate-400">{a.issuer}{a.year ? ` · ${a.year}` : ''}</p>
                        {a.description && <p className="text-xs text-slate-500 mt-1">{a.description}</p>}
                        {a.url && <a href={a.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 hover:text-indigo-300 transition">Reference ↗</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past clients (reference-able only) */}
              {(fp?.clients ?? []).filter(c => c.can_reference).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Notable Clients</h4>
                  <div className="space-y-2">
                    {fp!.clients.filter(c => c.can_reference).map((c, i) => (
                      <div key={i} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-200">{c.company_name}</p>
                          {c.industry && <span className="text-[9px] rounded bg-slate-800 px-1.5 py-0.5 text-slate-400">{c.industry}</span>}
                        </div>
                        <p className="text-[11px] text-slate-400">{c.engagement_type}{c.year_from ? ` · ${c.year_from}–${c.year_to || 'Present'}` : ''}</p>
                        {c.description && <p className="text-xs text-slate-500 mt-1">{c.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resume */}
              {profile?.resume_url && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">Resume / CV</h4>
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 hover:border-indigo-500/50 transition group"
                  >
                    <svg className="h-8 w-8 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 12h8v1H8v-1zm0 3h8v1H8v-1zm0-6h5v1H8V9z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-indigo-300 transition">Download Resume / CV</p>
                      <p className="text-[11px] text-slate-500">PDF document ↗</p>
                    </div>
                  </a>
                </div>
              )}

              {/* No profile data yet */}
              {!profile && (
                <div className="py-12 text-center text-slate-500 text-sm">
                  This trainer has not completed their profile yet.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">
            Close
          </button>
          {profile?.profile_status === 'submitted' && (
            <button className="flex-1 rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-500 transition">
              Approve Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', email: '', type: 'Internal', expertiseRaw: '',
  status: 'Active', t3Cert: '', partnerId: '',
};

export default function TrainersPage() {
  const [trainers, setTrainers]       = useState<Trainer[]>([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('All');
  const [search, setSearch]           = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formError, setFormError]     = useState('');
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [profileTarget, setProfileTarget] = useState<Trainer | null>(null);

  useEffect(() => {
    fetch('/api/academy/trainers')
      .then(r => r.json())
      .then(d => { setTrainers(d.trainers ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = trainers.filter(t => {
    if (filter !== 'All' && t.type !== filter) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function openModal() { setForm(EMPTY_FORM); setFormError(''); setShowModal(true); }

  function handleAdd() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    if (!form.email.trim()) { setFormError('Email is required.'); return; }
    const trainer: Trainer = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim(),
      type: form.type,
      expertise: form.expertiseRaw.split(',').map(s => s.trim()).filter(Boolean),
      rating: 0,
      sessions: 0,
      participants: 0,
      certifications: [],
      status: form.status,
      t3Cert: form.t3Cert.trim() || null,
      partnerId: form.partnerId.trim() || null,
      photoUrl: null,
      headline: null,
      resumeUrl: null,
      profileStatus: 'draft',
    };
    setTrainers(prev => [trainer, ...prev]);
    setShowModal(false);
  }

  return (
    <div className="space-y-6">
      {shareTarget && (
        <ShareProfileModal
          trainerId={shareTarget.id}
          trainerName={shareTarget.name}
          onClose={() => setShareTarget(null)}
        />
      )}

      {profileTarget && (
        <ProfileDrawer trainer={profileTarget} onClose={() => setProfileTarget(null)} />
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Trainers &amp; Faculty</h1>
          <p className="mt-0.5 text-sm text-slate-500">{loading ? 'Loading…' : `${filtered.length} trainer${filtered.length !== 1 ? 's' : ''}`}</p>
        </div>
        <button onClick={openModal}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Trainer
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search trainers…"
          className="flex-1 min-w-[200px] rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          {['All', ...TRAINER_TYPES].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium transition ${filter === f ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">Loading trainers…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No trainers yet. Click "Add Trainer" to get started.</div>
        )}
        {filtered.map(t => {
          const pill = STATUS_PILL[t.profileStatus] ?? STATUS_PILL.draft;
          return (
            <div key={t.id} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="shrink-0">
                    <Avatar name={t.name} photoUrl={t.photoUrl} size={10} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-200 truncate">{t.name}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${TYPE_META[t.type] ?? 'bg-slate-800 text-slate-400'}`}>{t.type}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <div className={`h-2 w-2 rounded-full ${t.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${pill.cls}`}>{pill.label}</span>
                </div>
              </div>

              {t.headline && <p className="text-[11px] text-slate-500 line-clamp-2">{t.headline}</p>}

              <Stars r={t.rating} />

              {t.expertise.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {t.expertise.map(e => (
                    <span key={e} className="rounded px-1.5 py-0.5 text-[9px] bg-slate-800 text-slate-400">{e}</span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                <div className="text-center">
                  <p className="text-lg font-bold text-indigo-400">{t.sessions}</p>
                  <p className="text-[10px] text-slate-600">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-emerald-400">{t.participants >= 1000 ? `${(t.participants/1000).toFixed(1)}K` : t.participants}</p>
                  <p className="text-[10px] text-slate-600">Participants</p>
                </div>
              </div>

              {t.t3Cert && <div className="text-[9px] font-mono text-emerald-600 truncate" title={t.t3Cert}>T3: {t.t3Cert}</div>}
              {t.partnerId && <div className="text-[9px] text-slate-600">Partner: {t.partnerId}</div>}

              <div className="flex gap-2">
                <button
                  onClick={() => setProfileTarget(t)}
                  className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:border-indigo-500/40 transition">
                  View Profile
                </button>
                <button className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 py-1.5 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">Assign</button>
                <button
                  onClick={() => setShareTarget({ id: t.id, name: t.name })}
                  title="Share profile"
                  className="rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-2 py-1.5 text-emerald-400 hover:border-emerald-500 transition">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Trainer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#0c1022] p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-100">Add Trainer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 transition">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Enter trainer name', required: true },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'trainer@example.com', required: true },
              ].map(({ label, key, type, placeholder, required }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{label}{required && <span className="text-rose-400 ml-0.5">*</span>}</label>
                  <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Trainer Type</label>
                <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  {TRAINER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Expertise Areas <span className="text-slate-600">(comma-separated)</span></label>
                <input value={form.expertiseRaw} onChange={e => setForm(p => ({ ...p, expertiseRaw: e.target.value }))}
                  placeholder="Plastic Waste, E-Waste, CPCB Portal"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">T3 Certificate Ref <span className="text-slate-600">(optional)</span></label>
                <input value={form.t3Cert} onChange={e => setForm(p => ({ ...p, t3Cert: e.target.value }))}
                  placeholder="EALP-2024-001"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Partner ID <span className="text-slate-600">(optional)</span></label>
                <input value={form.partnerId} onChange={e => setForm(p => ({ ...p, partnerId: e.target.value }))}
                  placeholder="PARTNER-001"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>

            {formError && <p className="text-xs text-rose-400">{formError}</p>}

            <div className="flex gap-3 pt-1">
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-slate-700 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={handleAdd}
                className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition">Add Trainer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
