// Shared shell for the Strategy Cockpit (5 canvases). The route-level
// /intel/layout.tsx already gates intel access — no extra auth here.

import Link from 'next/link';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

const CANVASES = [
  { slug: 'standing',  label: 'Where we stand',         status: 'live' as const },
  { slug: 'money',     label: 'Where the money goes',   status: 'live' as const },
  { slug: 'risk',      label: "What's at risk",         status: 'live' as const },
  { slug: 'plays',     label: 'What to do next',        status: 'live' as const },
  { slug: 'scenarios', label: 'Scenario lab',           status: 'live' as const },
];

export default async function CockpitLayout({ children }: { children: React.ReactNode }) {
  const pathname = (await headers()).get('x-pathname') ?? '';
  const activeSlug = pathname.replace(/^\/intel\/cockpit\/?/, '').split('/')[0] || 'standing';

  // Open task count for badge — fail silently if table doesn't exist yet.
  let openTaskCount = 0;
  try {
    const supabase = await createServerComponentClient();
    const { count } = await supabase
      .from('intel_cockpit_tasks')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'in_progress']);
    openTaskCount = count ?? 0;
  } catch {
    // Table may not exist yet; badge stays at 0.
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* top-11 (44px) = height of the IntelLayoutShell global top bar */}
      <header className="sticky top-11 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/intel" className="text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:text-teal-300">
              ← Back to Intel workspace
            </Link>
            <span className="text-slate-700">|</span>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">Strategy Cockpit</p>
          </div>
          <nav aria-label="Canvas tabs" className="flex flex-wrap items-center gap-1">
            {/* Tasks list — action surface, distinct from numeric canvases */}
            <Link
              href="/intel/cockpit/tasks"
              aria-current={activeSlug === 'tasks' ? 'page' : undefined}
              className={`mr-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSlug === 'tasks'
                  ? 'border border-teal-400/40 bg-teal-500/15 text-teal-200'
                  : 'border border-slate-700 text-slate-300 hover:border-teal-400/40 hover:bg-teal-500/10 hover:text-teal-200'
              }`}
              title="Cockpit to-do list"
            >
              ☑ Tasks
              {openTaskCount > 0 && (
                <span className="min-w-[18px] rounded-full bg-teal-500/30 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-teal-200">
                  {openTaskCount > 99 ? '99+' : openTaskCount}
                </span>
              )}
            </Link>
            {/* Memo button — distinct from canvases (it's the AI synthesis surface) */}
            <Link
              href="/intel/cockpit/memo"
              aria-current={activeSlug === 'memo' ? 'page' : undefined}
              className={`mr-2 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeSlug === 'memo'
                  ? 'border border-amber-400/40 bg-amber-500/15 text-amber-200'
                  : 'border border-slate-700 text-slate-300 hover:border-amber-400/40 hover:bg-amber-500/10 hover:text-amber-200'
              }`}
              title="AI portfolio strategy memo"
            >
              ✦ Memo
            </Link>
            {CANVASES.map((canvas) => {
              const isActive = canvas.slug === activeSlug;
              const isLive = canvas.status === 'live';
              const cls = isActive
                ? 'bg-teal-500/15 text-teal-200 border border-teal-400/30'
                : isLive
                ? 'text-slate-300 hover:bg-slate-800/60 hover:text-teal-200'
                : 'text-slate-500 cursor-not-allowed';
              return isLive ? (
                <Link
                  key={canvas.slug}
                  href={`/intel/cockpit/${canvas.slug}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${cls}`}
                >
                  {canvas.label}
                </Link>
              ) : (
                <span
                  key={canvas.slug}
                  className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold ${cls}`}
                  title="Coming in a later phase"
                >
                  {canvas.label}
                  <span className="rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Soon
                  </span>
                </span>
              );
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
