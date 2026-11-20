'use client';

import { useState } from 'react';
import {
  Plus, Send, Users, MousePointer, CheckCircle,
  Tag, Calendar, ChevronRight, X, IndianRupee, Percent,
  MessageSquare, Mail
} from 'lucide-react';

interface Offer {
  id: string;
  name: string;
  targetCohort: string;
  targetTier: string;
  discountCode: string;
  discountType: '₹ flat' | '% off';
  discountValue: number;
  expiry: string;
  messageTemplate: string;
  sent: number;
  clicked: number;
  enrolled: number;
  status: 'Active' | 'Expired' | 'Draft';
}

const MOCK_OFFERS: Offer[] = [];

const MESSAGE_TEMPLATES = ['Upgrade Welcome', 'Agency Upgrade Pitch', 'Flash Sale Template', 'Batch-Specific Offer', 'Referral Bonus Template', 'Exclusive Agency Offer'];

const STATUS_COLORS: Record<string, string> = {
  'Active': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'Expired': 'bg-slate-700/60 text-slate-400 border-slate-600/40',
  'Draft': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
};

export default function UpgradeOffersPage() {
  const [offers, setOffers] = useState<Offer[]>(MOCK_OFFERS);
  const [showForm, setShowForm] = useState(false);
  const [sentMap, setSentMap] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({
    name: '',
    targetCohort: '',
    targetTier: 'Tier 1 → Tier 2',
    discountCode: '',
    discountType: '₹ flat' as '₹ flat' | '% off',
    discountValue: '',
    expiry: '',
    messageTemplate: MESSAGE_TEMPLATES[0],
  });

  const handleSend = (id: string) => {
    setSentMap(prev => new Set([...prev, id]));
  };

  const handleSubmit = () => {
    if (!form.name || !form.discountCode) return;
    const newOffer: Offer = {
      id: `O${offers.length + 1}`,
      name: form.name,
      targetCohort: form.targetCohort || 'Not specified',
      targetTier: form.targetTier,
      discountCode: form.discountCode,
      discountType: form.discountType,
      discountValue: Number(form.discountValue) || 0,
      expiry: form.expiry || '2026-12-31',
      messageTemplate: form.messageTemplate,
      sent: 0,
      clicked: 0,
      enrolled: 0,
      status: 'Draft',
    };
    setOffers(prev => [newOffer, ...prev]);
    setShowForm(false);
    setForm({ name: '', targetCohort: '', targetTier: 'Tier 1 → Tier 2', discountCode: '', discountType: '₹ flat', discountValue: '', expiry: '', messageTemplate: MESSAGE_TEMPLATES[0] });
  };

  const activeOffers = offers.filter(o => o.status === 'Active');
  const totalSent = offers.reduce((a, o) => a + o.sent, 0);
  const totalEnrolled = offers.reduce((a, o) => a + o.enrolled, 0);

  return (
    <div className="min-h-screen bg-[#060910] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Upgrade Offer Manager</h1>
          <p className="text-slate-400 text-sm mt-1">EPR Compass — Create and send tier upgrade offers</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Offer
        </button>
      </div>

      {/* Summary Pills */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
          <span className="text-emerald-400 font-bold">{activeOffers.length}</span>
          <span className="text-slate-400"> active offers</span>
        </div>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
          <span className="text-indigo-400 font-bold">{totalSent}</span>
          <span className="text-slate-400"> total sent</span>
        </div>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
          <span className="text-violet-400 font-bold">{totalEnrolled}</span>
          <span className="text-slate-400"> total enrolled</span>
        </div>
        <div className="bg-[#0c1022] border border-slate-800/80 rounded-lg px-4 py-2 text-sm">
          <span className="text-amber-400 font-bold">{totalSent > 0 ? ((totalEnrolled / totalSent) * 100).toFixed(1) : 0}%</span>
          <span className="text-slate-400"> overall conversion</span>
        </div>
      </div>

      {/* Create Offer Form */}
      {showForm && (
        <div className="bg-[#0c1022] border border-indigo-500/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-slate-200 font-semibold">Create New Offer</h2>
            <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Offer Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Tier1June2026" className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Target Audience</label>
              <input value={form.targetCohort} onChange={e => setForm(p => ({ ...p, targetCohort: e.target.value }))} placeholder="e.g. All Tier 1 Completions – June 2026" className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Tier Upgrade</label>
              <select value={form.targetTier} onChange={e => setForm(p => ({ ...p, targetTier: e.target.value }))} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
                <option>Tier 1 → Tier 2</option>
                <option>Tier 2 → Tier 3</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Discount Code</label>
              <input value={form.discountCode} onChange={e => setForm(p => ({ ...p, discountCode: e.target.value.toUpperCase() }))} placeholder="e.g. TIER1JUN500" className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase" />
            </div>
            <div className="flex gap-3">
              <div className="w-40">
                <label className="block text-xs text-slate-400 mb-1.5">Discount Type</label>
                <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value as '₹ flat' | '% off' }))} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
                  <option>₹ flat</option>
                  <option>% off</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1.5">Amount</label>
                <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))} placeholder="500" className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Expiry Date</label>
              <input type="date" value={form.expiry} onChange={e => setForm(p => ({ ...p, expiry: e.target.value }))} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Message Template</label>
              <select value={form.messageTemplate} onChange={e => setForm(p => ({ ...p, messageTemplate: e.target.value }))} className="w-full bg-[#060910] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500">
                {MESSAGE_TEMPLATES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">Cancel</button>
            <button onClick={handleSubmit} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Create Offer
            </button>
          </div>
        </div>
      )}

      {/* Offers List */}
      <div className="space-y-4">
        {offers.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-sm">No records yet.</div>
        )}
        {offers.map(offer => {
          const convRate = offer.sent > 0 ? ((offer.enrolled / offer.sent) * 100).toFixed(1) : '0.0';
          const clickRate = offer.sent > 0 ? ((offer.clicked / offer.sent) * 100).toFixed(0) : '0';
          const isSent = sentMap.has(offer.id);
          return (
            <div key={offer.id} className="bg-[#0c1022] border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
                <div>
                  <div className="flex items-center gap-2.5 mb-1">
                    <h3 className="text-slate-100 font-semibold">{offer.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[offer.status]}`}>{offer.status}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">{offer.targetTier}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{offer.targetCohort}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      <span className="font-mono bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">{offer.discountCode}</span>
                      <span className="text-emerald-400 font-medium">{offer.discountType === '₹ flat' ? `₹${offer.discountValue} off` : `${offer.discountValue}% off`}</span>
                    </span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expires {offer.expiry}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {offer.status !== 'Expired' && (
                    <button
                      onClick={() => handleSend(offer.id)}
                      disabled={isSent}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSent ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                    >
                      {isSent ? <><CheckCircle className="w-4 h-4" /> Sent</> : <><MessageSquare className="w-4 h-4" /><Mail className="w-3 h-3" /> Send via WhatsApp + Email</>}
                    </button>
                  )}
                </div>
              </div>

              {/* Conversion Funnel */}
              <div className="bg-[#060910] rounded-xl p-4 border border-slate-800/60">
                <p className="text-slate-500 text-xs uppercase tracking-wide mb-3">Conversion Funnel</p>
                <div className="flex items-center gap-2">
                  {/* Sent */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex flex-col items-center justify-center">
                      <Send className="w-4 h-4 text-indigo-400 mb-0.5" />
                      <span className="text-indigo-400 font-bold text-sm">{offer.sent}</span>
                    </div>
                    <span className="text-slate-500 text-xs mt-1">Sent</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  {/* Clicked */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center">
                      <MousePointer className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span className="text-amber-400 font-bold text-sm">{offer.clicked}</span>
                    </div>
                    <span className="text-slate-500 text-xs mt-1">Clicked</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-700 flex-shrink-0" />
                  {/* Enrolled */}
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-emerald-400 mb-0.5" />
                      <span className="text-emerald-400 font-bold text-sm">{offer.enrolled}</span>
                    </div>
                    <span className="text-slate-500 text-xs mt-1">Enrolled</span>
                  </div>

                  {/* Rates */}
                  <div className="ml-auto flex gap-4 text-right">
                    <div>
                      <div className="text-slate-300 text-lg font-bold">{clickRate}%</div>
                      <div className="text-slate-500 text-xs">Click rate</div>
                    </div>
                    <div>
                      <div className="text-emerald-400 text-lg font-bold">{convRate}%</div>
                      <div className="text-slate-500 text-xs">Conversion</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

