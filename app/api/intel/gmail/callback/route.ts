import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const stateToken = searchParams.get('state');

  if (error || !code) {
    return NextResponse.redirect(new URL('/intel/staging?gmail=denied', req.url));
  }

  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  // Get Gmail user email
  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const profile = await profileRes.json();
  const gmailEmail = profile.email;

  if (!gmailEmail) {
    return NextResponse.redirect(new URL('/intel/staging?gmail=error', req.url));
  }

  // Resolve the portal user from state token (base64 encoded user id)
  let userId: string | null = null;
  if (stateToken) {
    try { userId = Buffer.from(stateToken, 'base64').toString('utf8'); } catch {}
  }

  if (!userId) {
    return NextResponse.redirect(new URL('/intel/staging?gmail=error', req.url));
  }

  const supabase = db();
  await supabase.from('email_accounts').upsert({
    user_id: userId,
    email: gmailEmail,
    provider: 'gmail',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token!,
    token_expiry: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
  }, { onConflict: 'email' });

  return NextResponse.redirect(new URL('/intel/staging?gmail=connected', req.url));
}
