import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { redirect } from 'next/navigation';
import OnboardingAdminClient from './OnboardingAdminClient';
import Link from 'next/link';

export default async function AdminOnboardingPage() {
  const supabase = await createServerComponentClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!['admin', 'manager'].includes(profile?.role || '')) redirect('/admin/dashboard');

  const [{ data: checklists }, { data: clients }, { data: recyclers }, { data: cepc }, { data: partners }] = await Promise.all([
    (supabase as any)
      .from('onboarding_checklists')
      .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(200),
    (supabase as any).from('clients').select('id, profile_id'),
    (supabase as any).from('recyclers').select('id, company_name, contact_person'),
    (supabase as any).from('cepc_consultants').select('id, full_name'),
    (supabase as any).from('partners').select('id, company_name, contact_person'),
  ]);

  const profileIds = [...new Set((clients || []).map((c: any) => c.profile_id).filter(Boolean))];
  const { data: profiles } = profileIds.length
    ? await (supabase as any).from('profiles').select('id, full_name, company_name').in('id', profileIds)
    : { data: [] as any[] };

  const profileMap = new Map<string, any>((profiles || []).map((p: any) => [p.id, p]));
  const clientMap = new Map<string, string>((clients || []).map((c: any) => {
    const p = profileMap.get(c.profile_id);
    return [c.id, p?.company_name || p?.full_name || c.id];
  }));

  const nameFor = (entityType: string, entityId: string) => {
    if (entityType === 'client') return clientMap.get(entityId) || entityId;
    if (entityType === 'recycler') {
      const r = (recyclers || []).find((x: any) => x.id === entityId);
      return r?.company_name || r?.contact_person || entityId;
    }
    if (entityType === 'cepc') {
      const c = (cepc || []).find((x: any) => x.id === entityId);
      return c?.full_name || entityId;
    }
    if (entityType === 'partner') {
      const p = (partners || []).find((x: any) => x.id === entityId);
      return p?.company_name || p?.contact_person || entityId;
    }
    return entityId;
  };

  const rows = (checklists || []).map((c: any) => ({
    ...c,
    entity_name: nameFor(c.entity_type, c.entity_id),
  }));

  return <><Link href="/admin/registrations" className="m-5 inline-block text-sm font-semibold text-emerald-600">Review new registrations</Link><Link href="/admin/growth" className="m-5 inline-block text-sm font-semibold text-emerald-600">Service journey metrics</Link><OnboardingAdminClient initialRows={rows} currentUserId={user.id} /></>;
}
