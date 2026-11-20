import Link from 'next/link';
import { resolveKnowledgeActor, getKnowledgeAdminClient } from '@/lib/knowledge/auth';
import { canContribute } from '@/lib/knowledge/permissions';
import TourTarget from '@/components/portal/tour/TourTarget';
import RecentItemsList from '@/components/knowledge/RecentItemsList';

export const metadata = { title: 'Dashboard | Knowledge Hub' };
export const dynamic = 'force-dynamic';

function StatCard({ label, value, accent, href }: { label: string; value: number; accent: string; href: string }) {
  return (
    <Link href={href}
      className="rounded-xl border border-slate-800/80 bg-[#0c1022] p-5 transition hover:border-slate-700 hover:bg-slate-800/40">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${accent}`}>{value}</p>
    </Link>
  );
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default async function KnowledgeDashboardPage() {
  const actor = await resolveKnowledgeActor();
  const db = getKnowledgeAdminClient();

  const [{ data: items }, { count: categoryCount }] = await Promise.all([
    (db as any)
      .from('knowledge_items')
      .select('id, title, item_type, created_at, created_by, file_name, external_url')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false }),
    (db as any)
      .from('knowledge_categories')
      .select('id', { count: 'exact', head: true }),
  ]);

  const all = (items as any[]) || [];
  const totalItems   = all.length;
  const docCount     = all.filter(i => i.item_type === 'document').length;
  const trainerCount = all.filter(i => i.item_type === 'training_material').length;
  const recent       = all.slice(0, 6);

  // Resolve uploader names for the recent list (profiles has no email column).
  const ownerIds = Array.from(new Set(recent.map(i => i.created_by).filter(Boolean)));
  const ownerMap: Record<string, string> = {};
  if (ownerIds.length) {
    const { data: profiles } = await (db as any)
      .from('profiles').select('id, full_name, company_name').in('id', ownerIds);
    for (const p of profiles || []) ownerMap[p.id] = p.full_name || p.company_name || '';
  }

  const mayContribute = canContribute(actor?.role || '');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Knowledge Hub</h1>
          <p className="text-sm text-slate-500">All your team&apos;s documents and training materials in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/knowledge/library"
            className="rounded-lg border border-slate-700 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800/60 transition">
            Browse Library
          </Link>
          {mayContribute && (
            <Link href="/knowledge/upload"
              className="rounded-lg bg-cyan-600 hover:bg-cyan-700 px-4 py-2 text-sm font-semibold text-white transition">
              + Upload
            </Link>
          )}
        </div>
      </div>

      {/* Stats */}
      <TourTarget id="dash-summary-cards" className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Items"        value={totalItems}            accent="text-cyan-300"   href="/knowledge/library" />
        <StatCard label="Documents"          value={docCount}              accent="text-sky-300"    href="/knowledge/library?type=document" />
        <StatCard label="Training Materials" value={trainerCount}          accent="text-violet-300" href="/knowledge/library?type=training_material" />
        <StatCard label="Categories"         value={categoryCount ?? 0}    accent="text-amber-300"  href="/knowledge/categories" />
      </TourTarget>

      {/* Recent uploads */}
      <TourTarget id="dash-recent-items" className="rounded-xl border border-slate-800/80 bg-[#0c1022]">
        <div className="flex items-center justify-between border-b border-slate-800/60 px-5 py-3">
          <p className="text-sm font-semibold text-slate-200">Recently added</p>
          <Link href="/knowledge/library" className="text-xs font-medium text-cyan-400 hover:text-cyan-300">View all →</Link>
        </div>
        {recent.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-slate-500">No items yet.</p>
            {mayContribute && (
              <Link href="/knowledge/upload" className="mt-2 inline-block text-sm font-medium text-cyan-400 hover:text-cyan-300">
                Upload the first one →
              </Link>
            )}
          </div>
        ) : (
          <RecentItemsList
            items={recent.map((i: any) => ({
              id: i.id,
              title: i.title,
              item_type: i.item_type,
              created_at: i.created_at,
              ownerName: i.created_by ? ownerMap[i.created_by] : undefined,
              dateLabel: fmtDate(i.created_at),
            }))}
          />
        )}
      </TourTarget>
    </div>
  );
}
