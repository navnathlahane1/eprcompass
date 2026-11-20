import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

// ── NO indexing, NO caching ───────────────────────────────────────────────────
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false, noarchive: true, nosnippet: true },
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface EduEntry    { degree: string; institution: string; year_from?: string; year_to?: string; description?: string }
interface AchievEntry { title: string; issuer?: string; year?: string; description?: string; url?: string }
interface CertEntry   { name: string; issuer?: string; year?: string; credential_id?: string; url?: string }
interface ClientEntry { company_name: string; industry?: string; engagement_type?: string; year_from?: number; year_to?: number; description?: string }
interface ServiceRow  {
  title: string; category: string; description?: string; key_topics?: string[];
  delivery_mode?: string[]; duration_hours?: number; language?: string;
  pricing_model?: string; price_amount?: number; price_currency?: string; price_notes?: string;
}

interface TrainerData {
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website_url: string | null;
  profile_photo_url: string | null;
  linkedin_url: string | null;
  twitter_url: string | null;
  youtube_url: string | null;
  instagram_url: string | null;
  languages: string[] | null;
  education: EduEntry[];
  achievements: AchievEntry[];
  certifications: CertEntry[];
}

const PRICING_LABELS: Record<string, string> = {
  per_session:     'per session',
  per_participant: 'per participant',
  per_day:         'per day',
  custom:          'custom pricing',
};

