import DownloadActivityCsvButton from './DownloadActivityCsvButton';
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

function typeIcon(type: string) {
  if (type === 'Call') return '📞';
  if (type === 'Email') return '✉️';
  if (type === 'Meeting') return '📅';
  if (type === 'Filing') return '📄';
  return '📝';
}

function normalizeTypeFilter(type: string) {
  if (type === 'Calls') return 'Call';
  if (type === 'Emails') return 'Email';
  if (type === 'Meetings') return 'Meeting';
  if (type === 'Filings') return 'Filing';
  if (type === 'Notes') return 'Note';
  return 'All';
}

export default async function PortalActivityPage({
  searchParams
}: {
  searchParams?: Promise<{ type?: string; from?: string; to?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const typeFilter = normalizeTypeFilter(params?.type || 'All');

  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 30);

  const from = params?.from || defaultFrom.toISOString().slice(0, 10);
  const to = params?.to || today.toISOString().slice(0, 10);

  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return <div className="rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700">Please sign in to view your activity.</div>;
  }

  const context = await getPortalClientContext(supabase as any, user.id);
  if (!context || !context.account) {
    return <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-700">No company profile is linked to your account yet.</div>;
  }

  const { account } = context;

  const [activitiesRes, notesRes, emailsRes, servicesRes] = await Promise.all([
    (supabase as any)
      .from('activities')
      .select('id, type, subject, note, outcome, status, done_by, created_at, due_date')
      .eq('entity_type', 'account')
      .eq('entity_id', account.id)
      .neq('type', 'internal_note')
      .gte('created_at', `${from}T00:00:00Z`)
      .lte('created_at', `${to}T23:59:59Z`)
      .order('created_at', { ascending: false })
      .limit(200),
    (supabase as any)
      .from('crm_notes')
      .select('id, title, content, created_by, created_at')
      .eq('entity_type', 'account')
      .eq('entity_id', account.id)
      .not('title', 'ilike', 'INTERNAL:%')
      .gte('created_at', `${from}T00:00:00Z`)
      .lte('created_at', `${to}T23:59:59Z`)
      .order('created_at', { ascending: false })
      .limit(200),
    (supabase as any)
      .from('email_log')
      .select('id, subject, status, sent_at, to_email')
      .eq('entity_type', 'account')
      .eq('entity_id', account.id)
      .gte('sent_at', `${from}T00:00:00Z`)
      .lte('sent_at', `${to}T23:59:59Z`)
      .order('sent_at', { ascending: false })
      .limit(200),
    (supabase as any)
      .from('services')
      .select('id, waste_category, status, updated_at, due_date, service_type')
      .eq('client_id', context.client.id)
      .eq('service_type', 'Filing')
      .gte('updated_at', `${from}T00:00:00Z`)
      .lte('updated_at', `${to}T23:59:59Z`)
      .order('updated_at', { ascending: false })
      .limit(100)
  ]);

  const profileIds = Array.from(
    new Set([
      ...(activitiesRes.data || []).map((row: any) => row.done_by).filter(Boolean),
      ...(notesRes.data || []).map((row: any) => row.created_by).filter(Boolean)
    ])
  );

  const { data: profiles } = profileIds.length
    ? await (supabase as any)
        .from('profiles')
        .select('id, full_name, company_name')
        .in('id', profileIds)
    : { data: [] };

  const profileById = new Map((profiles || []).map((p: any) => [p.id, p.full_name || p.company_name || 'Consultant']));

  const timeline = [
    ...(activitiesRes.data || []).map((row: any) => {
      let description = row.note || row.subject || 'Activity logged';
      if (row.type === 'Call') {
        description = `Our team called you${row.outcome ? ` — ${row.outcome}` : ''}`;
      }
      if (row.type === 'Meeting') {
        description = `Meeting: ${row.subject || 'Consultation'} on ${fmtDate(row.due_date || row.created_at)}`;
      }
      return {
        date: row.created_at,
        type: row.type,
        description,
        by: profileById.get(row.done_by) || 'Consultant'
      };
    }),
    ...(notesRes.data || [])
      .filter((row: any) => !(row.title || '').startsWith('INTERNAL:'))
      .map((row: any) => ({
        date: row.created_at,
        type: 'Note',
        description: row.content,
        by: profileById.get(row.created_by) || 'Consultant'
      })),
    ...(emailsRes.data || []).map((row: any) => ({
      date: row.sent_at,
      type: 'Email',
      description: `Email sent: ${row.subject || 'No subject'}`,
      by: 'Consultant'
    })),
    ...(servicesRes.data || []).map((row: any) => ({
      date: row.updated_at,
      type: 'Filing',
      description: `EPR filing ${row.status}: ${row.waste_category}`,
      by: 'Compliance Team'
    }))
  ]
    .filter((row) => {
      if (typeFilter === 'All') return true;
      return row.type === typeFilter;
    })
    .sort((a, b) => new Date(b.date || '').getTime() - new Date(a.date || '').getTime());

  const csvRows = timeline.map((item) => ({
    date: fmtDate(item.date),
    type: item.type,
    description: item.description,
    by: item.by
  }));

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h1 className="text-xl font-semibold text-slate-900">Your EPR Service History</h1>
        <p className="mt-1 text-sm text-slate-600">All interactions, filings, and updates.</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <form className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <select name="type" defaultValue={params?.type || 'All'} className="rounded-md border border-slate-300 px-3 py-2 text-sm">
            <option value="All">Type: All</option>
            <option value="Calls">Calls</option>
            <option value="Emails">Emails</option>
            <option value="Filings">Filings</option>
            <option value="Meetings">Meetings</option>
          </select>
          <input type="date" name="from" defaultValue={from} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <input type="date" name="to" defaultValue={to} className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
          <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Apply filters
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900">Timeline</h2>
          <DownloadActivityCsvButton rows={csvRows} />
        </div>

        <div className="space-y-3">
          {timeline.map((item, index) => (
            <article key={`${item.type}-${item.date}-${index}`} className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs text-slate-500">{fmtDate(item.date)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{typeIcon(item.type)} {item.type}</p>
              <p className="mt-1 text-sm text-slate-700">{item.description}</p>
              <p className="mt-1 text-xs text-slate-500">By: {item.by}</p>
            </article>
          ))}

          {timeline.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
              No recorded activity yet. Your consultant will log interactions here.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
