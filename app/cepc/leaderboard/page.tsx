export const metadata = {
  title: 'Leaderboard | CEPC Portal',
  description: 'See how CEPC consultants rank by leads, revenue, and tier.',
};

const rows = [
  { rank: 1, name: 'Priya Mehta', region: 'West India', leads: 42, revenue: 385000, tier: 'Platinum' },
  { rank: 2, name: 'Rajesh Kumar', region: 'North India', leads: 38, revenue: 342000, tier: 'Platinum' },
  { rank: 3, name: 'Ankit Sharma', region: 'North India', leads: 31, revenue: 278000, tier: 'Gold' },
  { rank: 4, name: 'Sneha Reddy', region: 'South India', leads: 27, revenue: 241000, tier: 'Gold' },
  { rank: 5, name: 'Karthik Iyer', region: 'South India', leads: 24, revenue: 215000, tier: 'Gold' },
  { rank: 6, name: 'Neha Gupta', region: 'East India', leads: 19, revenue: 168000, tier: 'Silver' },
  { rank: 7, name: 'Vikram Joshi', region: 'West India', leads: 16, revenue: 142000, tier: 'Silver' },
  { rank: 8, name: 'Amrita Sen', region: 'East India', leads: 14, revenue: 125000, tier: 'Silver' },
  { rank: 9, name: 'Deepak Verma', region: 'Central India', leads: 11, revenue: 98000, tier: 'Bronze' },
  { rank: 10, name: 'Sunita Rao', region: 'South India', leads: 9, revenue: 78000, tier: 'Bronze' },
];

function tierBadge(tier: string) {
  if (tier === 'Platinum') return 'bg-violet-100 text-violet-800';
  if (tier === 'Gold') return 'bg-amber-100 text-amber-800';
  if (tier === 'Silver') return 'bg-slate-100 text-slate-700';
  return 'bg-orange-100 text-orange-800';
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
}

export default function CepcLeaderboardPage() {
  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">Top CEPC consultants ranked by leads and revenue (FY 2025-26).</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-600">
              <th className="px-4 py-3 text-center w-14">Rank</th>
              <th className="px-4 py-3">CEPC Name</th>
              <th className="px-4 py-3">Region</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">Revenue</th>
              <th className="px-4 py-3">Tier</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rank} className="border-b border-slate-100">
                <td className="px-4 py-3 text-center font-semibold text-slate-900">{row.rank}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{row.name}</td>
                <td className="px-4 py-3 text-slate-700">{row.region}</td>
                <td className="px-4 py-3 text-right text-slate-700">{row.leads}</td>
                <td className="px-4 py-3 text-right text-slate-700">{formatINR(row.revenue)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${tierBadge(row.tier)}`}>{row.tier}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
