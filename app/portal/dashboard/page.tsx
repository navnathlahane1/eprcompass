import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import SetupGuideWidget from '@/components/setup/SetupGuideWidget';
import { buildClientSetupSteps } from '@/components/setup/setupSteps';
import NextActionCockpit, { type NextAction } from '@/components/portal/NextActionCockpit';
import { getComplianceScore } from '@/lib/compliance';
import { resolveFilingCalendar, type CalendarItem } from '@/lib/portal/filingCalendar';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';
import { dashboardBaseline } from '@/lib/portal/dashboardState';

const STREAMS = [
  { key: 'plastic', label: 'Plastic', aliases: ['plastic'] },
  { key: 'e_waste', label: 'E-Waste', aliases: ['e-waste', 'ewaste', 'e_waste'] },
  { key: 'battery', label: 'Battery', aliases: ['battery'] },
  { key: 'tyre', label: 'Tyre', aliases: ['tyre', 'tire'] },
  { key: 'used_oil', label: 'Used Oil', aliases: ['oil', 'used oil', 'used_oil'] },
] as const;

const currentFy = (date = new Date()) => date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
const matches = (value: unknown, aliases: readonly string[]) => {
  const normalized = String(value || '').trim().toLowerCase();
  return aliases.some((alias) => normalized.includes(alias));
};
const mt = (value: number | null) => value == null ? 'Not set' : `${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })} MT`;

