'use client';

/**
 * /portal/epr-audit-docs — Client-facing Audit Documents
 * Shows admin-uploaded audit documents visible to this client.
 * Groups by FY and category. Allows download.
 */

import { useState, useEffect, useCallback } from 'react';

const CATEGORIES = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];

interface AuditDoc {
  id: string;
  category: string;
  doc_type: string;
  title: string;
  file_name: string;
  file_size: number | null;
  mark_as: string;
  client_note: string | null;
  created_at: string;
  epr_financial_years?: { label: string };
}

interface FY { id: string; label: string }

export default function EPRAuditDocsPortalPage() {
  const [docs, setDocs] = useState<AuditDoc[]>([]);
  const [fys, setFys] = useState<FY[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterFy, setFilterFy] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg }); setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch('/api/epr/financial-years').then(r => r.json()).then(d => setFys(d.financialYears ?? []));
  }, []);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterFy) p.set('fy_id', filterFy);
    if (filterCat) p.set('category', filterCat);
    const res = await fetch(`/api/epr/audit-documents?${p}`);
    const d = res.ok ? await res.json() : { documents: [] };
    setDocs(d.documents ?? []);
    setLoading(false);
  }, [filterFy, filterCat]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleDownload = async (doc: AuditDoc) => {
    // Audit docs use a separate download approach; here we link via a dedicated audit download endpoint
    // For now, use client-documents download flow — audit docs use a different storage structure
    // Calling a download intent API route (could be extended for audit specifically)
    showToast('error', 'Download not yet wired — contact your compliance manager.');
  };

  const fmtBytes = (b: number | null) => {
    if (!b) return '—';
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Group docs by FY label → category
  const grouped: Record<string, Record<string, AuditDoc[]>> = {};
  for (const d of docs) {
    const fy = d.epr_financial_years?.label ?? 'Unknown FY';
    const cat = d.category;
    if (!grouped[fy]) grouped[fy] = {};
    if (!grouped[fy][cat]) grouped[fy][cat] = [];
    grouped[fy][cat].push(d);
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded shadow-lg text-white text-sm ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.msg}
        </div>
      )}

      <h1 className="text-2xl font-bold text-slate-900">Audit &amp; Compliance Documents</h1>
      <p className="text-sm text-slate-500">Official documents shared by your EPR compliance team.</p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={filterFy} onChange={e => setFilterFy(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All FYs</option>
          {fys.map(fy => <option key={fy.id} value={fy.id}>{fy.label}</option>)}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-xl border-2 border-dashed">
          <p className="text-slate-500 font-medium">No documents shared yet</p>
          <p className="text-sm text-slate-400 mt-1">Your compliance team will share official audit documents here.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([fy, categories]) => (
            <div key={fy}>
              <h2 className="text-base font-semibold text-slate-800 mb-4">{fy}</h2>
              {Object.entries(categories).map(([cat, catDocs]) => (
                <div key={cat} className="mb-4">
                  <h3 className="text-sm font-medium text-slate-600 mb-2">{cat}</h3>
                  <div className="space-y-2">
                    {catDocs.map(d => (
                      <div key={d.id} className="border rounded-xl bg-white p-4 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900">{d.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{d.doc_type} · {d.file_name} · {fmtBytes(d.file_size)}</p>
                          {d.client_note && (
                            <p className="text-xs text-slate-600 mt-1 bg-blue-50 rounded px-2 py-1">{d.client_note}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${d.mark_as === 'Final' ? 'bg-green-100 text-green-700' : d.mark_as === 'Certified Copy' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                            {d.mark_as}
                          </span>
                          <button onClick={() => handleDownload(d)} className="text-blue-600 hover:underline text-xs">Download</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
