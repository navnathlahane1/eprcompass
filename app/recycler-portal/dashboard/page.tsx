'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildRecyclerPortalSetupSteps } from '@/components/setup/setupSteps';
import type { SetupStep } from '@/components/setup/SetupGuideWidget';
import CertRenewalBanner from '@/components/recycler-portal/CertRenewalBanner';
import TourTarget from '@/components/portal/tour/TourTarget';

interface DashboardData {
  recycler: {
    name: string;
    recyclerCode: string;
    verificationStatus: string;
  };
  summary: {
    newTenders: number;
    liveAuctions: number;
    unreadAlerts: number;
    pendingRequests: number;
  };
  complianceOfficer: { id: string; full_name: string; email: string } | null;
}

export default function RecyclerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [recyclerUserId, setRecyclerUserId] = useState<string>('');
  const [activeServiceRequests, setActiveServiceRequests] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/recycler-portal/me').then((r) => r.json()),
      fetch('/api/recycler-portal/tenders?limit=5').then((r) => r.json()),
      fetch('/api/recycler-portal/auctions?status=LIVE').then((r) => r.json()),
      fetch('/api/recycler-portal/cpcb-alerts?unread=true').then((r) => r.json()),
      fetch('/api/recycler-portal/requests?limit=5').then((r) => r.json()),
      fetch('/api/recycler-portal/service-requests').then((r) => r.json()).catch(() => ({ requests: [] })),
    ])
      .then(([me, tenders, auctions, alerts, requests, serviceReqs]) => {
        const recycler = me.recycler;
        setRecyclerUserId(recycler?.id ?? '');
        const srActive = (serviceReqs.requests ?? []).filter(
          (r: any) => ['SUBMITTED', 'UNDER_REVIEW', 'IN_PROGRESS', 'AWAITING_INFO'].includes(r.status)
        ).length;
        setActiveServiceRequests(srActive);
        setData({
          recycler: {
            name: recycler?.name ?? '',
            recyclerCode: recycler?.recycler_code ?? '',
            verificationStatus: recycler?.verification_status ?? '',
          },
          summary: {
            newTenders: tenders.tenders?.filter((t: any) => t.matched)?.length ?? 0,
            liveAuctions: auctions.auctions?.length ?? 0,
            unreadAlerts: alerts.total ?? 0,
            pendingRequests: requests.requests?.filter(
              (r: any) => ['SENT', 'VIEWED'].includes(r.status)
            )?.length ?? 0,
          },
          complianceOfficer: me.complianceOfficer ?? null,
        });
        setSetupSteps(buildRecyclerPortalSetupSteps({
          hasProfile: !!(recycler?.name && recycler?.state),
          hasCertificate: !!(recycler?.cpcb_cert_no),
          hasWasteCategories: Array.isArray(recycler?.epr_categories) && recycler.epr_categories.length > 0,
          hasOnboardingDone: recycler?.verification_status === 'VERIFIED',
          hasDocuments: !!(recycler?.documents_count > 0),
          trainingCompleted: !!recycler?.training_completed,
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const summaryCards = data
    ? [
        { label: 'New Tender Matches', value: data.summary.newTenders, href: '/recycler-portal/tenders', color: 'bg-blue-50 text-blue-700 border-blue-200' },
        { label: 'Live Auctions', value: data.summary.liveAuctions, href: '/recycler-portal/auctions', color: 'bg-green-50 text-green-700 border-green-200' },
        { label: 'Unread CPCB Alerts', value: data.summary.unreadAlerts, href: '/recycler-portal/cpcb-alerts', color: 'bg-orange-50 text-orange-700 border-orange-200' },
        { label: 'Pending Requests', value: data.summary.pendingRequests, href: '/recycler-portal/requests', color: 'bg-purple-50 text-purple-700 border-purple-200' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <CertRenewalBanner />
      {!loading && setupSteps.length > 0 && (
        <TourTarget id="dash-setup-guide">
          <SetupGuideWidget
            steps={setupSteps}
            portalKey={`recycler-portal-${recyclerUserId}`}
            accentColor="teal"
          />
        </TourTarget>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {loading ? 'Loading…' : `Welcome, ${data?.recycler.name}`}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Recycler Code: {data?.recycler.recyclerCode ?? '—'}
        </p>
      </div>

      {/* Summary cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {summaryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-xl border p-4 transition hover:shadow-sm ${card.color}`}
            >
              <p className="text-3xl font-bold">{card.value}</p>
              <p className="text-xs font-medium mt-1">{card.label}</p>
            </Link>
          ))}
        </TourTarget>
      )}

      {/* Compliance Officer Card */}
      {!loading && data?.complianceOfficer && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 flex items-center gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold select-none">
            {data.complianceOfficer.full_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">Your Compliance Officer</p>
            <p className="text-sm font-semibold text-teal-900">{data.complianceOfficer.full_name}</p>
          </div>
          <a
            href={`mailto:${data.complianceOfficer.email}?subject=Query — ${data.recycler.recyclerCode}`}
            className="shrink-0 rounded-lg border border-teal-300 bg-white px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100 transition-colors"
          >
            Message
          </a>
        </div>
      )}

      {/* Service Requests Alert */}
      {!loading && activeServiceRequests > 0 && (
        <Link
          href="/recycler-portal/service-requests"
          className="block rounded-xl border border-amber-200 bg-amber-50 p-4 hover:bg-amber-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            <p className="text-sm font-medium text-amber-800">
              {activeServiceRequests} active service request{activeServiceRequests !== 1 ? 's' : ''} — click to view updates
            </p>
          </div>
        </Link>
      )}

      {/* Quick actions */}
      <TourTarget id="dash-quick-actions" className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/recycler-portal/tenders" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">Browse Tenders</Link>
          <Link href="/recycler-portal/auctions" className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">Join Auction</Link>
          <Link href="/recycler-portal/credits" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">Credit Trading</Link>
          <Link href="/recycler-portal/tonnage" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Log Tonnage</Link>
          <Link href="/recycler-portal/analytics" className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700">Analytics</Link>
          <Link href="/recycler-portal/invoices" className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">Invoices</Link>
          <Link href="/recycler-portal/requests" className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">Requests</Link>
          <Link href="/recycler-portal/service-requests" className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">Get Support</Link>
          <Link href="/recycler-portal/profile" className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Update Profile</Link>
        </div>
      </TourTarget>
    </div>
  );
}
