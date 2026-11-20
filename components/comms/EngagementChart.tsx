'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#60a5fa', twitter: '#38bdf8', facebook: '#818cf8',
  instagram: '#f472b6', youtube: '#f87171', tiktok: '#e2e8f0',
  google_business: '#34d399', other: '#94a3b8',
};

interface PlatformMetric {
  platform:        string;
  followers:       number;
  reach:           number;
  impressions:     number;
  engagement_rate: number;
}

type Metric = 'followers' | 'reach' | 'impressions' | 'engagement_rate';

interface Props {
  data:    PlatformMetric[];
  metric?: Metric;
  height?: number;
}

const METRIC_LABELS: Record<Metric, string> = {
  followers:       'Followers',
  reach:           'Reach (30d)',
  impressions:     'Impressions (30d)',
  engagement_rate: 'Engagement Rate %',
};

function fmt(v: number, metric: Metric) {
  if (metric === 'engagement_rate') return `${v.toFixed(2)}%`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

export default function EngagementChart({ data, metric = 'followers', height = 220 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-600">
        No data yet.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="platform"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={p => p.charAt(0).toUpperCase() + p.slice(1)}
        />
        <YAxis
          tickFormatter={(v) => fmt(v, metric)}
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
        <Tooltip
          contentStyle={{ background: '#0c1022', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8', textTransform: 'capitalize' }}
          formatter={(v: number) => [fmt(v, metric), METRIC_LABELS[metric]]}
        />
        <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map(entry => (
            <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] ?? '#94a3b8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
