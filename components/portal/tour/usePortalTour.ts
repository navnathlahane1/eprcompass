'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { TourStep } from './tourTypes';

export type { TourStep };

/** How many separate sessions the tour auto-starts on before it stops showing itself uninvited. */
const MAX_AUTO_STARTS = 3;

interface UsePortalTourArgs {
  steps: TourStep[];
  /** Namespaces the auto-start counter in localStorage — pass the same storageKey used for the portal shell */
  storageKey: string;
  autoStart?: boolean;
}

export function usePortalTour({ steps, storageKey, autoStart = true }: UsePortalTourArgs) {
  const countKey = `${storageKey}-tour-shown-count`;
  const [index, setIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const autoStartedRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname() ?? '';

  useEffect(() => {
    if (autoStartedRef.current || !autoStart || steps.length === 0) return;
    // Utility pages the user was deliberately sent to (e.g. the post-login redirect from
    // the Chrome Extension's "Sign in" flow) shouldn't get hijacked by the tour before the
    // page's own on-load logic (like auto-connecting the extension) has a chance to run.
    if (pathname === '/portal/extension') return;
    autoStartedRef.current = true;
    if (typeof window === 'undefined') return;
    const count = parseInt(window.localStorage.getItem(countKey) || '0', 10);
    if (count >= MAX_AUTO_STARTS) return;
    const t = setTimeout(() => {
      window.localStorage.setItem(countKey, String(count + 1));
      setIndex(0);
      setIsActive(true);
    }, 700);
    return () => clearTimeout(t);
  }, [autoStart, countKey, steps.length, pathname]);

  const start = useCallback(() => {
    setIndex(0);
    setIsActive(true);
  }, []);

  const finish = useCallback(() => {
    setIsActive(false);
  }, []);

  const skip = useCallback(() => {
    setIsActive(false);
  }, []);

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) return i;
      return i + 1;
    });
  }, [steps.length]);

  const back = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const isLastStep = index >= steps.length - 1;

  const handleNext = useCallback(() => {
    if (isLastStep) {
      finish();
    } else {
      next();
    }
  }, [isLastStep, finish, next]);

  const step = steps[index];

  // Sidebar-walkthrough steps use their own href as the id — treat that as
  // an implicit route so "Next" carries you to every page in the portal,
  // not just the one you started the tour on.
  const targetRoute = step?.route ?? (step?.id.startsWith('/') ? step.id : undefined);
  // Compare pathname only — usePathname() never includes the query string,
  // so a targetRoute with a "?..." would otherwise never match and isReady
  // would stay false forever (tour freezes with no Next/Skip).
  const targetPathname = targetRoute?.split('?')[0];
  const isReady = !isActive || !targetRoute || targetPathname === pathname;

  // Navigate to the step's page before we try to highlight anything on it.
  useEffect(() => {
    if (!isActive || !targetRoute || targetPathname === pathname) return;
    router.push(targetRoute);
  }, [isActive, targetRoute, targetPathname, pathname, router]);

  return {
    isActive: isActive && steps.length > 0,
    isReady,
    step,
    index,
    total: steps.length,
    isLastStep,
    start,
    next: handleNext,
    back,
    skip,
  };
}
