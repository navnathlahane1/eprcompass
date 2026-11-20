'use client';

const MY_ASSETS: { name: string; format: string; status: string; customised: boolean; desc: string }[] = [];

const USAGE_TIPS = [
  { asset: 'Program Flyer', tip: 'Share in WhatsApp EHS groups and as a PDF attachment in email outreach.' },
  { asset: 'Social Media Kit', tip: 'Post 3–5 times per week. Lead with the regulatory urgency angle.' },
  { asset: 'Email Sequences', tip: '18 pre-written emails. Send the first sequence within 24 hrs of certification.' },
  { asset: 'WhatsApp Templates', tip: 'Broadcast to your professional contacts — personalise the first message.' },
  { asset: 'Sales Pitch Deck', tip: 'Use in 1-on-1 demos with EHS managers, CAs, or compliance heads.' },
  { asset: 'Lead Magnet PDF', tip: 'Share the compliance checklist to capture email leads — EPR compliance is immediate pain.' },
];

export default function MyAssetsPage() {
  const ready = MY_ASSETS.filter(a => a.status === 'Ready').length;
  const driveFolderLink = '#';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">My Marketing Assets</h1>
          <p className="mt-0.5 text-sm text-slate-500">Co-branded marketing materials prepared for you by EPR Compass.</p>
        </div>
        <a href={driveFolderLink}
          className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          Open Google Drive Folder
        </a>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Assets Ready</p>
          <p className="mt-1 text-2xl font-bold text-emerald-400">{ready}/{MY_ASSETS.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Co-Branded</p>
          <p className="mt-1 text-2xl font-bold text-indigo-400">{MY_ASSETS.filter(a => a.customised).length}</p>
        </div>
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide">Pending</p>
          <p className="mt-1 text-2xl font-bold text-amber-400">{MY_ASSETS.filter(a => a.status === 'Pending').length}</p>
        </div>
      </div>

      {/* Asset list */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-2">
        <h2 className="text-sm font-semibold text-slate-200 mb-3">Your Asset Kit</h2>
        {MY_ASSETS.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {MY_ASSETS.map((a, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-800/60 bg-slate-900/30 px-4 py-3">
            <div className={`h-2 w-2 rounded-full shrink-0 ${a.status === 'Ready' ? 'bg-emerald-500' : 'bg-amber-500/60'}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-200 truncate">{a.name}</p>
              <p className="text-[10px] text-slate-500">{a.desc}</p>
            </div>
            <span className="text-[10px] font-mono text-slate-600 shrink-0">{a.format}</span>
            {a.customised && <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] bg-indigo-500/15 text-indigo-400">co-branded</span>}
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold ${a.status === 'Ready' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
              {a.status}
            </span>
            {a.status === 'Ready' && (
              <button className="shrink-0 rounded px-2 py-1 text-[10px] text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/10 transition">
                Download
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Usage Tips */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">How to Use Your Assets</h2>
        <div className="space-y-2">
          {USAGE_TIPS.map((t, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className="shrink-0 w-28 font-semibold text-indigo-300">{t.asset}</span>
              <span className="text-slate-400">{t.tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
