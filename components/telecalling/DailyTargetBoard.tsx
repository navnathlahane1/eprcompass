'use client';

interface Props {
  todayCallCount: number;
  connectedCalls: number;
  notRespondedCalls: number;
  contactRate: number;
  pendingFollowupsCount: number;
  overdueCount: number;
  dailyTarget?: number;
  streak?: number;
}

function Ring({ value, target, label, color }: { value: number; target: number; label: string; color: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(target, 1)) * 100));
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  const stroke =
    color === 'teal'  ? '#14b8a6' :
    color === 'amber' ? '#f59e0b' :
    color === 'rose'  ? '#f43f5e' :
    '#8b5cf6';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-16 h-16">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={r} fill="none" stroke="#1e293b" strokeWidth="6" />
          <circle
            cx="36" cy="36" r={r} fill="none"
            stroke={stroke} strokeWidth="6"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-200">{value}<span className="text-slate-500">/{target}</span></span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 2) return null;
  const emoji = streak >= 7 ? '🔥' : streak >= 3 ? '⚡' : '✨';
  return (
    <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5">
      <span className="text-base">{emoji}</span>
      <div>
        <div className="text-xs font-bold text-amber-300">{streak}-day streak!</div>
        <div className="text-xs text-amber-500/80">Keep it going</div>
      </div>
    </div>
  );
}

export default function DailyTargetBoard({
  todayCallCount,
  connectedCalls,
  notRespondedCalls,
  contactRate,
  pendingFollowupsCount,
  overdueCount,
  dailyTarget = 40,
  streak = 0,
}: Props) {
  const pct = Math.min(100, Math.round((todayCallCount / dailyTarget) * 100));
  const remaining = Math.max(0, dailyTarget - todayCallCount);

  let statusColor = 'text-teal-400';
  let statusLabel = 'On track';
  if (pct < 40) { statusColor = 'text-red-400'; statusLabel = 'Behind target'; }
  else if (pct < 70) { statusColor = 'text-amber-400'; statusLabel = 'Getting there'; }
  else if (pct >= 100) { statusColor = 'text-green-400'; statusLabel = 'Target hit! 🎉'; }

  return (
    <div className="bg-slate-900/60 rounded-xl border border-slate-700/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-slate-100">Today's Target</h2>
        <span className={`text-xs font-semibold ${statusColor}`}>{statusLabel}</span>
      </div>

      {/* Main progress bar */}
      <div className="mb-4">
        <div className="flex items-end justify-between mb-1.5">
          <div className="text-3xl font-bold text-slate-100">
            {todayCallCount}
            <span className="text-base font-normal text-slate-500"> / {dailyTarget} calls</span>
          </div>
          <span className="text-sm font-medium text-slate-400">{pct}%</span>
        </div>
        <div className="h-2.5 bg-slate-700/40 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${pct >= 100 ? 'bg-green-500' : pct >= 70 ? 'bg-teal-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {remaining > 0 && (
          <p className="text-xs text-slate-500 mt-1">{remaining} more calls to hit today's target</p>
        )}
      </div>

      {/* Rings: Connected / Not Responded / Contact Rate */}
      <div className="flex items-center justify-around py-3 border-t border-slate-800">
        <Ring value={connectedCalls} target={todayCallCount || 1} label="Connected" color="teal" />
        <Ring value={notRespondedCalls} target={todayCallCount || 1} label="Not Responded" color="rose" />
        <Ring value={contactRate} target={100} label="Contact rate %" color="amber" />
      </div>

      {/* Alerts + streak */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
        {overdueCount > 0 && (
          <a href="/telecalling/followups" className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-1.5 hover:bg-red-500/15 transition-colors">
            <span className="text-red-400 text-sm">⚠</span>
            <div>
              <div className="text-xs font-semibold text-red-300">{overdueCount} overdue follow-up{overdueCount > 1 ? 's' : ''}</div>
              <div className="text-xs text-red-500/80">Tap to view</div>
            </div>
          </a>
        )}
        {pendingFollowupsCount > 0 && overdueCount === 0 && (
          <a href="/telecalling/followups" className="flex items-center gap-1.5 bg-teal-500/10 border border-teal-500/20 rounded-lg px-3 py-1.5 hover:bg-teal-500/15 transition-colors">
            <span className="text-teal-400 text-sm">📅</span>
            <div>
              <div className="text-xs font-semibold text-teal-300">{pendingFollowupsCount} follow-up{pendingFollowupsCount > 1 ? 's' : ''} scheduled</div>
              <div className="text-xs text-teal-500/80">Tap to view</div>
            </div>
          </a>
        )}
        <StreakBadge streak={streak} />
      </div>
    </div>
  );
}
