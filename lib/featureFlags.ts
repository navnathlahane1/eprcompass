/**
 * Feature flags for the EPR platform.
 *
 * Server-side flags read from environment variables.
 * Client-safe flags use the NEXT_PUBLIC_ prefix.
 *
 * Usage:
 *   import { FEATURE_FLAGS } from '@/lib/featureFlags';
 *   if (FEATURE_FLAGS.TYRE_EPR_ENABLED) { ... }
 */

export const FEATURE_FLAGS = {
  /**
   * Tyre EPR category. Default: false (coming soon).
   * Set NEXT_PUBLIC_ENABLE_TYRE_EPR=true in .env to enable.
   */
  TYRE_EPR_ENABLED:
    process.env.NEXT_PUBLIC_ENABLE_TYRE_EPR === 'true',

  /**
   * Export to Excel/PDF on the Unified EPR Dashboard.
   * Default: true (enabled for all roles except Viewer).
   */
  EPR_DASHBOARD_EXPORT_ENABLED:
    process.env.NEXT_PUBLIC_EPR_DASHBOARD_EXPORT !== 'false',

  /**
   * Recycler / PRO Network Management module.
   * Global kill-switch — if false, the entire module is hidden for everyone.
   * Per-client granularity is enforced via the client_feature_flags table.
   * Default: true (per-client opt-in still required).
   */
  RECYCLER_NETWORK_ENABLED:
    process.env.NEXT_PUBLIC_ENABLE_RECYCLER_NETWORK !== 'false',

  /**
   * Recycler-facing portal (Tender Alerts, Auctions, CPCB, Requests).
   * Default: true.
   */
  RECYCLER_PORTAL_ENABLED:
    process.env.NEXT_PUBLIC_ENABLE_RECYCLER_PORTAL !== 'false',

  /**
   * AI-based tender-to-recycler matching (falls back to rule-based).
   * Default: false.
   */
  AI_TENDER_MATCHING:
    process.env.NEXT_PUBLIC_AI_TENDER_MATCHING === 'true',

  /**
   * ML-based reserve price / pricing hints for auctions.
   * Default: false.
   */
  AUCTION_ML_PRICING:
    process.env.NEXT_PUBLIC_AUCTION_ML_PRICING === 'true',

  /**
   * Auto-scrape CPCB website for new alerts.
   * Default: false (requires backend cron).
   */
  CPCB_AUTO_SCRAPER:
    process.env.NEXT_PUBLIC_CPCB_AUTO_SCRAPER === 'true',

  /**
   * AI-assisted negotiation suggestions inside corporate request threads.
   * Default: false.
   */
  AI_NEGOTIATION_ASSIST:
    process.env.NEXT_PUBLIC_AI_NEGOTIATION_ASSIST === 'true',

  /**
   * WhatsApp notification channel.
   * Default: false (opt-in per recycler).
   */
  WHATSAPP_NOTIFICATIONS:
    process.env.NEXT_PUBLIC_WHATSAPP_NOTIFICATIONS === 'true',
} as const;
