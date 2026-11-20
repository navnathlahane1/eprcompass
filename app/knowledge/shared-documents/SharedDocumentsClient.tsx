'use client';

import { useEffect, useMemo, useState } from 'react';

type KnowledgeItem = {
  id: string;
  title: string;
  description: string | null;
  item_type: string;
  category_name: string | null;
  file_name: string | null;
  external_url: string | null;
};

type TelecallingUser = {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
};

type Share = {
  id: string;
  item_id: string;
  user_id: string;
  shared_at: string;
  item_title: string;
  item_type: string;
  user_name: string;
  user_email: string;
  user_role: string;
  shared_by_name: string;
};

function roleLabel(role: string) {
  return role.replace(/^tc_/, 'TC ').replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());
}

function dateLabel(value: string) {
  return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SharedDocumentsClient() {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [users, setUsers] = useState<TelecallingUser[]>([]);
  const [shares, setShares] = useState<Share[]>([]);
  const [itemId, setItemId] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [shareSearch, setShareSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge/shares');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load shared documents');
      setItems(data.items || []);
      setUsers(data.users || []);
      setShares(data.shares || []);
    } catch (error) {
      setMessage({ type: 'err', text: error instanceof Error ? error.message : 'Failed to load shared documents' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const existingForItem = useMemo(
    () => new Set(shares.filter(share => share.item_id === itemId).map(share => share.user_id)),
    [shares, itemId]
  );

  const visibleUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    return users.filter(user => !query || `${user.full_name || ''} ${user.email} ${user.role}`.toLowerCase().includes(query));
  }, [users, userSearch]);

  const visibleShares = useMemo(() => {
    const query = shareSearch.trim().toLowerCase();
    return shares.filter(share => !query || `${share.item_title} ${share.user_name} ${share.user_email} ${share.user_role}`.toLowerCase().includes(query));
  }, [shares, shareSearch]);

  const uniqueDocuments = new Set(shares.map(share => share.item_id)).size;
  const uniqueUsers = new Set(shares.map(share => share.user_id)).size;

  function toggleUser(userId: string) {
    if (existingForItem.has(userId)) return;
    setSelectedUsers(current => current.includes(userId) ? current.filter(id => id !== userId) : [...current, userId]);
  }

  function selectVisible() {
    const available = visibleUsers.filter(user => !existingForItem.has(user.id)).map(user => user.id);
    setSelectedUsers(current => Array.from(new Set([...current, ...available])));
  }

  async function assign() {
    if (!itemId || !selectedUsers.length) {
      setMessage({ type: 'err', text: 'Select a document and at least one Telecalling user.' });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/knowledge/shares', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, user_ids: selectedUsers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to share document');
      setMessage({ type: 'ok', text: `Document shared with ${data.created} user${data.created === 1 ? '' : 's'}.` });
      setSelectedUsers([]);
      await load();
    } catch (error) {
      setMessage({ type: 'err', text: error instanceof Error ? error.message : 'Unable to share document' });
    } finally {
      setSaving(false);
    }
  }

  async function revoke(share: Share) {
    if (!confirm(`Remove “${share.item_title}” from ${share.user_name}?`)) return;
    setBusyId(share.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/knowledge/shares/${share.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to revoke access');
      setShares(current => current.filter(row => row.id !== share.id));
      setMessage({ type: 'ok', text: 'Document access revoked.' });
    } catch (error) {
      setMessage({ type: 'err', text: error instanceof Error ? error.message : 'Unable to revoke access' });
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Shared Documents</h1>
        <p className="mt-1 text-sm text-slate-500">Control which Knowledge Hub documents each Telecalling user can access.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          ['Active shares', shares.length, 'text-cyan-300'],
          ['Documents shared', uniqueDocuments, 'text-violet-300'],
          ['Users with access', uniqueUsers, 'text-teal-300'],
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {message && (
        <div className={`rounded-lg border px-3 py-2.5 text-sm ${message.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-300'}`}>
          {message.text}
        </div>
      )}

      <section className="rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <div className="border-b border-slate-800/60 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-200">Share a document</h2>
          <p className="mt-0.5 text-xs text-slate-500">Choose one document and one or more recipients.</p>
        </div>
        <div className="grid gap-5 p-5 lg:grid-cols-2">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Document</label>
            <select value={itemId} onChange={event => { setItemId(event.target.value); setSelectedUsers([]); }}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500">
              <option value="">Select document…</option>
              {items.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
            </select>
            {itemId && (() => {
              const item = items.find(row => row.id === itemId);
              return item ? (
                <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                  <p className="text-xs font-medium text-slate-300">{item.item_type === 'training_material' ? 'Training material' : 'Document'}{item.category_name ? ` · ${item.category_name}` : ''}</p>
                  {item.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.description}</p>}
                </div>
              ) : null;
            })()}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Telecalling users</label>
              <div className="flex gap-3 text-[11px]">
                <button type="button" onClick={selectVisible} disabled={!itemId} className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40">Select available</button>
                <button type="button" onClick={() => setSelectedUsers([])} className="text-slate-500 hover:text-slate-300">Clear</button>
              </div>
            </div>
            <input value={userSearch} onChange={event => setUserSearch(event.target.value)} placeholder="Search name, email or role…"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500" />
            <div className="max-h-56 space-y-1 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-2">
              {visibleUsers.map(user => {
                const alreadyShared = existingForItem.has(user.id);
                return (
                  <label key={user.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${alreadyShared ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-800/60'}`}>
                    <input type="checkbox" checked={alreadyShared || selectedUsers.includes(user.id)} disabled={!itemId || alreadyShared}
                      onChange={() => toggleUser(user.id)} className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-600 focus:ring-cyan-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-200">{user.full_name || user.email}</p>
                      <p className="truncate text-[11px] text-slate-500">{user.email} · {roleLabel(user.role)}</p>
                    </div>
                    {alreadyShared && <span className="text-[10px] text-emerald-400">Shared</span>}
                  </label>
                );
              })}
              {!loading && visibleUsers.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No users found.</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-800/60 px-5 py-4">
          <p className="text-xs text-slate-500">{selectedUsers.length} recipient{selectedUsers.length === 1 ? '' : 's'} selected</p>
          <button onClick={assign} disabled={saving || !itemId || !selectedUsers.length}
            className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50">
            {saving ? 'Sharing…' : 'Share Document'}
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Current access</h2>
            <p className="mt-0.5 text-xs text-slate-500">Every active document-to-user assignment.</p>
          </div>
          <input value={shareSearch} onChange={event => setShareSearch(event.target.value)} placeholder="Search shares…"
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:w-64" />
        </div>
        {loading ? (
          <p className="py-14 text-center text-sm text-slate-500">Loading shared documents…</p>
        ) : visibleShares.length === 0 ? (
          <p className="py-14 text-center text-sm text-slate-500">No shared documents found.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {visibleShares.map(share => (
              <div key={share.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[1.2fr_1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-200">{share.item_title}</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">{share.item_type === 'training_material' ? 'Training material' : 'Document'}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-300">{share.user_name}</p>
                  <p className="truncate text-[11px] text-slate-500">{share.user_email} · {roleLabel(share.user_role)}</p>
                  <p className="mt-0.5 text-[10px] text-slate-600">Shared by {share.shared_by_name} · {dateLabel(share.shared_at)}</p>
                </div>
                <button onClick={() => revoke(share)} disabled={busyId === share.id}
                  className="rounded-lg border border-rose-500/20 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50">
                  {busyId === share.id ? 'Removing…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
