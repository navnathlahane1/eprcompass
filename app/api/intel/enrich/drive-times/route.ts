import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { driveTimes } from '@/lib/intel/googleSales';

export async function GET(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const companyId = req.nextUrl.searchParams.get('company_id') || '';
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const { data: originRow } = await auth.db
    .from('intel_google_places_data')
    .select('latitude, longitude')
    .eq('company_id', companyId)
    .maybeSingle();
  const { data: geo } = await auth.db
    .from('intel_company_geo_data')
    .select('latitude, longitude')
    .eq('company_id', companyId)
    .maybeSingle();
  const lat = Number(originRow?.latitude ?? geo?.latitude);
  const lng = Number(originRow?.longitude ?? geo?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Company has no map pin yet — run Google Maps enrich first' }, { status: 400 });
  }

  const { data: recyclers } = await auth.db
    .from('intel_recycler_authorizations')
    .select('company_id')
    .limit(80);
  const recyclerIds = [...new Set((recyclers || []).map((r) => r.company_id).filter((id) => id !== companyId))];
  let destQuery = auth.db
    .from('intel_company_geo_data')
    .select('company_id, normalized_company_name, latitude, longitude')
    .not('latitude', 'is', null)
    .neq('company_id', companyId)
    .limit(20);
  if (recyclerIds.length) destQuery = destQuery.in('company_id', recyclerIds.slice(0, 20));
  const { data: dests } = await destQuery;
  const points = (dests || [])
    .map((d) => ({
      company_id: d.company_id,
      company_name: d.normalized_company_name || d.company_id,
      lat: Number(d.latitude),
      lng: Number(d.longitude),
    }))
    .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
    .slice(0, 15);

  try {
    const legs = await driveTimes({ lat, lng }, points);
    legs.sort((a, b) => (a.duration_min ?? 9e9) - (b.duration_min ?? 9e9));
    return NextResponse.json({ ok: true, origin: { lat, lng }, legs });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Distance Matrix failed' }, { status: 502 });
  }
}
