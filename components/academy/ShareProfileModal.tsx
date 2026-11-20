'use client';

import { useEffect, useState } from 'react';

interface Share {
  id: string;
  token: string;
  expires_at: string;
  recipient_name: string | null;
  recipient_email: string | null;
  note_to_recipient: string | null;
  view_count: number;
  last_viewed_at: string | null;
  is_revoked: boolean;
  created_at: string;
}

interface Props {
  trainerId: string;
  trainerName: string;
  onClose: () => void;
}

const PRESET_DURATIONS = [
  { label: '24 hours',  hours: 24 },
  { label: '3 days',    hours: 72 },
  { label: '7 days',    hours: 168 },
  { label: '14 days',   hours: 336 },
  { label: '30 days',   hours: 720 },
];

function expiryFromHours(h: number): string {
  const d = new Date(Date.now() + h * 3_600_000);
  return d.toISOString().slice(0, 16); // datetime-local format
}

function isExpired(iso: string) { return new Date(iso) < new Date(); }

function timeLabel(iso: string) {
  if (isExpired(iso)) return 'Expired';
  const ms = new Date(iso).getTime() - Date.now();
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d left`;
  return `${h}h left`;
}

export default function ShareProfileModal({ trainerId, trainerName, onClose }: Props) {
  const [shares, setShares]         = useState<Share[]>([]);
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [view, setView]             = useState<'list' | 'create'>('list');
  const [copiedId, setCopiedId]     = useState<string | null>(null);

  // Form state
  const [expiresAt, setExpiresAt]   = useState(expiryFromHours(72));
  const [recipientName, setRecName] = useState('');
  const [recipientEmail, setRecMail]= useState('');
  const [note, setNote]             = useState('');
  const [error, setError]           = useState('');
  const [newToken, setNewToken]     = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/academy/trainer-shares?trainer_id=${trainerId}`);
    if (res.ok) { const { shares: s } = await res.json(); setShares(s ?? []); }
    setLoading(false);
  }
  useEffect(() => { load(); }, [trainerId]); // eslint-disable-line react-hooks/exhaustive-deps

  function shareUrl(token: string) {
    return `${window.location.origin}/t/${token}`;
  }

  async function copy(token: string, id: string) {
    await navigator.clipboard.writeText(shareUrl(token));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function revoke(id: string) {
    if (!confirm('Revoke this link? Anyone with the link will no longer be able to view the profile.')) return;
    await fetch('/api/academy/trainer-shares', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    load();
  }

  async function create() {
    if (!expiresAt) { setError('Set an expiry date'); return; }
    if (new Date(expiresAt) <= new Date()) { setError('Expiry must be in the future'); return; }
    setError('');
    setCreating(true);
    const res = await fetch('/api/academy/trainer-shares', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trainer_id:       trainerId,
        expires_at:       new Date(expiresAt).toISOString(),
        recipient_name:   recipientName || null,
        recipient_email:  recipientEmail || null,
        note_to_recipient: note || null,
      }),
    });
    setCreating(false);
    if (!res.ok) { const d = await res.json(); setError(d.error ?? 'Failed'); return; }
    const { token } = await res.json();
    setNewToken(token);
    load();
  }

  const activeShares  = shares.filter(s => !s.is_revoked && !isExpired(s.expires_at));
  const archivedShares= shares.filter(s => s.is_revoked || isExpired(s.expires_at));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="font-semibold text-white">Share Profile</h2>
            <p className="text-xs text-slate-400 mt-0.5">{trainerName}</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-5 pt-3 border-b border-slate-800">
          {(['list','create'] as const).map(t => (
            <button key={t} onClick={() => { setView(t); setNewToken(null); setError(''); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${view === t ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>
              {t === 'list' ? `Active Links (${activeShares.length})` : '+ New Link'}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              {loading && (
                <div className="space-y-2">{[...Array(2)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>
              )}

              {!loading && activeShares.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No active links. Create one to share this profile.
                </div>
              )}

              {activeShares.map(s => (
                <div key={s.id} className="rounded-xl border border-slate-700 bg-slate-800/40 p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-white">{s.recipient_name ?? 'Unnamed link'}</span>
                        <span className="text-xs rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5">
                          {timeLabel(s.expires_at)}
                        </span>
                      </div>
                      {s.recipient_email && <p className="text-xs text-slate-500 mt-0.5">{s.recipient_email}</p>}
                      <p className="text-xs text-slate-600 mt-0.5">
                        Expires {new Date(s.expires_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        {s.view_count > 0 && <span className="ml-2 text-slate-500">· Viewed {s.view_count}×</span>}
                      </p>
                    </div>
                    <button onClick={() => revoke(s.id)}
                      className="flex-shrink-0 rounded-lg border border-red-900 px-2.5 py-1 text-xs text-red-400 hover:border-red-700 transition-colors">
                      Revoke
                    </button>
                  </div>

                  {/* Link row */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-slate-400 font-mono truncate">
                      {shareUrl(s.token)}
                    </div>
                    <button onClick={() => copy(s.token, s.id)}
                      className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${copiedId === s.id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 text-slate-300 hover:border-slate-400'}`}>
                      {copiedId === s.id ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}

              {archivedShares.length > 0 && (
                <details className="group">
                  <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 select-none list-none flex items-center gap-1">
                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    Expired / Revoked ({archivedShares.length})
                  </summary>
                  <div className="mt-2 space-y-2">
                    {archivedShares.map(s => (
                      <div key={s.id} className="rounded-xl border border-slate-800 bg-slate-900/30 p-3 opacity-50">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-slate-400">{s.recipient_name ?? 'Unnamed'}</span>
                          <span className="text-xs text-slate-600">{s.is_revoked ? 'Revoked' : 'Expired'} · Viewed {s.view_count}×</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}

          {/* ── CREATE VIEW ── */}
          {view === 'create' && (
            <>
              {newToken ? (
                /* Success state */
                <div className="space-y-4 text-center py-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-white">Link created!</p>
                    <p className="text-sm text-slate-400 mt-1">Copy and share it with the recipient</p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800 p-3 font-mono text-xs text-slate-300 break-all text-left">
                    {shareUrl(newToken)}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => { navigator.clipboard.writeText(shareUrl(newToken)); setCopiedId('new'); setTimeout(() => setCopiedId(null), 2000); }}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${copiedId === 'new' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-600 text-slate-300 hover:border-slate-400'}`}>
                      {copiedId === 'new' ? '✓ Copied!' : 'Copy Link'}
                    </button>
                    <button onClick={() => { setNewToken(null); setView('list'); setRecName(''); setRecMail(''); setNote(''); setExpiresAt(expiryFromHours(72)); }}
                      className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Duration presets */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">Link Duration <span className="text-red-400">*</span></label>
                    <div className="flex flex-wrap gap-2">
                      {PRESET_DURATIONS.map(p => {
                        const val = expiryFromHours(p.hours);
                        const active = expiresAt === val;
                        return (
                          <button key={p.hours} type="button" onClick={() => setExpiresAt(val)}
                            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${active ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500">Or set a custom date & time</label>
                      <input
                        type="datetime-local"
                        value={expiresAt}
                        onChange={e => setExpiresAt(e.target.value)}
                        min={new Date(Date.now() + 3_600_000).toISOString().slice(0, 16)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Recipient */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Recipient Name</label>
                      <input value={recipientName} onChange={e => setRecName(e.target.value)}
                        placeholder="Acme Corp HR"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Recipient Email</label>
                      <input type="email" value={recipientEmail} onChange={e => setRecMail(e.target.value)}
                        placeholder="hr@acme.com"
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none" />
                    </div>
                  </div>

                  {/* Note */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Note to Recipient <span className="text-slate-500 font-normal">(optional)</span></label>
                    <textarea value={note} onChange={e => setNote(e.target.value.slice(0, 400))} rows={3}
                      placeholder="e.g. We believe this trainer is an excellent fit for your e-waste awareness program…"
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none" />
                    <p className="text-xs text-slate-600 text-right">{note.length}/400</p>
                  </div>

                  {error && <p className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-sm text-red-400">{error}</p>}

                  <button onClick={create} disabled={creating}
                    className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-2.5 text-sm font-semibold text-white transition-colors">
                    {creating ? 'Generating link…' : 'Generate Share Link'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
