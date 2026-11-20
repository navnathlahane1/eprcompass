import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { signOnboardingToken } from '@/lib/onboarding/templates';

export async function POST(request: Request) {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager'].includes(profile?.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const checklistId = String(body?.checklist_id || '').trim();
  if (!checklistId) return NextResponse.json({ error: 'checklist_id is required' }, { status: 400 });

  try {
    const token = signOnboardingToken(checklistId, 30);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    return NextResponse.json({ url: `${siteUrl}/onboarding/${token}` });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to sign token' }, { status: 500 });
  }
}
