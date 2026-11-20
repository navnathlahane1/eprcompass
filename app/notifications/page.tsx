/**
 * /notifications — Public EPR Notifications Listing Page
 * Supports: filter by EPR type, authority, year, keyword
 * ISR: revalidates every 10 minutes
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import NotificationCard from '@/components/notifications/NotificationCard';
import NotificationFilters from '@/components/notifications/NotificationFilters';
import NotificationsPagination from '@/components/notifications/NotificationsPagination';
import { Bell, FileText, Filter, TrendingUp } from 'lucide-react';

export const revalidate = 600; // 10 minutes

// ─── Metadata ────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'EPR Compliance Notifications | CPCB Circulars, Gazettes & Guidelines — EPR Compass',
  description:
    'Stay updated on India EPR compliance — CPCB circulars, MoEF&CC gazettes, office memorandums, guidelines for Plastic, E-Waste, Battery, Tyre EPR producers. Download PDFs instantly.',
  keywords: [
    'EPR notifications India', 'CPCB circular', 'MoEF&CC gazette notification',
    'plastic waste EPR', 'e-waste compliance', 'battery EPR notification',
    'EPR compliance update', 'India pollution control board',
  ],
  openGraph: {
    title:       'EPR Compliance Notifications — EPR Compass',
    description: 'CPCB, MoEF&CC circulars, gazettes, and compliance guidelines for EPR producers in India.',
    type:        'website',
    url:         'http://localhost:3000/notifications',
  },
  alternates: { canonical: 'http://localhost:3000/notifications' },
};

// ─── Supabase (server-side, service role) ────────────────────────────────────
function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────
interface SearchParams {
  page?:      string;
  limit?:     string;
  q?:         string;
  epr_type?:  string;
  authority?: string;
  year?:      string;
  sort?:      string;
}

async function fetchNotifications(searchParams: SearchParams) {
  const sb     = getSb();
  const page   = Math.max(1, parseInt(searchParams.page  || '1',  10));
  const limit  = Math.min(24, parseInt(searchParams.limit || '20', 10));
  const offset = (page - 1) * limit;

  let qb = sb
    .from('scraped_notifications')
    .select(
      `id, slug, title, short_description, epr_type, document_type,
       published_date, tags, is_featured, view_count, download_count,
       notification_authorities!authority_id(id, slug, short_name, name),
       notification_categories!category_id(id, slug, name),
       notification_files(id, cdn_url, mime_type, is_primary, display_name, file_extension)`,
      { count: 'exact' }
    )
    .eq('status', 'active')
    .eq('is_deleted', false);

  if (searchParams.epr_type)  qb = qb.eq('epr_type', searchParams.epr_type);
  if (searchParams.year)      qb = qb.gte('published_date', `${searchParams.year}-01-01`).lte('published_date', `${searchParams.year}-12-31`);
  if (searchParams.q) {
    qb = qb.or(`title.ilike.%${searchParams.q}%,short_description.ilike.%${searchParams.q}%`);
  }

  const ascending = searchParams.sort === 'date_asc';
  qb = qb.order('published_date', { ascending, nullsFirst: false });
  qb = qb.range(offset, offset + limit - 1);

  return qb;
}

async function fetchEprTypeCounts() {
  const sb = getSb();
  const { data } = await sb
    .from('scraped_notifications')
    .select('epr_type')
    .eq('status', 'active')
    .eq('is_deleted', false);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const k = row.epr_type || 'General';
    counts[k] = (counts[k] || 0) + 1;
  }
  return counts;
}

// ─── EPR Quick Filter Chips ───────────────────────────────────────────────────
const EPR_CHIPS = [
  { value: '',          label: 'All',        emoji: '📋' },
  { value: 'Plastic',   label: 'Plastic',    emoji: '♻️' },
  { value: 'E-Waste',   label: 'E-Waste',    emoji: '💻' },
  { value: 'Battery',   label: 'Battery',    emoji: '🔋' },
  { value: 'Tyre',      label: 'Tyre',       emoji: '🚗' },
  { value: 'Hazardous', label: 'Hazardous',  emoji: '⚗️' },
];

// ─── Page component ───────────────────────────────────────────────────────────
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [notifResult, eprCounts] = await Promise.all([
    fetchNotifications(params),
    fetchEprTypeCounts(),
  ]);

  const { data: notifications, count, error } = notifResult;
  const total      = count || 0;
  const page       = parseInt(params.page || '1', 10);
  const limit      = parseInt(params.limit || '20', 10);
  const totalPages = Math.ceil(total / limit);

  // JSON-LD for the listing page
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': 'EPR Compliance Notifications India',
    'url': 'http://localhost:3000/notifications',
    'description': 'India EPR compliance notifications, circulars, and guidelines from CPCB, MoEF&CC, and State PCBs.',
    'publisher': {
      '@type': 'Organization',
      'name': 'EPR Compass',
      'url': 'http://localhost:3000',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* Hero */}
        <div className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-blue-200 text-sm mb-6">
              <Link href="/" className="hover:text-white">Home</Link>
              <span>/</span>
              <span className="text-white font-medium">Notifications</span>
            </nav>

            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <span className="text-blue-200 text-sm font-medium uppercase tracking-wider">
                  Regulatory Intelligence
                </span>
              </div>

              <h1 className="text-3xl lg:text-4xl font-bold mb-4 leading-tight">
                India EPR Compliance Notifications
              </h1>
              <p className="text-blue-100 text-lg mb-6 leading-relaxed">
                CPCB circulars, MoEF&CC gazettes, state PCB notifications, guidelines and
                compliance documents — all in one place with instant PDF downloads.
              </p>

              {/* Stats row */}
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200">{total.toLocaleString()} Notifications</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200">Updated every 6 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-300" />
                  <span className="text-blue-200">8 EPR categories</span>
                </div>
              </div>
            </div>

            {/* EPR quick-filter chips */}
            <div className="flex flex-wrap gap-2 mt-8">
              {EPR_CHIPS.map((chip) => {
                const isActive = (params.epr_type || '') === chip.value;
                const count = chip.value ? (eprCounts[chip.value] || 0) : total;
                return (
                  <a
                    key={chip.value}
                    href={`/notifications${chip.value ? `?epr_type=${chip.value}` : ''}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all
                      ${isActive
                        ? 'bg-white text-blue-800 border-white'
                        : 'bg-white/10 text-blue-100 border-white/20 hover:bg-white/20'
                      }`}>
                    <span>{chip.emoji}</span>
                    {chip.label}
                    {count > 0 && (
                      <span className={`text-xs ${isActive ? 'text-blue-500' : 'text-blue-300'}`}>
                        ({count})
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <aside className="lg:col-span-1 space-y-4">
              <Suspense>
                <NotificationFilters total={total} />
              </Suspense>

              {/* EPR Category breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">By EPR Type</h3>
                <div className="space-y-2">
                  {Object.entries(eprCounts)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 8)
                    .map(([type, cnt]) => (
                      <a
                        key={type}
                        href={`/notifications?epr_type=${encodeURIComponent(type)}`}
                        className="flex items-center justify-between text-sm hover:text-blue-600 transition-colors py-0.5">
                        <span className="text-gray-700">{type}</span>
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{cnt}</span>
                      </a>
                    ))}
                </div>
              </div>
            </aside>

            {/* Notifications grid */}
            <main className="lg:col-span-3">
              {error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                  <p className="text-red-600">Failed to load notifications. Please try again.</p>
                </div>
              ) : notifications && notifications.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {notifications.map((notif: any) => (
                      <NotificationCard
                        key={notif.id}
                        id={notif.id}
                        slug={notif.slug}
                        title={notif.title}
                        shortDescription={notif.short_description}
                        eprType={notif.epr_type}
                        documentType={notif.document_type}
                        publishedDate={notif.published_date}
                        tags={notif.tags}
                        authority={notif.notification_authorities}
                        category={notif.notification_categories}
                        files={notif.notification_files}
                        viewCount={notif.view_count}
                        isFeatured={notif.is_featured}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Suspense>
                      <NotificationsPagination
                        page={page}
                        totalPages={totalPages}
                        total={total}
                      />
                    </Suspense>
                  )}
                </>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-7 h-7 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No notifications found</h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {params.q || params.epr_type
                      ? 'Try adjusting your filters or search query.'
                      : 'Notifications will appear here once scraped.'}
                  </p>
                  <Link href="/notifications" className="text-blue-600 hover:underline text-sm">
                    Clear all filters →
                  </Link>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

