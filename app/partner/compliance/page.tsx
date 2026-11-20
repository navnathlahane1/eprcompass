import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import TourTarget from '@/components/portal/tour/TourTarget';

export const metadata = { title: 'Compliance Health | Partner Portal' };

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function servicePill(status: string, dueDate: string | null) {
  const today = new Date();
  const isOverdue = dueDate && new Date(dueDate) < today && !['approved', 'completed', 'Certificate Issued'].includes(status?.toLowerCase());
  if (isOverdue) return { label: 'Overdue', cls: 'bg-rose-100 text-rose-700' };
  if (status === 'approved' || status === 'Certificate Issued') return { label: 'Approved', cls: 'bg-emerald-100 text-emerald-700' };
  if (status === 'Filed') return { label: 'Filed', cls: 'bg-blue-100 text-blue-700' };
  if (status === 'Registered') return { label: 'Registered', cls: 'bg-indigo-100 text-indigo-700' };
  if (status === 'In Progress') return { label: 'In Progress', cls: 'bg-amber-100 text-amber-700' };
  return { label: status || 'Pending', cls: 'bg-slate-100 text-slate-600' };
}

type HealthStatus = 'green' | 'amber' | 'red';

function computeHealth(services: any[]): HealthStatus {
  const today = new Date();
  for (const s of services) {
    if (s.due_date && new Date(s.due_date) < today && !['approved', 'completed', 'Certificate Issued'].includes(s.status?.toLowerCase())) {
      return 'red';
    }
  }
  for (const s of services) {
    const daysUntil = s.due_date ? Math.ceil((new Date(s.due_date).getTime() - today.getTime()) / 86400000) : null;
    if ((daysUntil !== null && daysUntil <= 30) || ['pending', 'in_progress', 'In Progress'].includes(s.status)) {
      return 'amber';
    }
  }
  return 'green';
}

const healthConfig = {
  green: { dot: 'bg-emerald-500', label: 'Compliant', badge: 'bg-emerald-100 text-emerald-700' },
  amber: { dot: 'bg-amber-500', label: 'Needs Attention', badge: 'bg-amber-100 text-amber-700' },
  red: { dot: 'bg-rose-500', label: 'Overdue', badge: 'bg-rose-100 text-rose-700' },
};

export default async function ComplianceHealthPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const { data: partner } = await (supabase as any)
    .from('partners').select('id').eq('profile_id', user.id).maybeSingle();

  if (!partner) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <p className="text-sm text-slate-600">Partner profile not linked. Contact support.</p>
        </div>
      </div>
    );
  }

  let pcRows: any[] = [];
  try {
    const { data } = await (supabase as any)
      .from('partner_clients')
      .select(`
        client_id,
        clients:client_id (
          id, status, waste_categories,
          profiles:profile_id ( company_name, full_name )
        )
      `)
      .eq('partner_id', partner.id);
    pcRows = data || [];
  } catch { pcRows = []; }

  const clientIds = pcRows.map((r: any) => r.client_id).filter(Boolean);

  let allServices: any[] = [];
  if (clientIds.length > 0) {
    try {
      const { data } = await (supabase as any)
        .from('services')
        .select('id, client_id, service_type, waste_category, status, due_date, certificate_number, certificate_expiry, approved_at')
        .in('client_id', clientIds);
      allServices = data || [];
    } catch { allServices = []; }
  }

  const servicesByClient: Record<string, any[]> = {};
  for (const s of allServices) {
    if (!servicesByClient[s.client_id]) servicesByClient[s.client_id] = [];
    servicesByClient[s.client_id].push(s);
  }

  const clients = pcRows.map((r: any) => {
    const c = r.clients || {};
    const services = servicesByClient[c.id] || [];
    const health = computeHealth(services);
    return {
      id: c.id,
      companyName: c.profiles?.company_name || c.profiles?.full_name || 'Unknown',
      status: c.status || 'Onboarding',
      wasteCategories: c.waste_categories || [],
      services,
      health,
    };
  });

  const greenCount = clients.filter(c => c.health === 'green').length;
  const amberCount = clients.filter(c => c.health === 'amber').length;
  const redCount = clients.filter(c => c.health === 'red').length;

  return (
    <ComplianceHealthClient
      clients={clients}
      greenCount={greenCount}
      amberCount={amberCount}
      redCount={redCount}
    />
  );
}

// Inline client-like component (server-rendered, uses URL params via search for filter)
function ComplianceHealthClient({
  clients,
  greenCount,
  amberCount,
  redCount,
}: {
  clients: any[];
  greenCount: number;
  amberCount: number;
  redCount: number;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Compliance Health Centre</h1>
        <p className="text-sm text-slate-500">Monitor EPR compliance status across all your clients.</p>
      </div>

      {/* Summary strip */}
      <TourTarget id="compliance-summary-strip" className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full bg-emerald-500" />
            <p className="text-xs font-semibold text-emerald-700">Compliant</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-emerald-800">{greenCount}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full bg-amber-500" />
            <p className="text-xs font-semibold text-amber-700">Needs Attention</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-amber-800">{amberCount}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-3 w-3 rounded-full bg-rose-500" />
            <p className="text-xs font-semibold text-rose-700">Overdue</p>
          </div>
          <p className="text-2xl font-bold tabular-nums text-rose-800">{redCount}</p>
        </div>
      </TourTarget>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <p className="text-sm font-medium text-slate-700">No clients yet</p>
          <p className="mt-1 text-xs text-slate-400">Clients you refer will appear here once onboarded.</p>
        </div>
      ) : (
        <TourTarget id="compliance-client-list" className="space-y-3">
          {clients.map((c) => {
            const cfg = healthConfig[c.health as HealthStatus];
            return (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full shrink-0 ${cfg.dot}`} />
                    <div>
                      <p className="font-semibold text-slate-900">{c.companyName}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold mt-0.5 ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/partner/clients/${c.id}`}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors"
                  >
                    View Client →
                  </Link>
                </div>

                {/* Category-wise services */}
                {c.wasteCategories.length > 0 && (
                  <div className="space-y-1.5">
                    {c.wasteCategories.map((cat: string) => {
                      const svc = c.services.find((s: any) => s.waste_category === cat);
                      const pill = svc ? servicePill(svc.status, svc.due_date) : { label: 'No Service', cls: 'bg-slate-100 text-slate-400' };
                      return (
                        <div key={cat} className="flex flex-wrap items-center gap-2">
                          <span className="text-xs text-slate-500 w-28 shrink-0">{cat}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${pill.cls}`}>{pill.label}</span>
                          {svc?.certificate_number && (
                            <span className="text-[11px] text-slate-400">Cert: {svc.certificate_number}</span>
                          )}
                          {svc?.certificate_expiry && (
                            <span className="text-[11px] text-slate-400">Exp: {formatDate(svc.certificate_expiry)}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </TourTarget>
      )}
    </div>
  );
}
