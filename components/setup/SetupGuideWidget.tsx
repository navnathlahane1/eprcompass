'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface SetupStep {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  required?: boolean;
}

interface Props {
  steps: SetupStep[];
  portalKey: string; // unique key per portal type + user, for localStorage
  accentColor?: 'blue' | 'emerald' | 'violet' | 'teal';
  dark?: boolean;     // manager portal uses dark bg
}

const ACCENT_STYLES = {
  blue: {
    bar: 'bg-blue-600',
    barBg: 'bg-blue-100',
    badge: 'bg-blue-600 text-white',
    link: 'text-blue-600 hover:text-blue-700',
    button: 'bg-blue-600 hover:bg-blue-700 text-white',
    ring: 'stroke-blue-600',
    ringBg: 'stroke-blue-100',
    dot: 'bg-blue-600',
    stepCurrent: 'border-blue-500 bg-blue-50',
    checkBg: 'bg-emerald-600',
  },
  emerald: {
    bar: 'bg-emerald-600',
    barBg: 'bg-emerald-100',
    badge: 'bg-emerald-600 text-white',
    link: 'text-emerald-700 hover:text-emerald-800',
    button: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    ring: 'stroke-emerald-500',
    ringBg: 'stroke-emerald-100',
    dot: 'bg-emerald-600',
    stepCurrent: 'border-emerald-400 bg-emerald-50',
    checkBg: 'bg-emerald-600',
  },
  violet: {
    bar: 'bg-violet-600',
    barBg: 'bg-violet-100',
    badge: 'bg-violet-600 text-white',
    link: 'text-violet-600 hover:text-violet-700',
    button: 'bg-violet-600 hover:bg-violet-700 text-white',
    ring: 'stroke-violet-500',
    ringBg: 'stroke-violet-100',
    dot: 'bg-violet-600',
    stepCurrent: 'border-violet-400 bg-violet-50',
    checkBg: 'bg-emerald-600',
  },
  teal: {
    bar: 'bg-teal-600',
    barBg: 'bg-teal-100',
    badge: 'bg-teal-600 text-white',
    link: 'text-teal-700 hover:text-teal-800',
    button: 'bg-teal-600 hover:bg-teal-700 text-white',
    ring: 'stroke-teal-500',
    ringBg: 'stroke-teal-100',
    dot: 'bg-teal-600',
    stepCurrent: 'border-teal-400 bg-teal-50',
    checkBg: 'bg-emerald-600',
  },
};

function CircleProgress({ pct, color, dark }: { pct: number; color: string; dark: boolean }) {
  const r = 28;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" strokeWidth="6" className={dark ? 'stroke-slate-700' : 'stroke-slate-100'} />
      <circle
        cx="36" cy="36" r={r} fill="none" strokeWidth="6"
        className={color} strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 36 36)"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="36" y="41" textAnchor="middle" fontSize="14" fontWeight="700"
        className={dark ? 'fill-slate-100' : 'fill-slate-900'}>
        {pct}%
      </text>
    </svg>
  );
}

