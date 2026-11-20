'use client';

import { useState } from 'react';

interface Followup {
  id: string;
  scheduled_for: string;
  type: string;
  notes?: string;
  priority?: string;
  source?: string;
}

interface FollowupWidgetProps {
  followup: Followup;
  onUpdate: () => void;
}

export default function FollowupWidget({ followup, onUpdate }: FollowupWidgetProps) {
  const [loading, setLoading] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState('');

  async function patch(body: Record<string, any>) {
    setLoading(true);
    await fetch(`/api/admin/telecalling/followups/${followup.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    setLoading(false);
    onUpdate();
  }

  const scheduledDate = new Date(followup.scheduled_for);
  const isOverdue = scheduledDate < new Date();

  return (
    <div className={[
      'rounded-lg border p-4',
      isOverdue
        ? 'border-red-700/50 bg-red-900/20'
        : 'border-slate-700/60 bg-slate-900/60',
    ].join(' ')}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-slate-100">
            {followup.type} follow-up
            {followup.priority && followup.priority !== 'Normal' && (
              <span className="ml-2 text-xs text-orange-600">{followup.priority}</span>
            )}
            {followup.source === 'CALL_TRANSCRIPT' && (
              <span className="ml-2 text-[10px] font-semibold text-indigo-300 bg-indigo-900/40 border border-indigo-700/50 rounded-full px-1.5 py-0.5" title="Auto-extracted from the call recording transcript">
                AI · from call
              </span>
            )}
          </div>
          <div className={`text-xs mt-0.5 ${isOverdue ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
            {isOverdue ? 'Overdue · ' : ''}{scheduledDate.toLocaleString()}
          </div>
          {followup.notes && <div className="text-xs text-slate-400 mt-1">{followup.notes}</div>}
        </div>
      </div>

      {showReschedule ? (
        <div className="mt-3 flex gap-2">
          <input
            type="datetime-local"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
            className="flex-1 border border-slate-700 rounded px-2 py-1 text-xs bg-slate-900/60 text-slate-100"
          />
          <button
            onClick={() => newDate && patch({ scheduled_for: new Date(newDate).toISOString() })}
            disabled={!newDate || loading}
            className="px-3 py-1 bg-teal-500/15 text-white rounded text-xs disabled:opacity-50"
          >Save</button>
          <button onClick={() => setShowReschedule(false)} className="px-3 py-1 border border-slate-700 rounded text-xs text-slate-300">Cancel</button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => patch({ status: 'Completed', outcome: 'Completed via quick action' })}
            disabled={loading}
            className="flex-1 bg-green-600 text-white rounded py-1.5 text-xs font-medium hover:bg-green-700 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            onClick={() => setShowReschedule(true)}
            className="flex-1 border border-slate-700 text-slate-300 rounded py-1.5 text-xs font-medium hover:bg-slate-800/40"
          >
            Reschedule
          </button>
        </div>
      )}
    </div>
  );
}
