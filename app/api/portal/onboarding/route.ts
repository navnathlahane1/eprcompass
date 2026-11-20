import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { parseClientSetup } from '@/lib/onboarding/clientSetup';
import { rejectUnsafeWorkspaceWrite } from '@/lib/saas/requestGuard';

export async function PUT(req: NextRequest) {
  const rejected = rejectUnsafeWorkspaceWrite(req);
  if (rejected) return rejected;
  try {
    const actor = await resolveClientActor();
    if (!actor) return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
    if (actor.memberRole !== 'OWNER') return NextResponse.json({ error: 'Company owner access required' }, { status: 403 });
    let setup;
    let draft = false;
    try {
      const body = await req.json();
      if (body?.mode !== undefined && !['draft', 'complete'].includes(body.mode)) throw new Error('Invalid save mode');
      draft = body?.mode === 'draft';
      setup = parseClientSetup(body, { draft });
    }
    catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid setup' }, { status: 400 }); }
    const { business_activity, ...details } = setup;
    const setup_status = draft ? 'draft' : 'complete';
    const { data, error } = await adminClient().from('clients').update({ business_activity, onboarding_details: { ...details, setup_status } })
      .eq('id', actor.clientId).eq('profile_id', actor.userId).select('id').maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Company account not found' }, { status: 404 });
    return NextResponse.json({ saved: true, setup_status });
  } catch (error) {
    console.error('[client/onboarding]', error);
    return NextResponse.json({ error: 'Company setup could not be saved. Please retry.' }, { status: 503 });
  }
}
