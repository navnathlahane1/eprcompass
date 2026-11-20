'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const fmt = (n: number) => `₹${n.toLocaleString('en-IN')}`;

const KPI = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) => (
  <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5">
    <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    {sub && <p className="text-[11px] text-slate-500 mt-0.5">{sub}</p>}
  </div>
);

const PARTNER_PCT = 20;
const GST_PCT     = 18;

interface Payment {
  program_title: string;
  total_inr: number;
  gst_amount_inr: number;
  partner_code: string | null;
  status: string;
  created_at: string;
}

function buildStats(payments: Payment[]) {
  const paid    = payments.filter(p => p.status === 'paid');
  const gross   = paid.reduce((s, p) => s + p.total_inr, 0);
  const partnerPayout = Math.round(
    paid.filter(p => p.partner_code).reduce((s, p) => s + p.total_inr, 0) * PARTNER_PCT / 100
  );
  const net     = gross - partnerPayout;
  const gstLiab = paid.reduce((s, p) => s + p.gst_amount_inr, 0);
  const pending = payments.filter(p => p.status === 'created').reduce((s, p) => s + p.total_inr, 0);

  const tierMap: Record<string, number> = {};
  paid.forEach(p => { tierMap[p.program_title] = (tierMap[p.program_title] ?? 0) + p.total_inr; });

  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const grossMoM = paid.filter(p => p.created_at.startsWith(monthStr)).reduce((s, p) => s + p.total_inr, 0);

  const partnerRev = paid.filter(p => p.partner_code).reduce((s, p) => s + p.total_inr, 0);
  const directRev  = gross - partnerRev;

  return { gross, partnerPayout, net, gstLiab, pending, tierMap, grossMoM, partnerRev, directRev };
}

