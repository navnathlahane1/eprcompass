'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCountdown, auctionCountdownUrgency } from '@/lib/recyclerPortal/auctionService';

interface Auction {
  id: string;
  auction_number: string;
  title: string;
  epr_type: string;
  auction_type: string;
  required_qty: number;
  unit: string;
  start_time: string;
  end_time: string;
  status: string;
  total_bids: number;
  currency: string;
  current_best_bid: { amount: number } | null;
}

const STATUS_COLOR: Record<string, string> = {
  LIVE: 'bg-green-100 text-green-800 border-green-300',
  EXTENDED: 'bg-orange-100 text-orange-800 border-orange-300',
  SCHEDULED: 'bg-blue-100 text-blue-800 border-blue-300',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-300',
  AWARDED: 'bg-purple-100 text-purple-800 border-purple-300',
};

function LiveCountdown({ endTime, status }: { endTime: string; status: string }) {
  const [display, setDisplay] = useState('');
  const [urgency, setUrgency] = useState<string>('normal');

  useEffect(() => {
    const update = () => {
      setDisplay(formatCountdown(endTime));
      setUrgency(auctionCountdownUrgency(endTime));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [endTime]);

  if (!['LIVE', 'EXTENDED'].includes(status)) return null;

  const colorClass =
    urgency === 'critical'
      ? 'text-red-600 font-bold'
      : urgency === 'warning'
      ? 'text-orange-600 font-semibold'
      : 'text-gray-700';

  return <span className={`font-mono text-sm ${colorClass}`}>{display}</span>;
}

export default function RecyclerAuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'active' | 'scheduled' | 'closed'>('active');

  useEffect(() => {
    const statusParam = tab === 'active' ? '' : tab === 'scheduled' ? '?status=SCHEDULED' : '?status=CLOSED';
    fetch(`/api/recycler-portal/auctions${statusParam}`)
      .then((r) => r.json())
      .then((d) => setAuctions(d.auctions ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tab]);

  const tabs = [
    { key: 'active', label: 'Live / Extended' },
    { key: 'scheduled', label: 'Upcoming' },
    { key: 'closed', label: 'Closed' },
  ] as const;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Live Auctions</h1>

      {/* Tabs */}
      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setLoading(true); }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
              tab === t.key ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : auctions.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-gray-500 text-sm">No auctions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {auctions.map((auction) => (
            <div
              key={auction.id}
              className="rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-mono">{auction.auction_number}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full border ${
                        STATUS_COLOR[auction.status] ?? 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {auction.status}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      {auction.auction_type}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-1">{auction.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {auction.required_qty} {auction.unit} · {auction.epr_type} · {auction.total_bids} bids
                  </p>
                  {auction.current_best_bid && (
                    <p className="text-xs text-gray-600 mt-0.5">
                      Current best: <strong>
                        {auction.currency} {auction.current_best_bid.amount.toLocaleString('en-IN')}
                      </strong>
                    </p>
                  )}
                  <LiveCountdown endTime={auction.end_time} status={auction.status} />
                </div>
                {['LIVE', 'EXTENDED'].includes(auction.status) && (
                  <Link
                    href={`/recycler-portal/auctions/${auction.id}/live`}
                    className="shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                  >
                    Enter Room
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
