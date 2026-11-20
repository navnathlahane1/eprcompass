import { AUTH_CALLBACK_URL } from '@/lib/auth/config';

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Please request a reset from the EPR Compass website.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return Response.json({ error: 'Password recovery is unavailable. Please contact support.' }, { status: 503 });
  try {
    // Supabase enforces its shared email limits. Preserve its Retry-After
    // response instead of sending repeated requests from the browser.
    const endpoint = new URL('/auth/v1/recover', url);
    endpoint.searchParams.set('redirect_to', new URL('/auth/reset-password', AUTH_CALLBACK_URL).href);
    const result = await fetch(endpoint, {
      method: 'POST',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const payload = await result.json().catch(() => ({}));
    if (result.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(payload.code)) {
      const retryHeader = result.headers.get('retry-after');
      const retry = retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader)
        : retryHeader && Number.isFinite(Date.parse(retryHeader)) ? Math.ceil((Date.parse(retryHeader) - Date.now()) / 1000) : null;
      const retryAfter = Math.max(1, retry ?? (payload.code === 'over_email_send_rate_limit' ? 3600 : 60));
      return Response.json({ error: 'Password reset email limit reached. Please wait before trying again, or contact support if this continues.', retryAfter, estimated: retry === null }, { status: 429, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } });
    }
    if (!result.ok) return Response.json({ error: 'Unable to send a reset email right now. Please contact support or try again later.' }, { status: 503 });
    return Response.json({ message: 'If an account exists for this email, a password reset link will be sent.', retryAfter: 60 }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Password recovery is temporarily unavailable. Please try again later.' }, { status: 503 });
  }
}

