'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import ServicesTab from './ServicesTab';

// ── Helpers ────────────────────────────────────────────────────────────────────
function Input({ label, value, onChange, placeholder, type = 'text', required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-slate-300">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
      />
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onSubmit, profileStatus }: {
  dirty: boolean; saving: boolean; onSave: () => void; onSubmit: () => void;
  profileStatus: string;
}) {
  if (!dirty && profileStatus === 'approved') return null;
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/95 backdrop-blur px-4 py-3 shadow-lg">
      <p className="text-sm text-slate-400">
        {dirty ? 'You have unsaved changes' : profileStatus === 'submitted' ? 'Profile submitted — awaiting director review' : profileStatus === 'rejected' ? 'Profile was returned for revision' : ''}
      </p>
      <div className="flex gap-2">
        {dirty && (
          <button onClick={onSave} disabled={saving}
            className="rounded-lg border border-slate-600 px-4 py-1.5 text-sm text-slate-300 hover:border-slate-400 disabled:opacity-50 transition-colors">
            {saving ? 'Saving…' : 'Save Draft'}
          </button>
        )}
        {!dirty && (profileStatus === 'draft' || profileStatus === 'rejected') && (
          <button onClick={onSubmit} disabled={saving}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 px-4 py-1.5 text-sm font-medium text-white transition-colors">
            Submit for Review
          </button>
        )}
      </div>
    </div>
  );
}

const STATUS_PILL: Record<string, string> = {
  draft:      'bg-slate-700 text-slate-300',
  submitted:  'bg-amber-500/15 text-amber-300 border border-amber-500/30',
  approved:   'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  rejected:   'bg-red-500/15 text-red-300 border border-red-500/30',
};

interface EduEntry { id: string; degree: string; institution: string; year_from: string; year_to: string; description: string; }
interface AchievEntry { id: string; title: string; issuer: string; year: string; description: string; url: string; }
interface CertEntry { id: string; name: string; issuer: string; year: string; credential_id: string; url: string; }
interface ClientEntry { id: string; company_name: string; industry: string; engagement_type: string; year_from: string; year_to: string; description: string; can_reference: boolean; }

function uid() { return Math.random().toString(36).slice(2); }
function emptyEdu(): EduEntry { return { id: uid(), degree: '', institution: '', year_from: '', year_to: '', description: '' }; }
function emptyAchiev(): AchievEntry { return { id: uid(), title: '', issuer: '', year: '', description: '', url: '' }; }
function emptyCert(): CertEntry { return { id: uid(), name: '', issuer: '', year: '', credential_id: '', url: '' }; }
function emptyClient(): ClientEntry { return { id: uid(), company_name: '', industry: '', engagement_type: '', year_from: '', year_to: '', description: '', can_reference: false }; }

const TRAINER_ROLES = ['trainer', 'guest_trainer', 'partner_trainer'];
const RESUME_ROLES  = ['trainer', 'guest_trainer'];
const TABS = ['Overview', 'Education', 'Achievements', 'Clients', 'Services'];

