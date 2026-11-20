const STATUS_COLORS = {
  lead: {
    New: 'bg-slate-100 text-slate-800',
    Contacted: 'bg-blue-100 text-blue-800',
    Qualified: 'bg-indigo-100 text-indigo-800',
    Proposal: 'bg-violet-100 text-violet-800',
    Negotiation: 'bg-amber-100 text-amber-800',
    Won: 'bg-emerald-100 text-emerald-800',
    Lost: 'bg-rose-100 text-rose-800'
  },
  partner: {
    'Not Contacted': 'bg-slate-100 text-slate-800',
    'First Contact': 'bg-blue-100 text-blue-800',
    Responded: 'bg-indigo-100 text-indigo-800',
    Meeting: 'bg-cyan-100 text-cyan-800',
    Proposal: 'bg-violet-100 text-violet-800',
    Negotiation: 'bg-amber-100 text-amber-800',
    Signed: 'bg-emerald-100 text-emerald-800',
    Active: 'bg-green-100 text-green-800',
    Dormant: 'bg-orange-100 text-orange-800',
    Rejected: 'bg-rose-100 text-rose-800'
  },
  activity: {
    Call: 'bg-sky-100 text-sky-800',
    Email: 'bg-indigo-100 text-indigo-800',
    WhatsApp: 'bg-green-100 text-green-800',
    Meeting: 'bg-violet-100 text-violet-800',
    LinkedIn: 'bg-blue-100 text-blue-800',
    Contract: 'bg-amber-100 text-amber-800',
    Referral: 'bg-cyan-100 text-cyan-800'
  }
};

export default function StatusBadge({ status, type = 'lead' }) {
  const className = STATUS_COLORS[type]?.[status] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {status}
    </span>
  );
}