export default function FinanceDashboard() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch('/api/academy/payment/list')
      .then(r => r.json())
      .then(d => { if (d.success) setPayments(d.payments); })
      .finally(() => setLoading(false));
  }, []);

  const s = buildStats(payments);
  const tierKeys = ['Tier 3 — EPR Agency Launch Program (EALP)', 'Tier 2 — Certified EPR Consultant (CEPC)', 'Tier 1 — EPR Awareness Bootcamp'];
  const tierLabels = ['Tier 3 (EALP)', 'Tier 2 (CEPC)', 'Tier 1 (Bootcamp)'];
  const TIER_REV = tierKeys.map((k, i) => ({
    tier: tierLabels[i],
    amount: s.tierMap[k] ?? 0,
    pct: s.gross ? Math.round(((s.tierMap[k] ?? 0) / s.gross) * 100) : 0,
  }));
  const CHANNEL_REV = [
    { channel: 'Direct',          amount: s.directRev,  pct: s.gross ? Math.round(s.directRev / s.gross * 100) : 0,  color: 'bg-indigo-500' },
    { channel: 'Partner Referral',amount: s.partnerRev, pct: s.gross ? Math.round(s.partnerRev / s.gross * 100) : 0, color: 'bg-violet-500' },
  ];
  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financial Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">EPR Academy · Financial overview · May 2026</p>
        </div>
        <div className="flex gap-3">
          <Link href="/academy/finance/invoices" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-sm font-medium rounded-lg transition">View Invoices</Link>
          <Link href="/academy/finance/emi" className="px-4 py-2 bg-[#0c1022] border border-slate-700 hover:border-violet-500 text-sm font-medium rounded-lg transition">EMI Tracker</Link>
          <Link href="/academy/finance/promo-codes" className="px-4 py-2 bg-[#0c1022] border border-slate-700 hover:border-emerald-500 text-sm font-medium rounded-lg transition">Promo Codes</Link>
          <button onClick={() => router.push('/academy/reports/revenue')} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-sm font-medium rounded-lg transition">Generate Report</button>
        </div>
      </div>

      {/* P&L KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Gross Revenue"    value={loading ? '…' : fmt(s.gross)}          sub="All paid orders"       color="text-emerald-400" />
        <KPI label="Partner Payouts"  value={loading ? '…' : fmt(s.partnerPayout)}  sub={`${PARTNER_PCT}% of partner rev`} color="text-rose-400" />
        <KPI label="Net Revenue"      value={loading ? '…' : fmt(s.net)}            sub="after payouts"         color="text-indigo-400" />
        <KPI label="This Month"       value={loading ? '…' : fmt(s.grossMoM)}       sub="paid orders"           color="text-violet-400" />
      </div>

      {/* Revenue by Tier */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-slate-300 mb-5">Revenue by Program Tier</h2>
        <div className="space-y-3">
          {TIER_REV.map(t => (
            <div key={t.tier} className="flex items-center gap-4">
              <span className="w-36 text-xs text-slate-400 text-right">{t.tier}</span>
              <div className="flex-1 bg-slate-800/50 rounded-full h-7 relative">
                <div className="bg-indigo-600 h-7 rounded-full flex items-center px-3" style={{ width: `${t.pct}%` }}>
                  <span className="text-xs font-semibold text-white">{fmt(t.amount)}</span>
                </div>
              </div>
              <span className="w-8 text-xs text-slate-500">{t.pct}%</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-600 mt-3">
          Total: {fmt(s.gross)} · Highest earner: {TIER_REV.sort((a,b)=>b.amount-a.amount)[0]?.tier || '—'}
        </p>
      </div>

      {/* Two-column: Channel + Pending */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue by Channel — CSS Donut */}
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5">Revenue by Channel</h2>
          <div className="flex items-center gap-6">
            <div className="relative w-32 h-32 shrink-0">
              <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3.8" />
                {/* Direct 51% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#6366f1" strokeWidth="3.8"
                  strokeDasharray="51 49" strokeDashoffset="0" />
                {/* Partner 38% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#7c3aed" strokeWidth="3.8"
                  strokeDasharray="38 62" strokeDashoffset="-51" />
                {/* Corporate 11% */}
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10b981" strokeWidth="3.8"
                  strokeDasharray="11 89" strokeDashoffset="-89" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs text-slate-400 text-center">{fmt(s.gross)}</span>
              </div>
            </div>
            <div className="space-y-2.5">
              {CHANNEL_REV.map(c => (
                <div key={c.channel} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-sm ${c.color} shrink-0`} />
                  <div>
                    <p className="text-xs text-slate-300">{c.channel}</p>
                    <p className="text-[11px] text-slate-500">{fmt(c.amount)} · {c.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pending Collections */}
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-slate-300 mb-5">Pending Collections</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-amber-300">Pending Payments</p>
                <p className="text-[11px] text-slate-500">orders awaiting completion</p>
              </div>
              <span className="text-lg font-bold text-amber-400">{fmt(s.pending)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-rose-300">Partner Payouts Due</p>
                <p className="text-[11px] text-slate-500">{PARTNER_PCT}% of partner revenue</p>
              </div>
              <span className="text-lg font-bold text-rose-400">{fmt(s.partnerPayout)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <div>
                <p className="text-sm font-medium text-indigo-300">GST Liability ({GST_PCT}%)</p>
                <p className="text-[11px] text-slate-500">on gross revenue {fmt(s.gross)}</p>
              </div>
              <span className="text-lg font-bold text-indigo-400">{fmt(s.gstLiab)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary footer */}
      <div className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 flex flex-wrap gap-6 text-sm">
        <div><span className="text-slate-500">Gross Revenue:</span> <span className="text-emerald-400 font-semibold ml-2">{fmt(s.gross)}</span></div>
        <div><span className="text-slate-500">Partner Payouts:</span> <span className="text-rose-400 font-semibold ml-2">–{fmt(s.partnerPayout)}</span></div>
        <div><span className="text-slate-500">Net Revenue:</span> <span className="text-indigo-400 font-semibold ml-2">{fmt(s.net)}</span></div>
        <div><span className="text-slate-500">GST @ {GST_PCT}%:</span> <span className="text-amber-400 font-semibold ml-2">{fmt(s.gstLiab)}</span></div>
        <div><span className="text-slate-500">Net Post-GST:</span> <span className="text-white font-semibold ml-2">{fmt(s.net - s.gstLiab)}</span></div>
      </div>
    </div>
  );
}
