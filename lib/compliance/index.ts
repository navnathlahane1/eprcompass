import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/packages/db/types';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

import { sumMassTonnes, assertNonOverlappingLiabilities } from './quantities';

type RiskLevel = 'Low' | 'Medium' | 'High';

type ObligationResult = {
  obligated_mt: number;
  fulfilled_mt: number;
  gap_mt: number;
  credits_required: null;
  credits_held: null;
  risk_level: RiskLevel;
};

type ComplianceScoreResult = {
  score: number;
  risk: RiskLevel;
  flags: string[];
};

type DeadlineItem = {
  client_id: string;
  client_profile_id: string;
  client_name: string;
  service_id: string;
  service_type: Database['public']['Enums']['service_type'];
  due_date: string;
  status: Database['public']['Enums']['service_status'];
  days_left: number;
};

function parseFinancialYear(fy: string): { start: string; end: string } {
  const parts = fy.split('-');
  const startYear = Number(parts[0]);
  const endYear = Number(parts[1]?.length === 2 ? `20${parts[1]}` : parts[1]);

  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    const year = new Date().getUTCFullYear();
    return { start: `${year}-04-01`, end: `${year + 1}-03-31` };
  }

  return {
    start: `${startYear}-04-01`,
    end: `${endYear}-03-31`
  };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function riskFromScore(score: number): RiskLevel {
  if (score >= 75) return 'Low';
  if (score >= 45) return 'Medium';
  return 'High';
}

export async function calculateObligation(
  clientId: string,
  wasteCategory: Database['public']['Enums']['waste_category'],
  fy: string,
  supabaseArg?: SupabaseClient<Database>
): Promise<ObligationResult> {
  const supabase = supabaseArg ?? (await createServerComponentClient());
  const { start, end } = parseFinancialYear(fy);
  if (!/^\d{4}-(\d{2}|\d{4})$/.test(fy) || Number(end.slice(0, 4)) !== Number(start.slice(0, 4)) + 1) {
    throw new Error('Invalid financial year');
  }
  const normalizedYear = `${start.slice(0, 4)}-${end.slice(2, 4)}`;
  const categories: Record<string, string> = { Plastic: 'PLASTIC', 'E-Waste': 'EWASTE', Battery: 'BATTERY', Tyre: 'TYRE', Oil: 'USED_OIL' };
  const category = categories[wasteCategory];
  if (!category) throw new Error('Unsupported category');
  // These quantity tables reference profiles, whereas this helper accepts a clients.id.
  const db = supabase as SupabaseClient;
  const client = await db.from('clients').select('profile_id').eq('id', clientId).maybeSingle();
  if (client.error || !client.data?.profile_id) throw new Error('Client quantity scope unavailable');
  const [liabilities, fulfillments] = await Promise.all([
    db.from('epr_liabilities').select('liability_qty, unit, state, product_type')
      .eq('client_id', client.data.profile_id).eq('epr_type', category).eq('financial_year', normalizedYear),
    db.from('epr_fulfillments').select('fulfilled_qty, unit, state, product_type')
      .eq('client_id', client.data.profile_id).eq('epr_type', category).eq('financial_year', normalizedYear),
  ]);
  if (liabilities.error || fulfillments.error) throw new Error('Quantity records unavailable');
  if (!liabilities.data?.length) throw new Error('No obligation baseline recorded');
  const liabilityRows = liabilities.data.map(row => ({ ...row, quantity: row.liability_qty }));
  assertNonOverlappingLiabilities(liabilityRows);
  const obligated_mt = sumMassTonnes(liabilityRows);
  const fulfilled_mt = sumMassTonnes((fulfillments.data || []).map(row => ({ ...row, quantity: row.fulfilled_qty })));
  const gap_mt = Math.max(0, obligated_mt - fulfilled_mt);
  // Recorded fulfillment is not a certificate holding or an authority-approved credit allocation.
  return {
    obligated_mt, fulfilled_mt, gap_mt, credits_required: null, credits_held: null,
    risk_level: gap_mt === 0 ? 'Low' : fulfilled_mt >= obligated_mt / 2 ? 'Medium' : 'High',
  };
}

