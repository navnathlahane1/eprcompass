'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PortalTrainingConfig, TrainingSection, QuizQuestion, BadgeColor } from './trainingContent';

// ─── Accent theme ─────────────────────────────────────────────────────────────

const ACCENT = {
  indigo: {
    logo: 'bg-indigo-600', bar: 'bg-indigo-600', barBg: 'bg-indigo-100',
    activeBg: 'bg-indigo-50', activeBorder: 'border-indigo-500', activeText: 'text-indigo-700',
    activeNum: 'bg-indigo-600 text-white border-indigo-600',
    btn: 'bg-indigo-600 hover:bg-indigo-700', infoBox: 'border-l-indigo-500 bg-indigo-50 text-indigo-900',
    tag: 'bg-indigo-100 text-indigo-700', badge: 'bg-indigo-600',
  },
  violet: {
    logo: 'bg-violet-600', bar: 'bg-violet-600', barBg: 'bg-violet-100',
    activeBg: 'bg-violet-50', activeBorder: 'border-violet-500', activeText: 'text-violet-700',
    activeNum: 'bg-violet-600 text-white border-violet-600',
    btn: 'bg-violet-600 hover:bg-violet-700', infoBox: 'border-l-violet-500 bg-violet-50 text-violet-900',
    tag: 'bg-violet-100 text-violet-700', badge: 'bg-violet-600',
  },
  teal: {
    logo: 'bg-teal-600', bar: 'bg-teal-600', barBg: 'bg-teal-100',
    activeBg: 'bg-teal-50', activeBorder: 'border-teal-500', activeText: 'text-teal-700',
    activeNum: 'bg-teal-600 text-white border-teal-600',
    btn: 'bg-teal-600 hover:bg-teal-700', infoBox: 'border-l-teal-500 bg-teal-50 text-teal-900',
    tag: 'bg-teal-100 text-teal-700', badge: 'bg-teal-600',
  },
  rose: {
    logo: 'bg-rose-600', bar: 'bg-rose-600', barBg: 'bg-rose-100',
    activeBg: 'bg-rose-50', activeBorder: 'border-rose-500', activeText: 'text-rose-700',
    activeNum: 'bg-rose-600 text-white border-rose-600',
    btn: 'bg-rose-600 hover:bg-rose-700', infoBox: 'border-l-rose-500 bg-rose-50 text-rose-900',
    tag: 'bg-rose-100 text-rose-700', badge: 'bg-rose-600',
  },
};

const BADGE_STYLES: Record<BadgeColor, string> = {
  green:  'bg-emerald-100 text-emerald-800',
  amber:  'bg-amber-100 text-amber-800',
  red:    'bg-red-100 text-red-700',
  gray:   'bg-slate-100 text-slate-600',
  blue:   'bg-blue-100 text-blue-800',
  violet: 'bg-violet-100 text-violet-700',
};

// ─── Section renderer ─────────────────────────────────────────────────────────

