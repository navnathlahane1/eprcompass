'use client';

export default function PrintSummaryButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
    >
      Download Compliance Summary
    </button>
  );
}