export async function getComplianceScore(
  clientId: string,
  supabaseArg?: SupabaseClient<Database>
): Promise<ComplianceScoreResult> {
  const supabase = supabaseArg ?? (await createServerComponentClient());

  const [{ data: services, error: servicesError }, { data: documents, error: docsError }] = await Promise.all([
    supabase.from('services').select('id, status, due_date').eq('client_id', clientId),
    supabase.from('documents').select('id, status').eq('client_id', clientId)
  ]);

  if (servicesError) throw servicesError;
  if (docsError) throw docsError;

  const serviceRows = services ?? [];
  const docRows = documents ?? [];

  const now = new Date();
  const upcomingDue = serviceRows
    .map((row) => row.due_date)
    .filter(Boolean)
    .map((dueDate) => new Date(`${dueDate}T00:00:00Z`))
    .filter((date) => date.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const daysToDeadline = upcomingDue
    ? Math.max(0, Math.ceil((upcomingDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 30;

  const deadlineScore = clampScore((daysToDeadline / 30) * 100);

  const fulfilledCount = serviceRows.filter((row) => row.status === 'Filed' || row.status === 'Approved').length;
  const fulfilledPct = serviceRows.length === 0 ? 100 : (fulfilledCount / serviceRows.length) * 100;

  const docsCompleteCount = docRows.filter((row) => row.status === 'Verified').length;
  const docsCompletePct = docRows.length === 0 ? 100 : (docsCompleteCount / docRows.length) * 100;

  const score = clampScore(deadlineScore * 0.4 + fulfilledPct * 0.4 + docsCompletePct * 0.2);

  const flags: string[] = [];
  const hasOverdue = serviceRows.some((row) => {
    if (!row.due_date) return false;
    return new Date(`${row.due_date}T00:00:00Z`) < now && row.status !== 'Approved' && row.status !== 'Filed';
  });

  if (hasOverdue) flags.push('Overdue filing(s) detected');
  if (fulfilledPct < 60) flags.push('Fulfillment rate below 60%');
  if (docsCompletePct < 80) flags.push('Documentation incomplete');

  return {
    score,
    risk: riskFromScore(score),
    flags
  };
}

export async function getUpcomingDeadlines(
  managerId: string | null,
  days = 30,
  supabaseArg?: SupabaseClient<Database>
): Promise<DeadlineItem[]> {
  const supabase = supabaseArg ?? (await createServerComponentClient());

  const now = new Date();
  const upper = new Date(now);
  upper.setDate(upper.getDate() + days);

  let clientIds: string[] | null = null;

  if (managerId) {
    const { data: managerClients, error } = await supabase
      .from('clients')
      .select('id')
      .eq('assigned_manager_id', managerId);

    if (error) throw error;
    clientIds = (managerClients ?? []).map((row) => row.id);
    if (clientIds.length === 0) return [];
  }

  let servicesQuery = supabase
    .from('services')
    .select('id, client_id, due_date, status, service_type')
    .gte('due_date', now.toISOString().slice(0, 10))
    .lte('due_date', upper.toISOString().slice(0, 10))
    .order('due_date', { ascending: true });

  if (clientIds) {
    servicesQuery = servicesQuery.in('client_id', clientIds);
  }

  const { data: services, error: servicesError } = await servicesQuery;
  if (servicesError) throw servicesError;

  const serviceRows = services ?? [];
  if (serviceRows.length === 0) return [];

  const uniqueClientIds = [...new Set(serviceRows.map((row) => row.client_id))];

  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, profile_id')
    .in('id', uniqueClientIds);

  if (clientError) throw clientError;

  const profileIds = [...new Set((clients ?? []).map((row) => row.profile_id))];

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, company_name, full_name')
    .in('id', profileIds);

  if (profileError) throw profileError;

  const clientById = new Map((clients ?? []).map((row) => [row.id, row]));
  const profileById = new Map((profiles ?? []).map((row) => [row.id, row]));

  const result: DeadlineItem[] = serviceRows
    .filter((row) => Boolean(row.due_date))
    .map((row) => {
      const client = clientById.get(row.client_id);
      const profile = client ? profileById.get(client.profile_id) : undefined;
      const clientName = profile?.company_name || profile?.full_name || 'Client';

      const dueDate = row.due_date as string;
      const daysLeft = Math.ceil(
        (new Date(`${dueDate}T00:00:00Z`).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        client_id: row.client_id,
        client_profile_id: client?.profile_id ?? '',
        client_name: clientName,
        service_id: row.id,
        service_type: row.service_type,
        due_date: dueDate,
        status: row.status,
        days_left: Math.max(daysLeft, 0)
      };
    })
    .sort((a, b) => a.days_left - b.days_left);

  return result;
}

export async function generateDeadlineAlerts(
  supabaseArg?: SupabaseClient<Database>
): Promise<{ inserted: number }> {
  const supabase = supabaseArg ?? (await createServerComponentClient());
  const deadlines = await getUpcomingDeadlines(null, 14, supabase);

  if (deadlines.length === 0) {
    return { inserted: 0 };
  }

  const payload = deadlines
    .filter((item) => Boolean(item.client_profile_id))
    .map((item) => ({
      profile_id: item.client_profile_id,
      type: 'deadline_alert',
      message: `${item.service_type} filing due on ${item.due_date} (${item.days_left} day(s) left).`,
      read: false
    }));

  if (payload.length === 0) {
    return { inserted: 0 };
  }

  const { error } = await (supabase as unknown as {
    from: (table: string) => {
      insert: (rows: Array<{ profile_id: string; type: string; message: string; read: boolean }>) => Promise<{ error: Error | null }>;
    };
  })
    .from('notifications')
    .insert(payload);

  if (error) throw error;

  return { inserted: payload.length };
}
