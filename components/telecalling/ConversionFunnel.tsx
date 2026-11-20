'use client';

// Feature 8: Conversion Funnel View
// Step funnel: Dialed → Connected → Interested → Demo → Converted

interface FunnelStage {
  label: string;
  count: number;
  color: string;
}

interface Props {
  stages: FunnelStage[];
  agentName?: string;
  campaignName?: string;
  period?: string;
}

function pct(a: number, b: number) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

export default function ConversionFunnel({ stages, agentName, campaignName, period }: Props) {
  const top = stages[0]?.count || 1;

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="font-semibold text-slate-100">Conversion Funnel</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {agentName && <span>{agentName} · </span>}
            {campaignName && <span>{campaignName} · </span>}
            {period || 'All time'}
          </p>
        </div>
        {stages.length > 0 && (
          <div className="text-right">
            <div className="text-lg font-bold text-teal-400">
              {pct(stages[stages.length - 1]?.count || 0, top)}%
            </div>
            <div className="text-xs text-slate-500">overall conversion</div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {stages.map((stage, i) => {
          const width = pct(stage.count, top);
          const dropPct = i > 0 ? pct(stage.count, stages[i - 1].count) : 100;

          return (
            <div key={stage.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-300">{stage.label}</span>
                <div className="flex items-center gap-3">
                  {i > 0 && (
                    <span className={`text-xs ${dropPct < 30 ? 'text-red-400' : dropPct < 60 ? 'text-amber-400' : 'text-teal-400'}`}>
                      {dropPct}% of prev
                    </span>
                  )}
                  <span className="text-sm font-bold text-slate-200 w-10 text-right">{stage.count}</span>
                </div>
              </div>
              <div className="h-7 bg-slate-800/60 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all duration-700 ${stage.color}`}
                  style={{ width: `${Math.max(width, 3)}%` }}
                />
                <div className="absolute inset-0 flex items-center px-3">
                  <span className="text-xs text-slate-300 font-medium">{width}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {stages.length === 0 && (
        <div className="text-center py-8 text-slate-500 text-sm">No call data yet</div>
      )}
    </div>
  );
}
