'use client';

import { useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabaseClient';
import ActivityFeed from '../../../../components/activity/ActivityFeed';
import OnboardingChecklist from '../../../../components/onboarding/OnboardingChecklist';

const TABS = ['Overview', 'Documents', 'Credits', 'Onboarding', 'Activity'];
const DOC_TYPES = ['CPCB Cert', 'GST', 'Bank Details', 'Agreement', 'Capacity Report', 'Other'];

function riskBadgeClass(flag: string) {
  if (flag === 'High') return 'bg-rose-900/30 text-rose-300';
  if (flag === 'Medium') return 'bg-orange-900/30 text-orange-800';
  if (flag === 'Low') return 'bg-amber-900/30 text-amber-200';
  return 'bg-slate-900 text-slate-200';
}

function statusBadgeClass(status: string) {
  if (status === 'Active') return 'bg-emerald-100 text-emerald-800';
  if (status === 'Onboarding') return 'bg-blue-900/30 text-blue-300';
  if (status === 'Suspended') return 'bg-amber-100 text-amber-800';
  if (status === 'Blacklisted') return 'bg-rose-900/30 text-rose-300';
  return 'bg-slate-100 text-slate-700';
}

function formatINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

function safeSegment(value: string) {
  return String(value || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

export default function RecyclerProfileTabsClient({
  recycler,
  initialDocuments,
  credits,
  capacityLogs,
  initialActivities,
  currentUserId,
  onboardingChecklist
}: {
  recycler: any;
  initialDocuments: any[];
  credits: any[];
  capacityLogs: any[];
  initialActivities: any[];
  currentUserId: string | null;
  onboardingChecklist: any;
}) {
  const [tab, setTab] = useState('Overview');
  const [docs, setDocs] = useState(initialDocuments || []);
  const [uploading, setUploading] = useState(false);
  const [docForm, setDocForm] = useState({ doc_type: 'Other', expiry_date: '', file: null as File | null });

  const latestUtilization = Number(capacityLogs?.[capacityLogs.length - 1]?.utilization_pct || 0);
  const donutStyle = {
    background: `conic-gradient(#2563eb ${Math.max(0, Math.min(100, latestUtilization)) * 3.6}deg, #e5e7eb 0deg)`
  };

  const creditSummary = useMemo(() => {
    const totalValue = (credits || []).reduce((sum, row) => sum + Number(row.total_value_inr || 0), 0);
    const issuedCount = (credits || []).filter((row) => row.status === 'Issued').length;
    return { totalValue, issuedCount };
  }, [credits]);

  async function uploadDocument(event: React.FormEvent) {
    event.preventDefault();
    if (!docForm.file) return;
    setUploading(true);

    try {
      const fileName = `${Date.now()}-${safeSegment(docForm.file.name)}`;
      const docType = safeSegment(docForm.doc_type);
      const path = `${recycler.id}/${docType}/${fileName}`;

      const { error: uploadError } = await (supabase as any)
        .storage
        .from('recycler-docs')
        .upload(path, docForm.file, {
          upsert: false,
          contentType: docForm.file.type || 'application/octet-stream'
        });

      if (uploadError) throw uploadError;

      const { data, error } = await (supabase as any)
        .from('recycler_documents')
        .insert({
          recycler_id: recycler.id,
          doc_type: docForm.doc_type,
          file_path: path,
          expiry_date: docForm.expiry_date || null,
          status: 'Pending'
        })
        .select('id, recycler_id, doc_type, file_path, expiry_date, status, uploaded_at')
        .single();

      if (error) throw error;

      setDocs((prev) => [data, ...prev]);

      if (onboardingChecklist?.id) {
        const docType = String(docForm.doc_type || '').toLowerCase();
        const stepIds: string[] = [];
        if (docType.includes('cpcb')) stepIds.push('cpcb_cert');
        if (docType.includes('gst')) stepIds.push('gst');
        if (docType.includes('capacity')) stepIds.push('capacity_report');
        if (docType.includes('bank')) stepIds.push('bank_details');
        if (docType.includes('agreement')) stepIds.push('agreement');

        for (const stepId of stepIds) {
          await fetch(`/api/onboarding/${onboardingChecklist.id}/step`, {
            method: 'PATCH',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ stepId, done: true })
          }).catch(() => null);
        }
      }

      setDocForm({ doc_type: 'Other', expiry_date: '', file: null });
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
        {TABS.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              tab === item ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-200 hover:bg-slate-800'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Capacity Utilization</p>
              <div className="mt-3 flex items-center gap-4">
                <div className="relative h-24 w-24 rounded-full" style={donutStyle}>
                  <div className="absolute inset-2 flex items-center justify-center rounded-full bg-slate-900/60 text-sm font-semibold text-slate-100">
                    {latestUtilization.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-200">Annual Capacity</p>
                  <p className="text-base font-semibold text-slate-100">{Number(recycler.capacity_mt_pa || 0).toLocaleString('en-IN')} MT</p>
                </div>
              </div>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits Issued</p>
              <p className="mt-3 text-2xl font-semibold text-slate-100">{creditSummary.issuedCount}</p>
              <p className="mt-1 text-sm text-slate-400">Issued credits records</p>
            </article>

            <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Credits Value</p>
              <p className="mt-3 text-2xl font-semibold text-slate-100">{formatINR(creditSummary.totalValue)}</p>
              <p className="mt-1 text-sm text-slate-400">Total epr_credits value</p>
            </article>
          </div>

          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-sm font-semibold text-slate-100">Last 6 Months Utilization</p>
            <div className="mt-4 space-y-3">
              {(capacityLogs || []).map((row) => (
                <div key={row.id}>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                    <span>{new Date(`${row.month}T00:00:00Z`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                    <span>{Number(row.utilization_pct || 0).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, Number(row.utilization_pct || 0)))}%` }} />
                  </div>
                </div>
              ))}
              {(capacityLogs || []).length === 0 ? <p className="text-sm text-slate-500">No capacity data available.</p> : null}
            </div>
          </article>
        </div>
      ) : null}

      {tab === 'Documents' ? (
        <div className="space-y-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Upload New Document</h3>
            <form onSubmit={uploadDocument} className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
              <select
                value={docForm.doc_type}
                onChange={(e) => setDocForm((p) => ({ ...p, doc_type: e.target.value }))}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              >
                {DOC_TYPES.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>

              <input
                type="date"
                value={docForm.expiry_date}
                onChange={(e) => setDocForm((p) => ({ ...p, expiry_date: e.target.value }))}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              />

              <input
                type="file"
                onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              />

              <button
                type="submit"
                disabled={uploading || !docForm.file}
                className="btn-primary"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </article>

          <article className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h3 className="text-sm font-semibold text-slate-100">Documents</h3>
            <div className="mt-3 space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="rounded-lg border border-slate-800 p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-slate-100">{doc.doc_type}</p>
                    <span className="rounded-full bg-slate-900 px-2 py-1 text-xs font-semibold text-slate-200">{doc.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">Expiry: {doc.expiry_date || '-'}</p>
                  <p className="mt-1 text-xs text-slate-400">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                </div>
              ))}
              {docs.length === 0 ? <p className="text-sm text-slate-500">No documents uploaded yet.</p> : null}
            </div>
          </article>
        </div>
      ) : null}

      {tab === 'Credits' ? (
        <div className="space-y-3">
          <div className="hidden overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 sm:block">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-left text-slate-400">
                  <th className="px-4 py-3">Transaction Ref</th>
                  <th className="px-4 py-3">Waste</th>
                  <th className="px-4 py-3">Credit Type</th>
                  <th className="px-4 py-3">Qty (MT)</th>
                  <th className="px-4 py-3">Rate/MT</th>
                  <th className="px-4 py-3">Total Value</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((row) => (
                  <tr key={row.id} className="border-b border-slate-800/60">
                    <td className="px-4 py-3 text-slate-100">{row.transaction_ref}</td>
                    <td className="px-4 py-3 text-slate-200">{row.waste_category}</td>
                    <td className="px-4 py-3 text-slate-200">{row.credit_type}</td>
                    <td className="px-4 py-3 text-slate-200">{Number(row.quantity_mt || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-200">{formatINR(Number(row.rate_per_mt_inr || 0))}</td>
                    <td className="px-4 py-3 text-slate-200">{formatINR(Number(row.total_value_inr || 0))}</td>
                    <td className="px-4 py-3 text-slate-200">{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 sm:hidden">
            {credits.map((row) => (
              <article key={row.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm">
                <p className="font-semibold text-slate-100">{row.transaction_ref}</p>
                <p className="mt-1 text-xs text-slate-400">{row.waste_category} · {row.credit_type}</p>
                <p className="mt-1 text-xs text-slate-400">Qty: {Number(row.quantity_mt || 0).toLocaleString('en-IN')} MT</p>
                <p className="mt-1 text-xs text-slate-400">Total: {formatINR(Number(row.total_value_inr || 0))}</p>
                <p className="mt-1 text-xs text-slate-400">Status: {row.status}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === 'Onboarding' ? (
        onboardingChecklist ? (
          <OnboardingChecklist checklistId={onboardingChecklist.id} initialChecklist={onboardingChecklist} />
        ) : (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">Checklist unavailable.</div>
        )
      ) : null}

      {tab === 'Activity' ? (
        <ActivityFeed
          entityType="recycler"
          entityId={recycler.id}
          currentUserId={currentUserId}
          initialActivities={initialActivities}
        />
      ) : null}

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusBadgeClass(recycler.status)}`}>
            {recycler.status}
          </span>
          <span className={`rounded-full px-2 py-1 text-xs font-semibold ${riskBadgeClass(recycler.risk_flag)}`}>
            Risk: {recycler.risk_flag}
          </span>
          <span className="text-xs text-slate-400">State: {recycler.state || '-'}</span>
        </div>
      </section>
    </section>
  );
}
