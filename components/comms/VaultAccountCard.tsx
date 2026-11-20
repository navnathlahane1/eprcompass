'use client';

import Link from 'next/link';

const PLATFORM_ICONS: Record<string, { icon: string; color: string; label: string }> = {
  linkedin:        { icon: 'M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20', label: 'LinkedIn' },
  twitter:         { icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20', label: 'X / Twitter' },
  facebook:        { icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z', color: 'text-blue-500 bg-blue-600/10 border-blue-600/20', label: 'Facebook' },
  instagram:       { icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01M6.5 20.5h11a3 3 0 003-3v-11a3 3 0 00-3-3h-11a3 3 0 00-3 3v11a3 3 0 003 3z', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20', label: 'Instagram' },
  youtube:         { icon: 'M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 00-1.95 1.96A29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z', color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'YouTube' },
  tiktok:          { icon: 'M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.67a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z', color: 'text-slate-300 bg-slate-600/20 border-slate-600/30', label: 'TikTok' },
  pinterest:       { icon: 'M12 0C5.37 0 0 5.37 0 12c0 5.08 3.16 9.44 7.64 11.2-.1-.97-.2-2.46.04-3.52.22-.96 1.47-6.24 1.47-6.24s-.38-.75-.38-1.87c0-1.75 1.02-3.07 2.28-3.07 1.07 0 1.6.8 1.6 1.77 0 1.08-.69 2.69-1.04 4.18-.3 1.25.61 2.26 1.83 2.26 2.19 0 3.88-2.31 3.88-5.64 0-2.95-2.12-5.01-5.15-5.01-3.51 0-5.57 2.63-5.57 5.35 0 1.06.41 2.2.92 2.82.1.12.11.23.08.35-.09.38-.3 1.25-.34 1.43-.05.22-.18.27-.41.16-1.54-.72-2.5-2.97-2.5-4.78 0-3.89 2.83-7.47 8.16-7.47 4.28 0 7.61 3.05 7.61 7.12 0 4.25-2.68 7.66-6.4 7.66-1.25 0-2.42-.65-2.82-1.41l-.77 2.87c-.28 1.07-1.03 2.41-1.53 3.23.06.02.12.03.18.04A12 12 0 0024 12 12 12 0 0012 0z', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20', label: 'Pinterest' },
  threads:         { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-11h2v6h-2zm0-4h2v2h-2z', color: 'text-slate-300 bg-slate-600/20 border-slate-600/30', label: 'Threads' },
  google_business: { icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z', color: 'text-teal-400 bg-teal-500/10 border-teal-500/20', label: 'Google Business' },
  other:           { icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM12 10.5h.008v.008H12V10.5zm-.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z', color: 'text-slate-400 bg-slate-600/20 border-slate-600/30', label: 'Other' },
};

const STATUS_STYLES: Record<string, string> = {
  active:   'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  dormant:  'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  archived: 'bg-slate-700/60 text-slate-500 border border-slate-700',
};

const ENTITY_LABELS: Record<string, string> = {
  neubrain:           'Neubrain',
  ecovijay_growth:    'EPR Compass',
  eco_vijay_global:   'EPR Compass',
  eco_vijay_events:   'EPR Compass Events',
  eco_vijay_academy:  'EPR Compass Academy',
};

export interface AccountCardData {
  id: string;
  platform: string;
  display_name: string;
  handle: string | null;
  status: string;
  brand_entity: string;
  region: string | null;
  account_type: string;
  tags: string[];
  owners?: Array<{ owner_role: string; profiles: { full_name: string | null } | null }>;
}

export default function VaultAccountCard({ account }: { account: AccountCardData }) {
  const plat = PLATFORM_ICONS[account.platform] ?? PLATFORM_ICONS.other;

  return (
    <Link href={`/comms/vault/${account.id}`} className="block group">
      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 transition-all duration-150 hover:border-emerald-500/30 hover:bg-[#0e1628]">
        {/* Top row: platform + status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${plat.color}`}>
            <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${plat.color.split(' ')[0]}`} fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d={plat.icon} />
            </svg>
          </div>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[account.status] ?? STATUS_STYLES.archived}`}>
            {account.status}
          </span>
        </div>

        {/* Name + handle */}
        <div className="mb-3">
          <p className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-300 transition-colors">
            {account.display_name}
          </p>
          {account.handle && (
            <p className="text-xs text-slate-500 truncate">@{account.handle.replace(/^@/, '')}</p>
          )}
        </div>

        {/* Metadata tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400">
            {ENTITY_LABELS[account.brand_entity] ?? account.brand_entity}
          </span>
          {account.region && (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400">
              {account.region}
            </span>
          )}
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 capitalize">
            {account.account_type.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Owners */}
        {account.owners && account.owners.length > 0 && (
          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-800/60">
            <svg viewBox="0 0 24 24" className="h-3 w-3 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-[10px] text-slate-600 truncate">
              {account.owners.map(o => o.profiles?.full_name ?? '—').join(' · ')}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
