import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Company Profile | Recycler Portal',
  description: 'View and manage your recycler company profile details.',
};

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <span
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
        checked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300 bg-white'
      }`}
    >
      {checked && (
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  );
}

const ALL_WASTE_CATEGORIES = [
  'Plastic — Rigid',
  'Plastic — Flexible / MLP',
  'E-Waste',
  'Battery',
  'Tyre',
  'Used Oil',
  'Hazardous Waste',
];

export default async function RecyclerProfilePage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: recycler } = await (supabase as any)
    .from('recyclers')
    .select('id, company_name, gstin, address, state, city, contact_person, email, phone, waste_categories')
    .eq('email', user.email)
    .maybeSingle();

  if (!recycler) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Profile Not Found</h1>
          <p className="text-sm text-slate-600">
            Your recycler profile is not yet linked to this account. Please contact EPR Compass support.
          </p>
        </div>
      </div>
    );
  }

  const activeCategories: string[] = recycler.waste_categories ?? [];

  const addressParts = [recycler.address, recycler.city, recycler.state].filter(Boolean);

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Company Profile</h1>
        <p className="mt-1 text-sm text-slate-600">Recycler facility details and compliance information.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Company Details</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {recycler.company_name || '—'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">GSTIN</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {recycler.gstin || '—'}
            </p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Registered Address</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {addressParts.length > 0 ? addressParts.join(', ') : '—'}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Waste Categories</h2>
        {activeCategories.length === 0 ? (
          <p className="text-sm text-slate-400">No waste categories configured. Contact your account manager.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_WASTE_CATEGORIES.map((cat) => {
              const baseLabel = cat.split(' — ')[0].toLowerCase();
              const checked = activeCategories.some(
                (c) => c.toLowerCase().includes(baseLabel) || baseLabel.includes(c.toLowerCase())
              );
              return (
                <div key={cat} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckIcon checked={checked} />
                  {cat}
                </div>
              );
            })}
            {activeCategories
              .filter(
                (c) =>
                  !ALL_WASTE_CATEGORIES.some((w) => {
                    const base = w.split(' — ')[0].toLowerCase();
                    return c.toLowerCase().includes(base) || base.includes(c.toLowerCase());
                  })
              )
              .map((c) => (
                <div key={c} className="flex items-center gap-2 text-sm text-slate-700">
                  <CheckIcon checked={true} />
                  {c}
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Contact Information</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Person</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {recycler.contact_person || '—'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {recycler.email || '—'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
            <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900">
              {recycler.phone || '—'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

