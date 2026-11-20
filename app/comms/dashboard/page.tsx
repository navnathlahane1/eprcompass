import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TourTarget from '@/components/portal/tour/TourTarget';

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: 'LinkedIn', twitter: 'X / Twitter', facebook: 'Facebook',
  instagram: 'Instagram', youtube: 'YouTube', tiktok: 'TikTok',
  pinterest: 'Pinterest', threads: 'Threads', google_business: 'Google Business', other: 'Other',
};

export default async function CommsDashboardPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const client = getCommsAdminClient();

  const [
    accountsRes, activeRes, platformRes,
    contentTotalRes, contentReviewRes, contentApprovedRes, contentPublishedRes,
    connectionsRes, recentContentRes,
  ] = await Promise.all([
    client.from('comms_accounts').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    client.from('comms_accounts').select('id', { count: 'exact', head: true }).eq('is_deleted', false).eq('status', 'active'),
    client.from('comms_accounts').select('platform').eq('is_deleted', false).eq('status', 'active'),
    client.from('comms_content_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    client.from('comms_content_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false).eq('status', 'in_review'),
    client.from('comms_content_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false).in('status', ['approved', 'scheduled']),
    client.from('comms_content_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false).eq('status', 'published'),
    client.from('comms_platform_connections').select('id', { count: 'exact', head: true }).eq('status', 'connected'),
    client.from('comms_content_items')
      .select('id, platform, content_type, status, created_at, hook')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(4),
  ]);

  const total        = accountsRes.count ?? 0;
  const active       = activeRes.count ?? 0;
  const contentTotal = contentTotalRes.count ?? 0;
  const inReview     = contentReviewRes.count ?? 0;
  const approved     = contentApprovedRes.count ?? 0;
  const published    = contentPublishedRes.count ?? 0;
  const connections  = connectionsRes.count ?? 0;

  const platformCounts: Record<string, number> = {};
  for (const row of (platformRes.data ?? [])) {
    platformCounts[row.platform] = (platformCounts[row.platform] ?? 0) + 1;
  }
  const topPlatforms = Object.entries(platformCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const roleLabel = user.role.replace(/^comms_/, '').replace(/_/g, ' ');

  const STATUS_COLORS: Record<string, string> = {
    draft: 'text-slate-400 bg-slate-800/60',
    in_review: 'text-amber-400 bg-amber-500/10',
    approved: 'text-sky-400 bg-sky-500/10',
    scheduled: 'text-violet-400 bg-violet-500/10',
    published: 'text-emerald-400 bg-emerald-500/10',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Marketing Command Centre</h1>
          <p className="mt-1 text-sm text-slate-500 capitalize">
            {user.fullName || user.email} · {roleLabel}
          </p>
        </div>
        <Link
          href="/comms/vault/create"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 transition shrink-0"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </Link>
      </div>

      {/* Quick actions */}
      <TourTarget id="dash-quick-actions" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            href: '/comms/vault',
            label: 'Account Vault',
            desc: `${total} accounts · ${active} active`,
            icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
            accent: 'border-emerald-500/20 hover:border-emerald-500/40',
            iconColor: 'text-emerald-400 bg-emerald-500/10',
          },
          {
            href: '/comms/studio/content',
            label: 'Content Studio',
            desc: `${contentTotal} items · ${inReview} in review`,
            icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
            accent: 'border-violet-500/20 hover:border-violet-500/40',
            iconColor: 'text-violet-400 bg-violet-500/10',
          },
          {
            href: '/comms/analytics',
            label: 'Analytics',
            desc: `${connections} platform${connections !== 1 ? 's' : ''} connected`,
            icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
            accent: 'border-sky-500/20 hover:border-sky-500/40',
            iconColor: 'text-sky-400 bg-sky-500/10',
          },
        ].map(q => (
          <Link
            key={q.href}
            href={q.href}
            className={`group rounded-xl border bg-[#0c1022] p-4 transition ${q.accent}`}
          >
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${q.iconColor}`}>
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={q.icon} />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition">{q.label}</p>
            <p className="text-xs text-slate-500 mt-0.5">{q.desc}</p>
          </Link>
        ))}
      </TourTarget>

      {/* Stat row */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Accounts',  value: total,      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'In Review',       value: inReview,   icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
          { label: 'Ready to Publish', value: approved,  icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
          { label: 'Published',        value: published, icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8', color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
        ].map(stat => (
          <div key={stat.label} className={`rounded-xl border p-4 ${stat.color.split(' ').slice(1).join(' ')} border-opacity-40`}>
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg border mb-3 ${stat.color}`}>
              <svg viewBox="0 0 24 24" className={`h-4.5 w-4.5 ${stat.color.split(' ')[0]}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-100">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </TourTarget>

      {/* Two-column: platform breakdown + recent content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Platform breakdown */}
        <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Platform Breakdown</h2>
            <Link href="/comms/vault" className="text-xs text-emerald-500 hover:text-emerald-400 transition">View all →</Link>
          </div>
          {topPlatforms.length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">
              No accounts yet.{' '}
              <Link href="/comms/vault/create" className="text-emerald-500 hover:underline">Add the first one →</Link>
            </p>
          ) : (
            <div className="space-y-3">
              {topPlatforms.map(([platform, count]) => (
                <div key={platform} className="flex items-center gap-3">
                  <p className="w-32 text-xs text-slate-400 truncate">{PLATFORM_LABELS[platform] ?? platform}</p>
                  <div className="flex-1 h-2 rounded-full bg-slate-800/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{ width: `${active > 0 ? Math.round((count / active) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="w-6 text-right text-xs font-mono text-slate-500">{count}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent content */}
        <TourTarget id="dash-recent-content" className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-200">Recent Content</h2>
            <Link href="/comms/studio/content" className="text-xs text-emerald-500 hover:text-emerald-400 transition">View all →</Link>
          </div>
          {(recentContentRes.data ?? []).length === 0 ? (
            <p className="text-sm text-slate-600 py-4 text-center">
              No content yet.{' '}
              <Link href="/comms/studio/content" className="text-emerald-500 hover:underline">Generate the first post →</Link>
            </p>
          ) : (
            <div className="space-y-2">
              {(recentContentRes.data ?? []).map((item: any) => (
                <Link
                  key={item.id}
                  href={`/comms/studio/content/${item.id}`}
                  className="flex items-start gap-3 rounded-lg border border-slate-800/40 bg-slate-900/30 p-3 hover:bg-slate-800/40 transition"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{item.hook || '(no hook)'}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 capitalize">
                      {PLATFORM_LABELS[item.platform] ?? item.platform} · {item.content_type}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[item.status] ?? 'text-slate-400 bg-slate-800/60'}`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </TourTarget>
      </div>

      {/* Module status strip */}
      <div className="rounded-xl border border-slate-800/40 bg-[#0c1022]/60 p-4">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Module Status</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Account Vault',     href: '/comms/vault',           status: 'live' },
            { label: 'Permission Matrix', href: '/comms/rbac',            status: 'live' },
            { label: 'Content Studio',    href: '/comms/studio',          status: 'live' },
            { label: 'Social Analytics',  href: '/comms/analytics',       status: 'live' },
          ].map(m => (
            <Link
              key={m.label}
              href={m.href}
              className="flex items-center gap-2 rounded-lg border border-slate-800/60 bg-slate-900/30 px-3 py-2 hover:bg-slate-800/40 transition"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-xs text-slate-300 truncate">{m.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
