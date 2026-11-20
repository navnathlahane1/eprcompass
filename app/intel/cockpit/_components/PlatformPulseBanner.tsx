'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';

type PlatformPulse = {
  metrics: {
    total_insights: number;
  };
  insights: Array<{
    type: string;
    title: string;
    recommended_action?: string | null;
  }>;
  service_health: {
    enrichment: {
      total: number;
      completed: number;
      queued: number;
      processing: number;
      failed: number;
    };
    lead_verification: {
      total: number;
      valid: number;
    };
    outbound: {
      pending_approval: number;
      sent: number;
    };
  };
};

export default function PlatformPulseBanner() {
  const [pulse, setPulse] = useState<PlatformPulse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPulse() {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) return;

        const response = await fetch(`${getIntelApiBaseUrl()}/api/intel/dashboard/platform-intelligence`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        if (!response.ok) return;

        const data = await response.json();
        if (!cancelled) {
          setPulse((data.platform_intelligence || null) as PlatformPulse | null);
        }
      } catch {
        if (!cancelled) setPulse(null);
      }
    }

    loadPulse();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!pulse) return null;

  return (
    <section className="mt-4 rounded-2xl border border-teal-900/40 bg-gradient-to-br from-teal-950/20 via-slate-900/70 to-slate-900/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300">Platform Pulse</p>
          <p className="mt-1 text-sm text-slate-300">
            {pulse.metrics.total_insights.toLocaleString('en-IN')} AI signal{pulse.metrics.total_insights === 1 ? '' : 's'} active across Intel services.
          </p>
          {pulse.insights[0]?.title ? (
            <p className="mt-2 text-xs text-slate-400">
              Top signal: <span className="text-slate-200">{pulse.insights[0].title}</span>
            </p>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            Queue {pulse.service_health.enrichment.completed}/{pulse.service_health.enrichment.total}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2">
            Verify {pulse.service_health.lead_verification.valid}/{pulse.service_health.lead_verification.total}
          </div>
          <div className="col-span-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 sm:col-span-1">
            Outbound pending {pulse.service_health.outbound.pending_approval} · sent {pulse.service_health.outbound.sent}
          </div>
        </div>
      </div>
      {pulse.insights[0]?.recommended_action ? (
        <p className="mt-3 rounded-lg border border-teal-800/40 bg-teal-950/20 px-3 py-2 text-xs text-teal-200">
          Action cue: {pulse.insights[0].recommended_action}
        </p>
      ) : null}
    </section>
  );
}
