/**
 * GET  /api/finance/invoices  — list all invoices (with client name enrichment)
 * POST /api/finance/invoices  — create a new invoice
 *
 * Query params (GET):
 *   status  = draft | sent | paid | overdue | cancelled
 *   search  = client name substring
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sp           = req.nextUrl.searchParams;
  const statusFilter = sp.get('status') || '';
  const search       = sp.get('search') || '';

  const db  = getServiceClient();
  const now = new Date().toISOString().split('T')[0];

  // Auto-mark overdue before returning
  await (db as any)
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('status', 'sent')
    .lt('due_date', now);

  let q = (db as any)
    .from('invoices')
    .select('id, client_id, invoice_no, amount_inr, tax_inr, total_inr, issued_date, due_date, paid_date, status, notes, created_at, service_id, pdf_path')
    .order('created_at', { ascending: false });

  if (statusFilter) q = q.eq('status', statusFilter);

  const { data: invoices, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows: any[] = invoices ?? [];

  // Enrich with client names
  const clientIds = [...new Set(rows.map(i => i.client_id).filter(Boolean))];
  const clientNameMap: Record<string, string> = {};
  if (clientIds.length) {
    const { data: cls } = await (db as any).from('clients').select('id, profile_id').in('id', clientIds);
    const pids = (cls ?? []).map((c: any) => c.profile_id).filter(Boolean);
    if (pids.length) {
      const { data: profs } = await db.from('profiles').select('id, company_name, full_name').in('id', pids);
      const pm: Record<string, string> = {};
      for (const p of profs ?? []) pm[(p as any).id] = (p as any).company_name || (p as any).full_name || 'Client';
      for (const c of cls ?? []) clientNameMap[(c as any).id] = pm[(c as any).profile_id] || 'Client';
    }
  }

  let enriched = rows.map(i => ({ ...i, client_name: clientNameMap[i.client_id] || 'Unknown' }));

  if (search) {
    const q2 = search.toLowerCase();
    enriched = enriched.filter(i =>
      i.client_name.toLowerCase().includes(q2) ||
      (i.invoice_no || '').toLowerCase().includes(q2)
    );
  }

  const summary = {
    total:      enriched.length,
    draft:      enriched.filter(i => i.status === 'draft').length,
    sent:       enriched.filter(i => i.status === 'sent').length,
    paid:       enriched.filter(i => i.status === 'paid').length,
    overdue:    enriched.filter(i => i.status === 'overdue').length,
    cancelled:  enriched.filter(i => i.status === 'cancelled').length,
    totalValue: enriched.reduce((s, i) => s + (i.total_inr ?? 0), 0),
    collected:  enriched.filter(i => i.status === 'paid').reduce((s, i) => s + (i.total_inr ?? 0), 0),
    outstanding: enriched.filter(i => !['paid','cancelled'].includes(i.status)).reduce((s, i) => s + (i.total_inr ?? 0), 0),
  };

  return NextResponse.json({ invoices: enriched, summary });
}

export async function POST(req: NextRequest) {
  const actor = await resolveFinanceUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const {
    client_id, invoice_no, amount_inr, tax_inr, due_date,
    notes, service_id, task_id,
  } = body as {
    client_id: string;
    invoice_no?: string;
    amount_inr: number;
    tax_inr?: number;
    due_date?: string;
    notes?: string;
    service_id?: string;
    task_id?: string;  // link to originating portal_task
  };

  if (!client_id || !amount_inr) {
    return NextResponse.json({ error: 'client_id and amount_inr are required' }, { status: 400 });
  }

  const db  = getServiceClient();
  const today = new Date().toISOString().split('T')[0];

  // Auto-generate invoice number if not provided
  let invNo = invoice_no;
  if (!invNo) {
    const { data: last } = await (db as any)
      .from('invoices')
      .select('invoice_no')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const lastNum = parseInt((last?.invoice_no || 'INV-0000').replace(/[^0-9]/g, '')) || 0;
    invNo = `INV-${String(lastNum + 1).padStart(4, '0')}`;
  }

  const tax   = tax_inr ?? 0;
  const total = amount_inr + tax;

  const { data, error } = await (db as any)
    .from('invoices')
    .insert({
      client_id,
      service_id:  service_id || null,
      invoice_no:  invNo,
      amount_inr,
      tax_inr:     tax,
      total_inr:   total,
      issued_date: today,
      due_date:    due_date || null,
      status:      'draft',
      notes:       notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If created from a finance task, update that task to in_progress
  if (task_id) {
    await (db as any)
      .from('portal_tasks')
      .update({ status: 'in_progress', resolution_note: `Invoice ${invNo} created` })
      .eq('id', task_id);
  }

  return NextResponse.json({ invoice: data }, { status: 201 });
}
