'use client';

import { useState } from 'react';

export default function RenewalsActions({
  sequenceId,
  status
}: {
  sequenceId: string;
  status: 'Scheduled' | 'Running' | 'Completed' | 'Cancelled' | 'Opted Out';
}) {
  const [busy, setBusy] = useState(false);

  async function processNow() {
    setBusy(true);
    try {
      await fetch('/api/admin/renewals/process-step', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sequenceId })
      });
      location.reload();
    } finally {
      setBusy(false);
    }
  }

  async function cancelNow() {
    setBusy(true);
    try {
      await fetch('/api/admin/renewals/cancel-sequence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sequenceId, reason: 'Cancelled by admin' })
      });
      location.reload();
    } finally {
      setBusy(false);
    }
  }

  if (status !== 'Running' && status !== 'Scheduled') {
    return <span className="text-xs text-slate-500">No actions</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={busy}
        onClick={processNow}
        className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-950 disabled:opacity-60"
      >
        Process Step
      </button>
      <button
        type="button"
        disabled={busy}
        onClick={cancelNow}
        className="btn-danger"
      >
        Cancel
      </button>
    </div>
  );
}
