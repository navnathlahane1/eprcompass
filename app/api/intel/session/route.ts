import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { checkIntelAccess } from '@/lib/intel/server';

export async function GET() {
  const headers = { 'Cache-Control': 'private, no-store' };
  try {
    const session = await createServerComponentClient();
    const { data: { user }, error } = await session.auth.getUser();
    if (error || !user) return NextResponse.json({ error: 'Your browser session could not be verified. Allow cookies and try signing in again.' }, { status: 401, headers });
    const access = await checkIntelAccess(session, user, process.env);
    if (access === 'unavailable') return NextResponse.json({ error: 'Intel access verification is temporarily unavailable. Contact your administrator.' }, { status: 503, headers });
    if (access !== 'allowed') return NextResponse.json({ error: 'Your account is signed in but is not authorized for Intel. Ask your administrator to enable Intel access.' }, { status: 403, headers });
    return NextResponse.json({ allowed: true }, { headers });
  } catch {
    return NextResponse.json({ error: 'Intel sign-in is not fully configured. Contact your administrator.' }, { status: 503, headers });
  }
}
