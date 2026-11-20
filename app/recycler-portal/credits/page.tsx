'use client';

import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Credit {
  id: string;
  transaction_ref: string;
  waste_category: string;
  credit_type: string;
  quantity_mt: number;
  rate_per_mt_inr: number;
  total_value_inr: number;
  issue_date: string;
  validity_date: string;
  status: 'Issued' | 'Transferred' | 'Used' | 'Expired' | 'Disputed' | 'Listed';
  cpcb_cert_ref: string;
}

interface CreditSummary {
  total_issued: number;
  total_transferred: number;
  total_value_inr: number;
  by_category: Record<string, number>;
}

interface MarketListing {
  id: string;
  credit_id: string;
  seller_name: string;
  waste_category: string;
  credit_type: string;
  quantity_mt: number;
  ask_price_inr: number;
  validity_date: string;
  listed_at: string;
  status: 'ACTIVE' | 'SOLD' | 'EXPIRED' | 'WITHDRAWN';
  is_mine: boolean;
}

interface TradeRecord {
  id: string;
  trade_ref: string;
  waste_category: string;
  quantity_mt: number;
  trade_price_inr: number;
  total_value_inr: number;
  buyer_name: string;
  traded_at: string;
  settlement_status: 'PENDING' | 'SETTLED' | 'DISPUTED';
}

interface MarketData {
  listings: MarketListing[];
  myListings: MarketListing[];
  tradeHistory: TradeRecord[];
  marketRates: { category: string; avg_rate: number; min_rate: number; max_rate: number }[];
  availableToList: Credit[];
  cpcb_list_block?: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CREDIT_STATUS_COLORS: Record<string, string> = {
  Issued: 'bg-blue-100 text-blue-800',
  Transferred: 'bg-green-100 text-green-800',
  Used: 'bg-gray-100 text-gray-700',
  Expired: 'bg-orange-100 text-orange-700',
  Disputed: 'bg-red-100 text-red-700',
  Listed: 'bg-purple-100 text-purple-700',
};

const LISTING_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-300',
  SOLD: 'bg-blue-100 text-blue-800 border-blue-300',
  EXPIRED: 'bg-orange-100 text-orange-700 border-orange-300',
  WITHDRAWN: 'bg-gray-100 text-gray-700 border-gray-300',
};

const SETTLEMENT_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  SETTLED: 'bg-green-100 text-green-800',
  DISPUTED: 'bg-red-100 text-red-800',
};

const STATUS_FILTERS = ['All', 'Issued', 'Transferred', 'Used', 'Expired', 'Disputed', 'Listed'];

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN');
}

// ─── Ledger Tab ───────────────────────────────────────────────────────────────

