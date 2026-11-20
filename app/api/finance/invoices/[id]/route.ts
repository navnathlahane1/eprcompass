/**
 * GET   /api/finance/invoices/[id]  — fetch invoice detail
 * PATCH /api/finance/invoices/[id]  — update invoice (status, amounts, notes, due_date)
 *
 * Special PATCH actions:
 *   action = 'mark_paid'  → sets paid_date = today, status = 'paid',
 *                           creates IAM task to create client login,
 *                           marks originating finance task completed
 *   action = 'send'       → sets status = 'sent'
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = getServiceClient();

  const { data: inv, error } = await (db as any)
    .from('invoices')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  // Enrich client name + gstin
  let clientName = 'Unknown';
  let clientGstin: string | null = null;
  let gstinVerified = false;
  if (inv.client_id) {
    const { data: cl } = await (db as any).from('clients').select('profile_id, gstin, gstin_verified').eq('id', inv.client_id).maybeSingle();
    if (cl?.profile_id) {
      const { data: p } = await db.from('profiles').select('company_name, full_name').eq('id', cl.profile_id).maybeSingle();
      clientName = (p as any)?.company_name || (p as any)?.full_name || 'Client';
    }
    clientGstin   = cl?.gstin   ?? null;
    gstinVerified = cl?.gstin_verified ?? false;
  }

  return NextResponse.json({ invoice: { ...inv, client_name: clientName, client_gstin: clientGstin, gstin_verified: gstinVerified } });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body   = await req.json().catch(() => ({}));
  const { action, status, amount_inr, tax_inr, due_date, notes } = body as {
    action?: string;
    status?: string;
    amount_inr?: number;
    tax_inr?: number;
    due_date?: string;
    notes?: string;
  };

  const db  = getServiceClient();
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  const { data: inv } = await (db as any).from('invoices').select('*').eq('id', id).maybeSingle();
  if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (action === 'mark_paid') {
    updates.status    = 'paid';
    updates.paid_date = today;
  } else if (action === 'send') {
    updates.status = 'sent';
  } else {
    if (status)       updates.status    = status;
    if (due_date)     updates.due_date  = due_date;
    if (notes !== undefined) updates.notes = notes;
    if (amount_inr !== undefined) {
      updates.amount_inr = amount_inr;
      updates.total_inr  = amount_inr + (tax_inr ?? inv.tax_inr ?? 0);
    }
    if (tax_inr !== undefined) {
      updates.tax_inr   = tax_inr;
      updates.total_inr = (amount_inr ?? inv.amount_inr ?? 0) + tax_inr;
    }
  }

  const { error: uErr } = await (db as any).from('invoices').update(updates).eq('id', id);
  if (uErr) return NextResponse.json({ error: uErr.message }, { status: 500 });

  // ── When payment is marked: trigger downstream workflow ────────────────────
  if (action === 'mark_paid') {
    // 1. Find IAM user_manager to assign client login creation task
    const { data: iamUser } = await db
      .from('profiles').select('id').eq('role', 'user_manager').eq('is_banned', false).limit(1).maybeSingle();

    await (db as any).from('portal_tasks').insert({
      title:               `Create client portal login — Invoice ${inv.invoice_no} paid`,
      description:         `Invoice ${inv.invoice_no} has been marked as paid by finance. Please create the client's portal login account to give them access.`,
      task_type:           'iam_create_client',
      status:              'pending',
      priority:            'high',
      assigned_to:         (iamUser as any)?.id ?? null,
      client_id:           inv.client_id,
      related_entity_type: 'invoice',
      related_entity_id:   id,
      due_at:              new Date(now.getTime() + 2 * 86400_000).toISOString(),
      tat_minutes:         2880,
      created_by:          actor.id,
    });

    // 2. Mark any originating finance task as completed
    await (db as any)
      .from('portal_tasks')
      .update({ status: 'completed', completed_at: now.toISOString(), completed_by: actor.id, resolution_note: `Invoice ${inv.invoice_no} paid on ${today}` })
      .in('task_type', ['finance_invoice_deal', 'finance_invoice_service', 'payment_followup'])
      .eq('client_id', inv.client_id)
      .in('status', ['pending', 'in_progress']);
  }

  return NextResponse.json({ ok: true });
}
