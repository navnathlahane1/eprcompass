import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import BulkFilingPageClient from './BulkFilingPageClient';

export default async function BulkFilingPage() {
  const supabase = await createServerComponentClient();

  const [{ data: clients }, { data: services }, { data: docs }] = await Promise.all([
    (supabase as any)
      .from('clients')
      .select('id, profile_id, category, status'),
    (supabase as any)
      .from('services')
      .select('id, client_id, service_type, waste_category, status, due_date, filed_date')
      .order('created_at', { ascending: false }),
    (supabase as any)
      .from('documents')
      .select('id, client_id, status')
  ]);

  const profileIds = [...new Set((clients || []).map((c: any) => c.profile_id).filter(Boolean))];
  const { data: profiles } = profileIds.length
    ? await (supabase as any).from('profiles').select('id, company_name, full_name, state').in('id', profileIds)
    : { data: [] as any[] };

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));

  const serviceByClient = new Map<string, any[]>();
  (services || []).forEach((row: any) => {
    if (!serviceByClient.has(row.client_id)) serviceByClient.set(row.client_id, []);
    serviceByClient.get(row.client_id)?.push(row);
  });

  const docsByClient = new Map<string, any[]>();
  (docs || []).forEach((row: any) => {
    if (!docsByClient.has(row.client_id)) docsByClient.set(row.client_id, []);
    docsByClient.get(row.client_id)?.push(row);
  });

  const rows = (clients || []).map((client: any) => {
    const profile = profileMap.get(client.profile_id);
    const clientServices = serviceByClient.get(client.id) || [];
    const lastFiled = clientServices.find((s: any) => s.filed_date || s.status === 'Filed') || null;
    return {
      id: client.id,
      name: profile?.company_name || profile?.full_name || client.id,
      state: profile?.state || null,
      category: client.category,
      status: client.status,
      last_filed: lastFiled?.filed_date || null,
      services: clientServices,
      documents: docsByClient.get(client.id) || []
    };
  });

  return <BulkFilingPageClient clientRows={rows} />;
}
