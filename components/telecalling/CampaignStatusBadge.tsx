interface CampaignStatusBadgeProps {
  status: string | null;
}

const CONFIG: Record<string, { className: string }> = {
  Draft:     { className: 'bg-slate-800 text-slate-300' },
  Active:    { className: 'bg-green-100 text-green-700' },
  Paused:    { className: 'bg-yellow-100 text-yellow-700' },
  Completed: { className: 'bg-teal-500/15 text-teal-300' },
  Cancelled: { className: 'bg-red-100 text-red-600' },
};

export default function CampaignStatusBadge({ status }: CampaignStatusBadgeProps) {
  const cfg = CONFIG[status || ''] || CONFIG['Draft'];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {status || 'Draft'}
    </span>
  );
}
