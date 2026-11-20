'use client';

import { useEffect, useState } from 'react';
import { INDIA_STATES_UTS } from '@/lib/indiaGeo';
import { trackEvent } from '@/lib/analytics';

interface RecyclerProfile {
  id: string;
  name: string;
  recycler_code: string;
  type: string;
  epr_categories: string[];
  authorized_states: string[];
  certifications: string[];
  verification_status: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  city: string;
  state: string;
  last_audit_date: string | null;
  next_audit_due: string | null;
  onboarded_at: string | null;
  verified_at: string | null;
  documents_count: number;
}

interface ComplianceOfficer {
  id: string;
  full_name: string;
  email: string;
}

interface NotificationPrefs {
  channels: { email: boolean; inApp: boolean; whatsapp: boolean };
  digestMode: 'REALTIME' | 'DAILY' | 'WEEKLY';
}

interface EditForm {
  contact_phone: string;
  contact_address: string;
  city: string;
  state: string;
}

const VS_STYLE: Record<string, string> = {
  VERIFIED:    'bg-green-100 text-green-800 border-green-300',
  PENDING:     'bg-yellow-100 text-yellow-800 border-yellow-300',
  SUSPENDED:   'bg-red-100 text-red-800 border-red-300',
  BLACKLISTED: 'bg-gray-200 text-gray-700 border-gray-400',
};

function fmt(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900">{value || '—'}</p>
    </div>
  );
}

