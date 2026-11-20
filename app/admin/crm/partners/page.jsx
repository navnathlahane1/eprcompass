import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import PartnerPipelineClient from './PartnerPipelineClient';

export default async function PartnerPipelinePage() {
  const supabase = await createServerComponentClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // CHANGED: pull richer partner profile fields for directory filters/table/expanded panel.
  const [partnersRes, activitiesRes] = await Promise.all([
    supabase
      .from('partners')
      .select(
        'id, company_name, partner_type, outreach_tier, stage, agreement_signed, kit_sent, training_completed, portal_access, city, contact_person, contact_person_2, contact_person_3, email, email_2, email_3, phone_primary, phone_secondary, phone_tertiary, has_email, epr_pitch_status, data_source, priority_score, data_completeness_score, outreach_attempt_count, last_outreach_date, outreach_response, best_time_to_call, epr_awareness_level, potential_client_referrals, key_ports, cargo_types, outreach_channel_preference'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('activities')
      .select('id, entity_type, entity_id, type, note, outcome, created_at, done_by')
      .eq('entity_type', 'partner')
      .order('created_at', { ascending: false })
      .limit(200)
  ]);

  return (
    <PartnerPipelineClient
      initialPartners={partnersRes.data || []}
      initialActivities={activitiesRes.data || []}
      currentUserId={user?.id || null}
      // CHANGED: expose quick links for bulk import and outreach sequencer.
      quickLinks={{
        importUrl: '/admin/partners/import',
        outreachUrl: '/admin/partners/outreach'
      }}
    />
  );
}