const CATEGORY_HUE: Record<string, string> = {
  'E-Waste':                  '#3b82f6',
  'Plastic Waste':            '#f59e0b',
  'Battery Waste':            '#8b5cf6',
  'Tyre Waste':               '#f97316',
  'Used Oil':                 '#eab308',
  'EPR Compliance':           '#10b981',
  'Corporate Sustainability': '#14b8a6',
  'Environmental Audit':      '#ef4444',
  'Awareness Program':        '#ec4899',
  'Other':                    '#64748b',
};

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d} day${d > 1 ? 's' : ''} left`;
  return `${h} hour${h !== 1 ? 's' : ''} left`;
}

function initials(name: string | null) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TrainerPortfolioPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = db();

  const { data: share } = await supabase
    .from('trainer_profile_shares')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (!share || share.is_revoked) return notFound();
  const expired = new Date(share.expires_at) < new Date();

  // Bump view count
  if (!expired) {
    supabase
      .from('trainer_profile_shares')
      .update({ view_count: share.view_count + 1, last_viewed_at: new Date().toISOString() })
      .eq('id', share.id)
      .then(() => {});
  }

  const [{ data: profile }, { data: clients }, { data: services }, { data: userProfile }] = await Promise.all([
    supabase.from('trainer_profiles').select('*').eq('user_id', share.trainer_id).maybeSingle(),
    supabase.from('trainer_past_clients').select('*').eq('trainer_id', share.trainer_id).order('sort_order'),
    supabase.from('trainer_services').select('*').eq('trainer_id', share.trainer_id).eq('status', 'approved'),
    supabase.from('profiles').select('full_name').eq('id', share.trainer_id).maybeSingle(),
  ]);

  const trainer: TrainerData = {
    full_name:         userProfile?.full_name ?? null,
    headline:          profile?.headline ?? null,
    bio:               profile?.bio ?? null,
    location:          profile?.location ?? null,
    website_url:       profile?.website_url ?? null,
    profile_photo_url: profile?.profile_photo_url ?? null,
    linkedin_url:      profile?.linkedin_url ?? null,
    twitter_url:       profile?.twitter_url ?? null,
    youtube_url:       profile?.youtube_url ?? null,
    instagram_url:     profile?.instagram_url ?? null,
    languages:         profile?.languages ?? [],
    education:         profile?.education ?? [],
    achievements:      profile?.achievements ?? [],
    certifications:    profile?.certifications ?? [],
  };

  const pastClients: ClientEntry[] = clients ?? [];
  const approvedServices: ServiceRow[] = services ?? [];
  const remaining = timeLeft(share.expires_at);

  // ── Expired screen ───────────────────────────────────────────────────────
  if (expired) {
    return (
      <main className="min-h-screen bg-[#0c0f1a] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">This link has expired</h1>
          <p className="text-slate-400 text-sm">
            The trainer profile link you followed is no longer valid.
            Please contact the EPR Compass Academy for an updated link.
          </p>
          <div className="pt-2">
            <span className="text-xs text-slate-600">EPR Compass · Academy</span>
          </div>
        </div>
      </main>
    );
  }

  // ── Portfolio ────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#0c0f1a] text-slate-100">
      {/* ── Expiry banner ── */}
      {remaining && (
        <div className="sticky top-0 z-30 bg-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              This profile link expires in <strong className="ml-0.5">{remaining}</strong>
            </div>
            {share.recipient_name && (
              <span className="text-xs text-slate-500">Shared with {share.recipient_name}</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10 md:py-16 space-y-14">

        {/* ── Hero ── */}
        <section className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {trainer.profile_photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={trainer.profile_photo_url} alt={trainer.full_name ?? ''}
                className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-2 border-slate-700" />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-3xl font-bold text-white select-none">
                {initials(trainer.full_name)}
              </div>
            )}
          </div>

          {/* Name + headline + meta */}
          <div className="flex-1 space-y-3">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">
                {trainer.full_name ?? 'Trainer'}
              </h1>
              {trainer.headline && (
                <p className="mt-1.5 text-lg text-emerald-400 font-medium">{trainer.headline}</p>
              )}
            </div>

            {/* Meta chips */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
              {trainer.location && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {trainer.location}
                </span>
              )}
              {trainer.languages && trainer.languages.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"/></svg>
                  {trainer.languages.join(' · ')}
                </span>
              )}
            </div>

            {/* Social links */}
            <div className="flex items-center gap-3">
              {trainer.linkedin_url && (
                <a href={trainer.linkedin_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                  LinkedIn
                </a>
              )}
              {trainer.twitter_url && (
                <a href={trainer.twitter_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-sky-500 hover:text-sky-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  Twitter
                </a>
              )}
              {trainer.youtube_url && (
                <a href={trainer.youtube_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-red-500 hover:text-red-400 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.75 12.64 12.64 0 00-8.45 0A4.83 4.83 0 014.41 6.69 45.22 45.22 0 004 12a45.22 45.22 0 00.41 5.31 4.83 4.83 0 003.77 2.75 12.64 12.64 0 008.45 0 4.83 4.83 0 003.77-2.75A45.22 45.22 0 0020 12a45.22 45.22 0 00-.41-5.31zM10 15.5v-7l6 3.5z"/></svg>
                  YouTube
                </a>
              )}
              {trainer.website_url && (
                <a href={trainer.website_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs text-slate-300 hover:border-slate-400 hover:text-slate-100 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                  Website
                </a>
              )}
            </div>
          </div>
        </section>

        {/* ── Note from Academy ── */}
        {share.note_to_recipient && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-950/30 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-2">Note from EPR Compass Academy</p>
            <p className="text-slate-300 text-sm leading-relaxed">{share.note_to_recipient}</p>
          </section>
        )}

        {/* ── Bio ── */}
        {trainer.bio && (
          <section className="space-y-3">
            <SectionHeading>About</SectionHeading>
            <p className="text-slate-300 leading-relaxed text-[15px] whitespace-pre-line">{trainer.bio}</p>
          </section>
        )}

        {/* ── Services ── */}
        {approvedServices.length > 0 && (
          <section className="space-y-5">
            <SectionHeading>Services & Offerings</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedServices.map((s, i) => {
                const hue = CATEGORY_HUE[s.category] ?? '#64748b';
                return (
                  <div key={i} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-semibold text-white text-[15px] leading-snug">{s.title}</h3>
                      <span className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
                        style={{ background: `${hue}20`, color: hue, border: `1px solid ${hue}40` }}>
                        {s.category}
                      </span>
                    </div>

                    {s.description && <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{s.description}</p>}

                    {s.key_topics && s.key_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {s.key_topics.map(t => (
                          <span key={t} className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{t}</span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      {(s.delivery_mode ?? []).map(m => (
                        <span key={m} className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-400">{m}</span>
                      ))}
                      {s.duration_hours && <span>{s.duration_hours}h</span>}
                      {s.language && s.language !== 'English' && <span>{s.language}</span>}
                    </div>

                    {s.price_amount ? (
                      <p className="text-sm font-semibold text-emerald-400 mt-auto pt-1">
                        ₹{Number(s.price_amount).toLocaleString('en-IN')}
                        <span className="text-xs font-normal text-slate-500 ml-1">{PRICING_LABELS[s.pricing_model ?? ''] ?? s.pricing_model}</span>
                      </p>
                    ) : s.pricing_model === 'custom' ? (
                      <p className="text-sm text-slate-500 mt-auto pt-1">Custom / negotiable</p>
                    ) : null}
                    {s.price_notes && <p className="text-xs text-slate-600">{s.price_notes}</p>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Client Track Record ── */}
        {pastClients.length > 0 && (
          <section className="space-y-5">
            <SectionHeading>Client Track Record</SectionHeading>
            <div className="space-y-3">
              {pastClients.map((c, i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  {/* Company initial */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold text-slate-300">
                    {(c.company_name?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-white text-sm">{c.company_name}</span>
                      {c.industry && (
                        <span className="text-xs rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-slate-400">{c.industry}</span>
                      )}
                      {c.engagement_type && (
                        <span className="text-xs text-slate-500">{c.engagement_type}</span>
                      )}
                    </div>
                    {(c.year_from || c.year_to) && (
                      <p className="text-xs text-slate-600 mt-0.5">
                        {c.year_from}{c.year_from && c.year_to ? ' – ' : ''}{c.year_to}
                      </p>
                    )}
                    {c.description && (
                      <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{c.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Education & Certifications ── */}
        {(trainer.education.length > 0 || trainer.certifications.length > 0) && (
          <section className="space-y-5">
            <SectionHeading>Education & Credentials</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trainer.education.map((e, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{e.degree}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{e.institution}</p>
                      {(e.year_from || e.year_to) && (
                        <p className="text-xs text-slate-600 mt-0.5">{e.year_from}{e.year_from && e.year_to ? ' – ' : ''}{e.year_to}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {trainer.certifications.map((c, i) => (
                <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{c.name}</p>
                      {c.issuer && <p className="text-xs text-slate-400 mt-0.5">{c.issuer}</p>}
                      {c.year && <p className="text-xs text-slate-600 mt-0.5">{c.year}</p>}
                      {c.url && (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-emerald-500 hover:underline mt-0.5 inline-block">Verify ↗</a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Achievements ── */}
        {trainer.achievements.length > 0 && (
          <section className="space-y-5">
            <SectionHeading>Achievements</SectionHeading>
            <div className="space-y-3">
              {trainer.achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white text-sm">{a.title}</p>
                      {a.year && <span className="text-xs text-slate-500">{a.year}</span>}
                    </div>
                    {a.issuer && <p className="text-xs text-slate-400 mt-0.5">{a.issuer}</p>}
                    {a.description && <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{a.description}</p>}
                    {a.url && (
                      <a href={a.url} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-emerald-500 hover:underline mt-1 inline-block">View ↗</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Footer ── */}
        <footer className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <span>Shared by EPR Compass · Academy</span>
          <span>This profile is private and shared for evaluation purposes only</span>
        </footer>
      </div>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-white">{children}</h2>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

