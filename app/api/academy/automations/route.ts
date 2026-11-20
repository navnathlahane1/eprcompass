/**
 * GET   /api/academy/automations  — list automation rules
 * PATCH /api/academy/automations  — toggle a rule's status
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const DEFAULT_RULES = [
  { id: '1', trigger: 'Enrollment confirmed', action: 'Welcome email + WhatsApp sent immediately', delay: 'Immediately', status: 'active' },
  { id: '2', trigger: 'Session starts in 24 hours', action: 'Zoom link reminder via Email + WhatsApp', delay: '24 hrs before', status: 'active' },
  { id: '3', trigger: 'Assignment due in 48 hours', action: 'Assignment due reminder sent via Email', delay: '48 hrs before', status: 'active' },
  { id: '4', trigger: 'Session completed', action: 'Feedback survey sent via WhatsApp', delay: '4 hrs after', status: 'active' },
  { id: '5', trigger: 'Certificate issued', action: 'PDF download link + LinkedIn share prompt', delay: 'Immediately', status: 'active' },
  { id: '6', trigger: 'Tier 1 program completed', action: 'Tier 2 upgrade offer with ₹500 discount', delay: '3 days after', status: 'active' },
  { id: '7', trigger: 'Partner monthly payout processed', action: 'Payout notification via WhatsApp + Email', delay: 'Immediately', status: 'active' },
  { id: '8', trigger: 'EMI payment overdue by 3 days', action: 'Payment reminder via Email + WhatsApp', delay: '3 days overdue', status: 'paused' },
];

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const { data, error } = await (db as any)
    .from('academy_automation_rules')
    .select('id, trigger, action, delay, status, fired_count, last_fired_at')
    .order('id', { ascending: true });

  if (error) {
    return NextResponse.json({ rules: DEFAULT_RULES, source: 'defaults' });
  }

  const rules = data && data.length > 0 ? data : DEFAULT_RULES;
  return NextResponse.json({ rules, source: data && data.length > 0 ? 'db' : 'defaults' });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, status } = body;

  if (!id || !['active', 'paused'].includes(status)) {
    return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
  }

  const db = getServiceClient();

  const { error } = await (db as any)
    .from('academy_automation_rules')
    .update({ status })
    .eq('id', id);

  if (error) {
    if (error.code === '42P01') {
      return NextResponse.json({ ok: true, persisted: false });
    }
    return NextResponse.json({ error: 'Failed to update automation' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, persisted: true });
}
