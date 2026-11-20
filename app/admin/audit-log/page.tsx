export const metadata = {
  title: 'Audit Log | Admin',
  description: 'System-wide audit trail of user actions.',
};

const rows = [
  { timestamp: '2026-04-19 09:42:18', user: 'neha.gupta@eprcertificate.com', role: 'Admin', action: 'Updated recycler status to Active', module: 'Recyclers', ip: '103.21.58.74' },
  { timestamp: '2026-04-19 09:38:05', user: 'priya.mehta@eprcertificate.com', role: 'Manager', action: 'Created invoice INV-2026-0412', module: 'Billing', ip: '49.36.128.22' },
  { timestamp: '2026-04-19 09:15:44', user: 'ankit.sharma@example.com', role: 'CEPC', action: 'Referred lead — HydroCell Batteries', module: 'CRM', ip: '122.170.10.55' },
  { timestamp: '2026-04-19 08:52:30', user: 'system', role: 'System', action: 'Razorpay webhook — payment confirmed pay_N8k2mXo9pQ7r5t', module: 'Payments', ip: '52.66.155.21' },
  { timestamp: '2026-04-18 23:01:12', user: 'neha.gupta@eprcertificate.com', role: 'Admin', action: 'Sent WhatsApp broadcast — EPR renewal reminder', module: 'WhatsApp', ip: '103.21.58.74' },
  { timestamp: '2026-04-18 18:45:09', user: 'rajesh.kumar@example.com', role: 'Partner', action: 'Downloaded co-branded pitch deck', module: 'Documents', ip: '106.51.72.33' },
  { timestamp: '2026-04-18 16:30:55', user: 'priya.mehta@eprcertificate.com', role: 'Manager', action: 'Approved Q3 quarterly return — GreenPack Industries', module: 'Compliance', ip: '49.36.128.22' },
  { timestamp: '2026-04-18 14:12:38', user: 'system', role: 'System', action: 'Auto-generated renewal task for BatteryWorld Imports', module: 'Tasks', ip: '127.0.0.1' },
  { timestamp: '2026-04-18 11:05:20', user: 'neha.gupta@eprcertificate.com', role: 'Admin', action: 'Added team member sneha.reddy@eprcertificate.com', module: 'Settings', ip: '103.21.58.74' },
  { timestamp: '2026-04-18 09:30:00', user: 'system', role: 'System', action: 'Nightly risk-score recomputation completed — 48 recyclers', module: 'Recyclers', ip: '127.0.0.1' },
];

function roleBadge(role: string) {
  if (role === 'Admin') return 'bg-indigo-900/30 text-indigo-800';
  if (role === 'Manager') return 'bg-blue-900/30 text-blue-300';
  if (role === 'System') return 'bg-slate-900 text-slate-400';
  if (role === 'CEPC') return 'bg-violet-100 text-violet-800';
  if (role === 'Partner') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-900 text-slate-400';
}

export default function AdminAuditLogPage() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold text-slate-100">Audit Log</h1>
        <p className="mt-1 text-sm text-slate-400">System-wide trail of all user and system actions.</p>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-b border-slate-800/60">
                <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-slate-200">{row.timestamp}</td>
                <td className="px-4 py-3 text-slate-200">{row.user}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${roleBadge(row.role)}`}>{row.role}</span>
                </td>
                <td className="px-4 py-3 text-slate-100">{row.action}</td>
                <td className="px-4 py-3 text-slate-200">{row.module}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{row.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