function RenderSection({ section, accent }: { section: TrainingSection; accent: typeof ACCENT[keyof typeof ACCENT] }) {
  switch (section.type) {
    case 'p':
      return <p className="text-sm text-slate-600 leading-relaxed mb-3">{section.text}</p>;

    case 'info':
      return (
        <div className={`border-l-4 rounded-r-lg px-4 py-3 mb-4 ${accent.infoBox}`}>
          <p className="text-sm leading-relaxed">{section.text}</p>
        </div>
      );

    case 'h':
      return <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mt-4 mb-2">{section.text}</p>;

    case 'bullets':
      return (
        <ul className="mb-4 space-y-1.5">
          {section.items.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
              <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${accent.bar}`} />
              {item}
            </li>
          ))}
        </ul>
      );

    case 'metrics':
      return (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {section.items.map((m, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
              <p className="text-[11px] text-slate-500 mb-0.5">{m.label}</p>
              <p className="text-xs font-semibold text-slate-800">{m.value}</p>
            </div>
          ))}
        </div>
      );

    case 'steps':
      return (
        <div className="mb-4 space-y-1.5">
          {section.items.map((s, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${accent.badge}`}>
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{s.title}</span>
                  {s.badge && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">{s.badge}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'badges':
      return (
        <div className="mb-4 flex flex-wrap gap-2">
          {section.items.map((b, i) => (
            <span key={i} className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE_STYLES[b.color]}`}>
              {b.label}
            </span>
          ))}
        </div>
      );

    case 'tiers':
      return (
        <div className={`mb-4 grid gap-2`} style={{ gridTemplateColumns: `repeat(${section.items.length}, 1fr)` }}>
          {section.items.map((t, i) => (
            <div key={i} className={`rounded-lg border px-2 py-2.5 text-center ${
              t.hi
                ? `${accent.activeBg} ${accent.activeBorder} border`
                : 'border-slate-200 bg-slate-50'
            }`}>
              <p className="text-[10px] text-slate-500 mb-0.5">{t.num}</p>
              <p className={`text-[11px] font-semibold leading-tight mb-1 ${t.hi ? accent.activeText : 'text-slate-800'}`}>{t.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{t.type}</p>
            </div>
          ))}
        </div>
      );

    case 'cards':
      return (
        <div className="mb-4 space-y-1.5">
          {section.items.map((c, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <svg viewBox="0 0 24 24" className={`mt-0.5 h-4 w-4 shrink-0 ${accent.activeText}`} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">{c.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${accent.tag}`}>{c.tag}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );

    case 'levels':
      return (
        <div className="mb-4 space-y-1.5">
          {section.items.map((l, i) => (
            <div key={i} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: l.color }} />
              <div>
                <p className="text-xs font-semibold text-slate-800">{l.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

function QuizModule({
  questions,
  accent,
  onPass,
}: {
  questions: QuizQuestion[];
  accent: typeof ACCENT[keyof typeof ACCENT];
  onPass: () => void;
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = answers.every(a => a !== null);
  const results = questions.map((q, i) => answers[i] === q.correct);
  const allCorrect = submitted && results.every(Boolean);
  const score = results.filter(Boolean).length;

  function submit() {
    if (!allAnswered) return;
    setSubmitted(true);
    if (results.every(Boolean)) onPass();
  }

  function retry() {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
  }

  return (
    <div>
      <span className={`mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${accent.tag}`}>
        Quiz
      </span>
      <h3 className="mb-1 text-base font-semibold text-slate-900">Knowledge check</h3>
      <p className="mb-5 text-sm text-slate-500">Answer all {questions.length} questions correctly to complete your training.</p>

      {submitted && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm font-semibold ${
          allCorrect
            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
            : 'border-amber-300 bg-amber-50 text-amber-800'
        }`}>
          {allCorrect
            ? `All ${questions.length} correct — training complete!`
            : `${score}/${questions.length} correct — review the answers below and try again.`}
        </div>
      )}

      <div className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = answers[qi];
          const correct = q.correct;
          const isCorrect = submitted && chosen === correct;
          const isWrong = submitted && chosen !== null && chosen !== correct;

          return (
            <div key={qi}>
              <p className="mb-2.5 text-sm font-medium text-slate-800">
                <span className={`mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${accent.badge}`}>
                  {qi + 1}
                </span>
                {q.question}
              </p>
              <div className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  let cls = 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700';
                  if (submitted) {
                    if (oi === correct) cls = 'border-emerald-400 bg-emerald-50 text-emerald-800 font-medium';
                    else if (isChosen) cls = 'border-red-300 bg-red-50 text-red-700';
                    else cls = 'border-slate-200 bg-slate-50 text-slate-400';
                  } else if (isChosen) {
                    cls = `border-2 ${accent.activeBorder} ${accent.activeBg} ${accent.activeText} font-medium`;
                  }
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => {
                        const next = [...answers];
                        next[qi] = oi;
                        setAnswers(next);
                      }}
                      className={`w-full rounded-lg px-4 py-2.5 text-left text-sm transition-colors ${cls} ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (isCorrect || isWrong) && (
                <p className={`mt-2 text-xs leading-relaxed ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {isCorrect ? '✓ ' : '✗ '}
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!submitted ? (
          <button
            disabled={!allAnswered}
            onClick={submit}
            className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-40 ${accent.btn}`}
          >
            Submit answers
          </button>
        ) : !allCorrect ? (
          <button onClick={retry} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Try again
          </button>
        ) : null}
        {!submitted && !allAnswered && (
          <p className="text-xs text-slate-400">Answer all questions to submit</p>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  config: PortalTrainingConfig;
  initialDone?: boolean;
}

export default function OnboardingTraining({ config, initialDone = false }: Props) {
  const { modules, quiz, accent: accentKey, storageKey, completionApiUrl, portalLabel } = config;
  const a = ACCENT[accentKey];

  const totalSteps = modules.length + 1; // modules + quiz

  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [quizPassed, setQuizPassed] = useState(initialDone);
  const [saving, setSaving] = useState(false);
  const [allDone, setAllDone] = useState(initialDone);

  // Persist module progress to localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr: number[] = JSON.parse(raw);
        setCompleted(new Set(arr));
      }
      if (initialDone) {
        setCompleted(new Set(modules.map((_, i) => i).concat([modules.length])));
      }
    } catch { /* ignore parse errors */ }
  }, [storageKey, initialDone, modules]);

  const saveCompleted = useCallback((next: Set<number>) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch { /* ignore */ }
  }, [storageKey]);

  function markModuleComplete(idx: number) {
    setCompleted(prev => {
      const next = new Set([...prev, idx]);
      saveCompleted(next);
      return next;
    });
  }

  const completedCount = completed.size;
  const progressPct = Math.round((completedCount / totalSteps) * 100);

  const isQuizSlot = current === modules.length;
  const isLastSlot = current === modules.length;
  const canGoNext = !isLastSlot || quizPassed;

  function handleNext() {
    if (!isQuizSlot) markModuleComplete(current);
    if (current < modules.length) setCurrent(current + 1);
  }

  function handlePrev() {
    if (current > 0) setCurrent(current - 1);
  }

  async function handleQuizPass() {
    markModuleComplete(modules.length); // mark quiz slot done
    setQuizPassed(true);

    if (!allDone) {
      setSaving(true);
      try {
        await fetch(completionApiUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
        });
        setAllDone(true);
      } catch { /* silently fail — will be retried on next page load */ }
      finally { setSaving(false); }
    }
  }

  const everythingDone = allDone || (completedCount >= totalSteps);

  return (
    <div className="max-w-[900px]">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${a.logo}`}>
          EC
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Onboarding training</h2>
          <p className="text-xs text-slate-500">Complete all modules to activate your {portalLabel} account</p>
        </div>
        {saving && <span className="ml-auto text-xs text-slate-400 animate-pulse">Saving…</span>}
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <div className={`h-1.5 w-full overflow-hidden rounded-full ${a.barBg}`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${a.bar}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>
      <p className="mb-5 text-xs text-slate-500">
        {completedCount} of {totalSteps} steps completed — {progressPct}%
      </p>

      <div className="grid gap-4" style={{ gridTemplateColumns: '220px 1fr' }}>
        {/* Sidebar */}
        <div className="flex flex-col gap-1">
          {modules.map((m, i) => {
            const isDone = completed.has(i);
            const isActive = i === current;
            return (
              <button
                key={m.id}
                onClick={() => setCurrent(i)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? `${a.activeBg} border ${a.activeBorder}`
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  isDone
                    ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                    : isActive
                      ? a.activeNum
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}>
                  {isDone ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-xs font-semibold ${isActive ? a.activeText : 'text-slate-700'}`}>{m.title}</p>
                  <p className="text-[10px] text-slate-400">{m.subtitle}</p>
                </div>
                {isDone && !isActive && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })}

          {/* Quiz nav item */}
          {(() => {
            const isDone = completed.has(modules.length);
            const isActive = current === modules.length;
            return (
              <button
                onClick={() => setCurrent(modules.length)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? `${a.activeBg} border ${a.activeBorder}`
                    : 'border border-transparent hover:bg-slate-50'
                }`}
              >
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  isDone
                    ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                    : isActive
                      ? a.activeNum
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                }`}>
                  {isDone ? '✓' : modules.length + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`truncate text-xs font-semibold ${isActive ? a.activeText : 'text-slate-700'}`}>Knowledge check quiz</p>
                  <p className="text-[10px] text-slate-400">5 questions</p>
                </div>
                {isDone && !isActive && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            );
          })()}
        </div>

        {/* Content area */}
        <div>
          <div className="min-h-80 rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-3">
            {isQuizSlot ? (
              <QuizModule
                questions={quiz}
                accent={a}
                onPass={handleQuizPass}
              />
            ) : (
              (() => {
                const mod = modules[current];
                return (
                  <div>
                    <span className={`mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${a.tag}`}>
                      {mod.tag}
                    </span>
                    <h3 className="mb-3 text-base font-semibold text-slate-900">{mod.heading}</h3>
                    {mod.sections.map((s, i) => (
                      <RenderSection key={i} section={s} accent={a} />
                    ))}
                  </div>
                );
              })()
            )}
          </div>

          {/* All done banner */}
          {everythingDone && (
            <div className="mb-3 rounded-xl border border-emerald-300 bg-emerald-50 px-5 py-4 text-center">
              <p className="text-sm font-semibold text-emerald-800">Training complete!</p>
              <p className="mt-0.5 text-xs text-emerald-700">
                You are now fully onboarded. Your account setup checklist has been updated automatically.
              </p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrev}
              disabled={current === 0}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            {!isLastSlot && (
              <button
                onClick={handleNext}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${a.btn}`}
              >
                Mark complete & next
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {isLastSlot && !quizPassed && (
              <p className="text-xs italic text-slate-400">Answer all quiz questions correctly to finish</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
