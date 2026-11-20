'use client';

/**
 * /taskmanager/calendar
 * Regulatory Deadline Calendar — CPCB/SPCB events + live client overlay.
 */
import { useEffect, useState, useCallback } from 'react';

interface RegulatoryEvent {
  date: string; title: string; category: string;
  type: string; authority: string; description: string;
  days_to: number; past: boolean;
  clients_affected: number; not_ready: number;
}
interface Stats {
  upcoming_30d: number; upcoming_90d: number;
  critical_events: number; this_month_filings_due: number; this_month_clients: number;
}

const TYPE_STYLE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  critical:  { label: 'Critical',  bg: 'bg-rose-500/15',    text: 'text-rose-400',    border: 'border-l-rose-500'    },
  mandatory: { label: 'Mandatory', bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-l-orange-500'  },
  periodic:  { label: 'Periodic',  bg: 'bg-blue-500/8',     text: 'text-blue-400',    border: 'border-l-blue-500'    },
  advisory:  { label: 'Advisory',  bg: 'bg-slate-700/20',   text: 'text-slate-400',   border: 'border-l-slate-600'   },
};
const CAT_COLOR: Record<string, string> = {
  all: 'text-slate-400', plastic: 'text-blue-400', ewaste: 'text-purple-400',
  battery: 'text-amber-400', tyre: 'text-green-400', used_oil: 'text-orange-400',
  hazardous: 'text-rose-400',
};

function daysLabel(d: number) {
  if (d < 0)  return `${Math.abs(d)}d ago`;
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d < 7)  return `${d}d`;
  if (d < 30) return `${Math.round(d / 7)}w`;
  return `${Math.round(d / 30)}mo`;
}
function daysColor(d: number) {
  if (d < 0)   return 'text-slate-600';
  if (d <= 7)  return 'text-rose-400';
  if (d <= 30) return 'text-orange-400';
  if (d <= 60) return 'text-amber-400';
  return 'text-slate-400';
}

export default function RegulatoryCalendarPage() {
  const [events,   setEvents]   = useState<RegulatoryEvent[]>([]);
  const [upcoming, setUpcoming] = useState<RegulatoryEvent[]>([]);
  const [stats,    setStats]    = useState<Stats | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [fType,    setFType]    = useState('');
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/taskmanager/calendar');
    if (res.ok) {
      const d = await res.json();
      setEvents(d.events ?? []);
      setUpcoming(d.upcoming ?? []);
      setStats(d.stats ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const displayed = events.filter(e => {
    if (!showPast && e.past) return false;
    if (fType && e.type !== fType) return false;
    return true;
  }).sort((a, b) => a.days_to - b.days_to);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Regulatory Deadline Calendar</h1>
          <p className="text-sm text-slate-400 mt-0.5">CPCB/SPCB statutory deadlines overlaid with live client compliance data</p>
        </div>
        <button onClick={load} disabled={loading}
          className="h-8 px-3 rounded-lg border border-slate-700/60 bg-slate-800 text-[11px] text-slate-400 hover:text-slate-200 transition disabled:opacity-50">
          {loading ? 'Loading…' : '↺ Refresh'}
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { label: 'In 30 days',      v: stats.upcoming_30d,          color: stats.upcoming_30d > 0 ? 'text-orange-400' : 'text-slate-600'  },
            { label: 'In 90 days',      v: stats.upcoming_90d,          color: 'text-slate-300'   },
            { label: 'Critical Events', v: stats.critical_events,       color: stats.critical_events > 0 ? 'text-rose-400' : 'text-slate-600' },
            { label: 'Filings Due (mo)', v: stats.this_month_filings_due, color: 'text-amber-400' },
            { label: 'Clients Affected', v: stats.this_month_clients,   color: 'text-blue-400'    },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-3 text-center">
              <p className="text-[10px] text-slate-500 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming strip (next 90 days) */}
      {!loading && upcoming.length > 0 && (
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/3 px-4 py-3 space-y-2">
          <p className="text-xs font-semibold text-orange-400/80">Upcoming in 90 days</p>
          <div className="flex flex-wrap gap-2">
            {upcoming.slice(0, 6).map((e, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-700/40 bg-slate-900/60 px-3 py-1.5">
                <span className={`text-xs font-bold tabular-nums ${daysColor(e.days_to)}`}>{daysLabel(e.days_to)}</span>
                <span className="text-[11px] text-slate-400 truncate max-w-[160px]">{e.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        {Object.entries(TYPE_STYLE).map(([key, s]) => (
          <button key={key} onClick={() => setFType(fType === key ? '' : key)}
            className={`h-7 px-3 rounded-full text-[11px] font-semibold transition border ${fType === key ? `${s.bg} border-transparent ${s.text}` : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'}`}>
            {s.label}
          </button>
        ))}
        <button onClick={() => setShowPast(!showPast)}
          className={`h-7 px-3 rounded-full text-[11px] font-medium transition border ${showPast ? 'bg-slate-700/40 border-slate-600/40 text-slate-300' : 'bg-slate-800/60 border-slate-700/40 text-slate-500 hover:text-slate-300'}`}>
          {showPast ? 'Hide past' : 'Show past'}
        </button>
        <span className="ml-auto text-[11px] text-slate-600">{displayed.length} events</span>
      </div>

      {/* Events */}
      {loading && <div className="space-y-2">{[...Array(6)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-slate-800/50 animate-pulse" />)}</div>}

      {!loading && displayed.length > 0 && (
        <div className="space-y-2">
          {displayed.map((ev, i) => {
            const ts = TYPE_STYLE[ev.type] ?? TYPE_STYLE.advisory;
            return (
              <div key={i} className={`rounded-xl border border-l-4 border-slate-800/60 ${ts.border} px-4 py-3 ${ev.past ? 'opacity-50' : ev.type === 'critical' ? ts.bg : ''}`}>
                <div className="flex flex-wrap items-start gap-3">
                  {/* Date */}
                  <div className="shrink-0 text-center min-w-[56px]">
                    <p className={`text-lg font-bold tabular-nums leading-none ${ev.past ? 'text-slate-600' : daysColor(ev.days_to)}`}>
                      {daysLabel(ev.days_to)}
                    </p>
                    <p className="text-[10px] text-slate-600 mt-1">
                      {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-xs font-bold ${ev.past ? 'text-slate-500' : 'text-slate-200'}`}>{ev.title}</span>
                      <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 ${ts.bg} ${ts.text}`}>{ts.label}</span>
                      <span className={`text-[10px] font-medium ${CAT_COLOR[ev.category] ?? 'text-slate-500'}`}>{ev.authority}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">{ev.description}</p>
                  </div>

                  {/* Client impact */}
                  {ev.clients_affected > 0 && !ev.past && (
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-semibold text-slate-300">{ev.clients_affected} client{ev.clients_affected !== 1 ? 's' : ''}</p>
                      {ev.not_ready > 0 && (
                        <p className="text-[10px] text-rose-400">{ev.not_ready} not ready</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
