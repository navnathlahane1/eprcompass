/**
 * GET   /api/recycler-portal/reputation  — rating aggregate + reviews + public profile state
 * PATCH /api/recycler-portal/reputation  — toggle public profile / edit bio & slug
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
}

export async function GET() {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  const [recyclerRes, ratingsRes, reviewsRes] = await Promise.all([
    (db as any).from('recyclers')
      .select('name, recycler_code, verification_status, onboarded_at, epr_categories, authorized_states, certifications, public_profile_enabled, public_slug, public_bio, public_highlights')
      .eq('id', actor.recyclerId).maybeSingle(),
    (db as any).from('recycler_ratings')
      .select('timeliness, documentation, quantity_accuracy, compliance_score, responsiveness, overall_score, computed_at')
      .eq('recycler_id', actor.recyclerId),
    (db as any).from('recycler_reviews')
      .select('id, reviewer_name, reviewer_org, rating, title, body, created_at, is_published')
      .eq('recycler_id', actor.recyclerId).order('created_at', { ascending: false }),
  ]);

  const ratings = ratingsRes.error ? [] : (ratingsRes.data ?? []);
  const reviews = reviewsRes.error ? [] : (reviewsRes.data ?? []);

  function avg(field: string) {
    const vals = ratings.map((r: any) => Number(r[field])).filter((n: number) => !isNaN(n));
    return vals.length ? Math.round((vals.reduce((a: number, b: number) => a + b, 0) / vals.length) * 100) / 100 : null;
  }

  const aggregate = {
    overall: avg('overall_score'),
    timeliness: avg('timeliness'),
    documentation: avg('documentation'),
    quantity_accuracy: avg('quantity_accuracy'),
    compliance_score: avg('compliance_score'),
    responsiveness: avg('responsiveness'),
    rating_count: ratings.length,
    review_count: reviews.length,
  };

  // Derive badges
  const recycler = recyclerRes.data ?? {};
  const badges: string[] = [];
  if (recycler.verification_status === 'VERIFIED') badges.push('CPCB Verified');
  if (aggregate.overall != null && aggregate.overall >= 4.5) badges.push('Top Rated');
  if (aggregate.rating_count >= 10) badges.push('Trusted Partner');
  if (recycler.onboarded_at && (Date.now() - new Date(recycler.onboarded_at).getTime()) > 365 * 86_400_000) badges.push('Established');
  if ((recycler.certifications ?? []).length > 0) badges.push('Certified');

  return NextResponse.json({ recycler, aggregate, reviews, badges });
}

export async function PATCH(req: NextRequest) {
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const db = adminClient();
  const update: Record<string, any> = {};

  if (b.public_profile_enabled !== undefined) update.public_profile_enabled = !!b.public_profile_enabled;
  if (b.public_bio !== undefined) update.public_bio = b.public_bio?.trim() || null;
  if (Array.isArray(b.public_highlights)) update.public_highlights = b.public_highlights;

  // Generate a slug on first enable if none exists
  if (b.public_profile_enabled && !b.public_slug) {
    const { data: rec } = await (db as any).from('recyclers').select('public_slug, name, recycler_code').eq('id', actor.recyclerId).maybeSingle();
    if (rec && !rec.public_slug) {
      update.public_slug = `${slugify(rec.name || 'recycler')}-${(rec.recycler_code || '').toLowerCase()}`.replace(/-+$/,'');
    }
  }
  if (b.public_slug) update.public_slug = slugify(b.public_slug);

  if (Object.keys(update).length > 0) {
    const { error } = await (db as any).from('recyclers').update(update).eq('id', actor.recyclerId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, update });
}