export default function RecyclerProfilePage() {
  const [profile, setProfile] = useState<RecyclerProfile | null>(null);
  const [officer, setOfficer] = useState<ComplianceOfficer | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    channels: { email: true, inApp: true, whatsapp: false },
    digestMode: 'REALTIME',
  });
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({ contact_phone: '', contact_address: '', city: '', state: '' });
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefStatus, setPrefStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetch('/api/recycler-portal/me')
      .then((r) => r.json())
      .then((d) => {
        setProfile(d.recycler ?? null);
        setOfficer(d.complianceOfficer ?? null);
        if (d.notificationPrefs) {
          setPrefs({
            channels: d.notificationPrefs.channels ?? { email: true, inApp: true, whatsapp: false },
            digestMode: d.notificationPrefs.digestMode ?? 'REALTIME',
          });
        }
        if (d.recycler) {
          setEditForm({
            contact_phone: d.recycler.contact_phone ?? '',
            contact_address: d.recycler.contact_address ?? '',
            city: d.recycler.city ?? '',
            state: d.recycler.state ?? '',
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile() {
    setSaving(true); setSaveStatus('idle');
    try {
      const res = await fetch('/api/recycler-portal/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileDetails: editForm }),
      });
      setSaveStatus(res.ok ? 'success' : 'error');
      if (res.ok) {
        trackEvent('Recycler Profile Updated', {});
        setProfile((p) => p ? { ...p, ...editForm } : p);
        setEditOpen(false);
      }
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  }

  async function savePrefs() {
    setPrefSaving(true); setPrefStatus('idle');
    try {
      const res = await fetch('/api/recycler-portal/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationPrefs: prefs }),
      });
      if (res.ok) trackEvent('Recycler Notification Prefs Updated', {});
      setPrefStatus(res.ok ? 'success' : 'error');
    } catch {
      setPrefStatus('error');
    } finally {
      setPrefSaving(false);
    }
  }

  if (loading) return (
    <div className="space-y-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );
  if (!profile) return <p className="text-gray-500">Profile not found.</p>;

  const isVerified = profile.verification_status === 'VERIFIED';

  const onboardingChecklist = [
    { label: 'Profile Completed', done: !!(profile.name && profile.state) },
    { label: 'CPCB Certificate Uploaded', done: !!(profile.certifications?.length > 0) },
    { label: 'EPR Categories Set', done: !!(profile.epr_categories?.length > 0) },
    { label: 'Documents Verified', done: !!(profile.documents_count > 0) },
    { label: 'Account Verified', done: isVerified },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500">Your recycler account details and preferences.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold text-teal-700">
            {profile.type || 'Recycler'}
          </span>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${VS_STYLE[profile.verification_status] ?? 'bg-gray-100 text-gray-600 border-gray-300'}`}>
            {profile.verification_status}
          </span>
        </div>
      </div>

      {/* Identity */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Company & Contact</h2>
          <button
            onClick={() => setEditOpen((o) => !o)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {editOpen ? 'Cancel Edit' : 'Edit Details'}
          </button>
        </div>

        {editOpen ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone</label>
                <input
                  value={editForm.contact_phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, contact_phone: e.target.value }))}
                  placeholder="+91 98xxx xxxxx"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  value={editForm.city}
                  onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))}
                  placeholder="e.g. Pune"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">State</label>
                <select
                  value={editForm.state}
                  onChange={(e) => setEditForm((f) => ({ ...f, state: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select State / UT</option>
                  {INDIA_STATES_UTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Address</label>
                <textarea
                  value={editForm.contact_address}
                  onChange={(e) => setEditForm((f) => ({ ...f, contact_address: e.target.value }))}
                  rows={2}
                  placeholder="Full plant/facility address"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>
            </div>
            {saveStatus === 'success' && <p className="text-xs text-green-700">Profile updated.</p>}
            {saveStatus === 'error' && <p className="text-xs text-red-700">Failed to save. Try again.</p>}
            <button
              onClick={saveProfile}
              disabled={saving}
              className="rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Company Name" value={profile.name} />
            </div>
            <Field label="Recycler Code" value={profile.recycler_code} />
            <Field label="Type" value={profile.type} />
            <Field label="Email" value={profile.contact_email} />
            <Field label="Phone" value={profile.contact_phone} />
            <Field label="City" value={profile.city} />
            <Field label="State" value={profile.state} />
            {profile.contact_address && (
              <div className="sm:col-span-2">
                <Field label="Address" value={profile.contact_address} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Compliance Officer */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Assigned Compliance Officer</h2>
        {officer ? (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-base font-bold select-none">
              {officer.full_name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm">{officer.full_name}</p>
              <p className="text-xs text-gray-500">EPR Compliance Officer</p>
              <a href={`mailto:${officer.email}`} className="text-xs text-teal-600 hover:underline">{officer.email}</a>
            </div>
            <a
              href={`mailto:${officer.email}?subject=EPR Compliance Query — ${profile.recycler_code}`}
              className="shrink-0 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
            >
              Message
            </a>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">No compliance officer assigned yet. Contact support to get one assigned.</p>
        )}
      </div>

      {/* Onboarding Checklist */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Account Status</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {onboardingChecklist.map((item) => (
            <div
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 ${item.done ? 'bg-green-50' : 'bg-gray-50'}`}
            >
              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${item.done ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                {item.done && (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`text-xs ${item.done ? 'text-green-800 font-medium' : 'text-gray-600'}`}>{item.label}</span>
            </div>
          ))}
        </div>
        {!isVerified && (
          <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your account is pending verification. Upload all required documents and your compliance officer will review them.
          </p>
        )}
      </div>

      {/* Categories & States */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EPR Categories</p>
          <div className="flex flex-wrap gap-1.5">
            {(profile.epr_categories ?? []).length > 0
              ? profile.epr_categories.map((c) => (
                  <span key={c} className="text-xs bg-green-100 text-green-800 border border-green-300 rounded-full px-2 py-0.5">{c}</span>
                ))
              : <span className="text-xs text-gray-400">None set</span>
            }
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Authorized States</p>
          <div className="flex flex-wrap gap-1.5">
            {(profile.authorized_states ?? []).length > 0
              ? profile.authorized_states.map((s) => (
                  <span key={s} className="text-xs bg-blue-100 text-blue-800 border border-blue-300 rounded-full px-2 py-0.5">{s}</span>
                ))
              : <span className="text-xs text-gray-400">None set</span>
            }
          </div>
        </div>
      </div>

      {/* Certifications & Audit */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Certifications & Audit</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Certifications</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile.certifications ?? []).length > 0
                ? profile.certifications.map((c) => (
                    <span key={c} className="text-xs bg-gray-100 text-gray-700 border border-gray-300 rounded-full px-2 py-0.5">{c}</span>
                  ))
                : <span className="text-xs text-gray-400">None recorded</span>
              }
            </div>
          </div>
          <div className="space-y-2">
            <Field label="Last Audit" value={fmt(profile.last_audit_date)} />
            <Field label="Next Audit Due" value={fmt(profile.next_audit_due)} />
          </div>
        </div>
        {profile.verified_at && (
          <p className="mt-3 text-xs text-gray-400">Verified on {fmt(profile.verified_at)}</p>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-900">Notification Preferences</h2>
        <div>
          <p className="text-xs text-gray-500 mb-2">Channels</p>
          <div className="flex flex-wrap gap-4">
            {(['email', 'inApp', 'whatsapp'] as const).map((ch) => (
              <label key={ch} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={prefs.channels[ch]}
                  onChange={(e) => setPrefs((p) => ({ ...p, channels: { ...p.channels, [ch]: e.target.checked } }))}
                />
                {ch === 'inApp' ? 'In-App' : ch.charAt(0).toUpperCase() + ch.slice(1)}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-2">Digest Mode</p>
          <div className="flex gap-2">
            {(['REALTIME', 'DAILY', 'WEEKLY'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setPrefs((p) => ({ ...p, digestMode: mode }))}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize ${
                  prefs.digestMode === mode ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0) + mode.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        {prefStatus === 'success' && <p className="text-xs text-green-700">Preferences saved.</p>}
        {prefStatus === 'error' && <p className="text-xs text-red-700">Failed to save. Please try again.</p>}
        <button
          onClick={savePrefs}
          disabled={prefSaving}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {prefSaving ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>

      <p className="text-xs text-gray-400">
        For changes to your EPR categories or authorized states, contact your compliance officer or use the contact page on our website.
      </p>
    </div>
  );
}