function LedgerTab() {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [summary, setSummary] = useState<CreditSummary | null>(null);
  const [status, setStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== 'All') params.set('status', status);
    fetch(`/api/recycler-portal/credits?${params}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setError(d.error); return; }
        setCredits(d.credits);
        setSummary(d.summary);
      })
      .catch(() => setError('Failed to load credits'))
      .finally(() => setLoading(false));
  }, [status]);

  const activeCount = credits.filter(c => c.status === 'Issued').length;

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Issued</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{summary.total_issued}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Value</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{fmt(summary.total_value_inr)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Transferred</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{summary.total_transferred}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">Active (Issued)</p>
            <p className="text-3xl font-bold text-green-700 mt-1">{activeCount}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === s ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading credits…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">{error}</div>
        ) : credits.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            <p className="text-lg font-medium">No credits found</p>
            <p className="text-sm mt-1">Credits appear here once issued by the compliance team.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Transaction Ref', 'Category', 'Type', 'Qty (MT)', 'Rate/MT', 'Total Value', 'Issue Date', 'Valid Till', 'Status'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {credits.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{c.transaction_ref ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-800">{c.waste_category}</td>
                    <td className="px-4 py-3 text-gray-600">{c.credit_type}</td>
                    <td className="px-4 py-3 text-gray-800 font-medium">{c.quantity_mt?.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-gray-600">{fmt(c.rate_per_mt_inr)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{fmt(c.total_value_inr)}</td>
                    <td className="px-4 py-3 text-gray-600">{c.issue_date ? new Date(c.issue_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.validity_date ? new Date(c.validity_date).toLocaleDateString('en-IN') : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${CREDIT_STATUS_COLORS[c.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Marketplace Tab ──────────────────────────────────────────────────────────

function MarketplaceTab() {
  const [data, setData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<'all' | 'mine'>('all');

  // Sell listing form
  const [sellOpen, setSellOpen] = useState(false);
  const [sellForm, setSellForm] = useState({ credit_id: '', quantity_mt: '', ask_price_inr: '' });
  const [selling, setSelling] = useState(false);
  const [sellError, setSellError] = useState('');
  const [sellSuccess, setSellSuccess] = useState('');

  // Buy intent
  const [buying, setBuying] = useState<string | null>(null);
  const [buySuccess, setBuySuccess] = useState('');
  const [buyError, setBuyError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const r = await fetch('/api/recycler-portal/credits/marketplace');
      if (!r.ok) throw new Error('Failed to load marketplace');
      const d = await r.json();
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleList() {
    if (!sellForm.credit_id) { setSellError('Select a credit to list'); return; }
    if (!sellForm.quantity_mt || Number(sellForm.quantity_mt) <= 0) { setSellError('Enter valid quantity'); return; }
    if (!sellForm.ask_price_inr || Number(sellForm.ask_price_inr) <= 0) { setSellError('Enter valid ask price'); return; }
    setSelling(true); setSellError(''); setSellSuccess('');
    try {
      const r = await fetch('/api/recycler-portal/credits/marketplace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credit_id: sellForm.credit_id,
          quantity_mt: Number(sellForm.quantity_mt),
          ask_price_inr: Number(sellForm.ask_price_inr),
        }),
      });
      const d = await r.json();
      if (!r.ok) { setSellError(d.error || 'Failed'); return; }
      trackEvent('Recycler Credit Listed', { quantity_mt: Number(sellForm.quantity_mt), ask_price_inr: Number(sellForm.ask_price_inr) });
      setSellSuccess('Credit listed for sale! Buyers can now discover and bid.');
      setSellForm({ credit_id: '', quantity_mt: '', ask_price_inr: '' });
      setSellOpen(false);
      load();
    } catch (e: any) {
      setSellError(e.message);
    } finally {
      setSelling(false);
    }
  }

  async function handleBuyIntent(listingId: string) {
    setBuying(listingId); setBuyError(''); setBuySuccess('');
    try {
      const r = await fetch(`/api/recycler-portal/credits/marketplace/${listingId}/interest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      if (!r.ok) { setBuyError(d.error || 'Failed'); return; }
      trackEvent('Recycler Credit Buy Interest Registered', { listing_id: listingId });
      setBuySuccess('Interest registered. The seller will be notified and the compliance team will facilitate the trade.');
    } catch {
      setBuyError('Failed to register interest');
    } finally {
      setBuying(null);
    }
  }

  async function handleWithdraw(listingId: string) {
    setBuying(listingId);
    try {
      await fetch(`/api/recycler-portal/credits/marketplace/${listingId}`, { method: 'DELETE' });
      trackEvent('Recycler Credit Listing Withdrawn', { listing_id: listingId });
      load();
    } finally {
      setBuying(null);
    }
  }

  if (loading) return (
    <div className="space-y-3">
      {[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
      <p className="text-red-600 text-sm">{error}</p>
      <button onClick={load} className="mt-3 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700">Retry</button>
    </div>
  );

  const listings = view === 'mine' ? (data?.myListings ?? []) : (data?.listings ?? []);

  return (
    <div className="space-y-6">
      {/* Market Rates Banner */}
      {(data?.marketRates ?? []).length > 0 && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
          <p className="text-xs font-semibold text-teal-800 uppercase tracking-wide mb-3">Current Market Rates (₹/MT)</p>
          <div className="flex flex-wrap gap-4">
            {data!.marketRates.map(rate => (
              <div key={rate.category} className="text-center">
                <p className="text-xs text-teal-600 font-medium">{rate.category}</p>
                <p className="text-lg font-bold text-teal-900">₹{rate.avg_rate.toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-teal-500">₹{rate.min_rate.toLocaleString('en-IN')} – ₹{rate.max_rate.toLocaleString('en-IN')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'mine'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                view === v ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {v === 'all' ? 'All Listings' : 'My Listings'}
            </button>
          ))}
        </div>
        <button
          onClick={() => { setSellOpen(true); setSellError(data?.cpcb_list_block || ''); setSellSuccess(''); }}
          disabled={!!data?.cpcb_list_block}
          title={data?.cpcb_list_block || undefined}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          + List Credits for Sale
        </button>
      </div>

      {data?.cpcb_list_block ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {data.cpcb_list_block}{' '}
          <a href="/recycler-portal/cert-renewal" className="font-semibold underline">Renew CPCB certificate</a>
        </div>
      ) : null}

      {/* Success / error banners */}
      {sellSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {sellSuccess}
        </div>
      )}
      {buySuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {buySuccess}
        </div>
      )}
      {buyError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{buyError}</div>
      )}

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-50">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-teal-400" fill="none" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <p className="text-sm font-medium text-gray-700">No active listings</p>
          <p className="text-xs text-gray-400 mt-1">
            {view === 'mine' ? 'List your available credits for sale to reach EPR producers.' : 'Check back later for available credit listings.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map(listing => (
            <div key={listing.id} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className="text-sm font-semibold text-gray-900">{listing.waste_category}</span>
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{listing.credit_type}</span>
                    <span className={`text-xs rounded-full border px-2 py-0.5 font-medium ${LISTING_STATUS_COLORS[listing.status]}`}>
                      {listing.status}
                    </span>
                    {listing.is_mine && (
                      <span className="text-xs bg-teal-100 text-teal-700 rounded-full px-2 py-0.5 border border-teal-200">Your Listing</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                    <div>
                      <span className="text-gray-500 text-xs">Quantity</span>
                      <p className="font-semibold text-gray-900">{listing.quantity_mt.toLocaleString('en-IN')} MT</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Ask Price</span>
                      <p className="font-semibold text-teal-700">{fmt(listing.ask_price_inr)}/MT</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Total Value</span>
                      <p className="font-semibold text-gray-900">{fmt(listing.quantity_mt * listing.ask_price_inr)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 text-xs">Valid Till</span>
                      <p className="font-medium text-gray-700">{new Date(listing.validity_date).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                  {!listing.is_mine && (
                    <p className="text-xs text-gray-400 mt-2">Listed by: {listing.seller_name}</p>
                  )}
                </div>
                <div className="shrink-0">
                  {listing.is_mine && listing.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleWithdraw(listing.id)}
                      disabled={buying === listing.id}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
                    >
                      {buying === listing.id ? 'Withdrawing…' : 'Withdraw'}
                    </button>
                  ) : !listing.is_mine && listing.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleBuyIntent(listing.id)}
                      disabled={buying === listing.id}
                      className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-40 transition-colors"
                    >
                      {buying === listing.id ? 'Registering…' : 'Interested'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List for Sale Modal */}
      {sellOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">List Credit for Sale</h2>
              <button onClick={() => setSellOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Select Credit *</label>
                <select
                  value={sellForm.credit_id}
                  onChange={(e) => setSellForm((f) => ({ ...f, credit_id: e.target.value }))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Choose available credit…</option>
                  {(data?.availableToList ?? []).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.waste_category} — {c.quantity_mt} MT (Issued {new Date(c.issue_date).toLocaleDateString('en-IN')})
                    </option>
                  ))}
                </select>
                {(data?.availableToList ?? []).length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No issued credits available to list. Credits must be in "Issued" status.</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity to List (MT) *</label>
                <input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={sellForm.quantity_mt}
                  onChange={(e) => setSellForm((f) => ({ ...f, quantity_mt: e.target.value }))}
                  placeholder="e.g. 50"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Ask Price (₹/MT) *</label>
                <input
                  type="number"
                  min={1}
                  value={sellForm.ask_price_inr}
                  onChange={(e) => setSellForm((f) => ({ ...f, ask_price_inr: e.target.value }))}
                  placeholder="e.g. 12500"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                {sellForm.quantity_mt && sellForm.ask_price_inr && (
                  <p className="text-xs text-gray-500 mt-1">
                    Estimated value: {fmt(Number(sellForm.quantity_mt) * Number(sellForm.ask_price_inr))}
                  </p>
                )}
              </div>
            </div>

            {sellError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{sellError}</p>}

            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700">
              Listing is subject to compliance officer verification. Trades are facilitated by EPR Compass and settled within 5 business days.
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSellOpen(false)} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
              <button onClick={handleList} disabled={selling} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
                {selling ? 'Listing…' : 'List for Sale'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trade History Tab ─────────────────────────────────────────────────────────

function TradeHistoryTab() {
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recycler-portal/credits/marketplace?view=trades')
      .then(r => r.json())
      .then(d => setTrades(d.trades ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>;

  if (trades.length === 0) return (
    <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
      <p className="text-sm text-gray-500">No completed trades yet.</p>
      <p className="text-xs text-gray-400 mt-1">Trades executed through the marketplace will appear here.</p>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Trade Ref', 'Category', 'Qty (MT)', 'Price/MT', 'Total Value', 'Buyer', 'Date', 'Settlement'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {trades.map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-700">{t.trade_ref}</td>
                <td className="px-4 py-3 text-gray-800">{t.waste_category}</td>
                <td className="px-4 py-3 font-medium text-gray-900">{t.quantity_mt.toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-teal-700 font-medium">{fmt(t.trade_price_inr)}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(t.total_value_inr)}</td>
                <td className="px-4 py-3 text-gray-600">{t.buyer_name}</td>
                <td className="px-4 py-3 text-gray-600">{new Date(t.traded_at).toLocaleDateString('en-IN')}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${SETTLEMENT_COLORS[t.settlement_status]}`}>
                    {t.settlement_status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'ledger' | 'marketplace' | 'trades';

const TABS: { key: Tab; label: string }[] = [
  { key: 'ledger', label: 'Credit Ledger' },
  { key: 'marketplace', label: 'Trading Marketplace' },
  { key: 'trades', label: 'Trade History' },
];

export default function CreditsPage() {
  const [tab, setTab] = useState<Tab>('ledger');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">EPR Credits</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your EPR credit ledger, list credits for sale in the marketplace, and view completed trades.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'ledger' && <LedgerTab />}
      {tab === 'marketplace' && <MarketplaceTab />}
      {tab === 'trades' && <TradeHistoryTab />}
    </div>
  );
}

