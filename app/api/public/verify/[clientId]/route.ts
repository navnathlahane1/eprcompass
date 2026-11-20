import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { publicVerification } from '@/lib/compliance/publicVerification';

export const revalidate = 3600;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function maskGstin(gstin: string | null) {
  if (!gstin) return 'Not Available';
  if (gstin.length <= 6) return `${gstin}*****`;
  return `${gstin.slice(0, 6)}*****`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600'
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(_request: Request, { params }: { params: Promise<{ clientId: string }> }) {
  const { clientId } = await params;
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Verification service temporarily unavailable' },
        { status: 503, headers: corsHeaders() }
      );
    }

    const { data: client } = await (supabase as any)
      .from('clients')
      .select('id, profile_id, status, public_verify_id')
      .eq('public_verify_id', clientId)
      .maybeSingle();

    if (!client?.id) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404, headers: corsHeaders() });
    }

    const [{ data: profile, error: profileError }, { data: services, error: servicesError }] = await Promise.all([
      (supabase as any).from('profiles').select('company_name, gstin').eq('id', client.profile_id).maybeSingle(),
      (supabase as any)
        .from('services')
        .select('waste_category, status, due_date')
        .eq('client_id', client.id)
        .order('due_date', { ascending: false })
    ]);
    if (profileError || servicesError) throw new Error('Verification data unavailable');

    const serviceRows = services || [];
    const categories = Array.from(new Set(serviceRows.map((row: any) => row.waste_category)));

    const verification = publicVerification(serviceRows);

    const payload = {
      success: true,
      data: {
        company_name: profile?.company_name || 'Verified Company',
        gstin_masked: maskGstin(profile?.gstin || null),
        epr_categories_registered: categories,
        registration_status: client.status,
        ...verification,
        verified_by: 'EPR Compass',
        verification_timestamp: new Date().toISOString(),
      }
    };

    return NextResponse.json(payload, { headers: corsHeaders() });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Unable to fetch verification') },
      { status: 500, headers: corsHeaders() }
    );
  }
}

