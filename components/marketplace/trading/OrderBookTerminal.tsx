// [MODULE] EPR Listing Board (Order Book)
// [PURPOSE] Bloomberg-style bid/ask terminal showing spread and market depth with category color coding.
// [DEPENDENCIES] react, lucide-react, recharts, @/frontend/lib/epr-trading/*

'use client';

import { useMemo } from 'react';
import { Activity, ArrowDownCircle, ArrowUpCircle, CircleDot } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/epr-trading/i18n';
import type { MarketDepthPoint, TradingOrder, WasteCategory } from '@/lib/epr-trading/types';

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  plastic: '#00D4AA',
  ewaste: '#2D9CDB',
  battery: '#F2C94C',
  tyre: '#EB5757'
};

type Props = {
  orders: TradingOrder[];
  depth: MarketDepthPoint[];
  selectedCategory: WasteCategory;
  onSelectOrder?: (orderId: string) => void;
};

export default function OrderBookTerminal({ orders, depth, selectedCategory, onSelectOrder }: Props) {
  const asks = useMemo(
    () =>
      orders
        .filter((order) => order.side === 'sell' && order.category === selectedCategory)
        .sort((a, b) => a.pricePerMt - b.pricePerMt),
    [orders, selectedCategory]
  );

  const bids = useMemo(
    () =>
      orders
        .filter((order) => order.side === 'buy' && order.category === selectedCategory)
        .sort((a, b) => b.pricePerMt - a.pricePerMt),
    [orders, selectedCategory]
  );

  const bestAsk = asks[0]?.pricePerMt || 0;
  const bestBid = bids[0]?.pricePerMt || 0;
  const spread = bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0;

  const depthSeries = useMemo(
    () =>
      depth
        .filter((point) => point.category === selectedCategory)
        .sort((a, b) => a.priceBand - b.priceBand)
        .map((point) => ({
          price: point.priceBand,
          qty: Number(point.totalQuantityMt.toFixed(2)),
          side: point.side
        })),
    [depth, selectedCategory]
  );

  return (
    <section className="rounded-2xl border border-[#1B2640] bg-[#0A0F1E] p-4 text-white shadow-2xl">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-mono text-lg font-semibold tracking-wide">Order Book Terminal</h2>
          <p className="text-xs text-slate-300">Live bid/ask depth for anonymous EPR credit trading</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-[#223359] bg-[#0E1529] px-3 py-2 text-xs">
          <Activity className="h-4 w-4 text-[#00D4AA]" />
          <span>Spread:</span>
          <span className="font-mono text-[#00D4AA]">{formatCurrency(spread, 'INR')} / MT</span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-[#223359] bg-[#0D1428] p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-red-300">
              <ArrowDownCircle className="h-4 w-4" /> Ask (Sell)
            </h3>
            <span className="text-[11px] text-slate-400">Recycler offers</span>
          </div>
          <div className="space-y-1">
            {asks.slice(0, 8).map((ask) => (
              <button
                key={ask.id}
                onClick={() => onSelectOrder?.(ask.id)}
                className="flex w-full items-center justify-between rounded-md border border-transparent bg-[#131D38] px-3 py-2 text-left font-mono text-xs transition hover:border-red-400"
                aria-label={`Select sell order ${ask.id}`}
              >
                <span className="text-red-200">{formatCurrency(ask.pricePerMt, ask.currency)}</span>
                <span className="text-slate-300">{ask.quantityMt.toFixed(2)} MT</span>
                <span className="text-slate-400">{ask.traderId}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[#223359] bg-[#0D1428] p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300">
              <ArrowUpCircle className="h-4 w-4" /> Bid (Buy)
            </h3>
            <span className="text-[11px] text-slate-400">Brand obligations</span>
          </div>
          <div className="space-y-1">
            {bids.slice(0, 8).map((bid) => (
              <button
                key={bid.id}
                onClick={() => onSelectOrder?.(bid.id)}
                className="flex w-full items-center justify-between rounded-md border border-transparent bg-[#131D38] px-3 py-2 text-left font-mono text-xs transition hover:border-emerald-400"
                aria-label={`Select buy order ${bid.id}`}
              >
                <span className="text-emerald-200">{formatCurrency(bid.pricePerMt, bid.currency)}</span>
                <span className="text-slate-300">{bid.quantityMt.toFixed(2)} MT</span>
                <span className="text-slate-400">{bid.traderId}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#223359] bg-[#0D1428] p-3">
        <div className="mb-3 flex items-center gap-2 text-xs text-slate-300">
          <CircleDot className="h-4 w-4" style={{ color: CATEGORY_COLORS[selectedCategory] }} />
          Market Depth ({selectedCategory.toUpperCase()})
        </div>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={depthSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#223359" />
              <XAxis dataKey="price" stroke="#8FA3C8" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8FA3C8" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: '#0A0F1E',
                  border: '1px solid #223359',
                  color: '#E6ECFF'
                }}
              />
              <Area type="monotone" dataKey="qty" stroke={CATEGORY_COLORS[selectedCategory]} fill={CATEGORY_COLORS[selectedCategory]} fillOpacity={0.25} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
