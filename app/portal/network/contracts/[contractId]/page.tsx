'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { ContractStatusBadge } from '@/components/recycler-network/ContractStatusBadge';
import { ContractTimeline } from '@/components/recycler-network/ContractTimeline';
import { trackEvent } from '@/lib/analytics';

interface Contract {
  id: string;
  contract_number: string;
  status: 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED';
  start_date: string | null;
  end_date: string | null;
  epr_category: string;
  financial_year: string | null;
  committed_qty: number | null;
  renewal_notice_days: number;
  auto_renewal: boolean;
  termination_reason: string | null;
  activated_at: string | null;
  terminated_at: string | null;
  created_at: string;
  recyclers?: { name: string; recycler_code: string };
}

export default function ContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = use(params);
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminateReason, setTerminateReason] = useState('');

  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000); };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/network/contracts/${contractId}`);
        if (!res.ok) throw new Error((await res.json()).error);
        const { contract: data } = await res.json();
        setContract(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  async function activate() {
    setActivating(true);
    try {
      const res = await fetch(`/api/network/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      trackEvent('Client Network Contract Activated', {});
      setContract((prev) => prev ? { ...prev, status: 'ACTIVE' } : prev);
      showToast('Contract activated');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed', false);
    } finally {
      setActivating(false);
    }
  }

  async function terminate() {
    if (!terminateReason.trim()) { showToast('Reason is required', false); return; }
    setActivating(true);
    try {
      const res = await fetch(`/api/network/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'TERMINATED', termination_reason: terminateReason }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      trackEvent('Client Network Contract Terminated', {});
      setContract((prev) => prev ? { ...prev, status: 'TERMINATED', termination_reason: terminateReason } : prev);
      setTerminateOpen(false);
      showToast('Contract terminated');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed', false);
    } finally {
      setActivating(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-16 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>;
  if (error || !contract) return <div className="flex items-center gap-2 py-16 text-red-600"><AlertTriangle className="h-5 w-5" /> {error ?? 'Not found'}</div>;

  return (
    <div className="space-y-6">
      <Link href="/portal/network/contracts" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ChevronLeft className="h-4 w-4" /> Back to Contracts
      </Link>

      {toast && (
        <div role="status" aria-live="polite" className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${toast.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {toast.ok ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
          {toast.msg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-sm text-slate-500">{contract.contract_number}</p>
                <h1 className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
                  {contract.recyclers?.name ?? 'Contract'}
                </h1>
              </div>
              <ContractStatusBadge status={contract.status} endDate={contract.end_date} renewalNoticeDays={contract.renewal_notice_days} />
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-xs text-slate-500">Category</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.epr_category}</dd></div>
              <div><dt className="text-xs text-slate-500">FY</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.financial_year ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Start Date</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.start_date ? new Date(contract.start_date).toLocaleDateString('en-IN') : '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">End Date</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.end_date ? new Date(contract.end_date).toLocaleDateString('en-IN') : '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Committed Qty (MT)</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.committed_qty ?? '—'}</dd></div>
              <div><dt className="text-xs text-slate-500">Auto Renewal</dt><dd className="mt-0.5 font-medium text-slate-900 dark:text-white">{contract.auto_renewal ? 'Yes' : 'No'}</dd></div>
            </dl>

            {/* Actions */}
            {contract.status === 'DRAFT' && (
              <div className="mt-6 flex gap-2">
                <button
                  onClick={activate}
                  disabled={activating || !contract.start_date || !contract.end_date}
                  className="rounded-lg bg-eco-green-5 px-4 py-2 text-sm font-medium text-white hover:bg-eco-green-4 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-eco-green-5"
                >
                  {activating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Activate Contract'}
                </button>
                {(!contract.start_date || !contract.end_date) && (
                  <p className="text-xs text-amber-600 self-center">Set start & end date before activating</p>
                )}
              </div>
            )}

            {contract.status === 'ACTIVE' && (
              <div className="mt-6">
                {!terminateOpen ? (
                  <button
                    onClick={() => setTerminateOpen(true)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Terminate Contract
                  </button>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-2">
                    <p className="text-sm font-medium text-red-700">Provide reason for termination</p>
                    <textarea
                      value={terminateReason}
                      onChange={(e) => setTerminateReason(e.target.value)}
                      rows={3}
                      aria-label="Termination reason"
                      className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      placeholder="e.g. Mutual agreement, capacity issues, non-compliance…"
                    />
                    <div className="flex gap-2">
                      <button onClick={terminate} disabled={activating} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">Confirm</button>
                      <button onClick={() => setTerminateOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-300">Contract Lifecycle</h2>
          <ContractTimeline
            currentStatus={contract.status}
            createdAt={contract.created_at}
            activatedAt={contract.activated_at ?? undefined}
            endDate={contract.end_date ?? undefined}
            terminatedAt={contract.terminated_at ?? undefined}
            terminationReason={contract.termination_reason ?? undefined}
          />
        </div>
      </div>
    </div>
  );
}
