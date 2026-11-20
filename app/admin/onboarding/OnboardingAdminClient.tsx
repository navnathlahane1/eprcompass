'use client';

import { useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const ENTITY_TYPES = ['All', 'client', 'recycler', 'cepc', 'partner'] as const;

function StatusBar({ pct }: { pct: number }) {
  const p = Math.max(0, Math.min(100, pct || 0));
  const color = p === 100 ? 'bg-emerald-500' : p >= 50 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-900">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${p}%` }} />
    </div>
  );
}

export default function OnboardingAdminClient({ initialRows, currentUserId }: { initialRows: any[]; currentUserId: string }) {
  const [rows, setRows] = useState<any[]>(initialRows || []);
  const [filter, setFilter] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const typeOk = filter === 'All' || r.entity_type === filter;
      const searchOk = !q || r.entity_name.toLowerCase().includes(q) || r.template_name?.toLowerCase().includes(q);
      return typeOk && searchOk;
    });
  }, [rows, filter, search]);

  async function toggleStep(checklistId: string, stepId: string, done: boolean) {
    setSaving(checklistId);
    try {
      const res = await fetch(`/api/onboarding/${checklistId}/step`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId, done, doneBy: currentUserId })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Update failed');
      setRows((prev) => prev.map((r) => r.id === checklistId ? {
        ...r,
        steps: json.steps,
        completion_pct: json.completion_pct,
        updated_at: json.updated_at
      } : r));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  }

  async function copyLink(checklistId: string) {
    try {
      const res = await fetch('/api/onboarding/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist_id: checklistId })
      });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || 'Failed');
      await navigator.clipboard.writeText(json.url);
      alert('Onboarding link copied to clipboard!');
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Onboarding Checklists</h1>
        <p className="mt-1 text-sm text-slate-500">Track client, recycler, CEPC and partner onboarding progress.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-800 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        <div className="flex gap-2 flex-wrap">
          {ENTITY_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors capitalize ${filter === t ? 'bg-teal-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-500">{filtered.length} checklist{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-3">
        {filtered.map((row) => {
          const steps = Array.isArray(row.steps) ? row.steps : [];
          const isExpanded = expanded === row.id;
          const isLoading = saving === row.id;

          return (
            <div key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/60 shadow-sm">
              <button
                onClick={() => setExpanded(isExpanded ? null : row.id)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded-full bg-slate-900 px-2 py-0.5 text-xs font-medium capitalize text-slate-400">{row.entity_type}</span>
                    <span className="font-semibold text-slate-100 truncate">{row.entity_name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <StatusBar pct={row.completion_pct} />
                    <span className="shrink-0 text-xs font-semibold text-slate-400">{row.completion_pct}%</span>
                  </div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <span className={`text-xs font-semibold ${row.completion_pct === 100 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {row.completion_pct === 100 ? 'Complete' : 'In Progress'}
                  </span>
                  <svg className={`h-4 w-4 text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-slate-800/60 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Updated: {new Date(row.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <button
                      onClick={() => copyLink(row.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-300 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                      </svg>
                      Copy Link
                    </button>
                  </div>

                  <div className="space-y-2">
                    {steps.map((step: any) => (
                      <label key={step.id} className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm ${step.done ? 'bg-emerald-950/40' : 'bg-slate-950'} ${isLoading ? 'pointer-events-none opacity-60' : ''}`}>
                        <input
                          type="checkbox"
                          checked={!!step.done}
                          onChange={(e) => toggleStep(row.id, step.id, e.target.checked)}
                          className="h-4 w-4 accent-teal-600"
                        />
                        <span className={`flex-1 ${step.done ? 'line-through text-slate-500' : 'text-slate-100'}`}>{step.label}</span>
                        {step.done && step.done_at && (
                          <span className="shrink-0 text-xs text-slate-500">
                            {new Date(step.done_at).toLocaleDateString('en-IN')}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-700 py-12 text-center text-sm text-slate-500">
            No checklists found.
          </div>
        )}
      </div>
    </div>
  );
}
