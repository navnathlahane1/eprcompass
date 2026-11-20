'use client';

import { useState, useMemo } from 'react';
import VaultAccountCard, { AccountCardData } from '@/components/comms/VaultAccountCard';

const PLATFORMS = ['linkedin','twitter','facebook','instagram','youtube','tiktok','pinterest','threads','google_business','other'];
const PLATFORM_LABELS: Record<string, string> = {
  linkedin:'LinkedIn', twitter:'X / Twitter', facebook:'Facebook', instagram:'Instagram',
  youtube:'YouTube', tiktok:'TikTok', pinterest:'Pinterest', threads:'Threads',
  google_business:'Google Business', other:'Other',
};
const ENTITIES = ['neubrain','ecovijay_growth','eco_vijay_global','eco_vijay_events','eco_vijay_academy'];
const ENTITY_LABELS: Record<string, string> = {
  neubrain:'Neubrain', ecovijay_growth:'EPR Compass', eco_vijay_global:'EPR Compass',
  eco_vijay_events:'EPR Compass Events', eco_vijay_academy:'EPR Compass Academy',
};

interface Props {
  initialAccounts: AccountCardData[];
  userRole: string;
}

export default function VaultClient({ initialAccounts, userRole }: Props) {
  const [search, setSearch]     = useState('');
  const [platform, setPlatform] = useState('');
  const [entity, setEntity]     = useState('');
  const [status, setStatus]     = useState('');

  const filtered = useMemo(() => {
    return initialAccounts.filter(a => {
      if (platform && a.platform !== platform) return false;
      if (entity   && a.brand_entity !== entity) return false;
      if (status   && a.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          a.display_name.toLowerCase().includes(q) ||
          (a.handle ?? '').toLowerCase().includes(q) ||
          a.tags.some(t => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [initialAccounts, search, platform, entity, status]);

  const selectCls = 'rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          placeholder="Search accounts…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
        />
        <select value={platform} onChange={e => setPlatform(e.target.value)} className={selectCls}>
          <option value="">All Platforms</option>
          {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>)}
        </select>
        <select value={entity} onChange={e => setEntity(e.target.value)} className={selectCls}>
          <option value="">All Entities</option>
          {ENTITIES.map(e => <option key={e} value={e}>{ENTITY_LABELS[e]}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)} className={selectCls}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="archived">Archived</option>
        </select>
        {(search || platform || entity || status) && (
          <button
            onClick={() => { setSearch(''); setPlatform(''); setEntity(''); setStatus(''); }}
            className="text-xs text-slate-600 hover:text-slate-300 transition px-2 py-2"
          >
            Clear
          </button>
        )}
      </div>

      {/* Count */}
      <p className="text-xs text-slate-600">
        {filtered.length} account{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== initialAccounts.length ? ` (filtered from ${initialAccounts.length})` : ''}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-12 text-center">
          <p className="text-sm text-slate-500">No accounts match your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(account => (
            <VaultAccountCard key={account.id} account={account} />
          ))}
        </div>
      )}
    </div>
  );
}
