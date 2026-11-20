/**
 * Pure functions for auction bidding logic and validation.
 * No DB calls — all inputs must be provided.
 * Fully unit-testable.
 */

export type AuctionStatus = 'SCHEDULED' | 'LIVE' | 'EXTENDED' | 'CLOSED' | 'AWARDED' | 'CANCELLED';
export type AuctionType = 'REVERSE' | 'FORWARD';

export interface AuctionState {
  id: string;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: string;
  endTime: string;
  reservePrice?: number;
  currentBestBid?: number;
  extensionMinutes: number;
}

export interface BidValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a new bid against current auction state.
 * For REVERSE auctions: bid must be lower than current best.
 * For FORWARD auctions: bid must be higher than current best.
 */
export function validateAuctionBid(
  bidAmount: number,
  auction: AuctionState,
  currentBestBid?: number
): BidValidationResult {
  if (auction.status !== 'LIVE' && auction.status !== 'EXTENDED') {
    return { valid: false, error: `Auction is ${auction.status} — bidding not allowed` };
  }

  if (bidAmount <= 0) {
    return { valid: false, error: 'Bid amount must be positive' };
  }

  if (auction.auctionType === 'REVERSE') {
    if (currentBestBid !== undefined && bidAmount >= currentBestBid) {
      return {
        valid: false,
        error: `Bid must be lower than current best bid of ${currentBestBid}`,
      };
    }
    if (auction.reservePrice !== undefined && bidAmount < auction.reservePrice) {
      return {
        valid: false,
        error: `Bid of ${bidAmount} is below the reserve price floor`,
      };
    }
  }

  if (auction.auctionType === 'FORWARD') {
    if (currentBestBid !== undefined && bidAmount <= currentBestBid) {
      return {
        valid: false,
        error: `Bid must be higher than current best bid of ${currentBestBid}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Returns true if the auction should be auto-extended.
 * Extension triggers when a bid is placed within the last N minutes of end time.
 */
export function shouldExtendAuction(
  endTime: string,
  extensionTriggerMinutes: number = 5
): boolean {
  const msUntilEnd = new Date(endTime).getTime() - Date.now();
  const triggerMs = extensionTriggerMinutes * 60 * 1000;
  return msUntilEnd > 0 && msUntilEnd <= triggerMs;
}

/**
 * Computes the new end time after an extension.
 */
export function computeExtendedEndTime(currentEndTime: string, extensionMinutes: number): string {
  const extended = new Date(currentEndTime).getTime() + extensionMinutes * 60 * 1000;
  return new Date(extended).toISOString();
}

/**
 * Returns a human-readable countdown string (hh:mm:ss).
 */
export function formatCountdown(endTime: string): string {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return '00:00:00';
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

/**
 * Determines urgency class for countdown display.
 */
export function auctionCountdownUrgency(
  endTime: string
): 'normal' | 'warning' | 'critical' | 'ended' {
  const ms = new Date(endTime).getTime() - Date.now();
  if (ms <= 0) return 'ended';
  if (ms <= 5 * 60 * 1000) return 'critical'; // last 5 min
  if (ms <= 30 * 60 * 1000) return 'warning'; // last 30 min
  return 'normal';
}

/**
 * Computes my rank among all bids for this auction.
 * Lower amount = better rank for REVERSE; higher amount = better rank for FORWARD.
 */
export function computeMyRank(
  myBid: number,
  allBids: number[],
  auctionType: AuctionType
): number {
  const sorted =
    auctionType === 'REVERSE'
      ? [...allBids].sort((a, b) => a - b)
      : [...allBids].sort((a, b) => b - a);

  const idx = sorted.indexOf(myBid);
  return idx === -1 ? allBids.length + 1 : idx + 1;
}
