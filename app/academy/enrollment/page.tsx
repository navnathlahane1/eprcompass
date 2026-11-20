'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RazorpayModal, { type RazorpayModalProps } from '@/components/academy/RazorpayModal';

type PayStatus = 'Paid' | 'Pending' | 'EMI';
type Source = 'Organic' | 'Partner Referral';

interface Enrollment {
  id: string;
  name: string;
  email: string;
  program: string;
  payment: PayStatus;
  source: Source;
  partner?: string;
  date: string;
  status: 'Pending Confirmation' | 'Confirmed' | 'Rejected' | 'Waitlisted';
}

type Kpis = { pending: number; paidNotStarted: number; waitlisted: number; thisMonth: number };

const PAY_COLOR: Record<string, string> = {
  Paid:    'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  EMI:     'bg-violet-500/15 text-violet-300',
};

export default function EnrollmentPage() {
  const [records, setRecords]   = useState<Enrollment[]>([]);
  const [kpis, setKpis]         = useState<Kpis>({ pending: 0, paidNotStarted: 0, waitlisted: 0, thisMonth: 0 });
  const [loading, setLoading]   = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [payModal, setPayModal] = useState<Omit<RazorpayModalProps, 'onSuccess' | 'onFailure' | 'onClose'> | null>(null);

  useEffect(() => {
    fetch('/api/academy/enrollments')
      .then(r => r.json())
      .then(d => {
        setRecords(d.enrollments ?? []);
        if (d.kpis) setKpis(d.kpis);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pending = records.filter(r => r.status === 'Pending Confirmation');
  const confirmed_list = records.filter(r => r.status === 'Confirmed');
  const WAITLISTED = records.filter(r => r.status === 'Waitlisted');

  function confirm(id: string) {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, status: 'Confirmed' } : r));
    setConfirmed(s => new Set([...s, id]));
    setTimeout(() => setConfirmed(s => { const n = new Set(s); n.delete(id); return n; }), 2000);
  }

  function reject(id: string) {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, status: 'Rejected' } : r));
    setRejectId(null);
    setRejectReason('');
  }

  function waitlist(id: string) {
    setRecords(rs => rs.map(r => r.id === id ? { ...r, status: 'Waitlisted' } : r));
  }

  function openPayment(r: Enrollment) {
    setPayModal({
      programTitle:     r.program,
      participantName:  r.name,
      participantEmail: r.email,
      partnerCode:      r.partner,
    });
  }

  return (
    <div className="space-y-6">
      {/* Razorpay Payment Modal */}
      {payModal && (
        <RazorpayModal
          {...payModal}
          onSuccess={(paymentId) => {
            const r = records.find(x => x.email === payModal.participantEmail);
            if (r) setRecords(rs => rs.map(x => x.id === r.id ? { ...x, payment: 'Paid', status: 'Confirmed' } : x));
            setPayModal(null);
            alert(`Payment ${paymentId} recorded. Enrolment confirmed.`);
          }}
          onFailure={(msg) => alert(`Payment failed: ${msg}`)}
          onClose={() => setPayModal(null)}
        />
      )}

      {/* Reject Modal */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-[#0c1022] p-6 shadow-2xl">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">Reject Enrollment</h3>
            <p className="text-xs text-slate-500 mb-3">Please provide a reason for rejection:</p>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              rows={3} placeholder="e.g. Payment not received…"
              className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"/>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setRejectId(null)} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition">Cancel</button>
              <button onClick={() => reject(rejectId)} disabled={!rejectReason.trim()}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-500 transition disabled:opacity-40">Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Enrollment Queue</h1>
          <p className="mt-0.5 text-sm text-slate-500">Review and manage learner enrollments</p>
        </div>
        <div className="flex gap-2">
          <Link href="/academy/enrollment/bulk"
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700 transition">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
            Bulk Enrollment
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Pending Confirmation', value: loading ? '—' : String(kpis.pending),       color: 'text-amber-400',   border: 'border-amber-500/20'   },
          { label: 'Paid, Not Started',    value: loading ? '—' : String(kpis.paidNotStarted),color: 'text-emerald-400', border: 'border-emerald-500/20' },
          { label: 'On Waitlist',          value: loading ? '—' : String(kpis.waitlisted),    color: 'text-violet-400',  border: 'border-violet-500/20'  },
          { label: 'This Month',           value: loading ? '—' : String(kpis.thisMonth),     color: 'text-indigo-400',  border: 'border-indigo-500/20'  },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border ${k.border} bg-[#0c1022] p-4`}>
            <p className="text-xs text-slate-500">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Table */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Pending Confirmation ({pending.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['ID','Name','Email','Program','Payment','Source','Date','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">Loading enrollments…</td></tr>
              )}
              {!loading && pending.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center text-slate-500 text-sm">No pending enrollments.</td></tr>
              )}
              {pending.map(r => (
                <tr key={r.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition">
                  <td className="px-4 py-3 font-mono text-xs text-indigo-400">{r.id}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {confirmed.has(r.id) && (
                        <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-400 animate-bounce" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/></svg>
                      )}
                      <Link href={`/academy/enrollment/${r.id}`} className="text-xs font-semibold text-slate-200 hover:text-indigo-300 transition">{r.name}</Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">{r.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 max-w-[140px] truncate">{r.program}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PAY_COLOR[r.payment]}`}>{r.payment}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                    {r.source === 'Partner Referral' ? (
                      <span className="text-violet-300">{r.partner}</span>
                    ) : 'Organic'}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">{new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {r.payment !== 'Paid' && (
                        <button onClick={() => openPayment(r)}
                          className="rounded px-2 py-1 text-[10px] font-medium bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500/25 transition whitespace-nowrap">💳 Collect Payment</button>
                      )}
                      <button onClick={() => confirm(r.id)}
                        className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition whitespace-nowrap">Confirm</button>
                      <button onClick={() => setRejectId(r.id)}
                        className="rounded px-2 py-1 text-[10px] font-medium bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 transition">Reject</button>
                      <button onClick={() => waitlist(r.id)}
                        className="rounded px-2 py-1 text-[10px] font-medium bg-slate-800 text-slate-400 hover:bg-slate-700 transition whitespace-nowrap">Waitlist</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmed Table */}
      {confirmed_list.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-300 mb-3">Confirmed Enrollments ({confirmed_list.length})</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-[#0c1022]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800/80">
                  {['ID','Name','Program','Payment','Source','Date'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confirmed_list.map(r => (
                  <tr key={r.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition">
                    <td className="px-4 py-3 font-mono text-xs text-indigo-400">{r.id}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-200">
                      <Link href={`/academy/enrollment/${r.id}`} className="hover:text-indigo-300 transition">{r.name}</Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.program}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${PAY_COLOR[r.payment]}`}>{r.payment}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">{r.source === 'Partner Referral' ? r.partner : 'Organic'}</td>
                    <td className="px-4 py-3 text-xs text-slate-400">{new Date(r.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waitlist Section */}
      <div>
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Waitlist ({WAITLISTED.length})</h2>
        <div className="overflow-x-auto rounded-xl border border-violet-500/20 bg-[#0c1022]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800/80">
                {['Pos','Name','Email','Program','Date','Action'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WAITLISTED.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
              )}
              {WAITLISTED.map((w, idx) => (
                <tr key={w.id} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition">
                  <td className="px-4 py-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-[10px] font-bold text-violet-300">#{idx + 1}</span>
                  </td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-200">{w.name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{w.email}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{w.program}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{new Date(w.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                  <td className="px-4 py-3">
                    <button className="rounded px-2 py-1 text-[10px] font-medium bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition whitespace-nowrap">Move to Active</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
