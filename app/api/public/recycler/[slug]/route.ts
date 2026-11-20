/**
 * GET /api/public/recycler/[slug] — public verified profile (no auth required)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = db();

  const { data: recycler } = await (client as any)
    .from('recyclers')
    .select('id, name, recycler_code, verification_status, city, state, epr_categories, authorized_states, certifications, public_profile_enabled, public_bio, public_highlights, onboarded_at')
    .eq('public_slug', slug)
    .maybeSingle();

  if (!recycler || !recycler.public_profile_enabled) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const [ratingsRes, reviewsRes] = await Promise.all([
    (client as any).from('recycler_ratings').select('overall_score').eq('recycler_id', recycler.id),
    (client as any).from('recycler_reviews')
      .select('reviewer_name, reviewer_org, rating, title, body, created_at')
      .eq('recycler_id', recycler.id).eq('is_published', true)
      .order('created_at', { ascending: false }).limit(20),
  ]);

  const ratings = ratingsRes.data ?? [];
  const overall = ratings.length
    ? Math.round((ratings.reduce((s: number, r: any) => s + Number(r.overall_score || 0), 0) / ratings.length) * 100) / 100
    : null;

  const badges: string[] = [];
  if (recycler.verification_status === 'VERIFIED') badges.push('CPCB Verified');
  if (overall != null && overall >= 4.5) badges.push('Top Rated');
  if ((recycler.certifications ?? []).length > 0) badges.push('Certified');

  // Don't leak internal id
  const { id, ...publicRecycler } = recycler;
  return NextResponse.json({
    recycler: publicRecycler,
    rating: { overall, count: ratings.length },
    reviews: reviewsRes.data ?? [],
    badges,
  });
}
