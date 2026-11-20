import { createClient } from '@supabase/supabase-js';
import { notFound } from 'next/navigation';
import BookMeetingWidget from '@/components/public/BookMeetingWidget';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

interface Review { reviewer_name: string; reviewer_org: string | null; rating: number; title: string | null; body: string | null; created_at: string; }

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} viewBox="0 0 24 24" className={`h-5 w-5 ${i <= Math.round(value) ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
      ))}
    </span>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { data } = await (db() as any).from('recyclers').select('name').eq('public_slug', slug).maybeSingle();
  return { title: data?.name ? `${data.name} — Verified EPR Recycler` : 'Recycler Profile' };
}

export default async function PublicRecyclerProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const client = db();

  const { data: recycler } = await (client as any)
    .from('recyclers')
    .select('id, name, recycler_code, verification_status, city, state, epr_categories, authorized_states, certifications, public_profile_enabled, public_bio, public_highlights, onboarded_at')
    .eq('public_slug', slug)
    .maybeSingle();

  if (!recycler || !recycler.public_profile_enabled) notFound();

  const [ratingsRes, reviewsRes] = await Promise.all([
    (client as any).from('recycler_ratings').select('overall_score').eq('recycler_id', recycler.id),
    (client as any).from('recycler_reviews').select('reviewer_name, reviewer_org, rating, title, body, created_at').eq('recycler_id', recycler.id).eq('is_published', true).order('created_at', { ascending: false }).limit(20),
  ]);

  const ratings = ratingsRes.data ?? [];
  const overall = ratings.length ? Math.round((ratings.reduce((s: number, r: any) => s + Number(r.overall_score || 0), 0) / ratings.length) * 100) / 100 : null;
  const reviews: Review[] = reviewsRes.data ?? [];

  const badges: string[] = [];
  if (recycler.verification_status === 'VERIFIED') badges.push('CPCB Verified');
  if (overall != null && overall >= 4.5) badges.push('Top Rated');
  if ((recycler.certifications ?? []).length > 0) badges.push('Certified');

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{recycler.name}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{[recycler.city, recycler.state].filter(Boolean).join(', ')} · {recycler.recycler_code}</p>
            </div>
            {overall != null && (
              <div className="text-right">
                <p className="text-3xl font-extrabold text-gray-900">{overall.toFixed(1)}</p>
                <Stars value={overall} />
                <p className="text-xs text-gray-400 mt-0.5">{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</p>
              </div>
            )}
          </div>
          {badges.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {badges.map(b => (
                <span key={b} className="inline-flex items-center gap-1 rounded-full bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-700">
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                  {b}
                </span>
              ))}
            </div>
          )}
          {recycler.public_bio && <p className="mt-4 text-sm text-gray-600 leading-relaxed">{recycler.public_bio}</p>}
        </div>

        {/* Capabilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">EPR Categories</p>
            <div className="flex flex-wrap gap-1.5">
              {(recycler.epr_categories ?? []).length ? recycler.epr_categories.map((c: string) => <span key={c} className="text-xs bg-green-100 text-green-800 border border-green-300 rounded-full px-2 py-0.5">{c}</span>) : <span className="text-xs text-gray-400">—</span>}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Authorized States</p>
            <div className="flex flex-wrap gap-1.5">
              {(recycler.authorized_states ?? []).length ? recycler.authorized_states.map((s: string) => <span key={s} className="text-xs bg-blue-100 text-blue-800 border border-blue-300 rounded-full px-2 py-0.5">{s}</span>) : <span className="text-xs text-gray-400">—</span>}
            </div>
          </div>
        </div>

        {/* Book a Call */}
        <BookMeetingWidget slug={slug} />

        {/* Reviews */}
        {reviews.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Client Reviews</h2>
            <div className="space-y-4">
              {reviews.map((r, i) => (
                <div key={i} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center gap-2"><Stars value={r.rating} />{r.title && <span className="text-sm font-semibold text-gray-900">{r.title}</span>}</div>
                  {r.body && <p className="text-sm text-gray-600 mt-1">{r.body}</p>}
                  <p className="text-xs text-gray-400 mt-1">— {r.reviewer_name}{r.reviewer_org ? `, ${r.reviewer_org}` : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-gray-400">Verified profile powered by <span className="font-semibold text-teal-600">EPR Compass</span></p>
      </div>
    </div>
  );
}

