'use client';

import { useEffect, useState } from 'react';
import { urgencyToColor } from '@/lib/recyclerPortal/alertRequestService';
import { trackEvent } from '@/lib/analytics';

interface CpcbAlert {
  id: string;
  title: string;
  summary: string;
  issued_by: string;
  alert_type: string;
  epr_types: string[];
  affected_states: string[];
  urgency: string;
  effective_date: string | null;
  compliance_deadline: string | null;
  published_at: string;
  source_url: string | null;
  readAt: string | null;
  markedImportant: boolean;
}

export default function CpcbAlertsPage() {
  const [alerts, setAlerts] = useState<CpcbAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'important'>('unread');

  const load = () => {
    setLoading(true);
    const q = filter === 'unread' ? '?unread=true' : '';
    fetch(`/api/recycler-portal/cpcb-alerts${q}`)
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  async function markRead(alertId: string, important = false) {
    await fetch(`/api/recycler-portal/cpcb-alerts/${alertId}/read`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markedImportant: important }),
    });
    trackEvent('Recycler CPCB Alert Read', { marked_important: important });
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, readAt: new Date().toISOString(), markedImportant: important }
          : a
      )
    );
  }

  const displayed =
    filter === 'important' ? alerts.filter((a) => a.markedImportant) : alerts;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">CPCB & Regulatory Alerts</h1>
        <div className="flex gap-2">
          {(['unread', 'all', 'important'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition capitalize ${
                filter === f ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500 text-sm">No alerts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 transition ${
                alert.readAt ? 'bg-white border-gray-200' : 'bg-orange-50 border-orange-200'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Urgency bar */}
                <div
                  className={`w-1 h-full min-h-[40px] rounded-full flex-shrink-0 ${
                    alert.urgency === 'CRITICAL'
                      ? 'bg-red-500'
                      : alert.urgency === 'HIGH'
                      ? 'bg-orange-500'
                      : alert.urgency === 'MEDIUM'
                      ? 'bg-yellow-500'
                      : 'bg-blue-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${urgencyToColor(alert.urgency)}`}
                    >
                      {alert.urgency}
                    </span>
                    <span className="text-xs text-gray-500">{alert.issued_by}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(alert.published_at).toLocaleDateString('en-IN')}
                    </span>
                    {alert.markedImportant && (
                      <span className="text-xs text-yellow-600">⭐ Important</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{alert.title}</p>
                  {alert.summary && (
                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{alert.summary}</p>
                  )}
                  {alert.compliance_deadline && (
                    <p className="text-xs text-red-600 mt-0.5 font-medium">
                      Compliance deadline: {new Date(alert.compliance_deadline).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  {!alert.readAt && (
                    <button
                      onClick={() => markRead(alert.id, false)}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      Mark read
                    </button>
                  )}
                  {!alert.markedImportant && (
                    <button
                      onClick={() => markRead(alert.id, true)}
                      className="text-xs text-yellow-600 hover:text-yellow-700 underline"
                    >
                      ⭐ Important
                    </button>
                  )}
                  {alert.source_url && (
                    <a
                      href={alert.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Source ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
