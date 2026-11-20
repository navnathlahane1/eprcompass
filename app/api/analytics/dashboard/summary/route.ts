import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing Supabase env vars');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function monthLabel(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleString('en-IN', { month: 'short', year: '2-digit' });
}

export async function GET() {
  try {
    const { deny } = await requireAdminSession();
    if (deny) return deny;

    const db = adminClient() as any;

    // ── Parallel queries ────────────────────────────────────────────
    const results = await Promise.all([
      db.from('clients').select('id, created_at, status').order('created_at', { ascending: true }),
      db.from('services').select('id, service_type, waste_category, status, created_at').order('created_at', { ascending: true }),
      db.from('invoices').select('id, total_inr, status, issued_date').order('issued_date', { ascending: true }),
      db.from('leads').select('id, status, created_at').order('created_at', { ascending: true }),
      db.from('compliance_obligations').select('id, status, due_date').order('due_date', { ascending: false }),
    ]);
    if (results.some(result => result.error)) throw new Error('Analytics records unavailable');
    const [{ data: clients }, { data: services }, { data: invoices }, { data: leads }, { data: obligations }] = results;

    const safeClients = clients || [];
    const safeServices = services || [];
    const safeInvoices = invoices || [];
    const safeLeads = leads || [];
    const safeObligations = obligations || [];

    // ── KPIs ────────────────────────────────────────────────────────
    const totalClients = safeClients.length;
    const activeServices = safeServices.filter((s: any) => s.status !== 'Cancelled').length;
    const totalRevenue = safeInvoices
      .filter((i: any) => i.status === 'Paid')
      .reduce((sum: number, i: any) => sum + (Number(i.total_inr) || 0), 0);
    const overdueCount = safeObligations.filter((o: any) =>
      o.status !== 'Approved' && o.due_date && new Date(o.due_date) < new Date()
    ).length;

    // MoM client growth
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const clientsThisMonth = safeClients.filter((c: any) => new Date(c.created_at) >= thisMonthStart).length;
    const clientsLastMonth = safeClients.filter((c: any) => {
      const d = new Date(c.created_at);
      return d >= lastMonthStart && d < thisMonthStart;
    }).length;
    const clientGrowthPct = clientsLastMonth > 0
      ? Math.round(((clientsThisMonth - clientsLastMonth) / clientsLastMonth) * 100)
      : 0;

    // ── Monthly client growth (last 12 months) ──────────────────────
    const monthlyClients: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyClients[monthLabel(d.toISOString())] = 0;
    }
    safeClients.forEach((c: any) => {
      const lbl = monthLabel(c.created_at);
      if (lbl in monthlyClients) monthlyClients[lbl]++;
    });
    const clientGrowthChart = Object.entries(monthlyClients).map(([month, count]) => ({ month, count }));

    // ── Monthly revenue (last 12 months) ───────────────────────────
    const monthlyRevenue: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthlyRevenue[monthLabel(d.toISOString())] = 0;
    }
    safeInvoices.filter((i: any) => i.status === 'Paid').forEach((inv: any) => {
      const lbl = monthLabel(inv.issued_date);
      if (lbl in monthlyRevenue) monthlyRevenue[lbl] += Number(inv.total_inr) || 0;
    });
    const revenueChart = Object.entries(monthlyRevenue).map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

    // ── Services by type (bar chart) ────────────────────────────────
    const byServiceType: Record<string, number> = {};
    safeServices.forEach((s: any) => {
      const t = s.service_type || 'Other';
      byServiceType[t] = (byServiceType[t] || 0) + 1;
    });
    const serviceTypeChart = Object.entries(byServiceType).map(([name, count]) => ({ name, count }));

    // ── Services by waste category (pie) ────────────────────────────
    const byCategory: Record<string, number> = {};
    safeServices.forEach((s: any) => {
      const c = s.waste_category || 'Other';
      byCategory[c] = (byCategory[c] || 0) + 1;
    });
    const categoryPieChart = Object.entries(byCategory).map(([name, value]) => ({ name, value }));

    // ── Lead funnel ──────────────────────────────────────────────────
    const totalLeads = safeLeads.length || 1;
    const qualifiedLeads = safeLeads.filter((l: any) =>
      ['Qualified', 'Proposal Sent', 'Negotiation', 'Converted'].includes(l.status)
    ).length;
    const convertedLeads = safeLeads.filter((l: any) => l.status === 'Converted').length;
    const leadFunnel = [
      { stage: 'Total Leads', value: safeLeads.length, percentage: 100 },
      { stage: 'Qualified', value: qualifiedLeads, percentage: Math.round((qualifiedLeads / totalLeads) * 100) },
      { stage: 'Converted', value: convertedLeads, percentage: Math.round((convertedLeads / totalLeads) * 100) },
    ];

    // ── Compliance status breakdown (pie) ──────────────────────────
    const complianceStatus: Record<string, number> = {};
    safeObligations.forEach((o: any) => {
      const s = o.status || 'Unknown';
      complianceStatus[s] = (complianceStatus[s] || 0) + 1;
    });
    const compliancePieChart = Object.entries(complianceStatus).map(([name, value]) => ({ name, value }));

    // ── Invoice status breakdown (pie) ─────────────────────────────
    const invoiceStatus: Record<string, number> = {};
    safeInvoices.forEach((i: any) => {
      const s = i.status || 'Unknown';
      invoiceStatus[s] = (invoiceStatus[s] || 0) + 1;
    });
    const invoicePieChart = Object.entries(invoiceStatus).map(([name, value]) => ({ name, value }));

    return NextResponse.json({
      kpis: {
        totalClients,
        activeServices,
        totalRevenue,
        overdueCount,
        clientGrowthPct,
      },
      charts: {
        clientGrowth: clientGrowthChart,
        revenue: revenueChart,
        serviceType: serviceTypeChart,
        category: categoryPieChart,
        leadFunnel,
        complianceStatus: compliancePieChart,
        invoiceStatus: invoicePieChart,
      },
    });
  } catch (err) {
    console.error('[analytics/summary]', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}
