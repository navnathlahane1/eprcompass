import { getAuthenticatedUser } from '@/lib/supabase/getAuthenticatedUser';
import { getCommsAdminClient } from '@/lib/comms/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-slate-700/60 text-slate-400',
  in_review: 'bg-amber-500/15 text-amber-400',
  approved:  'bg-sky-500/15 text-sky-400',
  scheduled: 'bg-violet-500/15 text-violet-400',
  published: 'bg-emerald-500/15 text-emerald-400',
};

export default async function StudioPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/iam/login');

  const client = getCommsAdminClient();

  const [totalRes, statusRes, recentRes] = await Promise.all([
    client.from('comms_content_items').select('id', { count: 'exact', head: true }).eq('is_deleted', false),
    client.from('comms_content_items').select('status').eq('is_deleted', false),
    client.from('comms_content_items')
      .select('id, platform, hook, status, created_at')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const row of statusRes.data ?? []) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1;
  }

  const ACTIONS = [
    {
      label: 'Strategy Generator',
      desc:  'AI-powered marketing strategy with content calendar and hook angles.',
      href:  '/comms/studio/strategy',
      icon:  'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      color: 'border-violet-500/30 bg-violet-500/10',
      accent: 'text-violet-400',
    },
    {
      label: 'Content Generator',
      desc:  'Generate platform-native posts with A/B variants, hooks, and image briefs.',
      href:  '/comms/studio/content',
      icon:  'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      color: 'border-emerald-500/30 bg-emerald-500/10',
      accent: 'text-emerald-400',
    },
    {
      label: 'Brand Voice',
      desc:  'Configure tone, content pillars, compliance guardrails, and hashtag sets.',
      href:  '/comms/studio/brand-voice',
      icon:  'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z',
      color: 'border-amber-500/30 bg-amber-500/10',
      accent: 'text-amber-400',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">AI Content Studio</h1>
        <p className="text-sm text-slate-500 mt-0.5">Strategy generation, content creation, and approval workflow</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACTIONS.map(a => (
          <Link key={a.href} href={a.href}
            className={`rounded-xl border p-5 transition-all hover:scale-[1.01] ${a.color}`}>
            <div className="flex items-start gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${a.color} mt-0.5`}>
                <svg viewBox="0 0 24 24" className={`h-5 w-5 ${a.accent}`} fill="none" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                </svg>
              </div>
              <div>
                <p className={`text-sm font-semibold ${a.accent}`}>{a.label}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{a.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Status overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {['draft','in_review','approved','scheduled','published'].map(s => (
          <Link key={s} href={`/comms/studio/content?status=${s}`}
            className="rounded-lg border border-slate-800/60 bg-[#0c1022] p-3 hover:border-slate-700 transition">
            <p className="text-xl font-bold font-mono text-slate-100">{statusCounts[s] ?? 0}</p>
            <p className={`text-[10px] font-medium capitalize mt-0.5 px-1.5 py-0.5 rounded inline-block ${STATUS_STYLES[s] ?? ''}`}>
              {s.replace('_', ' ')}
            </p>
          </Link>
        ))}
      </div>

      {/* Recent content */}
      <div className="rounded-xl border border-slate-800/60 bg-[#0c1022] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-200">Recent Content</h2>
          <Link href="/comms/studio/content" className="text-xs text-emerald-500 hover:text-emerald-400 transition">View all →</Link>
        </div>
        {(recentRes.data ?? []).length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">
            No content yet.{' '}
            <Link href="/comms/studio/content" className="text-emerald-500 hover:underline">Generate your first post →</Link>
          </p>
        ) : (
          <div className="space-y-2">
            {(recentRes.data ?? []).map((item: any) => (
              <Link key={item.id} href={`/comms/studio/content/${item.id}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-800/60 transition">
                <span className="text-xs text-slate-500 capitalize w-20 shrink-0">{item.platform}</span>
                <p className="flex-1 text-sm text-slate-300 truncate">{item.hook ?? '—'}</p>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLES[item.status] ?? ''}`}>
                  {item.status.replace('_',' ')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
