// [MODULE] EPR Trading Console
// [PURPOSE] Composes the full anonymous EPR credit trading experience for admin monitoring and operations.
// [DEPENDENCIES] react, local trading components/hooks

'use client';

import { useMemo, useState } from 'react';
import OrderBookTerminal from '@/components/marketplace/trading/OrderBookTerminal';
import NegotiationRoom from '@/components/marketplace/trading/NegotiationRoom';
import TradingDashboard from '@/components/marketplace/trading/TradingDashboard';
import PriceIntelligencePanel from '@/components/marketplace/trading/PriceIntelligencePanel';
import NotificationCenter from '@/components/marketplace/trading/NotificationCenter';
import { getDirection, t } from '@/lib/epr-trading/i18n';
import type { MarketDepthPoint, NegotiationMessage, NegotiationRoom as Room, TradingOrder, WasteCategory } from '@/lib/epr-trading/types';

const seededOrders: TradingOrder[] = [
  {
    id: 'ord-buy-1',
    traderId: 'BRAND-7X4K',
    side: 'buy',
    category: 'plastic',
    quantityMt: 180,
    pricePerMt: 11800,
    currency: 'INR',
    geography: 'Maharashtra',
    complianceGrade: 'verified',
    certifications: [],
    status: 'open',
    expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ord-sell-1',
    traderId: 'RCY-9M2P',
    side: 'sell',
    category: 'plastic',
    quantityMt: 150,
    pricePerMt: 12150,
    currency: 'INR',
    geography: 'Maharashtra',
    complianceGrade: 'verified',
    certifications: ['CPCB', 'ISO'],
    status: 'open',
    expiresAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ord-sell-2',
    traderId: 'RCY-2K8N',
    side: 'sell',
    category: 'plastic',
    quantityMt: 200,
    pricePerMt: 12300,
    currency: 'INR',
    geography: 'Gujarat',
    complianceGrade: 'pending',
    certifications: ['CPCB'],
    status: 'open',
    expiresAt: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const seededDepth: MarketDepthPoint[] = [
  { side: 'buy', category: 'plastic', currency: 'INR', priceBand: 11600, totalQuantityMt: 80, ordersCount: 2 },
  { side: 'buy', category: 'plastic', currency: 'INR', priceBand: 11800, totalQuantityMt: 180, ordersCount: 3 },
  { side: 'sell', category: 'plastic', currency: 'INR', priceBand: 12100, totalQuantityMt: 120, ordersCount: 2 },
  { side: 'sell', category: 'plastic', currency: 'INR', priceBand: 12300, totalQuantityMt: 240, ordersCount: 4 }
];

const seededTrend = [
  { day: 'D-6', plastic: 11300, ewaste: 18200, battery: 20500, tyre: 9500 },
  { day: 'D-5', plastic: 11450, ewaste: 18350, battery: 20600, tyre: 9600 },
  { day: 'D-4', plastic: 11600, ewaste: 18420, battery: 20780, tyre: 9720 },
  { day: 'D-3', plastic: 11700, ewaste: 18300, battery: 20820, tyre: 9790 },
  { day: 'D-2', plastic: 11820, ewaste: 18280, battery: 20910, tyre: 9820 },
  { day: 'D-1', plastic: 12050, ewaste: 18340, battery: 20990, tyre: 9860 },
  { day: 'D', plastic: 12250, ewaste: 18400, battery: 20950, tyre: 9850 }
];

const seededNotifications = [
  {
    id: 'ntf-1',
    channel: 'in_app' as const,
    message: 'Counter-offer received in Room A5Z9 for BRAND-7X4K.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'ntf-2',
    channel: 'email' as const,
    message: '3 new matches available for your open Plastic buy orders.',
    createdAt: new Date(Date.now() - 3600 * 1000).toISOString()
  }
];

export default function AdminEprCreditTradingPage() {
  const [locale, setLocale] = useState<'en' | 'hi' | 'ar'>('en');
  const [category, setCategory] = useState<WasteCategory>('plastic');
  const [messages, setMessages] = useState<NegotiationMessage[]>([
    {
      id: 'msg-1',
      roomId: 'room-1',
      senderTraderId: 'RCY-9M2P',
      redactedPreview: 'Can process 140 MT within 10 days at INR 12,150/MT.',
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
    }
  ]);

  const room: Room = useMemo(
    () => ({
      id: 'room-1',
      brandTraderId: 'BRAND-7X4K',
      recyclerTraderId: 'RCY-9M2P',
      status: 'in_discussion',
      terms: { quantityMt: 140, pricePerMt: 12150, category },
      expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    }),
    [category]
  );

  async function handlePostMessage(payload: { message: string; action: 'make_offer' | 'counter_offer' | 'accept' | 'walk_away' }) {
    // [LOGIC] Frontend contract simulation mirrors backend /api/trading/negotiations/:roomId/messages.
    setMessages((prev) => [
      ...prev,
      {
        id: `msg-${prev.length + 1}`,
        roomId: room.id,
        senderTraderId: 'BRAND-7X4K',
        redactedPreview: payload.message,
        createdAt: new Date().toISOString()
      }
    ]);
  }

  async function handleStatusChange(_status: Room['status']) {
    // TODO: persist negotiation status to /api/trading/negotiations/:roomId/status
  }

  return (
    <div className="space-y-6 p-4 md:p-6" dir={getDirection(locale)}>
      <section className="rounded-2xl border border-[#1B2640] bg-[#0A0F1E] p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-mono text-2xl font-bold">{t('trading.title', locale)}</h1>
            <p className="mt-1 text-sm text-slate-300">
              Anonymous discovery and deal-making between producers and recyclers. Identity unlock only after both parties spend 1000 credits; final settlement happens on the government platform.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as WasteCategory)}
              className="rounded-lg border border-[#223359] bg-[#0D1428] px-3 py-2 text-sm"
              aria-label="Waste category"
            >
              <option value="plastic">Plastic</option>
              <option value="ewaste">E-Waste</option>
              <option value="battery">Battery</option>
              <option value="tyre">Tyre</option>
            </select>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'en' | 'hi' | 'ar')}
              className="rounded-lg border border-[#223359] bg-[#0D1428] px-3 py-2 text-sm"
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ar">Arabic</option>
            </select>
          </div>
        </div>
      </section>

      <TradingDashboard role="ADMIN" />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <OrderBookTerminal orders={seededOrders} depth={seededDepth} selectedCategory={category} />
        </div>
        <NotificationCenter items={seededNotifications} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <NegotiationRoom
            room={room}
            messages={messages}
            activeTraderId="BRAND-7X4K"
            onPostMessage={handlePostMessage}
            onStatusChange={handleStatusChange}
          />
        </div>
        <PriceIntelligencePanel trend={seededTrend} />
      </div>
    </div>
  );
}
