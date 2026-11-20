'use client';

import { useCallback, useEffect, useState } from 'react';
import type { TourStep } from './usePortalTour';

interface TourOverlayProps {
  step: TourStep;
  index: number;
  total: number;
  ringClass: string;
  buttonClass: string;
  dotClass: string;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 6;
const TOOLTIP_WIDTH = 300;

export default function TourOverlay({
  step,
  index,
  total,
  ringClass,
  buttonClass,
  dotClass,
  onNext,
  onBack,
  onSkip,
}: TourOverlayProps) {
  const [rect, setRect] = useState<Rect | null>(null);

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.id}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.id]);

  useEffect(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour-id="${step.id}"]`);
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    const t = setTimeout(measure, 260);
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [step.id, measure]);

  if (!rect || typeof window === 'undefined') return null;

  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  const ringStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    width: rect.width + PADDING * 2,
    height: rect.height + PADDING * 2,
    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.55)',
    zIndex: 60,
    borderRadius: 10,
    pointerEvents: 'none',
    transition: 'all 0.25s ease',
  };

  const spaceBelow = viewportH - (rect.top + rect.height);
  const placeBelow = spaceBelow > 200 || rect.top < 200;

  let left = rect.left;
  if (left + TOOLTIP_WIDTH > viewportW - 16) left = viewportW - TOOLTIP_WIDTH - 16;
  if (left < 16) left = 16;

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left,
    width: TOOLTIP_WIDTH,
    zIndex: 61,
    transition: 'all 0.25s ease',
    ...(placeBelow
      ? { top: rect.top + rect.height + PADDING + 10 }
      : { top: Math.max(16, rect.top - PADDING - 10 - 140) }),
  };

  return (
    <>
      <div style={ringStyle} className={`border-2 ${ringClass}`} />
      <div
        style={tooltipStyle}
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        role="dialog"
        aria-live="polite"
        aria-label={`Tour step ${index + 1} of ${total}: ${step.title}`}
      >
        <div className="mb-1.5 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{step.title}</p>
          <button
            onClick={onSkip}
            aria-label="Skip tour"
            className="shrink-0 text-slate-400 hover:text-slate-600"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="mb-3 text-xs leading-relaxed text-slate-600">{step.body}</p>
        <div className="mb-2.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`h-full rounded-full transition-all duration-300 ${dotClass}`}
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="shrink-0 text-[10px] text-slate-400">
            Step {index + 1} of {total}
          </p>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={onBack}
                className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium text-white ${buttonClass}`}
            >
              {index === total - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
