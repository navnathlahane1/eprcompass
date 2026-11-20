'use client';

import { useState, useEffect, useCallback } from 'react';
import FollowupWidget from '@/components/telecalling/FollowupWidget';

const STATUS_TABS = ['Pending', 'Completed', 'Cancelled'];

export default function FollowupsClient() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState('Pending');

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), status: statusTab });
    const res = await fetch(`/api/admin/telecalling/followups?${params}`);
    const data = await res.json();
    setFollowups(data.followups || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [page, statusTab]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-100">Follow-ups <span className="text-sm font-normal text-slate-500">({total})</span></h1>
      </div>

      <div className="flex gap-1 mb-6 border-b border-slate-800">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => { setStatusTab(tab); setPage(1); }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${statusTab === tab ? 'border-blue-600 text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-200'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-500">Loading…</div>
      ) : followups.length === 0 ? (
        <div className="text-center py-10 text-slate-500">No follow-ups</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {followups.map((f: any) => (
            <div key={f.id} className="space-y-1">
              {f.lead && (
                <div className="text-xs font-medium text-slate-500 px-1">
                  <a href={`/admin/telecalling/leads/${f.lead_id}`} className="hover:text-blue-400">
                    {f.lead.company_name || f.lead.company || f.lead.contact_name}
                  </a>
                </div>
              )}
              <FollowupWidget followup={f} onUpdate={load} />
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-6 text-sm text-slate-500">
        <span>{total} total</span>
        <div className="flex gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Prev</button>
          <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total} className="px-3 py-1 border border-slate-700 rounded disabled:opacity-40">Next</button>
        </div>
      </div>
    </div>
  );
}
