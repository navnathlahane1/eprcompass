'use client';

type Item = {
  date: string;
  type: string;
  description: string;
  by: string;
};

function csvEscape(value: string) {
  return `"${String(value || '').replace(/"/g, '""')}"`;
}

export default function DownloadActivityCsvButton({ rows }: { rows: Item[] }) {
  function onDownload() {
    const header = ['Date', 'Type', 'Description', 'By'];
    const lines = [
      header.map(csvEscape).join(','),
      ...rows.map((row) => [row.date, row.type, row.description, row.by].map(csvEscape).join(','))
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={onDownload}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
    >
      Download History
    </button>
  );
}
