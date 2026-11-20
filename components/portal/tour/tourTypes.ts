export interface TourStep {
  /** Must match a `data-tour-id` attribute in the DOM */
  id: string;
  title: string;
  body: string;
  /**
   * Page this step's target lives on. When set and different from the
   * current route, the tour navigates there before trying to highlight it.
   * Sidebar-walkthrough steps (id is already an href) don't need this — see
   * the `route` fallback in usePortalTour.
   */
  route?: string;
}

/**
 * Splices each page's deep-dive steps in right after that page's own
 * sidebar-walkthrough step, instead of leaving them all bunched at the end
 * of the tour. `deepDive` is keyed by the sidebar step's id (its href).
 *
 * Deliberately kept in a plain module (no 'use client') so server-rendered
 * portal layouts can call it directly when building tourSteps.
 */
export function interleaveDeepDive(
  steps: TourStep[],
  deepDive: Record<string, TourStep[]>
): TourStep[] {
  const out: TourStep[] = [];
  for (const step of steps) {
    out.push(step);
    if (deepDive[step.id]) out.push(...deepDive[step.id]);
  }
  return out;
}
