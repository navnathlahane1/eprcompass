'use client';

/**
 * /portal/epr-checklist — Document completion checklist per filing.
 * Shows each filing's required doc types vs what the client has already uploaded.
 */

import { useState, useEffect, useCallback } from 'react';

interface Filing {
  id: string;
  category: string;
  current_status: string;
  epr_financial_years?: { label: string };
}

interface Doc {
  doc_type: string;
  status: string;
}

interface ChecklistItem {
  doc_type: string;
  uploaded: boolean;
  status: string | null;
}

const NEXT_STATUS_FOR: Record<string, string> = {
  Pending: 'Documents Submitted',
  'Documents Submitted': 'Under Review',
  'Under Review': 'Approved',
  'Query Raised': 'Under Review',
  Approved: 'Certificate Issued',
  'Certificate Issued': 'Certificate Issued',
};

const STATUS_CHIP: Record<string, string> = {
  Approved: 'bg-green-100 text-green-700',
  Received: 'bg-sky-100 text-sky-700',
  Reviewed: 'bg-amber-100 text-amber-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function PortalChecklistPage() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Per-filing checklist state
  const [checklists, setChecklists] = useState<Record<string, ChecklistItem[]>>({});
  const [checkLoading, setCheckLoading] = useState<Record<string, boolean>>({});

  const loadFilings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/epr/filing-statuses');
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = (data as any)?.error || (res.status === 401 ? 'Please sign in again to continue.' : 'Unable to load filing statuses.');
        throw new Error(message);
      }

      // API may return { statuses: [...] } or legacy { filings: [...] }
      const list = Array.isArray(data)
        ? data
        : (data as any).statuses ?? (data as any).filings ?? [];
      setFilings(list);
    } catch (e: any) {
      setError(e?.message || 'Unable to load checklist. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFilings();
  }, [loadFilings]);

  const loadChecklist = useCallback(async (filing: Filing) => {
    const key = filing.id;
    if (checklists[key]) { setExpanded(key); return; }

    setCheckLoading(p => ({ ...p, [key]: true }));
    try {
      const targetStatus = NEXT_STATUS_FOR[filing.current_status] ?? filing.current_status;

      // Fetch required doc types + uploaded docs in parallel
      const [clRes, docsRes] = await Promise.all([
        fetch(`/api/epr/checklist?category=${encodeURIComponent(filing.category)}&status=${encodeURIComponent(targetStatus)}`),
        fetch(`/api/epr/client-documents?category=${encodeURIComponent(filing.category)}`),
      ]);

      const cl = clRes.ok ? await clRes.json() : { docTypes: [] };
      const docsRaw = docsRes.ok ? await docsRes.json() : {};
      // API returns { documents: [...] }
      const docsData: Doc[] = Array.isArray(docsRaw) ? docsRaw : (docsRaw.documents ?? []);

      const uploadedMap: Record<string, string> = {};
      docsData.forEach(d => { uploadedMap[d.doc_type] = d.status; });

      const items: ChecklistItem[] = (cl.docTypes as string[]).map(dt => ({
        doc_type: dt,
        uploaded: Boolean(uploadedMap[dt]),
        status: uploadedMap[dt] ?? null,
      }));

      setChecklists(p => ({ ...p, [key]: items }));
      setExpanded(key);
    } catch {
      // silently collapse
    } finally {
      setCheckLoading(p => ({ ...p, [key]: false }));
    }
  }, [checklists]);

  const completionPct = (items: ChecklistItem[]) => {
    if (!items.length) return 100;
    return Math.round((items.filter(i => i.uploaded).length / items.length) * 100);
  };

  if (loading) return (
    <div className="p-6 max-w-2xl mx-auto space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-20 bg-slate-100 animate-pulse rounded-xl" />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-red-50 text-red-700 p-4 rounded-xl">
        <p>{error}</p>
        <button
          type="button"
          onClick={loadFilings}
          className="mt-3 inline-flex items-center rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Document Checklist</h1>
        <p className="text-sm text-slate-500 mt-1">Track which documents are required and uploaded per filing</p>
      </div>

      {filings.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-lg font-medium">No filings found</p>
          <p className="text-sm mt-1">Your filings will appear here once created by your compliance manager</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filings.map(filing => {
            const items = checklists[filing.id];
            const pct = items ? completionPct(items) : null;
            const isOpen = expanded === filing.id;
            const isLoading = checkLoading[filing.id];

            return (
              <div key={filing.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => isOpen ? setExpanded(null) : loadChecklist(filing)}
                  aria-expanded={isOpen}
                  aria-controls={`checklist-${filing.id}`}
                >
                  <div>
                    <p className="font-semibold text-slate-900">
                      {filing.category}
                      {filing.epr_financial_years && (
                        <span className="ml-2 text-sm text-slate-400">{filing.epr_financial_years.label}</span>
                      )}
                    </p>
                    <p className="text-sm text-slate-500 mt-0.5">{filing.current_status}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {pct !== null && (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-slate-600">{pct}%</span>
                      </div>
                    )}
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                    )}
                  </div>
                </button>

                {/* Checklist rows */}
                {isOpen && items && (
                  <div id={`checklist-${filing.id}`} className="border-t border-slate-100 divide-y divide-slate-50">
                    {items.length === 0 ? (
                      <p className="px-5 py-3 text-sm text-slate-400">No specific documents required for this stage.</p>
                    ) : (
                      items.map(item => (
                        <div key={item.doc_type} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                                item.uploaded ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-400'
                              }`}
                              aria-hidden="true"
                            >
                              {item.uploaded ? '✓' : '○'}
                            </span>
                            <span className={`text-sm ${item.uploaded ? 'text-slate-900' : 'text-slate-500'}`}>
                              {item.doc_type}
                            </span>
                          </div>
                          {item.status ? (
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_CHIP[item.status] ?? 'bg-slate-100 text-slate-600'}`}>
                              {item.status}
                            </span>
                          ) : (
                            <a
                              href="/portal/epr-documents"
                              className="text-xs text-blue-600 hover:underline font-medium"
                            >
                              Upload →
                            </a>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
