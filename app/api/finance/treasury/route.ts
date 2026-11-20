/**
 * GET /api/finance/treasury
 * Treasury overview — bank accounts, totals, cash position.
 */
import { NextResponse } from 'next/server';
import { resolveFinanceUser, getServiceClient } from '@/lib/finance/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const actor = await resolveFinanceUser();
    if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!actor.isCFO) return NextResponse.json({ error: 'Forbidden — CFO access only' }, { status: 403 });

    const db = getServiceClient();

    const { data: accounts, error } = await (db as any)
      .from('finance_bank_accounts')
      .select('*')
      .eq('is_active', true)
      .order('balance_inr', { ascending: false });

    if (error && error.code !== 'PGRST116') throw new Error(error.message);

    const rows: any[] = accounts ?? [];

    const totalBalance   = rows.reduce((s: number, r: any) => s + (r.balance_inr ?? 0), 0);
    const totalAvailable = rows.reduce((s: number, r: any) => s + (r.available_balance_inr ?? 0), 0);

    const byType: Record<string, { count: number; balance: number }> = {};
    for (const r of rows) {
      const t = r.account_type ?? 'other';
      if (!byType[t]) byType[t] = { count: 0, balance: 0 };
      byType[t].count   += 1;
      byType[t].balance += (r.balance_inr ?? 0);
    }

    // Cash forecast — last 6 months + next 6 months if data exists
    const { data: forecastRaw } = await (db as any)
      .from('finance_cash_forecast')
      .select('*')
      .order('period', { ascending: true });

    const forecast: any[] = forecastRaw ?? [];

    return NextResponse.json({
      summary: {
        totalBalance,
        totalAvailable,
        accountCount: rows.length,
      },
      accounts: rows,
      byType,
      forecast,
    });
  } catch (err: any) {
    console.error('[finance/treasury] GET error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to load treasury data', detail: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const actor = await resolveFinanceUser();
    if (!actor || !actor.isCFO) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const db   = getServiceClient();

    const { data, error } = await (db as any)
      .from('finance_bank_accounts')
      .insert({
        name:                 body.name,
        bank_name:            body.bank_name,
        account_number_mask:  body.account_number_mask,
        ifsc_code:            body.ifsc_code,
        account_type:         body.account_type ?? 'current',
        balance_inr:          body.balance_inr ?? 0,
        available_balance_inr: body.available_balance_inr ?? body.balance_inr ?? 0,
        as_of_date:           body.as_of_date,
        notes:                body.notes,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ account: data }, { status: 201 });
  } catch (err: any) {
    console.error('[finance/treasury] POST error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to create bank account', detail: err?.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const actor = await resolveFinanceUser();
    if (!actor || !actor.isCFO) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const db = getServiceClient();
    const { data, error } = await (db as any)
      .from('finance_bank_accounts')
      .update({
        balance_inr:           body.balance_inr,
        available_balance_inr: body.available_balance_inr,
        as_of_date:            body.as_of_date,
        notes:                 body.notes,
      })
      .eq('id', body.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json({ account: data });
  } catch (err: any) {
    console.error('[finance/treasury] PATCH error:', err?.message ?? err);
    return NextResponse.json({ error: 'Failed to update bank account', detail: err?.message }, { status: 500 });
  }
}
