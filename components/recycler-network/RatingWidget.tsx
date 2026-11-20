'use client';

import { memo } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip,
} from 'recharts';
import { ratingToBadge } from '@/lib/recyclerNetwork/recyclerNetworkService';

interface RatingWidgetProps {
  timeliness: number;
  documentation: number;
  quantity_accuracy: number;
  compliance_score: number;
  responsiveness: number;
  overall_score: number;
  is_manual_override?: boolean;
  computed_at?: string;
}

const BADGE_COLORS: Record<string, string> = {
  Excellent: 'bg-green-100 text-green-700',
  Good:      'bg-lime-100 text-lime-700',
  Average:   'bg-amber-100 text-amber-700',
  Poor:      'bg-red-100 text-red-700',
  Suspended: 'bg-gray-100 text-gray-600',
};

const DIMENSION_LABELS: Record<string, string> = {
  timeliness:         'Timeliness',
  documentation:      'Docs',
  quantity_accuracy:  'Qty Accuracy',
  compliance_score:   'Compliance',
  responsiveness:     'Response',
};

export const RatingWidget = memo(function RatingWidget({
  timeliness,
  documentation,
  quantity_accuracy,
  compliance_score,
  responsiveness,
  overall_score,
  is_manual_override,
  computed_at,
}: RatingWidgetProps) {
  const badge = ratingToBadge(overall_score);

  const radarData = [
    { dim: DIMENSION_LABELS.timeliness,        value: timeliness },
    { dim: DIMENSION_LABELS.documentation,     value: documentation },
    { dim: DIMENSION_LABELS.quantity_accuracy, value: quantity_accuracy },
    { dim: DIMENSION_LABELS.compliance_score,  value: compliance_score },
    { dim: DIMENSION_LABELS.responsiveness,    value: responsiveness },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Overall Rating</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{overall_score.toFixed(1)}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${BADGE_COLORS[badge]}`}>
            {badge}
          </span>
          {is_manual_override && (
            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">
              Admin Override
            </span>
          )}
        </div>
      </div>

      {/* Radar chart */}
      <div className="mt-4 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="70%">
            <PolarGrid />
            <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
            <Radar
              name="Score"
              dataKey="value"
              stroke="#16a34a"
              fill="#16a34a"
              fillOpacity={0.25}
            />
            <Tooltip
              formatter={(val: number) => [val.toFixed(1), 'Score']}
              contentStyle={{ fontSize: 12 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Dimension table */}
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {radarData.map((d) => (
          <div key={d.dim} className="flex items-center justify-between">
            <dt className="text-gray-500 dark:text-gray-400">{d.dim}</dt>
            <dd className="font-medium text-gray-900 dark:text-white">{d.value.toFixed(1)}</dd>
          </div>
        ))}
      </dl>

      {computed_at && (
        <p className="mt-3 text-right text-xs text-gray-400">
          Computed: {new Date(computed_at).toLocaleDateString()}
        </p>
      )}
    </div>
  );
});
