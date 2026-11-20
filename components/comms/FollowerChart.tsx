'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const PLATFORM_COLORS: Record<string, string> = {
  linkedin:        '#60a5fa',
  twitter:         '#38bdf8',
  facebook:        '#818cf8',
  instagram:       '#f472b6',
  youtube:         '#f87171',
  tiktok:          '#e2e8f0',
  google_business: '#34d399',
  other:           '#94a3b8',
};

interface DataPoint {
  date: string;
  [platform: string]: string | number;
}

interface Props {
  data:      DataPoint[];
  platforms: string[];
  height?:   number;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function FollowerChart({ data, platforms, height = 280 }: Props) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-slate-600">
        No follower data yet — connect a platform and run a sync.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={{ stroke: '#1e293b' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatK}
          tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          contentStyle={{ background: '#0c1022', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }}
          labelStyle={{ color: '#94a3b8' }}
          formatter={(value: number, name: string) => [value.toLocaleString(), name]}
          labelFormatter={formatDate}
        />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value) => <span style={{ color: '#94a3b8', textTransform: 'capitalize' }}>{value}</span>}
        />
        {platforms.map(p => (
          <Line
            key={p}
            type="monotone"
            dataKey={p}
            stroke={PLATFORM_COLORS[p] ?? '#94a3b8'}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
