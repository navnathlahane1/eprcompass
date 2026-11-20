'use client';

import { useSoftphone } from './SoftphoneContext';

const STATUS_LABEL: Record<string, string> = {
  UNCONFIGURED: 'Desktop calling not set up',
  REGISTERING: 'Connecting…',
  READY: 'Ready to call',
  CALLING: 'Calling…',
  ON_CALL: 'On call',
  ERROR: 'Softphone error',
};

const STATUS_DOT: Record<string, string> = {
  UNCONFIGURED: 'bg-slate-600',
  REGISTERING: 'bg-yellow-400 animate-pulse',
  READY: 'bg-green-500',
  CALLING: 'bg-yellow-400 animate-pulse',
  ON_CALL: 'bg-green-500 animate-pulse',
  ERROR: 'bg-rose-500',
};

// Floating status widget, mirrors the AdminChatBot's bottom-right placement.
// Stays minimal until an active call exists — the "Call" button on lead
// pages is the primary way agents dial (see LeadDetailClient.tsx).
export default function Softphone() {
  const { status, activeCall, hangup } = useSoftphone();

  if (status === 'UNCONFIGURED') return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 rounded-xl border border-slate-800 bg-slate-900/95 shadow-lg backdrop-blur px-4 py-3 min-w-[220px]">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status] || 'bg-slate-600'}`} />
        <span className="text-sm font-medium text-slate-200">{STATUS_LABEL[status] || status}</span>
      </div>
      {activeCall && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-400 truncate">{activeCall.toNumber}</span>
          <button
            onClick={() => hangup()}
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 border border-rose-800/60 rounded-md px-2 py-1"
          >
            Hang up
          </button>
        </div>
      )}
    </div>
  );
}
