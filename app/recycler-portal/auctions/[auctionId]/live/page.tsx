'use client';

import { use, useEffect, useRef, useState, useCallback } from 'react';
import {
  formatCountdown,
  auctionCountdownUrgency,
  validateAuctionBid,
  computeMyRank,
} from '@/lib/recyclerPortal/auctionService';
import { trackEvent } from '@/lib/analytics';

interface AuctionState {
  status: string;
  endTime: string;
  currentBestBid: { amount: number; placedAt: string } | null;
  totalBids: number;
  uniqueBidders: number;
  currency: string;
}

interface MyBid {
  id: string;
  bid_amount: number;
  placed_at: string;
  rank: number | null;
}

export default function LiveAuctionRoom({ params }: { params: Promise<{ auctionId: string }> }) {
  const { auctionId } = use(params);
  const [auction, setAuction] = useState<AuctionState | null>(null);
  const [myBids, setMyBids] = useState<MyBid[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');
  const [countdown, setCountdown] = useState('--:--:--');
  const [extended, setExtended] = useState(false);
  const esRef = useRef<EventSource | null>(null);

  // Load initial state
  useEffect(() => {
    fetch(`/api/recycler-portal/auctions/${auctionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.auction) {
          setAuction({
            status: data.auction.status,
            endTime: data.auction.end_time,
            currentBestBid: data.auction.current_best_bid,
            totalBids: data.auction.total_bids ?? 0,
            uniqueBidders: data.auction.unique_bidders ?? 0,
            currency: data.auction.currency ?? 'INR',
          });
        }
        setMyBids(data.myBids ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [auctionId]);

  // SSE live feed
  useEffect(() => {
    if (!auction) return;
    if (['CLOSED', 'AWARDED', 'CANCELLED'].includes(auction.status)) return;

    const es = new EventSource(`/api/recycler-portal/auctions/${auctionId}/live-feed`);
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === 'state' && event.auction) {
          setAuction((prev) =>
            prev
              ? {
                  ...prev,
                  ...event.auction,
                  endTime: event.auction.endTime ?? prev.endTime,
                }
              : prev
          );
          if (event.auction.status === 'EXTENDED') setExtended(true);
        }
        if (event.type === 'closed') {
          setAuction((prev) => prev ? { ...prev, status: event.reason } : prev);
          es.close();
        }
      } catch { /* parse error */ }
    };

    // Do not close on error: serverless function timeouts (Vercel) will
    // periodically drop this connection before the auction ends, and the
    // browser's native EventSource auto-reconnect is what recovers it.
    // Explicitly closing here would leave the feed dead until page reload.
    es.onerror = () => {};

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [auctionId, auction?.status]);

  // Countdown timer
  useEffect(() => {
    if (!auction?.endTime) return;
    const id = setInterval(() => setCountdown(formatCountdown(auction.endTime)), 500);
    return () => clearInterval(id);
  }, [auction?.endTime]);

  const urgency = auction ? auctionCountdownUrgency(auction.endTime) : 'normal';

  const submitBid = useCallback(async () => {
    if (!auction) return;
    setBidError('');
    setBidSuccess('');

    const amount = Number(bidAmount);
    const validation = validateAuctionBid(amount, {
      id: auctionId,
      auctionType: 'REVERSE',
      status: auction.status as any,
      startTime: '',
      endTime: auction.endTime,
      extensionMinutes: 5,
      currentBestBid: auction.currentBestBid?.amount,
    });

    if (!validation.valid) {
      setBidError(validation.error ?? 'Invalid bid');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/recycler-portal/auctions/${auctionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bidAmount: amount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBidError(data.error ?? 'Bid failed');
      } else {
        trackEvent('Recycler Auction Bid Placed', { auction_id: auctionId, amount });
        setBidSuccess(`Bid of ${auction.currency} ${amount.toLocaleString('en-IN')} placed!`);
        setBidAmount('');
        if (data.extended) setExtended(true);
      }
    } catch {
      setBidError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [auction, auctionId, bidAmount]);

  if (loading) return <div className="h-48 rounded-xl bg-gray-100 animate-pulse" />;
  if (!auction) return <p className="text-gray-500">Auction not found.</p>;

  const isActive = ['LIVE', 'EXTENDED'].includes(auction.status);
  const countdownColor =
    urgency === 'critical' ? 'text-red-600' : urgency === 'warning' ? 'text-orange-600' : 'text-gray-800';
  const myLatestBid = myBids[0];
  const myRank = myLatestBid && auction.currentBestBid
    ? computeMyRank(
        myLatestBid.bid_amount,
        [auction.currentBestBid.amount, myLatestBid.bid_amount],
        'REVERSE'
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Status bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Live Auction Room</h1>
          <p className="text-sm text-gray-500">
            {auction.totalBids} bids · {auction.uniqueBidders} bidders
          </p>
        </div>
        <div className="text-center">
          {isActive ? (
            <>
              <p className="text-xs text-gray-500">
                {extended ? '⏱ Extended — ' : ''}Time remaining
              </p>
              <p className={`text-2xl font-mono font-bold ${countdownColor}`}>{countdown}</p>
            </>
          ) : (
            <span className="rounded-full bg-gray-100 text-gray-600 text-sm px-3 py-1">
              {auction.status}
            </span>
          )}
        </div>
      </div>

      {extended && (
        <div className="rounded-xl bg-orange-50 border border-orange-200 px-4 py-2 text-sm text-orange-800">
          ⚡ Auction has been extended due to last-minute bidding.
        </div>
      )}

      {/* Current best bid (anonymized) */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Best Bid</p>
        {auction.currentBestBid ? (
          <p className="text-2xl font-bold text-green-700 mt-1">
            {auction.currency}{' '}
            {auction.currentBestBid.amount.toLocaleString('en-IN')}
          </p>
        ) : (
          <p className="text-gray-400 text-sm mt-1">No bids yet — be the first!</p>
        )}
        {myRank && (
          <p className="text-xs text-gray-600 mt-1">
            Your position: <strong>#{myRank}</strong>
          </p>
        )}
      </div>

      {/* Bid input */}
      {isActive && (
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Place a Bid</h2>
          <div className="flex gap-2">
            <input
              type="number"
              min={0.01}
              step={0.01}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              placeholder={`Enter amount (${auction.currency})`}
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              aria-label="Bid amount"
            />
            <button
              onClick={submitBid}
              disabled={submitting || !bidAmount}
              className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              aria-busy={submitting}
            >
              {submitting ? '…' : 'Place Bid'}
            </button>
          </div>
          {bidError && (
            <p role="alert" className="mt-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {bidError}
            </p>
          )}
          {bidSuccess && (
            <p role="status" className="mt-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              {bidSuccess}
            </p>
          )}
        </div>
      )}

      {/* My bid history */}
      {myBids.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">My Bid History</h2>
          <div className="space-y-2">
            {myBids.map((bid) => (
              <div key={bid.id} className="flex items-center justify-between text-xs text-gray-600">
                <span className="font-mono">
                  {auction.currency} {bid.bid_amount.toLocaleString('en-IN')}
                </span>
                <span>{new Date(bid.placed_at).toLocaleTimeString('en-IN')}</span>
                {bid.rank && <span className="text-gray-400">Rank #{bid.rank}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
