interface EnrichmentBadgeProps {
  status: string | null;
  score?: number | null;
  onClick?: () => void;
}

const CONFIG: Record<string, { label: string; className: string }> = {
  none:       { label: 'Not enriched',  className: 'bg-slate-800 text-slate-400' },
  queued:     { label: 'Queued',        className: 'bg-yellow-100 text-yellow-700' },
  processing: { label: 'Processing…',  className: 'bg-teal-500/15 text-teal-300' },
  done:       { label: 'Enriched',      className: 'bg-green-100 text-green-700' },
  failed:     { label: 'Failed',        className: 'bg-red-100 text-red-600' },
};

export default function EnrichmentBadge({ status, score, onClick }: EnrichmentBadgeProps) {
  const key = status || 'none';
  const cfg = CONFIG[key] || CONFIG['none'];
  return (
    <span
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}${onClick ? ' cursor-pointer' : ''}`}
      title={score != null ? `Lead score: ${score}` : undefined}
    >
      {cfg.label}
      {score != null && key === 'done' && (
        <span className="font-bold">{score}</span>
      )}
    </span>
  );
}