// ── Avatar uploader ────────────────────────────────────────────────────────────
function AvatarUploader({
  name, avatarUrl, onUploaded, uploading, setUploading,
}: {
  name: string;
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/academy/upload?type=avatar', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok && data.url) onUploaded(data.url);
    else alert(data.error ?? 'Upload failed');
    e.target.value = '';
  }

  const initials = name.split(' ').map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div className="flex items-center gap-5">
      <div className="relative group shrink-0">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile photo"
            className="h-20 w-20 rounded-full object-cover border-2 border-slate-700 group-hover:opacity-80 transition"
          />
        ) : (
          <div className="h-20 w-20 rounded-full bg-indigo-500/20 border-2 border-slate-700 flex items-center justify-center text-indigo-300 text-2xl font-bold group-hover:opacity-80 transition">
            {initials}
          </div>
        )}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition disabled:cursor-wait"
        >
          {uploading ? (
            <svg className="h-5 w-5 text-white animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFile} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-200">{name || 'Your Name'}</p>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-50 transition"
        >
          {uploading ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Upload photo'}
        </button>
        <p className="text-[10px] text-slate-600 mt-0.5">JPG, PNG or WebP · Max 2 MB</p>
      </div>
    </div>
  );
}

// ── Resume uploader ────────────────────────────────────────────────────────────
function ResumeUploader({
  resumeUrl, onUploaded,
}: {
  resumeUrl: string | null;
  onUploaded: (url: string) => void;
}) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/academy/upload?type=resume', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (res.ok && data.url) onUploaded(data.url);
    else setError(data.error ?? 'Upload failed');
    e.target.value = '';
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3">
      <h2 className="font-semibold text-white flex items-center gap-2">
        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Resume / CV
      </h2>
      {resumeUrl ? (
        <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3">
          <svg className="h-8 w-8 text-red-400 shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 12h8v1H8v-1zm0 3h8v1H8v-1zm0-6h5v1H8V9z"/>
          </svg>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">Resume uploaded</p>
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 transition">View PDF ↗</a>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="shrink-0 rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400 disabled:opacity-50 transition">
            {uploading ? 'Uploading…' : 'Replace'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full rounded-xl border border-dashed border-slate-700 py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-50 transition">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <span className="text-sm font-medium">{uploading ? 'Uploading…' : 'Upload Resume / CV'}</span>
          <span className="text-xs text-slate-600">PDF only · Max 5 MB</span>
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function TrainerProfilePage() {
  const [tab, setTab]                   = useState('Overview');
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [dirty, setDirty]               = useState(false);
  const [toast, setToast]               = useState('');
  const [profileStatus, setStatus]      = useState('draft');

  // Identity from API
  const [userRole, setUserRole]         = useState('');
  const [fullName, setFullName]         = useState('');
  const [avatarUrl, setAvatarUrl]       = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Overview fields
  const [headline, setHeadline]         = useState('');
  const [bio, setBio]                   = useState('');
  const [location, setLocation]         = useState('');
  const [website, setWebsite]           = useState('');
  const [linkedin, setLinkedin]         = useState('');
  const [twitter, setTwitter]           = useState('');
  const [youtube, setYoutube]           = useState('');
  const [instagram, setInstagram]       = useState('');
  const [languages, setLanguages]       = useState('');
  const [resumeUrl, setResumeUrl]       = useState<string | null>(null);

  // Education / achievements / certs
  const [education, setEducation]       = useState<EduEntry[]>([]);
  const [achievements, setAchievements] = useState<AchievEntry[]>([]);
  const [certs, setCerts]               = useState<CertEntry[]>([]);

  // Clients
  const [clients, setClients]           = useState<ClientEntry[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/academy/trainer-profile');
    if (!res.ok) { setLoading(false); return; }
    const { profile, clients: rawClients, role, fullName: fn, avatarUrl: av } = await res.json();
    setUserRole(role ?? '');
    setFullName(fn ?? '');
    setAvatarUrl(av ?? null);
    if (profile) {
      setHeadline(profile.headline ?? '');
      setBio(profile.bio ?? '');
      setLocation(profile.location ?? '');
      setWebsite(profile.website_url ?? '');
      setLinkedin(profile.linkedin_url ?? '');
      setTwitter(profile.twitter_url ?? '');
      setYoutube(profile.youtube_url ?? '');
      setInstagram(profile.instagram_url ?? '');
      setLanguages((profile.languages ?? []).join(', '));
      setResumeUrl(profile.resume_url ?? null);
      setEducation((profile.education ?? []).map((e: EduEntry) => ({ ...e, id: e.id ?? uid() })));
      setAchievements((profile.achievements ?? []).map((a: AchievEntry) => ({ ...a, id: a.id ?? uid() })));
      setCerts((profile.certifications ?? []).map((c: CertEntry) => ({ ...c, id: c.id ?? uid() })));
      setStatus(profile.profile_status ?? 'draft');
    }
    setClients((rawClients ?? []).map((c: ClientEntry) => ({ ...c, id: c.id ?? uid(), year_from: String(c.year_from ?? ''), year_to: String(c.year_to ?? '') })));
    setLoading(false);
    setDirty(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function markDirty() { setDirty(true); }

  async function save() {
    setSaving(true);
    const res = await fetch('/api/academy/trainer-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        headline, bio, location, website_url: website,
        linkedin_url: linkedin, twitter_url: twitter,
        youtube_url: youtube, instagram_url: instagram,
        languages: languages.split(',').map(l => l.trim()).filter(Boolean),
        resume_url: resumeUrl,
        education: education.map(({ id: _id, ...e }) => e),
        achievements: achievements.map(({ id: _id, ...a }) => a),
        certifications: certs.map(({ id: _id, ...c }) => c),
      }),
    });

    await fetch('/api/academy/trainer-profile?section=clients_sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clients: clients.map(({ id: _id, ...c }) => ({ ...c, year_from: c.year_from ? parseInt(c.year_from) : null, year_to: c.year_to ? parseInt(c.year_to) : null })) }),
    });

    setSaving(false);
    if (res.ok) { setDirty(false); setStatus(s => s === 'rejected' ? 'draft' : s); showToast('Profile saved'); }
  }

  async function submitForReview() {
    setSaving(true);
    const res = await fetch('/api/academy/trainer-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit' }),
    });
    setSaving(false);
    if (res.ok) { setStatus('submitted'); showToast('Profile submitted for review'); }
  }

  const updateEdu = (id: string, field: keyof EduEntry, val: string) => {
    setEducation(prev => prev.map(e => e.id === id ? { ...e, [field]: val } : e));
    markDirty();
  };
  const updateAchiev = (id: string, field: keyof AchievEntry, val: string) => {
    setAchievements(prev => prev.map(a => a.id === id ? { ...a, [field]: val } : a));
    markDirty();
  };
  const updateCert = (id: string, field: keyof CertEntry, val: string) => {
    setCerts(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    markDirty();
  };
  const updateClient = (id: string, field: keyof ClientEntry, val: string | boolean) => {
    setClients(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    markDirty();
  };

  const isTrainer        = TRAINER_ROLES.includes(userRole);
  const canUploadResume  = RESUME_ROLES.includes(userRole);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded-lg bg-slate-800/50 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white shadow-xl">{toast}</div>
      )}

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-5">

        {/* ── Avatar + identity header ── */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <AvatarUploader
            name={fullName}
            avatarUrl={avatarUrl}
            uploading={uploadingAvatar}
            setUploading={setUploadingAvatar}
            onUploaded={url => setAvatarUrl(url)}
          />
        </div>

        {/* ── Page header ── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Profile</h1>
            <p className="text-sm text-slate-400 mt-1">
              {isTrainer
                ? 'Build your trainer profile — visible to directors and used for program matching'
                : 'Manage your academy profile'}
            </p>
          </div>
          {isTrainer && (
            <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_PILL[profileStatus] ?? STATUS_PILL.draft}`}>
              {profileStatus === 'submitted' ? 'Under Review' : profileStatus}
            </span>
          )}
        </div>

        {isTrainer && (
          <SaveBar dirty={dirty} saving={saving} onSave={save} onSubmit={submitForReview} profileStatus={profileStatus} />
        )}

        {/* ── Tabs (trainer-only) ── */}
        {isTrainer && (
          <div className="flex gap-1 overflow-x-auto border-b border-slate-800 pb-0">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`whitespace-nowrap px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
                {t}
              </button>
            ))}
          </div>
        )}

        {/* ── Overview ── */}
        {(!isTrainer || tab === 'Overview') && (
          <div className="space-y-5">
            {isTrainer && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h2 className="font-semibold text-white">Basic Information</h2>
                <Input label="Professional Headline" value={headline} onChange={v => { setHeadline(v); markDirty(); }}
                  placeholder="e.g. EPR Compliance Trainer | E-Waste Specialist" />
                <Textarea label="Bio / About" value={bio} onChange={v => { setBio(v); markDirty(); }} rows={4}
                  placeholder="Describe your background, teaching philosophy, and areas of expertise…" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Location" value={location} onChange={v => { setLocation(v); markDirty(); }} placeholder="City, State" />
                  <Input label="Website" value={website} onChange={v => { setWebsite(v); markDirty(); }} placeholder="https://" />
                </div>
                <Input label="Languages (comma-separated)" value={languages} onChange={v => { setLanguages(v); markDirty(); }}
                  placeholder="English, Hindi, Tamil" />
              </div>
            )}

            {isTrainer && (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <h2 className="font-semibold text-white">Social Media Handles</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'LinkedIn', key: 'linkedin', val: linkedin, set: setLinkedin, icon: <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>, color: 'text-blue-400', placeholder: 'https://linkedin.com/in/…' },
                    { label: 'Twitter / X', key: 'twitter', val: twitter, set: setTwitter, icon: <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>, color: 'text-sky-400', placeholder: 'https://twitter.com/…' },
                    { label: 'YouTube', key: 'youtube', val: youtube, set: setYoutube, icon: <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 12.64 12.64 0 00-8.45 0A4.83 4.83 0 014.41 6.69 45.22 45.22 0 004 12a45.22 45.22 0 00.41 5.31 4.83 4.83 0 003.77 2.75 12.64 12.64 0 008.45 0 4.83 4.83 0 003.77-2.75A45.22 45.22 0 0020 12a45.22 45.22 0 00-.41-5.31zM10 15.5v-7l6 3.5z"/>, color: 'text-red-400', placeholder: 'https://youtube.com/…' },
                    { label: 'Instagram', key: 'instagram', val: instagram, set: setInstagram, icon: <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>, color: 'text-pink-400', placeholder: 'https://instagram.com/…' },
                  ].map(({ label, val, set, icon, color, placeholder }) => (
                    <div key={label} className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">{label}</label>
                      <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2">
                        <svg className={`w-4 h-4 flex-shrink-0 ${color}`} fill="currentColor" viewBox="0 0 24 24">{icon}</svg>
                        <input type="url" value={val} onChange={e => { set(e.target.value); markDirty(); }}
                          placeholder={placeholder} className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resume upload — trainer & guest_trainer only */}
            {canUploadResume && (
              <ResumeUploader
                resumeUrl={resumeUrl}
                onUploaded={url => setResumeUrl(url)}
              />
            )}
          </div>
        )}

        {/* ── Education ── */}
        {isTrainer && tab === 'Education' && (
          <div className="space-y-4">
            {education.map((e, idx) => (
              <div key={e.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Degree #{idx + 1}</h3>
                  <button onClick={() => { setEducation(p => p.filter(x => x.id !== e.id)); markDirty(); }}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors">Remove</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Degree / Qualification" value={e.degree} onChange={v => updateEdu(e.id, 'degree', v)} placeholder="B.Tech, MBA, M.Sc…" />
                  <Input label="Institution" value={e.institution} onChange={v => updateEdu(e.id, 'institution', v)} placeholder="University / College name" />
                  <Input label="Year From" value={e.year_from} onChange={v => updateEdu(e.id, 'year_from', v)} placeholder="2010" />
                  <Input label="Year To (or 'Present')" value={e.year_to} onChange={v => updateEdu(e.id, 'year_to', v)} placeholder="2014" />
                </div>
                <Textarea label="Description" value={e.description} onChange={v => updateEdu(e.id, 'description', v)} rows={2} placeholder="Optional notes" />
              </div>
            ))}
            <button onClick={() => { setEducation(p => [...p, emptyEdu()]); markDirty(); }}
              className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
              + Add Degree
            </button>

            <div className="pt-2 border-t border-slate-800">
              <h2 className="font-semibold text-white mb-4">Professional Certifications</h2>
              {certs.map((c, idx) => (
                <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-white">Certification #{idx + 1}</h3>
                    <button onClick={() => { setCerts(p => p.filter(x => x.id !== c.id)); markDirty(); }}
                      className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Certification Name" value={c.name} onChange={v => updateCert(c.id, 'name', v)} placeholder="CPCB EPR Certified Trainer" />
                    <Input label="Issuing Body" value={c.issuer} onChange={v => updateCert(c.id, 'issuer', v)} placeholder="CPCB, MoEFCC…" />
                    <Input label="Year" value={c.year} onChange={v => updateCert(c.id, 'year', v)} placeholder="2022" />
                    <Input label="Credential ID" value={c.credential_id} onChange={v => updateCert(c.id, 'credential_id', v)} placeholder="Optional" />
                    <Input label="Credential URL" value={c.url} onChange={v => updateCert(c.id, 'url', v)} placeholder="https://" />
                  </div>
                </div>
              ))}
              <button onClick={() => { setCerts(p => [...p, emptyCert()]); markDirty(); }}
                className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
                + Add Certification
              </button>
            </div>
          </div>
        )}

        {/* ── Achievements ── */}
        {isTrainer && tab === 'Achievements' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">Awards, publications, speaking engagements, press mentions, or any recognition worth highlighting.</p>
            {achievements.map((a, idx) => (
              <div key={a.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Achievement #{idx + 1}</h3>
                  <button onClick={() => { setAchievements(p => p.filter(x => x.id !== a.id)); markDirty(); }}
                    className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Title" value={a.title} onChange={v => updateAchiev(a.id, 'title', v)} placeholder="Best Trainer Award" />
                  <Input label="Issuer / Organisation" value={a.issuer} onChange={v => updateAchiev(a.id, 'issuer', v)} placeholder="EPR Council of India" />
                  <Input label="Year" value={a.year} onChange={v => updateAchiev(a.id, 'year', v)} placeholder="2023" />
                  <Input label="Reference URL" value={a.url} onChange={v => updateAchiev(a.id, 'url', v)} placeholder="https://" />
                </div>
                <Textarea label="Description" value={a.description} onChange={v => updateAchiev(a.id, 'description', v)} rows={2}
                  placeholder="Brief description of the achievement…" />
              </div>
            ))}
            <button onClick={() => { setAchievements(p => [...p, emptyAchiev()]); markDirty(); }}
              className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
              + Add Achievement
            </button>
          </div>
        )}

        {/* ── Clients ── */}
        {isTrainer && tab === 'Clients' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-400">List organisations you've trained or consulted for in the past. This builds trust with the academy director.</p>
            {clients.map((c, idx) => (
              <div key={c.id} className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white">Client #{idx + 1}</h3>
                  <button onClick={() => { setClients(p => p.filter(x => x.id !== c.id)); markDirty(); }}
                    className="text-xs text-red-400 hover:text-red-300">Remove</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Company / Organisation" value={c.company_name} onChange={v => updateClient(c.id, 'company_name', v)} placeholder="Wipro, CPCB, Reliance…" required />
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Industry</label>
                    <select value={c.industry} onChange={e => updateClient(c.id, 'industry', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none">
                      <option value="">Select…</option>
                      {['Electronics','Plastics','Battery','Tyre','Oil & Gas','Government','NGO','Corporate','Education','Other'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Engagement Type</label>
                    <select value={c.engagement_type} onChange={e => updateClient(c.id, 'engagement_type', e.target.value)}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none">
                      <option value="">Select…</option>
                      {['Training','Workshop','Consulting','Keynote','Audit Support','Other'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input label="Year From" value={c.year_from} onChange={v => updateClient(c.id, 'year_from', v)} placeholder="2019" />
                    <Input label="Year To" value={c.year_to} onChange={v => updateClient(c.id, 'year_to', v)} placeholder="2022" />
                  </div>
                </div>
                <Textarea label="What you did" value={c.description} onChange={v => updateClient(c.id, 'description', v)} rows={2}
                  placeholder="Brief description of the engagement…" />
                <label className={`flex items-center gap-2 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors w-fit ${c.can_reference ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700'}`}>
                  <input type="checkbox" checked={c.can_reference} onChange={e => updateClient(c.id, 'can_reference', e.target.checked)} className="rounded" />
                  <span className="text-sm text-slate-300">Can be used as reference</span>
                </label>
              </div>
            ))}
            <button onClick={() => { setClients(p => [...p, emptyClient()]); markDirty(); }}
              className="w-full rounded-xl border border-dashed border-slate-700 py-3 text-sm text-slate-400 hover:border-emerald-500 hover:text-emerald-400 transition-colors">
              + Add Client
            </button>
          </div>
        )}

        {/* ── Services ── */}
        {isTrainer && tab === 'Services' && <ServicesTab />}
      </div>
    </div>
  );
}
