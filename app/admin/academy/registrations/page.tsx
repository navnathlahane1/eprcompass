import RegistrationsClient from './RegistrationsClient';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export default async function RegistrationsPage() {
  const supabase = await createServerComponentClient();

  const [{ data: registrations }, { data: sessions }] = await Promise.all([
    (supabase as any)
      .from('registrations')
      .select('id, session_id, profile_id, name, email, phone, company, gstin, payment_status, amount_paid_inr, payment_ref, registered_at, attended, certificate_issued, certificate_url, training_sessions!inner(id, session_date, start_time, training_programs!inner(title))')
      .order('registered_at', { ascending: false }),
    (supabase as any)
      .from('training_sessions')
      .select('id, session_date, start_time, training_programs!inner(title)')
      .order('session_date', { ascending: false })
      .order('start_time', { ascending: false })
  ]);

  return <RegistrationsClient initialRows={registrations || []} sessionOptions={sessions || []} />;
}
