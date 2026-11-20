import KpiBar from './_components/KpiBar';
import OverviewHeader from './_components/OverviewHeader';
import EprKpiStrip from './_components/EprKpiStrip';
import RevenueChart from './_components/RevenueChart';
import LeadFunnelChart from './_components/LeadFunnelChart';
import ComplianceHeatmap from './_components/ComplianceHeatmap';
import RecyclerRiskTable from './_components/RecyclerRiskTable';
import AiInsightsPanel from './_components/AiInsightsPanel';
import AlertsStrip from './_components/AlertsStrip';
import DeadlinesTable from './_components/DeadlinesTable';
import ActivityFeed from './_components/ActivityFeed';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import TourTarget from '@/components/portal/tour/TourTarget';
import { loadRecyclerRisks } from '@/lib/admin/recyclerRisks';

const EMPTY_KPI_DATA = {
  kpis: {
    active_clients: 0,
    at_risk_clients: 0,
    revenue_this_month: 0,
    leads_this_month: 0,
    overdue_filings: 0,
    deadlines_30d: 0,
    marketplace_volume: 0,
    total_overdue: 0
  },
  deltas: {
    active_clients: 0,
    revenue_this_month: 0,
    leads_this_month: 0,
    overdue_filings: 0,
    deadlines_30d: 0,
    marketplace_volume: 0,
    total_overdue: 0,
    conversions_this_month: 0,
    collected_this_month: 0
  }
};

const EMPTY_REVENUE_DATA = {
  monthly: [],
  forecast: []
};

const EMPTY_LEADS_DATA = {
  funnel: [
    { stage: 'Visitor', value: 0, conversionPct: 0 },
    { stage: 'Lead', value: 0, conversionPct: 0 },
    { stage: 'Qualified', value: 0, conversionPct: 0 },
    { stage: 'Proposal', value: 0, conversionPct: 0 },
    { stage: 'Won', value: 0, conversionPct: 0 }
  ],
  sources: []
};

const EMPTY_COMPLIANCE_DATA = {
  matrix: [
    { category: 'Plastic', counts: { Onboarding: 0, Docs: 0, Filed: 0, Approved: 0, Overdue: 0 } },
    { category: 'E-Waste', counts: { Onboarding: 0, Docs: 0, Filed: 0, Approved: 0, Overdue: 0 } },
    { category: 'Battery', counts: { Onboarding: 0, Docs: 0, Filed: 0, Approved: 0, Overdue: 0 } },
    { category: 'Tyre', counts: { Onboarding: 0, Docs: 0, Filed: 0, Approved: 0, Overdue: 0 } }
  ]
};

function monthKey(dateLike?: string | null) {
  if (!dateLike) return null;
  return String(dateLike).slice(0, 7);
}

