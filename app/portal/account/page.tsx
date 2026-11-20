import PrintSummaryButton from './PrintSummaryButton';
import Link from 'next/link';
import BusinessLocationsSection from './BusinessLocationsSection';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { getPortalClientContext } from '@/lib/portal/clientContext';

function fmtDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(new Date(value));
}

function daysRemaining(dueDate?: string | null) {
  if (!dueDate) return null;
  const ms = new Date(`${dueDate}T00:00:00Z`).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

function statusClass(status: string) {
  if (status === 'Compliant') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'Non-Compliant') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (status === 'At Risk') return 'border-orange-200 bg-orange-50 text-orange-800';
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function urgencyBar(days: number | null) {
  if (days == null) return { width: 30, cls: 'bg-slate-300' };
  if (days <= 7) return { width: 95, cls: 'bg-rose-500' };
  if (days <= 30) return { width: 70, cls: 'bg-orange-500' };
  if (days <= 60) return { width: 50, cls: 'bg-amber-500' };
  return { width: 25, cls: 'bg-emerald-500' };
}

function deriveComplianceStatus(serviceRows: any[], obligationRows: any[]) {
  const hasOverdue = serviceRows.some((row) => row.status === 'Overdue');
  const pendingCount = serviceRows.filter((row) => row.status === 'Pending' || row.status === 'In Progress').length;
  const approvedCount = serviceRows.filter((row) => row.status === 'Approved' || row.status === 'Filed').length;

  const hasObligationGap = obligationRows.some((row) => Number(row.gap_mt || 0) > 0);

  if (hasOverdue || hasObligationGap) return 'Non-Compliant';
  if (pendingCount > 0 && approvedCount > 0) return 'At Risk';
  if (pendingCount > 0) return 'Pending';
  return 'Compliant';
}

export default async function PortalAccountPage() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">Please sign in to view your account.</div>;
  }

  const context = await getPortalClientContext(supabase as any, user.id);
  if (!context || !context.account) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">No company profile is linked to your account yet.</div>;
  }

  const { account, client, manager } = context;

  const [servicesRes, eprObRes, obligationsRes] = await Promise.all([
    (supabase as any)
      .from('services')
      .select('id, waste_category, service_type, status, due_date')
      .eq('client_id', client.id)
      .order('due_date', { ascending: true }),
    (supabase as any)
      .from('epr_obligations')
      .select('*')
      .eq('client_id', client.id),
    (supabase as any)
      .from('obligations')
      .select('*')
      .eq('client_id', client.id)
  ]);

  const services = servicesRes.data || [];
  const obligationRows = eprObRes.error ? (obligationsRes.data || []) : (eprObRes.data || []);

  const compliance = deriveComplianceStatus(services, obligationRows);

  const categories = Array.from(
    new Set([
      ...services.map((row: any) => row.waste_category).filter(Boolean),
      ...(account.waste_categories || [])
    ])
  );

  const summaryRows = categories.map((category) => {
    const serviceRows = services.filter((row: any) => row.waste_category === category);
    const registration = serviceRows.find((row: any) => row.service_type === 'Registration');
    const nextFiling = serviceRows
      .filter((row: any) => row.service_type === 'Filing' && row.due_date)
      .sort((a: any, b: any) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())[0];

    const remaining = daysRemaining(nextFiling?.due_date || null);
    const bar = urgencyBar(remaining);

    return {
      category,
      registrationStatus: registration?.status || 'Pending',
      nextFilingDue: nextFiling?.due_date || null,
      remaining,
      bar
    };
  });

  const waNumber = process.env.NEXT_PUBLIC_WA_NUMBER || '';
  const initials = (manager?.full_name || 'EC')
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-2xl font-semibold text-slate-900">{account.account_name}</h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span>{account.account_no || '-'}</span>
          <span>|</span>
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
            {account.account_type || 'Company'}
          </span>
        </div>

        <div className={`mt-3 rounded-lg border px-3 py-2 ${statusClass(compliance)}`}>
          <p className="text-sm font-semibold">Your EPR compliance is {compliance}</p>
        </div>
      </section>

      <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4" aria-label="Company settings">
        {[
          ['Company profile', '/portal/profile'],
          ['Data & products', '/portal/data-profile'],
          ['Contacts', '/portal/contacts'],
          ['Team & access', '/portal/team'],
          ['CPCB credentials', '/portal/epr-credentials'],
          ['CPCB SSO', '/portal/cpcb-sso'],
          ['Chrome extension', '/portal/extension'],
          ['Certificates', '/portal/certificates'],
        ].map(([label, href]) => (
          <Link key={href} href={href} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
            {label} →
          </Link>
        ))}
      </nav>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Company information</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-medium text-slate-900">GSTIN:</span> {account.gstin || '-'}</p>
            <p><span className="font-medium text-slate-900">PAN:</span> {account.pan || '-'}</p>
            <p><span className="font-medium text-slate-900">CIN:</span> {account.cin || '-'}</p>
            <p><span className="font-medium text-slate-900">Website:</span> {account.website || '-'}</p>
            <p><span className="font-medium text-slate-900">Phone:</span> {account.phone || '-'}</p>
          </div>
          <div className="space-y-2 text-sm text-slate-700">
            <p><span className="font-medium text-slate-900">EPR Registration No:</span> {account.epr_reg_no || '-'}</p>
            <p><span className="font-medium text-slate-900">CPCB Portal ID:</span> {account.cpcb_portal_id || '-'}</p>
            <p><span className="font-medium text-slate-900">Waste Categories:</span> {(account.waste_categories || []).join(', ') || '-'}</p>
            <p><span className="font-medium text-slate-900">Reg Date:</span> {fmtDate(account.epr_reg_date || null)}</p>
          </div>
        </div>
      </section>

      <BusinessLocationsSection clientId={client.id} />

      <section className="rounded-xl border border-slate-200 bg-white p-4 print:break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">EPR compliance summary</h2>
          <PrintSummaryButton />
        </div>

        <div className="mt-3 space-y-3">
          {summaryRows.map((row) => (
            <article key={row.category} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-col gap-1 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                <p className="font-semibold text-slate-900">{row.category}</p>
                <p>Registration status: <span className="font-medium">{row.registrationStatus}</span></p>
              </div>
              <div className="mt-1 flex flex-col gap-1 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
                <p>Next filing due: <span className="font-medium">{fmtDate(row.nextFilingDue)}</span></p>
                <p>Days remaining: <span className="font-medium">{row.remaining == null ? '-' : row.remaining}</span></p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div className={`h-full ${row.bar.cls}`} style={{ width: `${row.bar.width}%` }} />
              </div>
            </article>
          ))}

          {summaryRows.length === 0 ? (
            <p className="text-sm text-slate-600">No compliance categories available yet.</p>
          ) : null}
        </div>
      </section>

      <style>{`
        @media print {
          button, a[href^='https://wa.me'] {
            display: none !important;
          }
          body {
            background: #fff;
          }
        }
      `}</style>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-base font-semibold text-slate-900">Assigned consultant</h2>
        <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
              {initials || 'EC'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{manager?.full_name || 'EPR Consultant Team'}</p>
              <p className="text-xs text-slate-600">Your dedicated EPR consultant</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={waNumber ? `https://wa.me/${waNumber}` : '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-100"
            >
              WhatsApp
            </a>
            <a
              href={manager?.email ? `mailto:${manager.email}` : '#'}
              className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Email
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
