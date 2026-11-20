'use client';

/**
 * ComplianceTimeline
 * ───────────────────
 * Visual timeline of EPR compliance notifications grouped by year/month.
 * Used on the listing page as an alternative "timeline" view.
 */

import { useState, useMemo } from 'react';
import Link                  from 'next/link';
import { Calendar, ChevronRight, FileText } from 'lucide-react';

interface TimelineNotif {
  id:             string;
  slug:           string;
  title:          string;
  published_date: string | null;
  epr_type:       string | null;
  document_type:  string | null;
  authority_name?: string;
  has_file?:      boolean;
}

interface Props {
  notifications: TimelineNotif[];
  maxYears?: number;
}

const EPR_DOT_COLORS: Record<string, string> = {
  'Plastic':   'bg-green-500',
  'E-Waste':   'bg-blue-500',
  'Battery':   'bg-yellow-500',
  'Tyre':      'bg-gray-500',
  'Used-Oil':  'bg-orange-500',
  'C&D':       'bg-red-500',
  'Hazardous': 'bg-purple-500',
};

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];

function groupByYearMonth(notifications: TimelineNotif[]) {
  const groups: Record<string, Record<number, TimelineNotif[]>> = {};

  for (const n of notifications) {
    if (!n.published_date) continue;
    const date  = new Date(n.published_date);
    const year  = date.getFullYear().toString();
    const month = date.getMonth(); // 0-11

    if (!groups[year])        groups[year] = {};
    if (!groups[year][month]) groups[year][month] = [];
    groups[year][month].push(n);
  }

  return groups;
}

export default function ComplianceTimeline({ notifications, maxYears = 5 }: Props) {
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const grouped = useMemo(() => groupByYearMonth(notifications), [notifications]);

  const sortedYears = Object.keys(grouped)
    .sort((a, b) => parseInt(b) - parseInt(a))
    .slice(0, maxYears);

  function toggleYear(year: string) {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else                 next.add(year);
      return next;
    });
  }

  if (notifications.length === 0) return null;

  // Auto-expand the most recent year
  const latestYear = sortedYears[0];

  return (
    <div className="space-y-4">
      {sortedYears.map((year) => {
        const isExpanded = expandedYears.has(year) || year === latestYear;
        const yearGroups = grouped[year];
        const totalInYear = Object.values(yearGroups).flat().length;
        const monthList   = Object.keys(yearGroups)
          .map(Number)
          .sort((a, b) => b - a);

        return (
          <div key={year} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Year header */}
            <button
              onClick={() => toggleYear(year)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-900 text-lg">{year}</h3>
                  <p className="text-xs text-gray-400">{totalInYear} notification{totalInYear !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>

            {/* Month groups */}
            {isExpanded && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {monthList.map((month) => {
                  const items = yearGroups[month];
                  return (
                    <div key={month} className="px-5 py-4">
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {MONTH_NAMES[month]}
                      </h4>

                      <div className="relative pl-5">
                        {/* Timeline line */}
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-gray-200" />

                        <div className="space-y-3">
                          {items.map((notif) => {
                            const dotColor = EPR_DOT_COLORS[notif.epr_type || ''] || 'bg-gray-400';
                            const dateStr  = notif.published_date
                              ? new Date(notif.published_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                              : '';

                            return (
                              <div key={notif.id} className="relative flex items-start gap-3 group">
                                {/* Dot */}
                                <div className={`absolute -left-3.5 top-1.5 w-3 h-3 rounded-full border-2 border-white ${dotColor} flex-shrink-0 z-10`} />

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <Link
                                      href={`/notifications/${notif.slug}`}
                                      className="text-sm text-gray-800 hover:text-blue-600 font-medium leading-snug transition-colors line-clamp-2">
                                      {notif.title}
                                    </Link>
                                    {notif.has_file && (
                                      <FileText className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
                                    )}
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                                    {dateStr && (
                                      <span className="text-xs text-gray-400">{dateStr}</span>
                                    )}
                                    {notif.epr_type && (
                                      <span className="text-xs text-gray-500">{notif.epr_type}</span>
                                    )}
                                    {notif.document_type && (
                                      <span className="text-xs text-gray-400">{notif.document_type}</span>
                                    )}
                                    {notif.authority_name && (
                                      <span className="text-xs text-blue-500">{notif.authority_name}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
