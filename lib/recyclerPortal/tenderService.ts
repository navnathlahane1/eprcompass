/**
 * Pure functions for tender matching and eligibility evaluation.
 * No DB calls — all inputs must be provided.
 * Fully unit-testable.
 */

export interface TenderEligibility {
  minRating?: number;
  requiredCertifications?: string[];
  minCapacityPerMonth?: number;
  mustBeVerified?: boolean;
}

export interface TenderMatchInput {
  eprType: string;
  statesCovered: string[];
  requiredQty?: number;
  eligibilityCriteria: TenderEligibility;
}

export interface RecyclerProfile {
  eprCategories: string[];
  authorizedStates: string[];
  verificationStatus: string;
  certifications: string[];
  capacityPerMonth?: number;
  overallRating?: number;
}

export interface TenderMatchResult {
  matched: boolean;
  score: number; // 0–100
  reasons: string[];
  disqualifiers: string[];
}

/**
 * Scores and qualifies a recycler against a tender.
 * Returns a match result with detailed reasoning.
 */
export function matchRecyclerToTender(
  recycler: RecyclerProfile,
  tender: TenderMatchInput
): TenderMatchResult {
  const reasons: string[] = [];
  const disqualifiers: string[] = [];
  let score = 0;

  // 1. EPR category match (required)
  const categoryMatch = recycler.eprCategories.includes(tender.eprType);
  if (categoryMatch) {
    score += 35;
    reasons.push(`Handles ${tender.eprType} EPR category`);
  } else {
    disqualifiers.push(`Does not handle ${tender.eprType} EPR category`);
  }

  // 2. State coverage overlap (required: at least one match)
  const matchedStates = recycler.authorizedStates.filter((s) =>
    tender.statesCovered.includes(s)
  );
  if (matchedStates.length > 0) {
    const stateScore = Math.min(25, Math.round((matchedStates.length / tender.statesCovered.length) * 25));
    score += stateScore;
    reasons.push(`Covers ${matchedStates.length}/${tender.statesCovered.length} required states`);
  } else {
    disqualifiers.push('No authorized states overlap with tender requirements');
  }

  // 3. Verification status
  const eligibility = tender.eligibilityCriteria;
  if (eligibility.mustBeVerified !== false) {
    if (recycler.verificationStatus === 'VERIFIED') {
      score += 15;
      reasons.push('Verified recycler');
    } else {
      disqualifiers.push(`Verification status is ${recycler.verificationStatus} (VERIFIED required)`);
    }
  }

  // 4. Rating threshold
  if (eligibility.minRating && recycler.overallRating !== undefined) {
    if (recycler.overallRating >= eligibility.minRating) {
      score += 10;
      reasons.push(`Rating ${recycler.overallRating.toFixed(1)} meets minimum ${eligibility.minRating}`);
    } else {
      disqualifiers.push(`Rating ${recycler.overallRating.toFixed(1)} below minimum ${eligibility.minRating}`);
    }
  } else if (!eligibility.minRating) {
    score += 5; // no rating requirement — partial credit
  }

  // 5. Capacity check (recycler must handle ≥ 50 % of required qty)
  if (eligibility.minCapacityPerMonth && recycler.capacityPerMonth !== undefined) {
    const required = eligibility.minCapacityPerMonth;
    if (recycler.capacityPerMonth >= required * 0.5) {
      score += 10;
      reasons.push(`Monthly capacity ${recycler.capacityPerMonth} MT meets 50% threshold`);
    } else {
      disqualifiers.push(
        `Monthly capacity ${recycler.capacityPerMonth} MT below 50% of required ${required} MT`
      );
    }
  }

  // 6. Required certifications
  if (eligibility.requiredCertifications && eligibility.requiredCertifications.length > 0) {
    const missing = eligibility.requiredCertifications.filter(
      (c) => !recycler.certifications.includes(c)
    );
    if (missing.length === 0) {
      score += 5;
      reasons.push('All required certifications held');
    } else {
      disqualifiers.push(`Missing certifications: ${missing.join(', ')}`);
    }
  }

  const matched = disqualifiers.length === 0 && categoryMatch && matchedStates.length > 0;

  return { matched, score: Math.min(100, score), reasons, disqualifiers };
}

/**
 * Ranks a list of recyclers against a tender, returning only matched ones sorted by score.
 */
export function rankRecyclersForTender(
  recyclers: Array<RecyclerProfile & { id: string; name: string }>,
  tender: TenderMatchInput
): Array<{ id: string; name: string; score: number; reasons: string[] }> {
  return recyclers
    .map((r) => {
      const result = matchRecyclerToTender(r, tender);
      return { id: r.id, name: r.name, score: result.score, reasons: result.reasons, matched: result.matched };
    })
    .filter((r) => r.matched)
    .sort((a, b) => b.score - a.score);
}

/**
 * Returns true if a tender's submission deadline has passed.
 */
export function isTenderExpired(submissionDeadline: string | null | undefined): boolean {
  if (!submissionDeadline) return false;
  return new Date(submissionDeadline) < new Date();
}

/**
 * Returns days remaining until submission deadline.
 * Returns Infinity if no deadline set.
 */
export function daysUntilTenderDeadline(submissionDeadline: string | null | undefined): number {
  if (!submissionDeadline) return Infinity;
  const diff = new Date(submissionDeadline).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Returns an urgency label for deadline proximity.
 */
export function tenderDeadlineUrgency(
  submissionDeadline: string | null | undefined
): 'expired' | 'critical' | 'warning' | 'normal' {
  const days = daysUntilTenderDeadline(submissionDeadline);
  if (days <= 0) return 'expired';
  if (days <= 2) return 'critical';
  if (days <= 7) return 'warning';
  return 'normal';
}
