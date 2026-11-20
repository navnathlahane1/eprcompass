'use client';

/**
 * EprKpiStrip — EPR workflow KPIs injected into the admin dashboard.
 * Fetches live counts from the EPR tables via /api/epr/dashboard-kpis.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ClipboardList, FileSearch, ShieldCheck } from 'lucide-react';

interface EprKpis {
  pending_filings: number;
  sla_breached: number;
  docs_awaiting_review: number;
  certificate_issued_this_month: number;
}

const TILES = [
  {
    key: 'pending_filings' as keyof EprKpis,
    label: 'Pending Filings',
    href: '/admin/epr-filing',
    color: 'border-amber-500/60',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    icon: ClipboardList,
  },
  {
    key: 'sla_breached' as keyof EprKpis,
    label: 'SLA Breached',
    href: '/admin/epr-filing',
    color: 'border-red-400',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    icon: AlertTriangle,
  },
  {
    key: 'docs_awaiting_review' as keyof EprKpis,
    label: 'Docs Awaiting Review',
    href: '/admin/epr-documents',
    color: 'border-blue-400',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    icon: FileSearch,
  },
  {
    key: 'certificate_issued_this_month' as keyof EprKpis,
    label: 'Certificates This Month',
    href: '/admin/epr-filing',
    color: 'border-green-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    icon: ShieldCheck,
  },
];

export default function EprKpiStrip() {
  const [kpis, setKpis] = useState<EprKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiUnavailable, setApiUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    // [UPGRADE] Single retry improves resilience for transient network/API cold-start failures.
    const loadKpis = async (attempt = 0) => {
      try {
        const response = await fetch('/api/epr/dashboard-kpis');
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            if (active) setApiUnavailable(true);
            return;
          }

          if (attempt < 1 && active) {
            retryTimer = setTimeout(() => {
              void loadKpis(1);
            }, 1200);
            return;
          }
          if (active) setApiUnavailable(true);
          return;
        }

        const data = await response.json();
        if (active && data) setKpis(data);
      } catch {
        if (attempt < 1 && active) {
          retryTimer = setTimeout(() => {
            void loadKpis(1);
          }, 1200);
          return;
        }
        if (active) setApiUnavailable(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadKpis();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  return (
    <section aria-label="EPR workflow KPIs">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">
        Filing operations
      </h2>
      {apiUnavailable ? (
        <p role="status" className="mb-3 text-xs text-amber-800">Filing metrics are unavailable for this session.</p>
      ) : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {TILES.map(tile => (
          <Link
            key={tile.key}
            href={tile.href}
            className={`flex min-w-0 items-center gap-3 rounded-lg border-l-2 ${tile.color} ${tile.bg} p-4 transition hover:brightness-95`}
            aria-label={tile.label}
          >
            <tile.icon className={`h-5 w-5 shrink-0 ${tile.text}`} aria-hidden="true" />
            <div>
              {loading ? (
                <div className="skeleton h-6 w-10" />
              ) : (
                <p className={`text-2xl font-bold ${tile.text}`}>
                  {apiUnavailable || !Number.isFinite(kpis?.[tile.key]) ? '--' : kpis![tile.key].toLocaleString('en-IN')}
                </p>
              )}
              <p className="text-xs text-zinc-600">{tile.label}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
