import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

const CATEGORY_COLORS: Record<string, string> = {
  'E-Waste':                  'bg-blue-500/15 text-blue-300',
  'Plastic Waste':            'bg-amber-500/15 text-amber-300',
  'Battery Waste':            'bg-violet-500/15 text-violet-300',
  'Tyre Waste':               'bg-orange-500/15 text-orange-300',
  'Used Oil':                 'bg-yellow-500/15 text-yellow-300',
  'EPR Compliance':           'bg-emerald-500/15 text-emerald-300',
  'Corporate Sustainability': 'bg-teal-500/15 text-teal-300',
  'Environmental Audit':      'bg-red-500/15 text-red-300',
  'Awareness Program':        'bg-pink-500/15 text-pink-300',
};

const PRICING_LABELS: Record<string, string> = {
  per_session:     'Per Session',
  per_participant: 'Per Participant',
  per_day:         'Per Day',
  custom:          'Custom',
};

interface Offering {
  id: string;
  title: string;
  category: string;
  description: string | null;
  delivery_mode: string[] | null;
  duration_hours: number | null;
  pricing_model: string | null;
  price_amount: number | null;
  price_currency: string;
  price_notes: string | null;
  trainer_name: string | null;
  trainer_headline: string | null;
  is_active: boolean;
  approved_at: string;
}

export default async function TrainerOfferingsPage() {
  const supabase = await createServerComponentClient();

  const { data: offerings } = await (supabase as any)
    .from('trainer_offerings')
    .select('*')
    .order('approved_at', { ascending: false });

  const list: Offering[] = offerings ?? [];
  const active = list.filter(o => o.is_active);
  const inactive = list.filter(o => !o.is_active);

  const byCategory = active.reduce<Record<string, number>>((acc, o) => {
    acc[o.category] = (acc[o.category] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6 p-4 md:p-6 text-slate-100">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h1 className="text-2xl font-bold text-slate-100">Trainer Offerings</h1>
        <p className="mt-1 text-slate-400">
          Approved training services from our trainer network — ready to be matched to client requests or packaged into programs.
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-500">Active Offerings</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{active.length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-500">Unique Trainers</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{new Set(active.map(o => o.trainer_name)).size}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-500">Categories Covered</p>
          <p className="mt-1 text-3xl font-bold text-slate-100">{Object.keys(byCategory).length}</p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-sm text-slate-500">Inactive / Archived</p>
          <p className="mt-1 text-3xl font-bold text-slate-400">{inactive.length}</p>
        </div>
      </section>

      {/* Category breakdown */}
      {Object.keys(byCategory).length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h2 className="text-sm font-semibold text-slate-300 mb-3">By Category</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <span key={cat} className={`rounded-full px-3 py-1 text-sm font-medium ${CATEGORY_COLORS[cat] ?? 'bg-slate-700 text-slate-300'}`}>
                {cat} <span className="opacity-70 ml-1">({count})</span>
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Offerings grid */}
      {active.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-700 p-12 text-center text-slate-500">
          No approved trainer offerings yet. Directors approve trainer-submitted services from the Academy → Trainer Reviews page.
        </div>
      )}

      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Active Offerings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {active.map(o => (
              <article key={o.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-100 leading-snug">{o.title}</h3>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[o.category] ?? 'bg-slate-700 text-slate-300'}`}>
                    {o.category}
                  </span>
                </div>

                {o.description && (
                  <p className="text-sm text-slate-400 line-clamp-2">{o.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {(o.delivery_mode ?? []).map(m => (
                    <span key={m} className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{m}</span>
                  ))}
                  {o.duration_hours && (
                    <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs text-slate-300">{o.duration_hours}h</span>
                  )}
                </div>

                {o.price_amount && (
                  <p className="text-sm font-medium text-emerald-400">
                    ₹{Number(o.price_amount).toLocaleString('en-IN')}
                    <span className="text-xs text-slate-500 ml-1 font-normal">
                      {PRICING_LABELS[o.pricing_model ?? ''] ?? o.pricing_model}
                    </span>
                  </p>
                )}
                {!o.price_amount && o.pricing_model === 'custom' && (
                  <p className="text-sm text-slate-400">Custom / Negotiable pricing</p>
                )}
                {o.price_notes && <p className="text-xs text-slate-500">{o.price_notes}</p>}

                <div className="mt-auto pt-2 border-t border-slate-800">
                  <p className="text-xs text-slate-500">
                    <span className="text-slate-300">{o.trainer_name ?? 'Unknown Trainer'}</span>
                    {o.trainer_headline && <span className="ml-1">· {o.trainer_headline}</span>}
                  </p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Approved {new Date(o.approved_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {inactive.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Archived</h2>
          <div className="space-y-2">
            {inactive.map(o => (
              <div key={o.id} className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-3 flex items-center justify-between opacity-60">
                <div>
                  <span className="text-sm text-slate-300">{o.title}</span>
                  <span className="text-xs text-slate-500 ml-2">{o.category} · {o.trainer_name}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
