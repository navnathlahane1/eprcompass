/**
 * Resolves a configured backend URL, handling localhost-on-LAN and mixed-content edge cases.
 * Returns '' if the URL would be unreachable (production HTTPS with a localhost config).
 */
function resolveBackendUrl(configured) {
  if (!configured) return '';

  if (typeof window === 'undefined') {
    // Server-side: trust the configured URL as-is
    return configured;
  }

  const host = window.location.hostname;
  const isLoopback = host === 'localhost' || host === '127.0.0.1';

  try {
    const u = new URL(configured);
    const cfgHost = u.hostname;
    if (!isLoopback && (cfgHost === 'localhost' || cfgHost === '127.0.0.1')) {
      // On non-loopback hosts, avoid mixed-content / unreachable localhost endpoints.
      if (window.location.protocol === 'https:') return '';
      return `${window.location.protocol}//${host}${u.port ? `:${u.port}` : ''}`;
    }
  } catch {
    /* ignore invalid URLs */
  }

  return configured;
}

/**
 * Standard backend (Vercel) — forms, telecalling, payments.
 * Set NEXT_PUBLIC_API_URL in Vercel frontend env vars.
 */
export function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || '';

  if (typeof window === 'undefined') return configured;

  const host = window.location.hostname;
  const isLoopback = host === 'localhost' || host === '127.0.0.1';

  if (!configured) {
    return isLoopback ? 'http://localhost:5000' : '';
  }

  return resolveBackendUrl(configured);
}

/**
 * Intel API is same-origin Next (`/api/intel/*`).
 * Next implements export / explain / handoff / provenance / staging / gmail
 * natively and proxies remaining Intel paths to Express.
 */
export function getIntelApiBaseUrl() {
  return '';
}