function pctDelta(current: number, previous: number) {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function fromNowLabel(dateLike?: string | null) {
  if (!dateLike) return '-';
  const ms = Date.now() - new Date(dateLike).getTime();
  const mins = Math.max(1, Math.floor(ms / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

async function getKpis() {
  const supabase = await createServerComponentClient();
  const [{ data: row }, { data: invoices }, { data: leads }, { data: wonLeads }] = await Promise.all([
    (supabase as any).from('mv_dashboard_kpis').select('*').limit(1).maybeSingle(),
    (supabase as any).from('invoices').select('total_inr, status, issued_date, paid_date'),
    (supabase as any).from('leads').select('id, created_at'),
    (supabase as any).from('leads').select('id, stage, converted_at').eq('stage', 'Won')
  ]);

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const last = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonth = `${last.getUTCFullYear()}-${String(last.getUTCMonth() + 1).padStart(2, '0')}`;

  const sumByMonth = (list: any[], month: string, field = 'issued_date', pred?: (row: any) => boolean) =>
    (list || []).reduce((acc, item) => {
      if (pred && !pred(item)) return acc;
      return monthKey(item[field]) === month ? acc + Number(item.total_inr || 0) : acc;
    }, 0);

  const revenueCurrent = sumByMonth(invoices || [], currentMonth);
  const revenuePrev = sumByMonth(invoices || [], lastMonth);
  const collectedCurrent = sumByMonth(invoices || [], currentMonth, 'paid_date', (r) => Boolean(r.paid_date));
  const collectedPrev = sumByMonth(invoices || [], lastMonth, 'paid_date', (r) => Boolean(r.paid_date));
  const overdueCurrent = (invoices || []).reduce((acc, r) => acc + (r.status === 'Overdue' ? Number(r.total_inr || 0) : 0), 0);

  const leadsCurrent = (leads || []).filter((r: any) => monthKey(r.created_at) === currentMonth).length;
  const leadsPrev = (leads || []).filter((r: any) => monthKey(r.created_at) === lastMonth).length;
  const convCurrent = (wonLeads || []).filter((r: any) => monthKey(r.converted_at) === currentMonth).length;
  const convPrev = (wonLeads || []).filter((r: any) => monthKey(r.converted_at) === lastMonth).length;

  return {
    kpis: row || {},
    deltas: {
      revenue_this_month: pctDelta(revenueCurrent, revenuePrev),
      collected_this_month: pctDelta(collectedCurrent, collectedPrev),
      total_overdue: pctDelta(overdueCurrent, 0),
      leads_this_month: pctDelta(leadsCurrent, leadsPrev),
      conversions_this_month: pctDelta(convCurrent, convPrev)
    }
  };
}

async function getRevenue() {
  const supabase = await createServerComponentClient();
  const start = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 11, 1));

  const [{ data: invoices }, { data: leads }] = await Promise.all([
    (supabase as any)
      .from('invoices')
      .select('total_inr, issued_date, paid_date')
      .gte('issued_date', start.toISOString().slice(0, 10)),
    (supabase as any)
      .from('leads')
      .select('id, created_at')
      .gte('created_at', `${start.toISOString().slice(0, 10)}T00:00:00Z`)
  ]);

  const map = new Map<string, { month: string; billed: number; collected: number; leads: number }>();

  for (let i = 0; i < 12; i += 1) {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
    const key = d.toISOString().slice(0, 7);
    map.set(key, { month: key, billed: 0, collected: 0, leads: 0 });
  }

  for (const row of invoices || []) {
    const mk = monthKey(row.issued_date);
    if (!mk || !map.has(mk)) continue;
    const current = map.get(mk)!;
    current.billed += Number(row.total_inr || 0);
    if (row.paid_date && monthKey(row.paid_date) === mk) {
      current.collected += Number(row.total_inr || 0);
    }
  }

  for (const lead of leads || []) {
    const mk = monthKey(lead.created_at);
    if (!mk || !map.has(mk)) continue;
    map.get(mk)!.leads += 1;
  }

  const monthly = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  const recent = monthly.slice(-6).map((m) => m.collected);
  const n = recent.length;

  let forecast: Array<{ month: string; collected: number }> = [];
  if (n >= 2) {
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    for (let i = 0; i < n; i += 1) {
      const x = i + 1;
      const y = Number(recent[i] || 0);
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumX2 += x * x;
    }

    const denominator = n * sumX2 - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    const lastMonth = monthly[monthly.length - 1]?.month || monthKey(new Date().toISOString()) || '';
    const [yy, mm] = lastMonth.split('-').map(Number);
    forecast = [1, 2, 3].map((step) => {
      const x = n + step;
      const d = new Date(Date.UTC(yy, mm - 1 + step, 1));
      return {
        month: d.toISOString().slice(0, 7),
        collected: Math.max(0, Number((intercept + slope * x).toFixed(2)))
      };
    });
  }

  return { monthly, forecast };
}

async function getLeads() {
  const supabase = await createServerComponentClient();
  const { data: leads } = await (supabase as any)
    .from('leads')
    .select('id, source, stage, created_at, converted_at');

  const rows = leads || [];
  const stageNames = ['Visitor', 'Lead', 'Qualified', 'Proposal', 'Won'];
  const stageMap = new Map(stageNames.map((s) => [s, 0]));

  for (const row of rows) {
    if (row.stage === 'New' || row.stage === 'Contacted') stageMap.set('Lead', Number(stageMap.get('Lead') || 0) + 1);
    else if (stageMap.has(row.stage)) stageMap.set(row.stage, Number(stageMap.get(row.stage) || 0) + 1);
  }
  stageMap.set('Visitor', Number((stageMap.get('Lead') || 0) * 4));

  const funnel = stageNames.map((stage, i) => {
    const value = Number(stageMap.get(stage) || 0);
    const prev = i === 0 ? value : Number(stageMap.get(stageNames[i - 1]) || 0);
    return {
      stage,
      value,
      conversionPct: prev ? Number(((value / prev) * 100).toFixed(2)) : 0
    };
  });

  const sourceMap = new Map<string, { count: number; won: number }>();
  for (const row of rows) {
    const source = String(row.source || 'Unknown');
    const cur = sourceMap.get(source) || { count: 0, won: 0 };
    cur.count += 1;
    if (row.stage === 'Won') cur.won += 1;
    sourceMap.set(source, cur);
  }

  const sources = Array.from(sourceMap.entries())
    .map(([source, data]) => ({
      source,
      count: data.count,
      conversionRate: data.count ? Number(((data.won / data.count) * 100).toFixed(2)) : 0
    }))
    .sort((a, b) => b.count - a.count);

  return { funnel, sources };
}

async function getCompliance() {
  const supabase = await createServerComponentClient();
  const { data: services } = await (supabase as any)
    .from('services')
    .select('id, waste_category, status');

  const categories = ['Plastic', 'E-Waste', 'Battery', 'Tyre'];
  const statuses = ['Onboarding', 'Docs', 'Filed', 'Approved', 'Overdue'];

  const normalizedStatus = (status: string) => {
    if (status === 'Pending') return 'Onboarding';
    if (status === 'In Progress') return 'Docs';
    if (status === 'Filed') return 'Filed';
    if (status === 'Approved') return 'Approved';
    return 'Overdue';
  };

  const matrix = categories.map((category) => {
    const rowMap = new Map(statuses.map((s) => [s, 0]));
    for (const service of services || []) {
      if (service.waste_category !== category) continue;
      const label = normalizedStatus(service.status);
      rowMap.set(label, Number((rowMap.get(label) || 0) + 1));
    }
    return {
      category,
      counts: Object.fromEntries(Array.from(rowMap.entries()))
    };
  });

  return { matrix };
}

async function getRecyclerRisks() {
  const supabase = await createServerComponentClient();
  return loadRecyclerRisks(supabase);
}

async function getDeadlines() {
  const supabase = await createServerComponentClient();
  const in14 = new Date();
  in14.setDate(in14.getDate() + 14);

  const [{ data: services }, { data: clients }, { data: profiles }] = await Promise.all([
    (supabase as any)
      .from('services')
      .select('id, client_id, service_type, waste_category, due_date, assigned_to, status')
      .gte('due_date', new Date().toISOString().slice(0, 10))
      .lte('due_date', in14.toISOString().slice(0, 10))
      .neq('status', 'Approved')
      .order('due_date', { ascending: true }),
    (supabase as any)
      .from('clients')
      .select('id, profile_id'),
    (supabase as any)
      .from('profiles')
      .select('id, full_name, company_name')
  ]);

  const clientMap = new Map<string, any>((clients || []).map((row: any) => [row.id, row]));
  const profileMap = new Map<string, any>((profiles || []).map((row: any) => [row.id, row]));

  return (services || []).slice(0, 10).map((row: any) => {
    const client = clientMap.get(row.client_id);
    const clientProfile = client ? profileMap.get(client.profile_id) : null;
    const assignee = row.assigned_to ? profileMap.get(row.assigned_to) : null;

    const due = row.due_date ? new Date(`${row.due_date}T00:00:00Z`) : null;
    const daysLeft = due ? Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

    return {
      id: row.id,
      client_name: clientProfile?.company_name || clientProfile?.full_name || 'Client',
      service_type: row.service_type,
      waste_category: row.waste_category,
      due_date: row.due_date,
      days_left: daysLeft,
      assigned_to: assignee?.full_name || assignee?.company_name || 'Unassigned'
    };
  });
}

async function getActivities() {
  const supabase = await createServerComponentClient();
  const { data: activities } = await (supabase as any)
    .from('activities')
    .select('id, entity_type, entity_id, type, note, outcome, created_at')
    .order('created_at', { ascending: false })
    .limit(15);

  const rows = activities || [];
  const leadIds = rows.filter((r: any) => r.entity_type === 'lead').map((r: any) => r.entity_id);
  const clientIds = rows.filter((r: any) => r.entity_type === 'client').map((r: any) => r.entity_id);
  const partnerIds = rows.filter((r: any) => r.entity_type === 'partner').map((r: any) => r.entity_id);
  const recyclerIds = rows.filter((r: any) => r.entity_type === 'recycler').map((r: any) => r.entity_id);

  const [{ data: leads }, { data: clients }, { data: partners }, { data: recyclers }, { data: profiles }] = await Promise.all([
    leadIds.length ? (supabase as any).from('leads').select('id, company, contact_name').in('id', leadIds) : Promise.resolve({ data: [] }),
    clientIds.length ? (supabase as any).from('clients').select('id, profile_id').in('id', clientIds) : Promise.resolve({ data: [] }),
    partnerIds.length ? (supabase as any).from('partners').select('id, company_name, contact_person').in('id', partnerIds) : Promise.resolve({ data: [] }),
    recyclerIds.length ? (supabase as any).from('recyclers').select('id, company_name, contact_person').in('id', recyclerIds) : Promise.resolve({ data: [] }),
    (supabase as any).from('profiles').select('id, company_name, full_name')
  ]);

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const leadMap = new Map<string, string>((leads || []).map((r: any) => [r.id, r.company || r.contact_name || 'Lead']));
  const partnerMap = new Map<string, string>((partners || []).map((r: any) => [r.id, r.company_name || r.contact_person || 'Partner']));
  const recyclerMap = new Map<string, string>((recyclers || []).map((r: any) => [r.id, r.company_name || r.contact_person || 'Recycler']));

  const clientNameMap = new Map<string, string>();
  for (const c of clients || []) {
    const p = profileMap.get(c.profile_id);
    clientNameMap.set(c.id, p?.company_name || p?.full_name || 'Client');
  }

  return rows.map((row: any) => {
    let entityName = 'Entity';
    if (row.entity_type === 'lead') entityName = leadMap.get(row.entity_id) || 'Lead';
    else if (row.entity_type === 'client') entityName = clientNameMap.get(row.entity_id) || 'Client';
    else if (row.entity_type === 'partner') entityName = partnerMap.get(row.entity_id) || 'Partner';
    else if (row.entity_type === 'recycler') entityName = recyclerMap.get(row.entity_id) || 'Recycler';

    return {
      ...row,
      entity_name: entityName,
      time_ago: fromNowLabel(row.created_at),
      summary: row.note || row.outcome || `${row.type} activity logged`
    };
  });
}

export default async function AdminDashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isSupabaseConfigured =
    Boolean(supabaseUrl) &&
    !String(supabaseUrl).includes('example.supabase.co') &&
    Boolean(supabaseAnonKey) &&
    String(supabaseAnonKey) !== 'placeholder-anon-key';

  const [kpiData, revenueData, leadsData, complianceData, deadlinesData, activitiesData, recyclerRiskResult] = isSupabaseConfigured
    ? await Promise.all([
        getKpis(),
        getRevenue(),
        getLeads(),
        getCompliance(),
        getDeadlines(),
        getActivities(),
        getRecyclerRisks()
      ])
    : [
        EMPTY_KPI_DATA,
        EMPTY_REVENUE_DATA,
        EMPTY_LEADS_DATA,
        EMPTY_COMPLIANCE_DATA,
        [],
        [],
        { rows: [], error: null }
      ];

  const recyclerRisks = recyclerRiskResult.rows;

  const insightsContext = {
    kpis: kpiData.kpis,
    revenue: revenueData,
    leads: leadsData,
    compliance: complianceData,
    recyclerRisks,
    topAlerts: {
      overdueFilings: Number(kpiData.kpis?.overdue_filings || 0),
      deadlines30d: Number(kpiData.kpis?.deadlines_30d || 0),
      overdueInvoices: Number(kpiData.kpis?.total_overdue || 0),
      highRiskRecyclers: recyclerRisks.filter((r: any) => r.risk_flag === 'High').length
    }
  };

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 text-zinc-900">
      <OverviewHeader />
      {!isSupabaseConfigured ? (
        <section role="status" className="border-l-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Local preview. Live workspace data is unavailable until Supabase is configured.
        </section>
      ) : null}

      <TourTarget id="dash-alerts-strip">
        <AlertsStrip
          overdueFilings={Number(kpiData.kpis?.overdue_filings || 0)}
          deadlines7d={deadlinesData.filter((r: any) => Number(r.days_left) <= 7).length}
          overdueInvoices30d={Number(kpiData.kpis?.total_overdue || 0)}
          highRiskRecyclers={recyclerRisks.filter((r: any) => r.risk_flag === 'High').length}
        />
      </TourTarget>

      <TourTarget id="dash-kpi-bar">
        <KpiBar kpis={kpiData.kpis} deltas={kpiData.deltas} unavailable={!isSupabaseConfigured} />
      </TourTarget>

      <EprKpiStrip />

      <TourTarget id="dash-deadlines-activity" className="grid min-w-0 grid-cols-1 gap-6 2xl:grid-cols-12">
        <div className="min-w-0 2xl:col-span-8"><DeadlinesTable rows={deadlinesData} /></div>
        <div className="min-w-0 2xl:col-span-4"><ActivityFeed rows={activitiesData} /></div>
      </TourTarget>

      <TourTarget id="dash-revenue-leads" className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-7">
          <RevenueChart data={revenueData} />
        </div>
        <div className="min-w-0 xl:col-span-5">
          <LeadFunnelChart data={leadsData} />
        </div>
      </TourTarget>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="min-w-0 xl:col-span-6">
          <ComplianceHeatmap matrix={complianceData.matrix} />
        </div>
        <div className="min-w-0 xl:col-span-6">
      <RecyclerRiskTable rows={recyclerRisks} error={recyclerRiskResult.error} />
        </div>
      </section>

      <AiInsightsPanel context={insightsContext} />
    </div>
  );
}
