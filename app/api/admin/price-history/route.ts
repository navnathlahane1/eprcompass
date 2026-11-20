import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { checkPriceAlerts } from '@/lib/marketplace/price-alerts';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

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
  const { waste_category, rate_inr, recorded_date, source, notes } = body;

  if (!waste_category || !rate_inr || !recorded_date) {
    return NextResponse.json({ error: 'waste_category, rate_inr and recorded_date are required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data: entry, error } = await (admin as any)
    .from('credit_price_history')
    .insert({
      waste_category,
      rate_inr: Number(rate_inr),
      recorded_date,
      source: source || null,
      notes: notes || null,
      recorded_by: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Run alert engine asynchronously (don't block response)
  checkPriceAlerts(waste_category, Number(rate_inr)).catch((err: any) => {
    console.error('[price-history] alert engine error:', err?.message);
  });

  return NextResponse.json({ entry });
}
