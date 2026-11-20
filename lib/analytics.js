/**
 * Shared Amplitude tracking helper. Mirrors the dynamic-import pattern used
 * in components/AmplitudeInit.jsx so the SDK is only loaded client-side.
 * Never throws — analytics failures must not break app functionality.
 */
import { analyticsAllowed, safeAnalyticsProperties } from './analyticsPrivacy';
let amplitudeModule = null;

const AMPLITUDE_INIT_PROMISE = "__eprCompassAmplitudeInitPromise";

function loadAmplitude() {
  if (typeof window === "undefined") return null;
  if (!amplitudeModule) {
    amplitudeModule = import("@amplitude/unified");
  }
  return amplitudeModule;
}

function serverZone() {
  return process.env.NEXT_PUBLIC_AMPLITUDE_SERVER_ZONE?.toUpperCase() === "EU" ? "EU" : "US";
}

/**
 * Initializes the one shared Amplitude client used by the entire application.
 * The promise is stored on window so React Strict Mode and hot reloads cannot
 * create a second client. A missing key disables analytics without failing UI.
 */
export function initializeAmplitude() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!analyticsAllowed()) return Promise.resolve(null);

  if (window[AMPLITUDE_INIT_PROMISE]) return window[AMPLITUDE_INIT_PROMISE];

  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY?.trim();
  if (!apiKey) return Promise.resolve(null);

  window[AMPLITUDE_INIT_PROMISE] = loadAmplitude()
    .then(async (amplitude) => {
      if (!analyticsAllowed()) return null;
      await amplitude.initAll(apiKey, {
        serverZone: serverZone(),
        analytics: {
          fetchRemoteConfig: false,
          autocapture: false,
        },
        sessionReplay: { sampleRate: 0 },
      });
      return amplitude;
    })
    .catch(() => {
      // Allow a later retry after a transient SDK/network initialization error.
      delete window[AMPLITUDE_INIT_PROMISE];
      return null;
    });

  return window[AMPLITUDE_INIT_PROMISE];
}

// Distinguishes local/dev traffic from real production traffic in every
// event, since this project uses a single Amplitude API key for all
// environments (no separate dev project).
function currentEnvironment() {
  return process.env.NODE_ENV === "production" ? "production" : "development";
}

/**
 * @param {string} eventName
 * @param {Record<string, unknown>} [properties]
 */
export function trackEvent(eventName, properties = {}) {
  initializeAmplitude()
    .then((amplitude) =>
      analyticsAllowed() && amplitude?.track(eventName, safeAnalyticsProperties({ ...properties, environment: currentEnvironment(), event_version: 1 }))
    )
    .catch(() => {
      // Swallow errors — tracking must stay non-blocking.
    });
}

/**
 * Ties all subsequent events in this browser session to the logged-in user,
 * and to their company (Amplitude Group Analytics) when one is known.
 * Call once per portal session, right after the user's identity is resolved.
 */
/**
 * @param {{ userId?: string, email?: string, role?: string, portal?: string, companyName?: string, workspaceId?: string }} [params]
 */
export function identifyUser({ userId, role, portal, workspaceId } = {}) {
  if (!userId) return;

  initializeAmplitude()
    .then((amplitude) => {
      if (!amplitude || !analyticsAllowed()) return;
      amplitude.setUserId(userId);

      const identify = new amplitude.Identify();
      if (role) identify.set("role", role);
      if (portal) identify.set("portal", portal);
      amplitude.identify(identify);

      amplitude.setGroup('company', []);
      amplitude.setGroup('workspace', workspaceId ? [workspaceId] : []);
    })
    .catch(() => {
      // Swallow errors — identification must stay non-blocking.
    });
}

/**
 * Records a purchase through Amplitude's Revenue API (powers Revenue/LTV
 * charts), in addition to the plain trackEvent("Purchase Completed", ...)
 * calls already in place. Amounts are in INR (whole rupees).
 */
/**
 * @param {{ amount?: number, productId?: string, quantity?: number, revenueType?: string }} [params]
 */
export function trackRevenue({ amount, productId, quantity = 1, revenueType = "purchase" } = {}) {
  if (!amount) return;

  initializeAmplitude()
    .then((amplitude) => {
      if (!amplitude || !analyticsAllowed()) return;
      const revenue = new amplitude.Revenue()
        .setPrice(amount)
        .setQuantity(quantity)
        .setRevenueType(revenueType);
      if (productId) revenue.setProductId(productId);
      amplitude.revenue(revenue);
    })
    .catch(() => {
      // Swallow errors — revenue tracking must stay non-blocking.
    });
}

export async function resetAnalyticsIdentity() {
  if (typeof window === 'undefined' || !window[AMPLITUDE_INIT_PROMISE]) return;
  const amplitude = await window[AMPLITUDE_INIT_PROMISE];
  amplitude?.reset();
}

export async function applyAnalyticsConsent() {
  if (typeof window === 'undefined') return;
  const amplitude = await window[AMPLITUDE_INIT_PROMISE];
  if (amplitude) {
    amplitude.setOptOut(!analyticsAllowed());
    if (!analyticsAllowed()) amplitude.reset();
  } else if (analyticsAllowed()) {
    delete window[AMPLITUDE_INIT_PROMISE];
    await initializeAmplitude();
  }
}
