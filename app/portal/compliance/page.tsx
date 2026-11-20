import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { getComplianceScore } from '@/lib/compliance';

export const metadata = {
  title: 'Compliance Overview | Client Portal',
  description: 'Track EPR compliance status across all registered waste categories.',
};

function statusLabel(fulfilled: number, total: number, hasOverdue: boolean) {
  if (total === 0) return 'Not Started';
  if (hasOverdue) return 'At Risk';
  if (fulfilled >= total) return 'Compliant';
  if (fulfilled / total >= 0.5) return 'On Track';
  return 'At Risk';
}

function statusBadge(status: string) {
  if (status === 'Compliant') return 'bg-emerald-100 text-emerald-800';
  if (status === 'On Track') return 'bg-blue-100 text-blue-800';
  if (status === 'At Risk') return 'bg-amber-100 text-amber-800';
  return 'bg-slate-100 text-slate-600';
}

function progressColor(status: string) {
  if (status === 'Compliant') return 'bg-emerald-500';
  if (status === 'On Track') return 'bg-blue-500';
  if (status === 'At Risk') return 'bg-amber-500';
  return 'bg-slate-300';
}

export default async function PortalCompliancePage() {
  const supabase = await createServerComponentClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return <div className="p-6 text-sm text-red-700">Please sign in to access your compliance overview.</div>;
  }

  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (!client) {
    return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, waste_category, status, due_date, service_type')
    .eq('client_id', client.id);

  const compliance = await getComplianceScore(client.id, supabase);

  const now = new Date();

  // Group services by waste_category
  const categoryMap = new Map<string, NonNullable<typeof services>>();
  for (const svc of services ?? []) {
    const cat = svc.waste_category ?? 'Unknown';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(svc);
  }

  const categories = Array.from(categoryMap.entries()).map(([name, rows]) => {
    const total = rows.length;
    const fulfilled = rows.filter((r) => r.status === 'Filed' || r.status === 'Approved').length;
    const progress = total === 0 ? 0 : Math.round((fulfilled / total) * 100);
    const hasOverdue = rows.some((r) => {
      if (!r.due_date) return false;
      return new Date(`${r.due_date}T00:00:00Z`) < now && r.status !== 'Approved' && r.status !== 'Filed';
    });

    const status = statusLabel(fulfilled, total, hasOverdue);

    // Determine next action
    const pendingWithDue = rows
      .filter((r) => r.status !== 'Approved' && r.status !== 'Filed' && r.due_date)
      .sort((a, b) => (a.due_date! > b.due_date! ? 1 : -1));

    const nextAction = pendingWithDue.length > 0
      ? `Complete ${pendingWithDue[0].service_type || 'filing'} by ${pendingWithDue[0].due_date}`
      : fulfilled >= total
        ? 'All filings complete — file annual return when due'
        : 'Initiate pending filings';

    return { name, status, progress, total, fulfilled, nextAction };
  });

  // Current FY label
  const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const fyLabel = `FY ${fyStart}-${String(fyStart + 1).slice(2)}`;

  return (
    <div className="space-y-4">
      {/* Header with overall score */}
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Compliance Overview</h1>
            <p className="mt-1 text-sm text-slate-600">
              EPR compliance status across your registered waste categories for {fyLabel}.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-slate-500">Overall Score</p>
              <p className="text-2xl font-bold text-slate-900">{compliance.score}<span className="text-sm font-normal text-slate-500">/100</span></p>
            </div>
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
              compliance.risk === 'Low' ? 'bg-emerald-100 text-emerald-800' :
              compliance.risk === 'Medium' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }`}>
              {compliance.risk} Risk
            </span>
          </div>
        </div>

        {compliance.flags.length > 0 && (
          <div className="mt-3 space-y-1">
            {compliance.flags.map((flag) => (
              <p key={flag} className="text-xs text-amber-700">⚠ {flag}</p>
            ))}
          </div>
        )}
      </section>

      {categories.length === 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-500">No active waste category filings found for your account.</p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((cat) => (
            <article key={cat.name} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{cat.name}</h2>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadge(cat.status)}`}>
                  {cat.status}
                </span>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{cat.fulfilled} of {cat.total} filings</span>
                  <span className="font-semibold">{cat.progress}%</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${progressColor(cat.status)}`}
                    style={{ width: `${cat.progress}%` }}
                  />
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Next action:</span> {cat.nextAction}
              </p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
