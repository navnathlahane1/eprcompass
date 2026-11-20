'use client';

type MatrixRow = {
  category: string;
  counts: Record<string, number>;
};

const STATUSES = ['Onboarding', 'Docs', 'Filed', 'Approved', 'Overdue'];

function getOpacity(count: number, max: number) {
  if (!max) return 0.1;
  const raw = count / max;
  return Math.min(1, Math.max(0.12, raw));
}

function cellBackground(status: string, opacity: number) {
  if (status === 'Overdue') return `rgba(239,68,68,${opacity})`;
  if (status === 'Approved') return `rgba(34,197,94,${opacity})`;
  if (status === 'Filed') return `rgba(59,130,246,${opacity})`;
  return `rgba(245,158,11,${opacity})`;
}

export default function ComplianceHeatmap({ matrix }: { matrix: MatrixRow[] }) {
  const maxCount = Math.max(
    1,
    ...((matrix || []).flatMap((row) => STATUSES.map((status) => Number(row.counts?.[status] || 0))))
  );

  const onCellClick = (category: string, status: string) => {
    window.parent.postMessage(
      {
        type: 'sendPrompt',
        text: `Show me ${category} clients with ${status} status`
      },
      '*'
    );
  };

  return (
    <section className="min-w-0 border-t border-zinc-200 py-5">
      <h2 className="mb-3 text-sm font-semibold text-zinc-900">Compliance Heatmap</h2>

      <div className="overflow-x-auto"><div className="grid min-w-[480px] grid-cols-6 gap-2">
        <div className="text-xs font-semibold text-zinc-500">Category</div>
        {STATUSES.map((status) => (
          <div key={status} className="text-center text-xs font-semibold text-zinc-500">
            {status}
          </div>
        ))}

        {(matrix || []).map((row) => (
          <div key={row.category} className="contents">
            <div className="text-xs font-semibold text-zinc-700">
              {row.category}
            </div>
            {STATUSES.map((status) => {
              const count = Number(row.counts?.[status] || 0);
              const opacity = getOpacity(count, maxCount);
              return (
                <button
                  key={`${row.category}-${status}`}
                  type="button"
                  aria-label={`${row.category}: ${count} ${status.toLowerCase()}`}
                  onClick={() => onCellClick(row.category, status)}
                  className="rounded-md border border-zinc-200 p-2 text-center text-xs font-semibold text-zinc-900 transition hover:scale-[1.02]"
                  style={{ backgroundColor: cellBackground(status, opacity * 0.24) }}
                >
                  {count}
                </button>
              );
            })}
          </div>
        ))}
      </div></div>
    </section>
  );
}
