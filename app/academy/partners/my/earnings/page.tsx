'use client';

import { SITE_CONTACT_EMAIL, SITE_CONTACT_WHATSAPP, SITE_CONTACT_WHATSAPP_DIGITS } from '@/lib/siteContact';

const EARNINGS: { month: string; enrollments: number; grossRevenue: number; shareType: string; rate: number; partnerShare: number; status: string; dueDate: string }[] = [];

const REFERRAL_EARNINGS: { learner: string; program: string; date: string; fee: number; share: number }[] = [];

export default function MyEarningsPage() {
  const totalDelivery = EARNINGS.reduce((s, e) => s + e.partnerShare, 0);
  const totalReferral = REFERRAL_EARNINGS.reduce((s, r) => s + r.share, 0);
  const total = totalDelivery + totalReferral;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100">My Earnings</h1>
        <p className="mt-0.5 text-sm text-slate-500">Revenue share from self-delivered batches and referral enrollments.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Total Earnings',    value: `₹${total.toLocaleString('en-IN')}`,          color: 'text-emerald-400' },
          { label: 'Delivery Share',    value: `₹${totalDelivery.toLocaleString('en-IN')}`,  color: 'text-indigo-400' },
          { label: 'Referral Share',    value: `₹${totalReferral.toLocaleString('en-IN')}`,  color: 'text-violet-400' },
          { label: 'Pending Payout',    value: `₹${EARNINGS.filter(e=>e.status==='Pending').reduce((s,e)=>s+e.partnerShare,0).toLocaleString('en-IN')}`, color: 'text-amber-400' },
        ].map(k => (
          <div key={k.label} className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide">{k.label}</p>
            <p className={`mt-1 text-2xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Self-delivery earnings */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Self-Delivery Earnings (40% share)</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Month', 'Enrollments', 'Gross Revenue', 'Your Share (40%)', 'Status', 'Due Date'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EARNINGS.length === 0 ? (
              <tr><td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : EARNINGS.map((e, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="py-3 text-slate-200 font-medium">{e.month}</td>
                <td className="py-3 text-slate-300">{e.enrollments}</td>
                <td className="py-3 text-slate-300">₹{e.grossRevenue.toLocaleString('en-IN')}</td>
                <td className="py-3 text-emerald-400 font-bold">₹{e.partnerShare.toLocaleString('en-IN')}</td>
                <td className="py-3">
                  <span className={`rounded px-1.5 py-0.5 text-[9px] font-semibold ${e.status === 'Paid' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-300'}`}>
                    {e.status}
                  </span>
                </td>
                <td className="py-3 text-amber-400">{e.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Referral earnings */}
      <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Referral Earnings (20% share)</h2>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-800/60">
              {['Learner', 'Program', 'Enrolled', 'Fee Paid', 'Your Share (20%)'].map(h => (
                <th key={h} className="pb-2 text-left text-[10px] uppercase tracking-wide text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {REFERRAL_EARNINGS.length === 0 ? (
              <tr><td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No records yet.</td></tr>
            ) : REFERRAL_EARNINGS.map((r, i) => (
              <tr key={i} className="border-b border-slate-800/30">
                <td className="py-2.5 text-slate-200 font-medium">{r.learner}</td>
                <td className="py-2.5 text-slate-400">{r.program}</td>
                <td className="py-2.5 text-slate-500">{r.date}</td>
                <td className="py-2.5 text-slate-300">₹{r.fee.toLocaleString('en-IN')}</td>
                <td className="py-2.5 text-emerald-400 font-semibold">₹{r.share.toLocaleString('en-IN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500">Total referral share</span>
          <span className="text-sm font-bold text-emerald-400">₹{totalReferral.toLocaleString('en-IN')}</span>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-slate-400">
        Payments are processed monthly by the 15th of the following month. For queries contact EPR Compass support at{' '}
        <a href={`mailto:${SITE_CONTACT_EMAIL}`} className="text-indigo-300 hover:underline">{SITE_CONTACT_EMAIL}</a>{' '}or WhatsApp at{' '}
        <a href={`https://wa.me/${SITE_CONTACT_WHATSAPP_DIGITS}`} className="text-indigo-300 hover:underline">{SITE_CONTACT_WHATSAPP}</a>.
      </div>
    </div>
  );
}
