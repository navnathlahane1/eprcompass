'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

interface FeatureRequestCaptureProps {
  portalName: string;
}

/** Right-click anywhere in a portal to report a bug or request a feature. */
export default function FeatureRequestCapture({ portalName }: FeatureRequestCaptureProps) {
  const pathname = usePathname() ?? '';
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY });
    }
    function onClick() { setMenu(null); }
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('click', onClick);
    };
  }, []);

  function openModal() {
    setMenu(null);
    setDescription('');
    setStatus('idle');
    setModalOpen(true);
  }

  async function submit() {
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/feature-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portal: portalName, page_path: pathname, description }),
      });
      if (r.ok) {
        setStatus('sent');
        setTimeout(() => setModalOpen(false), 1200);
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={containerRef}>
      {menu && (
        <div
          style={{ top: menu.y, left: menu.x }}
          className="fixed z-[100] w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={openModal}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.99-2.386l-.548-.546z" />
            </svg>
            Request a feature / Report a bug
          </button>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">Request a Feature / Report a Bug</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <p className="text-xs text-slate-500">Tell us what you were doing and what you wish worked differently. This goes straight to our dev team as a ticket.</p>
            <textarea
              autoFocus
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. I wish I could filter this table by date range…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
            {status === 'sent' && <p className="text-sm text-green-600">Thanks — sent to our dev team!</p>}
            {status === 'error' && <p className="text-sm text-red-600">Something went wrong. Please try again.</p>}
            <div className="flex gap-3">
              <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={submit} disabled={submitting || !description.trim()} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                {submitting ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
