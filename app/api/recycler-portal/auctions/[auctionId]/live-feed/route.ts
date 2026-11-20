/**
 * GET /api/recycler-portal/auctions/[auctionId]/live-feed
 *
 * Server-Sent Events stream for live auction state.
 * Emits auction state every 3 seconds while auction is LIVE or EXTENDED.
 * The stream ends when auction status transitions to CLOSED/AWARDED/CANCELLED.
 *
 * Events emitted (JSON stringified):
 *   { type: 'state', auction: { status, endTime, currentBestBid, totalBids, uniqueBidders } }
 *   { type: 'closed', reason: 'CLOSED' | 'AWARDED' | 'CANCELLED' }
 *   { type: 'ping' }  — keepalive every 15 seconds
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveRecyclerActor, adminClient } from '@/lib/recyclerPortal/recyclerAuth';

// Vercel will kill this connection at the platform's function-duration limit
// well before 30 minutes regardless of this value; the client's EventSource
// auto-reconnects on drop (see live/page.tsx), so this is a soft outer cap.
export const maxDuration = 60;

// Max stream duration: 30 minutes (prevents runaway connections)
const MAX_STREAM_MS = 30 * 60 * 1000;
const POLL_INTERVAL_MS = 3000;
const PING_INTERVAL_MS = 15000;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ auctionId: string }> }
) {
  const { auctionId } = await params;
  const actor = await resolveRecyclerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = adminClient();

  // Verify auction exists and is accessible
  const { data: initialAuction } = await (db as any)
    .from('auctions')
    .select('id, status')
    .eq('id', auctionId)
    .maybeSingle();

  if (!initialAuction) {
    return NextResponse.json({ error: 'Auction not found' }, { status: 404 });
  }

  const TERMINAL_STATUSES = new Set(['CLOSED', 'AWARDED', 'CANCELLED']);

  if (TERMINAL_STATUSES.has(initialAuction.status)) {
    // Auction is already over — return single event and close
    const body = `data: ${JSON.stringify({ type: 'closed', reason: initialAuction.status })}\n\n`;
    return new NextResponse(body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  }

  const encoder = new TextEncoder();
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let maxTimer: ReturnType<typeof setTimeout> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      function send(data: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may already be closed; ignore
        }
      }

      function close() {
        if (pingTimer) clearInterval(pingTimer);
        if (pollTimer) clearInterval(pollTimer);
        if (maxTimer) clearTimeout(maxTimer);
        try { controller.close(); } catch { /* already closed */ }
      }

      // Keepalive ping
      pingTimer = setInterval(() => send({ type: 'ping' }), PING_INTERVAL_MS);

      // Poll DB for auction state
      pollTimer = setInterval(async () => {
        try {
          const { data: auction } = await (db as any)
            .from('auctions')
            .select('status, end_time, current_best_bid, total_bids, unique_bidders, currency')
            .eq('id', auctionId)
            .maybeSingle();

          if (!auction) {
            close();
            return;
          }

          if (TERMINAL_STATUSES.has(auction.status)) {
            send({ type: 'closed', reason: auction.status });
            close();
            return;
          }

          send({
            type: 'state',
            auction: {
              status: auction.status,
              endTime: auction.end_time,
              currentBestBid: auction.current_best_bid,
              totalBids: auction.total_bids,
              uniqueBidders: auction.unique_bidders,
              currency: auction.currency,
            },
          });
        } catch {
          close();
        }
      }, POLL_INTERVAL_MS);

      // Hard limit — close stream after MAX_STREAM_MS
      maxTimer = setTimeout(() => {
        send({ type: 'closed', reason: 'TIMEOUT' });
        close();
      }, MAX_STREAM_MS);

      // Send initial state immediately
      send({ type: 'state', auction: { status: initialAuction.status } });
    },
    cancel() {
      if (pingTimer) clearInterval(pingTimer);
      if (pollTimer) clearInterval(pollTimer);
      if (maxTimer) clearTimeout(maxTimer);
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
