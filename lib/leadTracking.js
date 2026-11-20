import { trackEvent } from "./analytics";

const ATTRIBUTION_STORAGE_KEY = "epr_lead_attribution_v1";

export function getPageCluster(pathname) {
  const path = String(pathname || "").toLowerCase();
  if (path.startsWith("/services")) return "services";
  if (path.startsWith("/blog")) return "blog";
  if (path.startsWith("/about") || path.startsWith("/about-us")) return "about";
  if (path.startsWith("/training") || path.startsWith("/webinar")) return "training";
  return "general";
}

export function getLeadAttribution(pathname) {
  if (typeof window === "undefined") {
    return {
      page_path: pathname || null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      gclid: null,
      fbclid: null,
    };
  }

  const search = new URLSearchParams(window.location.search || "");
  const incoming = {
    utm_source: search.get("utm_source"),
    utm_medium: search.get("utm_medium"),
    utm_campaign: search.get("utm_campaign"),
    utm_term: search.get("utm_term"),
    utm_content: search.get("utm_content"),
    gclid: search.get("gclid"),
    fbclid: search.get("fbclid"),
  };

  let cached = {};
  try {
    cached = JSON.parse(sessionStorage.getItem(ATTRIBUTION_STORAGE_KEY) || "{}");
  } catch {
    cached = {};
  }

  const merged = {
    utm_source: incoming.utm_source || cached.utm_source || null,
    utm_medium: incoming.utm_medium || cached.utm_medium || null,
    utm_campaign: incoming.utm_campaign || cached.utm_campaign || null,
    utm_term: incoming.utm_term || cached.utm_term || null,
    utm_content: incoming.utm_content || cached.utm_content || null,
    gclid: incoming.gclid || cached.gclid || null,
    fbclid: incoming.fbclid || cached.fbclid || null,
  };

  try {
    sessionStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors and continue with in-memory attribution.
  }

  return {
    page_path: pathname || window.location.pathname || null,
    ...merged,
  };
}

export function trackLeadEvent(eventName, payload = {}) {
  if (typeof window === "undefined") return;

  trackEvent(eventName, payload);

}
