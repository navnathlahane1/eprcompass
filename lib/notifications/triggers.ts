import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/packages/db/types';
import { reminderDeliveryKey } from './deliveryKey';
import { reminderPeriod } from './reminderPeriod';

type NotificationPayload = {
  profile_id: string;
  type: 'deadline' | 'payment' | 'document' | 'regulatory' | 'system';
  message: string;
  link?: string | null;
  read?: boolean;
  resource_id: string;
};

function getServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

async function insertNotifications(
  supabase: SupabaseClient<Database>,
  rows: NotificationPayload[]
): Promise<number> {
  if (rows.length === 0) return 0;

  const { data: preferences, error: preferencesError } = await (supabase as SupabaseClient).from('service_reminder_preferences').select('user_id,cadence').in('user_id', [...new Set(rows.map(row => row.profile_id))]);
  if (preferencesError) throw preferencesError;
  const cadence = new Map((preferences ?? []).map(row => [row.user_id, row.cadence]));
  const now = new Date();
  const deliveryRows = rows.flatMap(({ resource_id, ...row }) => {
    const period = reminderPeriod(cadence.get(row.profile_id) ?? 'daily', now);
    return period ? [{ ...row, delivery_key: reminderDeliveryKey(row.profile_id, row.type, resource_id, period) }] : [];
  });
  const deduped = [...new Map(deliveryRows.map(row => [row.delivery_key, row])).values()];
  if (!deduped.length) return 0;

  const { data, error } = await (supabase as SupabaseClient)
    .from('notifications')
    .upsert(deduped, { onConflict: 'delivery_key', ignoreDuplicates: true }).select('id');

  if (error) throw error;
  return data?.length ?? 0;
}

export async function onPaymentOverdue(
  supabaseArg?: SupabaseClient<Database>
): Promise<number> {
  const supabase = supabaseArg ?? getServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: invoices, error } = await (supabase as unknown as {
    from: (table: string) => {
      select: (cols: string) => {
        neq: (k: string, v: string) => {
          lt: (k2: string, v2: string) => Promise<{ data: Array<{ id: string; client_id: string; invoice_no: string; due_date: string }> | null; error: Error | null }>;
        };
      };
    };
  })
    .from('invoices')
    .select('id, client_id, invoice_no, due_date, status')
    .neq('status', 'Paid')
    .lt('due_date', today);

  if (error) throw error;
  const overdue = invoices ?? [];
  if (overdue.length === 0) return 0;

  const clientIds = [...new Set(overdue.map((i) => i.client_id))];
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, profile_id, assigned_manager_id')
    .in('id', clientIds);

  if (clientError) throw clientError;
  const clientsById = new Map((clients ?? []).map((c) => [c.id, c]));

  const payload: NotificationPayload[] = [];
  for (const inv of overdue) {
    const client = clientsById.get(inv.client_id);
    if (!client) continue;

    const msg = `Invoice ${inv.invoice_no} is overdue since ${inv.due_date}.`;
    const link = `/admin/billing/${inv.id}`;

    if (client.profile_id) payload.push({ profile_id: client.profile_id, type: 'payment', message: msg, link: '/portal/payments', read: false, resource_id: inv.id });
    if (client.assigned_manager_id) payload.push({ profile_id: client.assigned_manager_id, type: 'payment', message: msg, link, read: false, resource_id: inv.id });
  }

  return insertNotifications(supabase, payload);
}

export async function onDeadlineApproaching(
  days = 14,
  supabaseArg?: SupabaseClient<Database>
): Promise<number> {
  const supabase = supabaseArg ?? getServiceClient();
  const today = new Date();
  const upper = new Date(today);
  upper.setDate(upper.getDate() + days);

  const lowerDate = today.toISOString().slice(0, 10);
  const upperDate = upper.toISOString().slice(0, 10);

  const { data: services, error } = await supabase
    .from('services')
    .select('id, client_id, service_type, due_date, status')
    .gte('due_date', lowerDate)
    .lte('due_date', upperDate)
    .not('status', 'in', '(Approved,Filed)');

  if (error) throw error;
  const rows = services ?? [];
  if (rows.length === 0) return 0;

  const clientIds = [...new Set(rows.map((s) => s.client_id))];
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, profile_id, assigned_manager_id')
    .in('id', clientIds);

  if (clientError) throw clientError;
  const clientsById = new Map((clients ?? []).map((c) => [c.id, c]));

  const payload: NotificationPayload[] = [];
  for (const row of rows) {
    const client = clientsById.get(row.client_id);
    if (!client) continue;

    const msg = `${row.service_type} deadline is approaching on ${row.due_date}.`;
    const link = `/portal/filings`;

    if (client.profile_id) payload.push({ profile_id: client.profile_id, type: 'deadline', message: msg, link, read: false, resource_id: row.id });
    if (client.assigned_manager_id) payload.push({ profile_id: client.assigned_manager_id, type: 'deadline', message: msg, link: '/admin/crm/clients', read: false, resource_id: row.id });
  }

  return insertNotifications(supabase, payload);
}

export async function onDocumentExpiring(
  days = 30,
  supabaseArg?: SupabaseClient<Database>
): Promise<number> {
  const supabase = supabaseArg ?? getServiceClient();
  const today = new Date();
  const upper = new Date(today);
  upper.setDate(upper.getDate() + days);

  const lowerDate = today.toISOString().slice(0, 10);
  const upperDate = upper.toISOString().slice(0, 10);

  const { data: docs, error } = await supabase
    .from('documents')
    .select('id, client_id, doc_type, expiry_date, status')
    .gte('expiry_date', lowerDate)
    .lte('expiry_date', upperDate)
    .neq('status', 'Expired');

  if (error) throw error;
  const rows = docs ?? [];
  if (rows.length === 0) return 0;

  const clientIds = [...new Set(rows.map((d) => d.client_id))];
  const { data: clients, error: clientError } = await supabase
    .from('clients')
    .select('id, profile_id, assigned_manager_id')
    .in('id', clientIds);

  if (clientError) throw clientError;
  const clientsById = new Map((clients ?? []).map((c) => [c.id, c]));

  const payload: NotificationPayload[] = [];
  for (const row of rows) {
    const client = clientsById.get(row.client_id);
    if (!client) continue;

    const msg = `Document ${row.doc_type} expires on ${row.expiry_date}.`;

    if (client.profile_id) payload.push({ profile_id: client.profile_id, type: 'document', message: msg, link: '/portal/documents', read: false, resource_id: row.id });
    if (client.assigned_manager_id) payload.push({ profile_id: client.assigned_manager_id, type: 'document', message: msg, link: '/admin/crm/clients', read: false, resource_id: row.id });
  }

  return insertNotifications(supabase, payload);
}

export async function scheduleAll(
  supabaseArg?: SupabaseClient<Database>
): Promise<{ triggered: number; details: { overdue: number; deadlines: number; documents: number } }> {
  const supabase = supabaseArg ?? getServiceClient();

  const [overdue, deadlines, documents] = await Promise.all([
    onPaymentOverdue(supabase),
    onDeadlineApproaching(14, supabase),
    onDocumentExpiring(30, supabase)
  ]);

  return {
    triggered: overdue + deadlines + documents,
    details: { overdue, deadlines, documents }
  };
}
