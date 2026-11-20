'use client';

import { useEffect, useMemo, useState } from 'react';

type TargetMode = 'role' | 'individual' | 'group' | 'all';
type MessageType = 'info' | 'warning' | 'announcement' | 'urgent';

type TargetProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type AnnouncementRow = {
  id: string;
  title: string;
  body: string;
  message_type: MessageType;
  image_url: string | null;
  link_url: string | null;
  target_mode: TargetMode;
  target_roles: string[];
  target_profile_ids: string[];
  recipient_count: number;
  created_at: string;
  expires_at: string;
};

const MESSAGE_TYPES: { key: MessageType; label: string; color: string; desc: string }[] = [
  { key: 'info',         label: 'Info',         color: 'bg-blue-600',   desc: 'General information (blue)' },
  { key: 'warning',      label: 'Warning',      color: 'bg-amber-600',  desc: 'Attention required (amber)' },
  { key: 'announcement', label: 'Announcement', color: 'bg-violet-600', desc: 'Important update (violet)' },
  { key: 'urgent',       label: 'Urgent',       color: 'bg-rose-600',   desc: 'Critical / time-sensitive (red)' },
];

const MSG_TYPE_BADGE: Record<MessageType, string> = {
  info:         'bg-blue-500/20 text-blue-300',
  warning:      'bg-amber-500/20 text-amber-300',
  announcement: 'bg-violet-500/20 text-violet-300',
  urgent:       'bg-rose-500/20 text-rose-300',
};

const ROLE_OPTIONS = ['admin', 'manager', 'client', 'partner', 'recycler', 'cepc'];

