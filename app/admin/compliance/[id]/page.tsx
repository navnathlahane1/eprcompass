export const metadata = {
  title: 'Compliance Record | Admin',
  description: 'Detailed compliance record for a specific entity.',
};

const entity = {
  name: 'GreenPack Industries Pvt Ltd',
  cin: 'U25200MH2018PTC123456',
  gstin: '27AABCG1234M1ZP',
  type: 'Producer / Brand Owner',
};

const wasteCategory = 'Plastic Waste (PWM Rules 2022)';
const fy = 'FY 2025-26';

const filings = [
  { filing: 'Form-I: EPR Registration', date: '2025-05-10', status: 'Approved' },
  { filing: 'Form-II: Annual Action Plan', date: '2025-06-28', status: 'Approved' },
  { filing: 'Form-III: Q1 Quarterly Return', date: '2025-09-15', status: 'Approved' },
  { filing: 'Form-III: Q2 Quarterly Return', date: '2025-12-20', status: 'Approved' },
  { filing: 'Form-III: Q3 Quarterly Return', date: '2026-03-18', status: 'Submitted' },
  { filing: 'Form-IV: Annual Return', date: '-', status: 'Not Due' },
];

const timeline = [
  { date: '2025-04-01', event: 'Compliance cycle started for FY 2025-26' },
  { date: '2025-05-10', event: 'EPR registration approved by CPCB — certificate EPR/P/2025/001247' },
  { date: '2025-06-28', event: 'Annual action plan approved — target 1,200 MT' },
  { date: '2025-09-15', event: 'Q1 return filed — 285 MT processed' },
  { date: '2025-12-20', event: 'Q2 return filed — 312 MT processed' },
  { date: '2026-03-18', event: 'Q3 return submitted — 219 MT processed, pending approval' },
  { date: '2026-06-30', event: 'Annual return due (upcoming)' },
];

function statusBadge(status: string) {
  if (status === 'Approved') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Submitted') return 'bg-blue-900/30 text-blue-300';
  if (status === 'Not Due') return 'bg-slate-900 text-slate-500';
  return 'bg-amber-100 text-amber-800';
}

export default async function AdminComplianceRecordPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Entity Info */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Compliance Record</h1>
        <p className="mt-1 text-sm text-slate-400">Record ID: {id}</p>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-100">Entity Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-slate-500">Company</p>
            <p className="mt-0.5 text-sm font-medium text-slate-100">{entity.name}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">CIN</p>
            <p className="mt-0.5 font-mono text-xs text-slate-200">{entity.cin}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">GSTIN</p>
            <p className="mt-0.5 font-mono text-xs text-slate-200">{entity.gstin}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Entity Type</p>
            <p className="mt-0.5 text-sm text-slate-200">{entity.type}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Waste Category</p>
            <p className="mt-0.5 text-sm font-medium text-slate-100">{wasteCategory}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Financial Year</p>
            <p className="mt-0.5 text-sm font-medium text-slate-100">{fy}</p>
          </div>
        </div>
      </section>

      {/* Filings */}
      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="border-b border-slate-800 px-5 py-3">
          <h2 className="text-base font-semibold text-slate-100">Filings</h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Filing</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filings.map((f) => (
              <tr key={f.filing} className="border-b border-slate-800/60">
                <td className="px-4 py-3 font-medium text-slate-100">{f.filing}</td>
                <td className="px-4 py-3 text-slate-200">{f.date}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(f.status)}`}>{f.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Status Timeline */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
        <h2 className="mb-4 text-base font-semibold text-slate-100">Status Timeline</h2>
        <ol className="relative border-l border-slate-800 ml-3">
          {timeline.map((t, i) => (
            <li key={i} className="mb-6 ml-6 last:mb-0">
              <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-blue-900/30 ring-4 ring-white">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              </span>
              <p className="text-xs font-semibold text-slate-500">{t.date}</p>
              <p className="mt-0.5 text-sm text-slate-200">{t.event}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