export default async function PortalDashboardPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <div className="p-6 text-sm text-red-700">Please sign in to access your dashboard.</div>;

  const actor = await resolveClientActor();
  if (!actor) return <div role="alert" className="p-6 text-sm text-slate-700">Workspace access is unavailable. Contact your account manager.</div>;
  // Legacy RLS is owner-only on some source tables. This aggregate read is scoped
  // exclusively to the server-resolved active membership, never a request tenant ID.
  const records = adminClient();
  const { data: client, error: clientError } = await records.from('clients').select('id, intel_company_id, onboarding_details').eq('id', actor.clientId).maybeSingle();
  if (clientError) return <DashboardUnavailable />;
  if (!client) return <div className="p-6 text-sm text-slate-700">No client account is linked to this profile.</div>;

  const [servicesRes, paymentsRes, documentsRes, profileRes, contactsRes, credentialsRes, tasksRes, filingsRes, transactionsRes, creditsRes] = await Promise.all([
    records.from('services').select('id, due_date, status, service_type, waste_category').eq('client_id', client.id).order('due_date'),
    records.from('invoices').select('total_inr, status').eq('client_id', client.id).in('status', ['Sent', 'Overdue']),
    records.from('documents').select('id, status, expiry_date, doc_type').eq('client_id', client.id),
    records.from('profiles').select('full_name, company_name').eq('id', user.id).maybeSingle(),
    records.from('client_contacts').select('id').eq('client_id', client.id).limit(1),
    records.from('epr_credentials').select('id').eq('client_id', client.id).limit(1),
    records.from('client_epr_tasks').select('id, title, waste_category, due_date, status, period_label, fy').eq('client_id', client.id).order('due_date'),
    records.from('epr_filing_statuses').select('id, category, current_status, sla_due_at').eq('client_id', client.id),
    records.from('credit_transactions').select('category, quantity_kg, status').eq('buyer_client_id', client.id).eq('status', 'Completed'),
    records.from('epr_credits').select('waste_category, quantity_mt, status').eq('client_id', client.id).in('status', ['Issued', 'Transferred', 'Used']),
  ]);

  if ([servicesRes, paymentsRes, documentsRes, profileRes, contactsRes, credentialsRes, tasksRes, filingsRes, transactionsRes, creditsRes].some(result => result.error)) return <DashboardUnavailable />;
  const services = servicesRes.data || [];
  const tasks = tasksRes.data || [];
  const filings = filingsRes.data || [];
  const documents = documentsRes.data || [];
  const now = new Date();
  const calendar: CalendarItem[] = resolveFilingCalendar(tasks, filings, services, now);
  const overdue = calendar.filter((row) => row.daysLeft < 0);
  const dueSoon = calendar.filter((row) => row.daysLeft >= 0 && row.daysLeft <= 30);
  const upcoming = calendar.filter((row) => row.daysLeft >= 0).slice(0, 4);
  const pendingDocuments = documents.filter((row: any) => row.status === 'Pending');
  const expiredDocuments = documents.filter((row: any) => row.status === 'Expired' || (row.expiry_date && new Date(row.expiry_date) < now));
  const documentGap = pendingDocuments.length + expiredDocuments.length;
  const blockingTask = [...overdue, ...dueSoon][0];
  const outstanding = (paymentsRes.data || []).reduce((sum: number, row: any) => sum + Number(row.total_inr || 0), 0);
  const compliance = await getComplianceScore(client.id, records).catch(() => null);
  if (!compliance) return <DashboardUnavailable />;

  let dossierRows: any[] = [];
  if (client.intel_company_id && !process.env.SUPABASE_SERVICE_ROLE_KEY) return <DashboardUnavailable />;
  if (client.intel_company_id && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const result = await (admin as any).from('intel_epr_obligations').select('stream, fy, target_mt, placed_mt, credits_mt, shortfall_mt, return_status').eq('company_id', client.intel_company_id).eq('fy', currentFy());
    if (result.error) return <DashboardUnavailable />;
    dossierRows = result.data || [];
  }

  const streamRows = STREAMS.map((stream) => {
    const dossierParts = dossierRows.filter((row) => row.stream === stream.key);
    const dossier = dossierParts.length ? dossierParts.reduce((summary, row) => ({
      target_mt: Number(summary.target_mt || 0) + Number(row.target_mt || 0),
      placed_mt: Number(summary.placed_mt || 0) + Number(row.placed_mt || 0),
      credits_mt: Number(summary.credits_mt || 0) + Number(row.credits_mt || 0),
      shortfall_mt: Number(summary.shortfall_mt || 0) + Number(row.shortfall_mt || 0),
      return_status: row.return_status || summary.return_status,
    }), {}) : null;
    const purchasedTransactions = (transactionsRes.data || [])
      .filter((row: any) => matches(row.category, stream.aliases))
      .reduce((sum: number, row: any) => sum + Number(row.quantity_kg || 0) / 1000, 0);
    const assignedCredits = (creditsRes.data || [])
      .filter((row: any) => matches(row.waste_category, stream.aliases))
      .reduce((sum: number, row: any) => sum + Number(row.quantity_mt || 0), 0);
    const purchased = assignedCredits > 0 ? assignedCredits : purchasedTransactions;
    const credits = dossier?.credits_mt == null ? purchased : Number(dossier.credits_mt);
    const target = dossier?.target_mt == null ? null : Number(dossier.target_mt);
    const shortfall = dossier?.shortfall_mt == null ? (target == null ? null : Math.max(target - credits, 0)) : Number(dossier.shortfall_mt);
    const filing = filings.find((row: any) => matches(row.category, stream.aliases));
    const deadline = calendar.find((row) => matches(row.category || row.title, stream.aliases));
    return { ...stream, placed: dossier?.placed_mt == null ? null : Number(dossier.placed_mt), target, credits, shortfall, returnStatus: dossier?.return_status || filing?.current_status || 'Not started', dueDate: deadline?.due_date || filing?.sla_due_at?.slice(0, 10) || null };
  });
  const totalShortfall = streamRows.reduce((sum, row) => sum + Number(row.shortfall || 0), 0);
  const baseline = dashboardBaseline({ scheduled: calendar.length, targets: dossierRows.filter(row => row.target_mt != null).length, failed: false });

  const nextAction: NextAction = overdue[0]
    ? { title: `Overdue: ${overdue[0].title}`, detail: `${overdue.length} compliance item${overdue.length === 1 ? '' : 's'} past due. Complete the task and attach evidence now.`, href: '/portal/epr-tasks', cta: 'Open calendar', tone: 'danger' }
    : documentGap > 0
      ? { title: 'Close the document gap', detail: `${documentGap} document${documentGap === 1 ? '' : 's'} need review, replacement, or renewal before filing.`, href: '/portal/documents', cta: 'Open documents', tone: 'warning' }
      : totalShortfall > 0
        ? { title: `${mt(totalShortfall)} credit shortfall`, detail: 'Review available credits and matched recyclers for the current financial year.', href: '/portal/credits', cta: 'Close shortfall', tone: 'warning' }
        : dueSoon[0]
          ? { title: `Due in ${dueSoon[0].daysLeft} days`, detail: `${dueSoon[0].title} is due ${dueSoon[0].due_date}.`, href: '/portal/epr-tasks', cta: 'Prepare filing', tone: 'warning' }
          : baseline === 'unassessed'
            ? { title: 'Assessment pending', detail: 'Your account manager needs to validate your obligations and reporting schedule.', href: '/portal/service-requests', cta: 'Contact account team', tone: 'warning' }
            : { title: 'No recorded urgent actions', detail: 'Based on available records only. Your account team validates completeness and compliance.', href: '/portal/epr-tasks', cta: 'View calendar', tone: 'ok' };

  const setupDetails = client.onboarding_details as Record<string, unknown> | null;
  const setupSteps = buildClientSetupSteps({ hasProfile: Boolean(profileRes.data?.company_name || profileRes.data?.full_name), hasEprCertificates: documents.some((row: any) => /certificate/i.test(row.doc_type || '')), hasDocuments: documents.length > 0, hasFilings: services.length > 0, hasContacts: (contactsRes.data || []).length > 0, hasCredentials: (credentialsRes.data || []).length > 0, hasDataProfile: setupDetails?.setup_status === 'complete', hasProducts: Boolean(setupDetails?.imported_products || setupDetails?.manufactured_products) });
  const setupComplete = setupSteps.every((step) => step.done);

  return <div className="space-y-5">
    <NextActionCockpit action={nextAction} overdueCount={overdue.length} upcomingCount={dueSoon.length} pendingDocs={documentGap} score={baseline === 'recorded' ? compliance.score : null} />
    {!setupComplete ? <SetupGuideWidget steps={setupSteps} portalKey={`client-${user.id}`} accentColor="blue" /> : null}

    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Current FY · {currentFy()}–{String(currentFy() + 1).slice(-2)}</p><h1 className="mt-1 text-xl font-bold text-slate-900">Compliance by stream</h1><p className="mt-1 text-sm text-slate-600">Placed quantity → target → credits → shortfall → return.</p></div><Link href="/portal/credits" className="text-sm font-semibold text-blue-700">Manage credits →</Link></div>
      <div className="mt-4 overflow-x-auto"><table className="min-w-full text-sm"><thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2 pr-4">Stream</th><th className="py-2 pr-4">Placed</th><th className="py-2 pr-4">Target</th><th className="py-2 pr-4">Credits</th><th className="py-2 pr-4">Shortfall</th><th className="py-2 pr-4">Return</th><th className="py-2">Next due</th></tr></thead>
        <tbody>{streamRows.map((row) => <tr key={row.key} className="border-b border-slate-100 last:border-0"><td className="py-3 pr-4 font-semibold text-slate-900">{row.label}</td><td className="py-3 pr-4 text-slate-600">{mt(row.placed)}</td><td className="py-3 pr-4 text-slate-700">{mt(row.target)}</td><td className="py-3 pr-4 text-slate-700">{mt(row.credits)}</td><td className={`py-3 pr-4 font-semibold ${Number(row.shortfall || 0) > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{mt(row.shortfall)}</td><td className="py-3 pr-4 text-slate-700">{row.returnStatus}</td><td className="py-3 text-slate-600">{row.dueDate || 'Not scheduled'}</td></tr>)}</tbody>
      </table></div>
    </section>

    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Upcoming deadlines</h2><Link href="/portal/epr-tasks" className="text-sm font-semibold text-blue-700">Full calendar →</Link></div><div className="mt-3 space-y-2">{upcoming.length ? upcoming.map((item) => <Link key={item.id} href="/portal/epr-tasks" className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50"><div><p className="text-sm font-medium text-slate-900">{item.title}</p><p className="text-xs text-slate-500">{item.category || 'Compliance'} · {item.due_date}</p></div><span className={item.daysLeft <= 7 ? 'text-sm font-bold text-red-700' : 'text-sm font-bold text-amber-700'}>{item.daysLeft}d</span></Link>) : <p className="py-6 text-center text-sm text-slate-500">No upcoming deadlines.</p>}</div></section>
      <section className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center justify-between"><h2 className="font-semibold text-slate-900">Document gap</h2><Link href="/portal/documents" className="text-sm font-semibold text-blue-700">Open documents →</Link></div><p className="mt-4 text-3xl font-extrabold text-slate-900">{documentGap}</p><p className="mt-1 text-sm text-slate-600">{pendingDocuments.length} pending review · {expiredDocuments.length} expired</p>{blockingTask ? <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><span className="font-semibold">Potentially blocking:</span> {blockingTask.title}</div> : null}{outstanding > 0 ? <Link href="/portal/payments" className="mt-3 block text-xs text-slate-500">Outstanding payments: ₹{outstanding.toLocaleString('en-IN')} →</Link> : null}</section>
    </div>
  </div>;
}

function DashboardUnavailable() {
  return <div role="alert" className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
    <h1 className="text-lg font-semibold">Dashboard temporarily unavailable</h1>
    <p>Some records could not be loaded. No compliance status has been calculated.</p>
    <Link href="/portal/dashboard" className="inline-block min-h-11 py-2 font-semibold underline">Reload dashboard</Link>
    <Link href="/portal/service-requests" className="ml-4 inline-block min-h-11 py-2 font-semibold underline">Contact account team</Link>
  </div>;
}
