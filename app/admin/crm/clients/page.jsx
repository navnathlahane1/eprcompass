import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import ClientDirectoryClient from './ClientDirectoryClient';

export default async function ClientDirectoryPage() {
  const supabase = await createServerComponentClient();

  const [clientsRes, managersRes] = await Promise.all([
    supabase
      .from('clients')
      .select('id, profile_id, category, waste_categories, status, assigned_manager_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('id, full_name, company_name, role')
      .in('role', ['admin', 'manager'])
      .order('full_name', { ascending: true })
  ]);

  const clients = clientsRes.data || [];
  const managers = managersRes.data || [];

  const clientIds = clients.map((row) => row.id);
  const profileIds = [...new Set(clients.map((row) => row.profile_id).filter(Boolean))];

  const [servicesRes, paymentsRes, activitiesRes, profileRes] = await Promise.all([
    clientIds.length
      ? supabase
          .from('services')
          .select('id, client_id, service_type, status, due_date')
          .in('client_id', clientIds)
          .order('due_date', { ascending: true })
      : { data: [] },
    clientIds.length
      ? supabase
          .from('payments')
          .select('id, client_id, invoice_no, amount_inr, status')
          .in('client_id', clientIds)
          .neq('status', 'Paid')
          .order('created_at', { ascending: false })
      : { data: [] },
    clientIds.length
      ? supabase
          .from('activities')
          .select('id, entity_id, entity_type, type, note, created_at')
          .eq('entity_type', 'client')
          .in('entity_id', clientIds)
          .order('created_at', { ascending: false })
      : { data: [] },
    profileIds.length
      ? supabase.from('profiles').select('id, company_name').in('id', profileIds)
      : { data: [] }
  ]);

  const servicesByClient = new Map();
  (servicesRes.data || []).forEach((row) => {
    if (!servicesByClient.has(row.client_id)) servicesByClient.set(row.client_id, []);
    servicesByClient.get(row.client_id).push(row);
  });

  const paymentsByClient = new Map();
  (paymentsRes.data || []).forEach((row) => {
    if (!paymentsByClient.has(row.client_id)) paymentsByClient.set(row.client_id, []);
    paymentsByClient.get(row.client_id).push(row);
  });

  const activitiesByClient = new Map();
  (activitiesRes.data || []).forEach((row) => {
    if (!activitiesByClient.has(row.entity_id)) activitiesByClient.set(row.entity_id, []);
    activitiesByClient.get(row.entity_id).push(row);
  });

  const profileById = new Map((profileRes.data || []).map((profile) => [profile.id, profile]));

  const hydratedClients = clients.map((client) => ({
    ...client,
    company_name: profileById.get(client.profile_id)?.company_name || null,
    services: servicesByClient.get(client.id) || [],
    open_payments: paymentsByClient.get(client.id) || [],
    activities: activitiesByClient.get(client.id) || []
  }));

  return <ClientDirectoryClient initialClients={hydratedClients} managers={managers} />;
}
