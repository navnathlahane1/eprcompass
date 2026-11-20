'use client';

import Link from 'next/link';

const PLATFORM_COLORS: Record<string, string> = {
  linkedin:        'text-blue-400 bg-blue-500/10 border-blue-500/20',
  twitter:         'text-sky-400 bg-sky-500/10 border-sky-500/20',
  facebook:        'text-blue-500 bg-blue-600/10 border-blue-600/20',
  instagram:       'text-pink-400 bg-pink-500/10 border-pink-500/20',
  youtube:         'text-red-400 bg-red-500/10 border-red-500/20',
  tiktok:          'text-slate-300 bg-slate-600/20 border-slate-600/30',
  pinterest:       'text-rose-400 bg-rose-500/10 border-rose-500/20',
  threads:         'text-slate-300 bg-slate-600/20 border-slate-600/30',
  google_business: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  other:           'text-slate-400 bg-slate-700/20 border-slate-700/30',
};

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-slate-700/60 text-slate-400 border border-slate-700',
  in_review: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  approved:  'bg-sky-500/15 text-sky-400 border border-sky-500/30',
  scheduled: 'bg-violet-500/15 text-violet-400 border border-violet-500/30',
  published: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  archived:  'bg-slate-800/60 text-slate-600 border border-slate-800',
};

const PLATFORM_LABELS: Record<string, string> = {
  linkedin:'LinkedIn', twitter:'X/Twitter', facebook:'Facebook', instagram:'Instagram',
  youtube:'YouTube', tiktok:'TikTok', pinterest:'Pinterest', threads:'Threads',
  google_business:'Google Business', other:'Other',
};

export interface ContentCardData {
  id: string;
  platform: string;
  content_type: string;
  topic: string | null;
  hook: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  generated_by: string;
  profiles: { full_name: string | null } | null;
}

interface Props {
  item: ContentCardData;
  onApprove?: (id: string, action: string) => void;
  canApprove?: boolean;
}

export default function ContentCard({ item, onApprove, canApprove }: Props) {
  const platColor = PLATFORM_COLORS[item.platform] ?? PLATFORM_COLORS.other;

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-4 flex flex-col gap-3">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${platColor}`}>
            {PLATFORM_LABELS[item.platform]}
          </span>
          <span className="text-[10px] text-slate-600 capitalize">{item.content_type}</span>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status] ?? ''}`}>
          {item.status.replace('_', ' ')}
        </span>
      </div>

      {/* Hook preview */}
      {item.hook && (
        <p className="text-sm text-slate-300 leading-snug line-clamp-2">
          {item.hook}
        </p>
      )}
      {item.topic && !item.hook && (
        <p className="text-xs text-slate-500 italic">{item.topic}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
        <div className="text-[10px] text-slate-600">
          {item.profiles?.full_name && <span>{item.profiles.full_name} · </span>}
          {item.scheduled_at
            ? `Scheduled ${new Date(item.scheduled_at).toLocaleDateString()}`
            : new Date(item.created_at).toLocaleDateString()}
          {item.generated_by === 'ai' && (
            <span className="ml-1 rounded px-1 py-0.5 bg-emerald-500/10 text-emerald-600 font-mono text-[9px]">AI</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {canApprove && item.status === 'in_review' && (
            <>
              <button onClick={() => onApprove?.(item.id, 'reject')}
                className="rounded px-2 py-0.5 text-[10px] font-medium text-rose-400 hover:bg-rose-500/10 transition">
                Reject
              </button>
              <button onClick={() => onApprove?.(item.id, 'approve')}
                className="rounded px-2 py-0.5 text-[10px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition">
                Approve
              </button>
            </>
          )}
          {item.status === 'draft' && (
            <button onClick={() => onApprove?.(item.id, 'submit_review')}
              className="rounded px-2 py-0.5 text-[10px] font-medium text-amber-400 hover:bg-amber-500/10 transition">
              Submit
            </button>
          )}
          <Link href={`/comms/studio/content/${item.id}`}
            className="rounded px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:text-slate-300 transition">
            View →
          </Link>
        </div>
      </div>
    </div>
  );
}
