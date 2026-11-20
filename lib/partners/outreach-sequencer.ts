import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export type OutreachTarget = {
  id: string;
  company_name: string;
  city: string | null;
  partner_type: string;
  contact_person: string | null;
  email: string | null;
  phone_primary: string | null;
  priority_score: number | null;
  data_completeness_score: number | null;
  outreach_attempt_count: number | null;
  last_outreach_date: string | null;
  outreach_response: string | null;
  epr_pitch_status: string | null;
  stage: string;
  outreach_score: number;
};

function calculateOutreachScore(row: any): number {
  const priorityScore = Number(row.priority_score || 0);
  const completeness = Number(row.data_completeness_score || 0);
  const attempts = Number(row.outreach_attempt_count || 0);

  return (
    priorityScore * 3 +
    completeness / 10 +
    (attempts === 0 ? 20 : 0) -
    attempts * 5
  );
}

export async function getTopOutreachTargets(limit = 50): Promise<OutreachTarget[]> {
  const supabase = await createServerComponentClient();

  let data: any[] = [];

  const primary = await (supabase as any)
    .from('partners')
    .select(
      'id, company_name, city, partner_type, contact_person, email, phone_primary, priority_score, data_completeness_score, outreach_attempt_count, last_outreach_date, outreach_response, epr_pitch_status, stage, outreach_tier, has_email'
    )
    .eq('outreach_tier', 'Hot')
    .eq('epr_pitch_status', 'Not Pitched')
    .eq('has_email', true)
    .in('stage', ['Not Contacted', 'First Contact'])
    .limit(Math.max(1, Math.min(limit, 500)));

  if (!primary.error) {
    data = primary.data || [];
  } else {
    const fallback = await (supabase as any)
      .from('partners')
      .select('id, company_name, city, partner_type, contact_person, email, stage, outreach_tier')
      .in('stage', ['Not Contacted', 'First Contact'])
      .limit(Math.max(1, Math.min(limit * 3, 1000)));

    if (fallback.error) {
      return [];
    }

    data = (fallback.data || [])
      .filter((row: any) => row.outreach_tier === 'Hot' && Boolean(row.email))
      .slice(0, Math.max(1, Math.min(limit, 500)))
      .map((row: any) => ({
        ...row,
        phone_primary: null,
        priority_score: 0,
        data_completeness_score: 0,
        outreach_attempt_count: 0,
        last_outreach_date: null,
        outreach_response: 'No Response',
        epr_pitch_status: 'Not Pitched',
        has_email: Boolean(row.email)
      }));
  }

  const rows = (data || []).map((row: any) => ({
    ...row,
    outreach_score: calculateOutreachScore(row)
  }));

  return rows.sort((a: any, b: any) => b.outreach_score - a.outreach_score);
}
