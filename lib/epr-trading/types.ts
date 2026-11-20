// [MODULE] Core Trading Types
// [PURPOSE] Shared TS contracts for order book, negotiation rooms, deals, compliance, and notifications.
// [DEPENDENCIES] none

export type TradingRole = 'BRAND' | 'RECYCLER' | 'ADMIN' | 'PRO';
export type WasteCategory = 'plastic' | 'ewaste' | 'battery' | 'tyre';
export type OrderSide = 'buy' | 'sell';
export type NegotiationStatus =
  | 'open'
  | 'in_discussion'
  | 'terms_agreed'
  | 'pending_reveal'
  | 'deal_closed'
  | 'cancelled';

export type ComplianceGrade = 'verified' | 'pending' | 'unverified';

// [UPGRADE] Added status, createdAt, turnaroundDays to match SQL trading_orders schema.
export type OrderStatus = 'open' | 'partially_filled' | 'matched' | 'expired' | 'cancelled';

export interface TradingOrder {
  id: string;
  traderId: string;
  side: OrderSide;
  category: WasteCategory;
  subcategory?: string;
  quantityMt: number;
  pricePerMt: number;
  currency: 'INR' | 'AED' | 'USD';
  geography?: string;
  complianceDeadline?: string;
  complianceGrade: ComplianceGrade;
  certifications: string[];
  status: OrderStatus; // [UPGRADE] Required: matches order_status enum in SQL
  turnaroundDays?: number;
  expiresAt: string;
  createdAt: string;
}

export interface MarketDepthPoint {
  side: OrderSide;
  category: WasteCategory;
  currency: string;
  priceBand: number;
  totalQuantityMt: number;
  ordersCount: number;
}

export interface NegotiationMessage {
  id: string;
  roomId: string;
  senderTraderId: string;
  redactedPreview: string;
  createdAt: string;
}

export interface NegotiationRoom {
  id: string;
  brandTraderId: string;
  recyclerTraderId: string;
  status: NegotiationStatus;
  terms: Record<string, unknown>;
  expiresAt: string;
  createdAt: string; // [UPGRADE] Matches SQL negotiation_rooms.created_at
}

export interface TradingDeal {
  id: string;
  roomId: string;
  category: WasteCategory;
  quantityMt: number;
  agreedPricePerMt: number;
  currency: 'INR' | 'AED' | 'USD';
  escrowStatus: 'awaiting_deposit' | 'funded' | 'released' | 'refunded' | 'disputed';
  identityRevealed: boolean;
}

export interface MatchScoreBreakdown {
  quantityScore: number;
  priceScore: number;
  geoScore: number;
  categoryScore: number;
  subcategoryScore: number;
  complianceScore: number;
  historicalSuccessScore: number;
}

export interface MatchCandidate {
  order: TradingOrder;
  score: number;
  breakdown: MatchScoreBreakdown;
}
