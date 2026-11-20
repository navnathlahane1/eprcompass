import { NextRequest, NextResponse } from 'next/server';
import { resolveCommsActor, getCommsAdminClient } from '@/lib/comms/auth';
import { checkCommsPermission } from '@/lib/comms/permissions';

// Allowed workflow transitions per action
const TRANSITIONS: Record<string, { from: string[]; to: string; verb: 'approve' | 'publish' | 'create' }> = {
  submit_review:    { from: ['draft'],                 to: 'in_review', verb: 'create'  },
  approve:          { from: ['in_review'],             to: 'approved',  verb: 'approve' },
  reject:           { from: ['in_review','approved'],  to: 'draft',     verb: 'approve' },
  schedule:         { from: ['approved'],              to: 'scheduled', verb: 'approve' },
  reschedule_update:{ from: ['scheduled'],             to: 'scheduled', verb: 'approve' },
  publish:          { from: ['approved','scheduled'],  to: 'published', verb: 'publish' },
  revert:           { from: ['scheduled'],             to: 'approved',  verb: 'approve' },
  archive:          { from: ['published'],             to: 'archived',  verb: 'approve' },
};

// POST /api/comms/content/[id]/approve
// Body: { action: 'submit_review'|'approve'|'reject'|'schedule'|'publish'|'revert'|'archive', notes?, scheduled_at? }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveCommsActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id }     = await params;
  const { action, notes, scheduled_at } = await req.json();

  const transition = TRANSITIONS[action];
  if (!transition) {
    return NextResponse.json({ error: `Unknown action "${action}"` }, { status: 400 });
  }

  const canDo = await checkCommsPermission(actor.role, transition.verb);
  if (!canDo) {
    return NextResponse.json({ error: `Forbidden: "${transition.verb}" permission required` }, { status: 403 });
  }

  const client = getCommsAdminClient();

  const { data: item } = await client
    .from('comms_content_items')
    .select('id, status')
    .eq('id', id)
    .eq('is_deleted', false)
    .maybeSingle();

  if (!item) return NextResponse.json({ error: 'Content item not found' }, { status: 404 });

  if (!transition.from.includes(item.status)) {
    return NextResponse.json({
      error: `Cannot "${action}" a content item with status "${item.status}". Expected: ${transition.from.join(' or ')}`,
    }, { status: 422 });
  }

  const updates: Record<string, unknown> = {
    status:     transition.to,
    updated_at: new Date().toISOString(),
  };

  if (action === 'approve') {
    updates.approved_by = actor.id;
    updates.approved_at = new Date().toISOString();
  }
  if (action === 'publish') {
    updates.published_at = new Date().toISOString();
  }
  if ((action === 'schedule' || action === 'reschedule_update') && scheduled_at) {
    updates.scheduled_at = scheduled_at;
  }
  if (action === 'reject') {
    updates.approved_by = null;
    updates.approved_at = null;
  }

  const { error } = await client
    .from('comms_content_items')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await client.from('comms_content_audit').insert({
    content_id:  id,
    actor_id:    actor.id,
    actor_email: actor.email,
    action,
    from_status: item.status,
    to_status:   transition.to,
    notes:       notes ?? null,
  });

  return NextResponse.json({ success: true, newStatus: transition.to });
}
