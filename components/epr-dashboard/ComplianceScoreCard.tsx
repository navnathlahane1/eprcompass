'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ComplianceScoreResult, EprType } from '@/lib/epr/eprDashboardService';

interface TrendPoint { financial_year: string; score: number; computed_at: string }

interface Props {
  score: Omit<ComplianceScoreResult, 'trend'> & { trend?: TrendPoint[] };
}

const BADGE_STYLES: Record<string, string> = {
  Compliant:       'bg-emerald-100 text-emerald-800 border-emerald-300',
  'At Risk':       'bg-amber-100 text-amber-800 border-amber-300',
  'Non-Compliant': 'bg-red-100 text-red-800 border-red-300',
};

const BADGE_RING: Record<string, string> = {
  Compliant:       '#10b981',
  'At Risk':       '#f59e0b',
  'Non-Compliant': '#ef4444',
};

const DONUT_COLORS: Record<EprType, string> = {
  PLASTIC:  '#6366f1',
  EWASTE:   '#f59e0b',
  BATTERY:  '#10b981',
  USED_OIL: '#3b82f6',
  TYRE:     '#8b5cf6',
};

export default function ComplianceScoreCard({ score }: Props) {
  const { composite, badge, byType, trend = [] } = score;
  const ringColor = BADGE_RING[badge] ?? '#6b7280';

  const donutData = Object.entries(byType).map(([type, val]) => ({
    name: type,
    value: Math.max(0.1, val as number), // avoid 0-sized arcs
  }));

  const trendData = (trend ?? []).map((t) => ({
    fy: t.financial_year,
    Score: Number(t.score),
  }));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        {/* Score gauge */}
        <div className="flex flex-col items-center">
          <h2 className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
            Compliance Score
          </h2>
          <div className="relative h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'score', value: composite },
                    { name: 'gap',   value: Math.max(0, 100 - composite) },
                  ]}
                  cx="50%"
                  cy="50%"
                  startAngle={220}
                  endAngle={-40}
                  innerRadius={46}
                  outerRadius={60}
                  dataKey="value"
                  strokeWidth={0}
                >
                  <Cell fill={ringColor} />
                  <Cell fill="#f3f4f6" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {composite.toFixed(1)}
              </span>
              <span className="text-xs text-gray-500">/ 100</span>
            </div>
          </div>
          <span
            className={`mt-2 rounded-full border px-3 py-0.5 text-xs font-semibold ${BADGE_STYLES[badge] ?? ''}`}
          >
            {badge}
          </span>
        </div>

        {/* Donut by type */}
        <div>
          <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">By EPR Type</p>
          <div className="h-36 w-36">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} innerRadius={38} outerRadius={56} dataKey="value" strokeWidth={0}>
                  {donutData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={DONUT_COLORS[entry.name as EprType] ?? '#6b7280'}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 space-y-0.5">
            {donutData.map((d) => (
              <li key={d.name} className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: DONUT_COLORS[d.name as EprType] ?? '#6b7280' }}
                />
                {d.name}
                <span className="ml-auto font-semibold">{d.value.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Trend line */}
        {trendData.length > 0 && (
          <div className="flex-1 min-w-[180px]">
            <p className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-400">Score Trend</p>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="fy" tick={{ fontSize: 9 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip formatter={(v: number) => `${v.toFixed(1)}`} />
                  <Line
                    type="monotone"
                    dataKey="Score"
                    stroke={ringColor}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
