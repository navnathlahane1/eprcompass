'use client';

interface PostMetrics {
  id: string;
  platform: string;
  platform_post_id: string;
  posted_at: string | null;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number;
  synced_at: string;
}

interface Props { metrics: PostMetrics | null; isSyncing?: boolean; }

function Stat({ label, value, accent = false }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-center">
      <p className={`text-lg font-bold font-mono ${accent ? 'text-emerald-400' : 'text-slate-100'}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p className="text-[10px] text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

export default function PostMetricsPanel({ metrics, isSyncing }: Props) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
        <p className="text-xs font-semibold text-slate-400 mb-2">Post Performance</p>
        <p className="text-xs text-slate-600">
          {isSyncing
            ? 'Syncing…'
            : 'No metrics yet. Metrics are fetched on the next sync cycle after publishing.'}
        </p>
      </div>
    );
  }

  const totalEngagements = metrics.likes + metrics.comments + metrics.shares + metrics.saves + metrics.clicks;

  return (
    <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-400">Post Performance</p>
        <p className="text-[10px] text-slate-600">
          Last synced {new Date(metrics.synced_at).toLocaleString()}
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        <Stat label="Impressions"       value={metrics.impressions}     />
        <Stat label="Reach"             value={metrics.reach}           />
        <Stat label="Engagements"       value={totalEngagements}        />
        <Stat label="Eng. Rate"         value={`${metrics.engagement_rate.toFixed(2)}%`} accent />
        <Stat label="Likes"             value={metrics.likes}           />
        <Stat label="Comments"          value={metrics.comments}        />
        <Stat label="Shares / RTs"      value={metrics.shares}          />
        {metrics.clicks > 0   && <Stat label="Clicks"      value={metrics.clicks}      />}
        {metrics.saves > 0    && <Stat label="Saves"       value={metrics.saves}       />}
        {metrics.video_views > 0 && <Stat label="Video Views" value={metrics.video_views} />}
      </div>

      {metrics.platform_post_id && (
        <p className="text-[10px] text-slate-700 font-mono">
          Platform post ID: {metrics.platform_post_id}
        </p>
      )}
    </div>
  );
}