export default function SetupGuideWidget({ steps, portalKey, accentColor = 'blue', dark = false }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const done = steps.filter(s => s.done).length;
  const total = steps.length;
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = pct === 100;
  const firstPending = steps.find(s => !s.done);

  const storageKey = `setup-guide-dismissed-${portalKey}`;

  useEffect(() => {
    if (complete) {
      localStorage.removeItem(storageKey);
      setDismissed(false);
    } else {
      setDismissed(localStorage.getItem(storageKey) === '1');
    }
  }, [storageKey, complete]);

  function dismiss() {
    localStorage.setItem(storageKey, '1');
    setDismissed(true);
  }

  const a = ACCENT_STYLES[accentColor];

  // If dismissed and not complete — show mini bar
  if (dismissed && !complete) {
    return (
      <div
        onClick={() => setDismissed(false)}
        className={`mb-4 flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-all ${
          dark
            ? 'border-slate-700 bg-[#0c1022] hover:bg-slate-800/50'
            : 'border-slate-200 bg-white hover:bg-slate-50'
        }`}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs font-semibold ${dark ? 'text-slate-300' : 'text-slate-600'}`}>
              Setup Progress — {done}/{total} steps done
            </span>
            <span className={`text-xs font-bold ${dark ? 'text-slate-200' : 'text-slate-800'}`}>{pct}%</span>
          </div>
          <div className={`h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all ${a.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <span className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Show guide →</span>
      </div>
    );
  }

  // Complete state
  if (complete) {
    return (
      <div className={`mb-4 flex items-center gap-3 rounded-xl border px-4 py-3 ${
        dark ? 'border-emerald-800/40 bg-emerald-900/20' : 'border-emerald-200 bg-emerald-50'
      }`}>
        <span className="text-emerald-500 text-xl">✓</span>
        <div>
          <p className={`text-sm font-semibold ${dark ? 'text-emerald-300' : 'text-emerald-800'}`}>Setup Complete!</p>
          <p className={`text-xs ${dark ? 'text-emerald-400' : 'text-emerald-700'}`}>All {total} setup steps are done. Your account is fully configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`mb-4 overflow-hidden rounded-2xl border shadow-sm ${
      dark ? 'border-slate-700 bg-[#0c1022]' : 'border-slate-200 bg-white'
    }`}>
      {/* Header */}
      <div
        className={`flex cursor-pointer items-center gap-4 p-4 ${
          dark ? 'border-b border-slate-800' : 'border-b border-slate-100'
        }`}
        onClick={() => setCollapsed(c => !c)}
      >
        <CircleProgress pct={pct} color={a.ring} dark={dark} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`text-base font-semibold ${dark ? 'text-slate-100' : 'text-slate-900'}`}>
              Account Setup
            </h3>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${a.badge}`}>
              {done}/{total} done
            </span>
          </div>
          <p className={`mt-0.5 text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
            {firstPending
              ? `Next: ${firstPending.label}`
              : 'Complete the steps below to finish setting up your account.'}
          </p>
          <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
            <div className={`h-full rounded-full transition-all duration-500 ${a.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(); }}
            className={`rounded-md p-1 text-xs ${dark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            title="Dismiss"
          >
            ✕
          </button>
          <svg
            viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''} ${dark ? 'text-slate-400' : 'text-slate-500'}`}
            fill="none" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Steps */}
      {!collapsed && (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {steps.map((step, idx) => {
            const isCurrent = !step.done && firstPending?.id === step.id;
            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                  step.done
                    ? dark ? 'opacity-50 hover:opacity-70' : 'opacity-50 hover:opacity-70'
                    : isCurrent
                      ? dark
                        ? 'bg-slate-800/60 hover:bg-slate-800'
                        : `${a.stepCurrent} hover:opacity-90`
                      : dark
                        ? 'hover:bg-slate-800/40'
                        : 'hover:bg-slate-50'
                }`}
              >
                {/* Status icon */}
                <div className="mt-0.5 shrink-0">
                  {step.done ? (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold text-white ${a.checkBg}`}>✓</span>
                  ) : isCurrent ? (
                    <span className={`flex h-6 w-6 animate-pulse items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      dark ? 'border-slate-400 text-slate-300' : `border-current ${a.link}`
                    }`}>
                      {idx + 1}
                    </span>
                  ) : (
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-medium ${
                      dark ? 'border-slate-600 text-slate-500' : 'border-slate-300 text-slate-400'
                    }`}>
                      {idx + 1}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${
                    step.done
                      ? dark ? 'text-slate-400 line-through' : 'text-slate-400 line-through'
                      : dark ? 'text-slate-200' : 'text-slate-800'
                  }`}>
                    {step.label}
                    {step.required && !step.done && (
                      <span className="ml-1.5 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">Required</span>
                    )}
                  </p>
                  <p className={`mt-0.5 text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>{step.description}</p>
                </div>

                {/* Arrow */}
                {!step.done && (
                  <svg viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 mt-1 ${dark ? 'text-slate-600' : 'text-slate-400'}`}
                    fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
