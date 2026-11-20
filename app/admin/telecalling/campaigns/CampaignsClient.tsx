'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CampaignStatusBadge from '@/components/telecalling/CampaignStatusBadge';
import { useToast } from '@/lib/toast/ToastContext';

interface CampaignStats {
  total: number;
  connected: number;
  last_call_at: string | null;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  type?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  daily_call_limit?: number;
  created_at: string;
  _stats?: CampaignStats;
}

interface Props {
  initialCampaigns: Campaign[];
}

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CampaignsClient({ initialCampaigns }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', type: 'Outbound', daily_call_limit: '50' });
  const [saving, setSaving] = useState(false);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/telecalling/campaigns', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, daily_call_limit: parseInt(form.daily_call_limit) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Failed to create campaign', 'error');
      } else if (data.campaign) {
        setCampaigns((c) => [{ ...data.campaign, _stats: { total: 0, connected: 0, last_call_at: null } }, ...c]);
        setShowCreate(false);
        setForm({ name: '', description: '', type: 'Outbound', daily_call_limit: '50' });
        toast(`Campaign "${data.campaign.name}" created`, 'success');
      }
    } catch {
      toast('Network error — could not create campaign', 'error');
    }
    setSaving(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-100">Campaigns</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          New Campaign
        </button>
      </div>

      {/* ── Create modal ───────────────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-slate-900/60 rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-100">New Campaign</h2>
              <button onClick={() => setShowCreate(false)} className="text-slate-500 text-xl">&times;</button>
            </div>
            <form onSubmit={createCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                  >
                    <option>Outbound</option>
                    <option>Inbound</option>
                    <option>Mixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Daily call limit</label>
                  <input
                    type="number"
                    value={form.daily_call_limit}
                    onChange={(e) => setForm((f) => ({ ...f, daily_call_limit: e.target.value }))}
                    className="w-full border border-slate-700 rounded-lg px-3 py-2 text-sm bg-slate-900/60 text-slate-100"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-slate-700 text-slate-200 rounded-lg py-2 text-sm"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Creating…' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Campaign cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {campaigns.map((c) => {
          const stats = c._stats ?? { total: 0, connected: 0, last_call_at: null };
          const connectRate = stats.total > 0
            ? Math.round((stats.connected / stats.total) * 100)
            : null;

          return (
            <a
              key={c.id}
              href={`/admin/telecalling/campaigns/${c.id}`}
              className="bg-slate-900/60 rounded-xl border border-slate-800 p-5 hover:border-blue-700/50 transition-colors block"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-100 leading-snug">{c.name}</h3>
                <CampaignStatusBadge status={c.status} />
              </div>

              {c.description && (
                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{c.description}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-3">
                <span>{c.type || 'Outbound'}</span>
                {c.daily_call_limit && <span>· {c.daily_call_limit} calls/day</span>}
                {c.start_date && <span>· From {new Date(c.start_date).toLocaleDateString('en-IN')}</span>}
              </div>

              {/* ── Performance strip ─────────────────────────────────────── */}
              <div className="mt-auto pt-3 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-base font-bold text-slate-100 leading-none">
                    {stats.total.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Calls</p>
                </div>
                <div>
                  <p className="text-base font-bold text-emerald-400 leading-none">
                    {stats.connected.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Connected</p>
                </div>
                <div>
                  <p className="text-base font-bold text-blue-400 leading-none">
                    {connectRate !== null ? `${connectRate}%` : '—'}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Rate</p>
                </div>
              </div>

              {/* Last activity */}
              {stats.last_call_at && (
                <p className="mt-2 text-[10px] text-slate-500 text-right">
                  Last call {timeAgo(stats.last_call_at)}
                </p>
              )}
            </a>
          );
        })}

        {campaigns.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-500">
            No campaigns yet — create one to get started.
          </div>
        )}
      </div>
    </div>
  );
}
