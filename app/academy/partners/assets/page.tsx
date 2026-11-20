'use client';

import { useState } from 'react';

const ASSET_KITS: { partner: string; partnerId: string; driveFolderLink: string; assets: { name: string; format: string; status: string; customised: boolean }[] }[] = [];

const MASTER_ASSETS = [
  { name: 'Program Flyer — EPR Awareness Bootcamp', format: '.docx', desc: 'Customised per partner with name & contact' },
  { name: 'Program Flyer — Foundation Course',       format: '.docx', desc: 'Customised per partner with name & contact' },
  { name: 'Program Flyer — CEPC 3-Month Program',   format: '.docx', desc: 'Silver+ only' },
  { name: 'Sales Pitch Deck (12 slides)',             format: '.pptx', desc: 'Partner slide updated with photo & bio' },
  { name: 'Social Media Post Kit (30 posts)',         format: '.docx', desc: 'Bio + referral link updated per partner' },
  { name: 'Email Campaign Sequences (18 emails)',     format: '.docx', desc: 'Sender name updated' },
  { name: 'Ad Creatives — 15 Images',                format: '.png',  desc: 'EPR Compass branded (co-brand in Month 2)' },
  { name: 'WhatsApp Broadcast Templates (3)',         format: '.txt',  desc: 'Partner name in sign-off' },
  { name: 'Email Header Banner',                      format: '.png',  desc: '600×200px shared brand' },
  { name: 'EPR Compliance Checklist (Lead Magnet)',   format: '.pdf',  desc: 'Download link per partner' },
  { name: 'Co-branded Certificate Template',          format: '.docx', desc: 'Issued on T3 completion' },
  { name: 'LinkedIn Badge — EPR Certified Trainer',  format: '.png',  desc: 'Issued on T3 completion' },
];

export default function AssetsPage() {
  const [view, setView] = useState<'by-partner' | 'master'>('by-partner');

  const totalReady = ASSET_KITS.flatMap(k => k.assets).filter(a => a.status === 'Ready').length;
  const totalAssets = ASSET_KITS.flatMap(k => k.assets).length;
  const pendingPartners = ASSET_KITS.filter(k => k.assets.some(a => a.status === 'Pending')).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Marketing Asset Kits</h1>
          <p className="mt-0.5 text-sm text-slate-500">Co-branded marketing materials for all partner trainers.</p>
        </div>
        <div className="flex rounded-lg border border-slate-700 overflow-hidden">
          <button onClick={() => setView('by-partner')}
            className={`px-3 py-2 text-xs font-medium transition ${view === 'by-partner' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            By Partner
          </button>
          <button onClick={() => setView('master')}
            className={`px-3 py-2 text-xs font-medium transition ${view === 'master' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            Master Asset List
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Assets Delivered</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{totalReady}/{totalAssets}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Partners with Kits</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">{ASSET_KITS.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pending Partners</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{pendingPartners}</p>
        </div>
      </div>

      {view === 'by-partner' ? (
        <div className="space-y-4">
          {ASSET_KITS.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
          )}
          {ASSET_KITS.map(kit => {
            const ready = kit.assets.filter(a => a.status === 'Ready').length;
            const pct = Math.round((ready / kit.assets.length) * 100);
            return (
              <div key={kit.partnerId} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{kit.partner}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{kit.partnerId}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">{ready}/{kit.assets.length} ready</span>
                    <a href={kit.driveFolderLink} className="rounded px-2 py-1 text-[10px] font-semibold text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/10 transition">
                      Google Drive
                    </a>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" style={{ width: `${pct}%` }} />
                </div>
                <div className="space-y-1.5">
                  {kit.assets.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-lg bg-slate-900/30 px-3 py-2">
                      <div className={`h-2 w-2 rounded-full shrink-0 ${a.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500/60'}`} />
                      <span className="flex-1 text-xs text-slate-300 truncate">{a.name}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{a.format}</span>
                      <span className={`text-[10px] ${a.customised ? 'text-indigo-400' : 'text-slate-600'}`}>
                        {a.customised ? 'co-branded' : 'standard'}
                      </span>
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold shrink-0 ${a.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
                        {a.status}
                      </span>
                    </div>
                  ))}
                </div>
                {kit.assets.some(a => a.status === 'Pending') && (
                  <button className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition">
                    Complete & Deliver Kit
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Master Asset Template List</h2>
          <p className="text-xs text-slate-500">All assets are prepared from these master templates, then co-branded per partner.</p>
          <div className="space-y-2">
            {MASTER_ASSETS.map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/30 px-4 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-200">{a.name}</p>
                  <p className="text-[10px] text-slate-500">{a.desc}</p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 shrink-0">{a.format}</span>
                <button className="shrink-0 rounded px-2 py-1 text-[10px] text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition">
                  Edit Master
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