export default function AdminAnnouncementsClient() {
  const [targetMode, setTargetMode] = useState<TargetMode>('role');
  const [messageType, setMessageType] = useState<MessageType>('info');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [targetRoles, setTargetRoles] = useState<string[]>(['client']);
  const [targetProfiles, setTargetProfiles] = useState<TargetProfile[]>([]);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rows, setRows] = useState<AnnouncementRow[]>([]);

  async function loadData() {
    setLoadingData(true);
    setError(null);

    try {
      const [targetsRes, announcementsRes] = await Promise.all([
        fetch('/api/admin/announcements/targets'),
        fetch('/api/admin/announcements')
      ]);

      const targetsResult = await targetsRes.json().catch(() => ({}));
      const announcementsResult = await announcementsRes.json().catch(() => ({}));

      if (!targetsRes.ok) {
        throw new Error(targetsResult?.error || 'Could not load target users.');
      }

      if (!announcementsRes.ok) {
        throw new Error(announcementsResult?.error || 'Could not load announcements list.');
      }

      setTargetProfiles(Array.isArray(targetsResult?.rows) ? targetsResult.rows : []);
      setRows(Array.isArray(announcementsResult?.rows) ? announcementsResult.rows : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load announcements data.');
      setTargetProfiles([]);
      setRows([]);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredProfiles = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return targetProfiles;
    return targetProfiles.filter((row) => {
      const hay = `${row.name} ${row.email} ${row.role}`.toLowerCase();
      return hay.includes(q);
    });
  }, [searchTerm, targetProfiles]);

  function toggleRole(role: string) {
    setTargetRoles((prev) => (prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]));
  }

  function toggleProfile(id: string) {
    setSelectedProfileIds((prev) => {
      if (targetMode === 'individual') {
        return prev.includes(id) ? [] : [id];
      }
      return prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
    });
  }

  async function submitAnnouncement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          body,
          imageUrl,
          linkUrl,
          targetMode,
          targetRoles,
          targetProfileIds: selectedProfileIds,
          messageType,
        })
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || 'Could not create announcement.');
      }

      setSuccess(`Announcement sent to ${result?.recipientCount || 0} recipient(s).`);
      setTitle('');
      setBody('');
      setImageUrl('');
      setLinkUrl('');
      setSelectedProfileIds([]);

      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Could not create announcement.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Messages &amp; Announcements</h1>
        <p className="mt-1 text-sm text-slate-400">
          Send messages to specific users, user types, groups, or everyone. Messages appear as dismissible banners on their dashboards and are accessible from their Notifications inbox for 6 months, then auto-archived. Choose a message type to set the visual tone.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          {MESSAGE_TYPES.map((mt) => (
            <span key={mt.key} className={`rounded px-2 py-0.5 font-semibold ${MSG_TYPE_BADGE[mt.key]}`}>
              {mt.label} — {mt.desc}
            </span>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-100">Create Announcement</h2>
        <form onSubmit={submitAnnouncement} className="mt-4 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={220}
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
              placeholder="Important compliance update"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
              placeholder="Write the announcement text"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Image URL (optional)</label>
              <input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">Link URL (optional)</label>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full rounded-md border border-slate-700 px-3 py-2 text-sm"
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Message Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Message Type</label>
            <div className="flex flex-wrap gap-2">
              {MESSAGE_TYPES.map((mt) => (
                <button
                  key={mt.key}
                  type="button"
                  onClick={() => setMessageType(mt.key)}
                  title={mt.desc}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium text-white transition ${
                    messageType === mt.key
                      ? mt.color + ' ring-2 ring-offset-1 ring-offset-slate-900 ring-white/30'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {mt.label}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {MESSAGE_TYPES.find((m) => m.key === messageType)?.desc}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-200">Audience</label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'role', label: 'User Type' },
                { key: 'individual', label: 'Individual' },
                { key: 'group', label: 'Group' },
                { key: 'all', label: 'All Users' }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setTargetMode(item.key as TargetMode)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    targetMode === item.key
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-700 bg-slate-900/60 text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {targetMode === 'role' ? (
            <div className="rounded-lg border border-slate-800 p-3">
              <p className="mb-2 text-sm font-medium text-slate-200">Select user type(s)</p>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    type="button"
                    key={role}
                    onClick={() => toggleRole(role)}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      targetRoles.includes(role)
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-700 bg-slate-900/60 text-slate-200'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {targetMode === 'individual' || targetMode === 'group' ? (
            <div className="rounded-lg border border-slate-800 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">
                  {targetMode === 'individual' ? 'Select one user' : 'Select users for group'}
                </p>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full max-w-xs rounded-md border border-slate-700 px-2 py-1 text-xs"
                  placeholder="Search user"
                />
              </div>
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {filteredProfiles.map((row) => (
                  <label key={row.id} className="flex items-start gap-2 rounded border border-slate-800/60 p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedProfileIds.includes(row.id)}
                      onChange={() => toggleProfile(row.id)}
                      className="mt-0.5"
                    />
                    <span>
                      <span className="block font-medium text-slate-100">{row.name}</span>
                      <span className="block text-xs text-slate-500">{row.email} • {row.role}</span>
                    </span>
                  </label>
                ))}
                {filteredProfiles.length === 0 ? <p className="text-xs text-slate-500">No users match your search.</p> : null}
              </div>
            </div>
          ) : null}

          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          {success ? <p className="text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Sending...' : 'Send Announcement'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-100">Recent Announcements</h2>
          <button onClick={loadData} className="rounded-md border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200">
            Refresh
          </button>
        </div>

        {loadingData ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {!loadingData && rows.length === 0 ? <p className="text-sm text-slate-500">No announcements yet.</p> : null}

        <div className="space-y-3">
          {rows.map((row) => {
            const msgType = (row.message_type ?? 'info') as MessageType;
            const badgeClass = MSG_TYPE_BADGE[msgType] ?? MSG_TYPE_BADGE.info;
            const typeLabel = MESSAGE_TYPES.find((m) => m.key === msgType)?.label ?? 'Info';
            return (
              <article key={row.id} className="rounded-lg border border-slate-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeClass}`}>
                      {typeLabel}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-100">{row.title}</h3>
                  </div>
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs text-slate-200">
                    {row.recipient_count} recipients
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-200">{row.body}</p>
                <p className="mt-2 text-xs text-slate-500">
                  Sent {new Date(row.created_at).toLocaleString()} • Expires {row.expires_at ? new Date(row.expires_at).toLocaleDateString() : 'N/A'}
                </p>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
