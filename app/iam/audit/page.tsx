import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export const metadata = { title: 'Audit Log | Access Manager' };

async function getIamReadClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServerComponentClient();
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

interface PageProps {
  searchParams: Promise<{ action?: string; page?: string; actor?: string }>;
}

const ACTION_BADGE: Record<string, string> = {
  create:         'border-emerald-500/30 bg-emerald-500/15 text-emerald-300',
  ban:            'border-rose-500/30 bg-rose-500/15 text-rose-300',
  unban:          'border-teal-500/30 bg-teal-500/15 text-teal-300',
  role_change:    'border-blue-500/30 bg-blue-500/15 text-blue-300',
  update:         'border-slate-500/30 bg-slate-500/15 text-slate-400',
  password_reset: 'border-amber-500/30 bg-amber-500/15 text-amber-300',
  password_set:   'border-fuchsia-500/30 bg-fuchsia-500/15 text-fuchsia-300',
  invite_email_sent: 'border-cyan-500/30 bg-cyan-500/15 text-cyan-300',
  delete:         'border-red-500/30 bg-red-500/15 text-red-400',
  link_company:   'border-violet-500/30 bg-violet-500/15 text-violet-300',
  unlink_company: 'border-orange-500/30 bg-orange-500/15 text-orange-300',
};

const ACTION_ICONS: Record<string, string> = {
  create:         'M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z',
  ban:            'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
  unban:          'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  role_change:    'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  update:         'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
  password_reset: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z',
  password_set:   'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  invite_email_sent: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8V6a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z',
  delete:         'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
  link_company:   'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  unlink_company: 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21',
};

const ALL_ACTIONS = ['create', 'ban', 'unban', 'role_change', 'update', 'password_reset', 'password_set', 'invite_email_sent', 'delete', 'link_company', 'unlink_company'] as const;
const PAGE_SIZE = 50;

function formatDateTime(d: string) {
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · '
    + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function buildLink(base: string, params: Record<string, string | number>) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== '' && v !== undefined) p.set(k, String(v));
  }
  return `${base}${p.toString() ? '?' + p.toString() : ''}`;
}

export default async function AuditLogPage({ searchParams }: PageProps) {
  const sp           = await searchParams;
  const actionFilter = sp.action || '';
  const actorFilter  = sp.actor  || '';
  const currentPage  = Math.max(1, parseInt(sp.page || '1'));
  const offset       = (currentPage - 1) * PAGE_SIZE;

  const adminClient = await getIamReadClient();

  let query = adminClient
    .from('iam_audit_log')
    .select('id, actor_name, target_email, action, created_at, notes, new_value, old_value', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (actionFilter) query = query.eq('action', actionFilter);
  if (actorFilter)  query = query.ilike('actor_name', `%${actorFilter}%`);

  const { data: entries, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Audit Log</h1>
          <p className="text-sm text-slate-500">
            {count ?? 0} total event{count !== 1 ? 's' : ''}
            {actionFilter && <> · filtered by <span className="text-slate-400 font-medium">{actionFilter.replace(/_/g, ' ')}</span></>}
          </p>
        </div>
        {(actionFilter || actorFilter) && (
          <Link href="/iam/audit"
            className="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition">
            Clear filters ✕
          </Link>
        )}
      </div>

      {/* Action filter pills */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href={buildLink('/iam/audit', { actor: actorFilter })}
          className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
            !actionFilter
              ? 'border-violet-500 bg-violet-500/15 text-violet-300'
              : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
          }`}>
          All
        </Link>
        {ALL_ACTIONS.map(a => (
          <Link key={a}
            href={buildLink('/iam/audit', { action: a, actor: actorFilter })}
            className={`rounded-full border px-3 py-1 text-[11px] font-semibold capitalize transition ${
              actionFilter === a
                ? ACTION_BADGE[a]
                : 'border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400'
            }`}>
            {a.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      {/* Entries */}
      {!entries || entries.length === 0 ? (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] py-20 text-center">
          <svg viewBox="0 0 24 24" className="mx-auto h-10 w-10 text-slate-700 mb-3" fill="none" stroke="currentColor" strokeWidth={1.25}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No events found</p>
          {(actionFilter || actorFilter) && (
            <Link href="/iam/audit" className="mt-3 inline-block text-xs text-violet-400 hover:text-violet-300 transition">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800/80 bg-[#0c1022] overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[120px_1fr_1fr_160px] gap-4 border-b border-slate-800/60 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
            <span>Action</span>
            <span>Actor</span>
            <span>Target</span>
            <span className="text-right">When</span>
          </div>
          <div className="divide-y divide-slate-800/40">
            {entries.map((entry: any) => {
              const badgeClass  = ACTION_BADGE[entry.action]  || 'border-slate-600/30 bg-slate-700/20 text-slate-400';
              const iconPath    = ACTION_ICONS[entry.action]  || ACTION_ICONS.update;
              return (
                <div key={entry.id} className="flex flex-col sm:grid sm:grid-cols-[120px_1fr_1fr_160px] sm:items-start gap-2 sm:gap-4 px-5 py-4 hover:bg-slate-800/20 transition group">

                  {/* Action badge */}
                  <div className="shrink-0">
                    <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badgeClass}`}>
                      <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                      </svg>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Actor */}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-300 font-medium truncate">{entry.actor_name || 'System'}</p>
                    <p className="text-[10px] text-slate-600">actor</p>
                  </div>

                  {/* Target + details */}
                  <div className="min-w-0">
                    <p className="text-sm text-slate-400 truncate">{entry.target_email || <span className="italic text-slate-600">Unknown</span>}</p>
                    {entry.notes && (
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{entry.notes}</p>
                    )}
                    {!entry.notes && entry.new_value && Object.keys(entry.new_value).length > 0 && (
                      <p className="mt-0.5 text-[10px] text-slate-700 font-mono truncate">
                        {JSON.stringify(entry.new_value).slice(0, 80)}
                      </p>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="sm:text-right">
                    <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Page {currentPage} of {totalPages}
            <span className="text-slate-700"> · {count} events</span>
          </span>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <Link href={buildLink('/iam/audit', { page: currentPage - 1, action: actionFilter, actor: actorFilter })}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 transition">
                ← Prev
              </Link>
            )}
            {currentPage < totalPages && (
              <Link href={buildLink('/iam/audit', { page: currentPage + 1, action: actionFilter, actor: actorFilter })}
                className="rounded-lg border border-slate-700 px-3 py-1.5 hover:bg-slate-800 transition">
                Next →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
