'use client';

import { useMemo, useState } from 'react';

type Props = {
  checklistId: string;
  initialChecklist: any;
  readOnly?: boolean;
};

function pctFromSteps(steps: any[]) {
  if (!steps.length) return 0;
  const done = steps.filter((s) => s.done).length;
  return Math.floor((done * 100) / steps.length);
}

export default function OnboardingChecklist({ checklistId, initialChecklist, readOnly = false }: Props) {
  const [checklist, setChecklist] = useState(initialChecklist);
  const [savingStepId, setSavingStepId] = useState<string | null>(null);

  const steps = useMemo(() => (Array.isArray(checklist?.steps) ? checklist.steps : []), [checklist]);
  const pct = checklist?.completion_pct ?? pctFromSteps(steps);
  const firstPending = steps.find((step: any) => !step.done);

  async function markDone(stepId: string, done: boolean) {
    if (readOnly) return;
    setSavingStepId(stepId);

    const optimisticSteps = steps.map((step: any) => (step.id === stepId ? { ...step, done } : step));
    const optimistic = { ...checklist, steps: optimisticSteps, completion_pct: pctFromSteps(optimisticSteps) };
    setChecklist(optimistic);

    const response = await fetch(`/api/onboarding/${checklistId}/step`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ stepId, done })
    });

    const payload = await response.json();
    if (!response.ok) {
      setChecklist(initialChecklist);
    } else {
      setChecklist(payload);
    }

    setSavingStepId(null);
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-900">Onboarding Checklist</h3>
        <span className="text-xs font-semibold text-gray-700">{pct}% complete</span>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step: any) => {
          const isCurrent = firstPending?.id === step.id && !step.done;
          const isSaving = savingStepId === step.id;
          return (
            <article key={step.id} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
              {step.done ? (
                <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">✓</div>
              ) : isCurrent ? (
                <div className="mt-0.5 inline-flex h-5 w-5 animate-pulse items-center justify-center rounded-full border-2 border-blue-600 text-[10px] text-blue-600">○</div>
              ) : (
                <div className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-[10px] text-gray-500">○</div>
              )}

              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{step.label}</p>
                {step.done && step.done_at ? (
                  <p className="mt-1 text-xs text-gray-500">by {step.done_by || '-'} on {new Date(step.done_at).toLocaleString('en-IN')}</p>
                ) : null}
              </div>

              {!readOnly && !step.done && isCurrent ? (
                <button
                  onClick={() => markDone(step.id, true)}
                  disabled={isSaving}
                  className="rounded-md border border-blue-300 px-2 py-1 text-xs font-semibold text-blue-700 disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : 'Mark Done'}
                </button>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
