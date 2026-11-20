export const metadata = {
  title: 'Edit Recycler | Admin',
  description: 'Edit recycler facility details, capacity, and compliance status.',
};

const recycler = {
  company_name: 'EcoRecycle India Pvt Ltd',
  status: 'Active',
  risk_flag: 'Low',
  state: 'Maharashtra',
  capacity_mt_pa: 5000,
  cpcb_cert_expiry: '2028-06-30',
  gstin: '27AADCE1234F1ZH',
  contact_person: 'Manoj Patil',
  contact_email: 'manoj.patil@ecorecycle.in',
  contact_phone: '+91 98210 44567',
  address: 'Plot No. 47, MIDC Industrial Area, Taloja, Navi Mumbai, Maharashtra — 410208',
  waste_categories: ['Plastic — Rigid', 'Plastic — Flexible / MLP', 'E-Waste', 'Tyre'],
};

const allCategories = [
  'Plastic — Rigid',
  'Plastic — Flexible / MLP',
  'E-Waste',
  'Battery',
  'Tyre',
  'Used Oil',
  'Hazardous Waste',
];

const statusOptions = ['Active', 'Onboarding', 'Suspended', 'Blacklisted'];
const riskOptions = ['Low', 'Medium', 'High'];

export default async function EditRecyclerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Edit Recycler</h1>
        <p className="mt-1 text-sm text-slate-400">Recycler ID: {id}</p>
      </section>

      {/* Company Details */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-100">Company Details</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Company Name</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.company_name}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">GSTIN</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.gstin}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Status</label>
            <select className="mt-1 w-full input" defaultValue={recycler.status}>
              {statusOptions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Flag</label>
            <select className="mt-1 w-full input" defaultValue={recycler.risk_flag}>
              {riskOptions.map((r) => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">State</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.state}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Annual Capacity (MT)</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.capacity_mt_pa.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">CPCB Cert Expiry</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.cpcb_cert_expiry}</p>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Address</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.address}</p>
          </div>
        </div>
      </section>

      {/* Waste Categories */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-100">Waste Categories</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allCategories.map((cat) => {
            const checked = recycler.waste_categories.includes(cat);
            return (
              <label key={cat} className="flex items-center gap-2 text-sm text-slate-200">
                <span className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border ${checked ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-700 bg-slate-900/60'}`}>
                  {checked && (
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {cat}
              </label>
            );
          })}
        </div>
      </section>

      {/* Contact Information */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-100">Contact Information</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Contact Person</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.contact_person}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.contact_email}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Phone</label>
            <p className="mt-1 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100">{recycler.contact_phone}</p>
          </div>
        </div>
      </section>

      <section className="flex gap-3">
        <button type="button" className="btn-primary">Save Changes</button>
        <button type="button" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-950">Cancel</button>
      </section>
    </div>
  );
}
