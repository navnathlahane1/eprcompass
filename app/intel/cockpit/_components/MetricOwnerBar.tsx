'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { INTEL_METRICS, type IntelMetricMeta } from '@/lib/intel/owners';

type Props = {
  metricId: string;
  companyId?: string | null;
  state?: string | null;
  wasteCategory?: string | null;
  title?: string;
};

export default function MetricOwnerBar({ metricId, companyId, state, wasteCategory, title }: Props) {
  const meta: IntelMetricMeta = INTEL_METRICS[metricId] || {
    id: metricId,
    owner: 'Intel team',
    drillHref: '/intel/cockpit',
    source: 'intel_*',
    playHint: 'Create a cockpit task',
  };
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');

  async function act(target: 'explain' | 'play' | 'telecalling' | 'crm') {
    setBusy(target);
    setMsg('');
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Not signed in');
      if (target === 'explain') {
        const res = await fetch('/api/intel/explain', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          body: JSON.stringify({ metric_id: metricId, context: { state, waste_category: wasteCategory } }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Explain failed');
        setMsg(body.explanation);
        return;
      }
      const res = await fetch('/api/intel/handoff', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          target,
          company_id: companyId || undefined,
          title: title || meta.playHint,
          play_hint: meta.playHint,
          state,
          waste_category: wasteCategory,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Handoff blocked');
      setMsg(target === 'play' ? 'Play added to cockpit tasks' : `Pushed to ${target}`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[11px] text-slate-400">
        Owner <span className="font-semibold text-slate-200">{meta.owner}</span>
        <span className="mx-1.5 text-slate-600">·</span>
        <span className="text-slate-500">{meta.source}</span>
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Link href={meta.drillHref} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
          Open drill
        </Link>
        <button type="button" onClick={() => act('explain')} disabled={!!busy} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-teal-400 disabled:opacity-50">
          Explain
        </button>
        <button type="button" onClick={() => act('play')} disabled={!!busy} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-teal-400 disabled:opacity-50">
          Make a play
        </button>
        {companyId ? (
          <>
            <button type="button" onClick={() => act('telecalling')} disabled={!!busy} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-teal-400 disabled:opacity-50">
              To telecalling
            </button>
            <button type="button" onClick={() => act('crm')} disabled={!!busy} className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-200 hover:border-teal-400 disabled:opacity-50">
              To CRM
            </button>
          </>
        ) : null}
      </div>
      {msg ? <p className="text-[11px] leading-snug text-teal-200/90">{msg}</p> : null}
    </div>
  );
}
