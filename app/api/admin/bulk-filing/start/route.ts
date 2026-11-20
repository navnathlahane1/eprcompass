import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '../../../../../lib/supabase/createServerComponentClient';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function getUserRole() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return { userId: null, role: null };

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return { userId: user.id, role: profile?.role || null };
}

export async function POST(request: Request) {
  const { userId, role } = await getUserRole();
  if (!userId || !['admin', 'manager'].includes(role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const serviceType = String(body?.service_type || '').trim();
  const wasteCategory = String(body?.category || '').trim();
  const clientIds = Array.isArray(body?.client_ids) ? body.client_ids : [];
  const fy = String(body?.fy || '');
  const filingType = String(body?.filing_type || '');

  if (!serviceType || !wasteCategory || !clientIds.length) {
    return NextResponse.json({ error: 'service_type, category and client_ids are required' }, { status: 400 });
  }

  if (clientIds.length > 100) {
    return NextResponse.json({ error: 'Maximum 100 clients allowed per bulk filing job' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();

    const { data: job, error } = await (supabase as any)
      .from('bulk_filing_jobs')
      .insert({
        created_by: userId,
        service_type: serviceType,
        waste_category: wasteCategory,
        client_ids: clientIds,
        status: 'Draft',
        started_at: new Date().toISOString(),
        results: { _meta: { fy, filing_type: filingType } }
      })
      .select('id')
      .single();

    if (error || !job?.id) {
      return NextResponse.json({ error: error?.message || 'Failed to create job' }, { status: 500 });
    }

    const fnUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/bulk-filing-processor`;
    void fetch(fnUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ''}`,
        'x-idempotency-key': `bulk-filing:${job.id}`
      },
      body: JSON.stringify({ job_id: job.id })
    }).catch(() => null);

    return NextResponse.json({ job_id: job.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
