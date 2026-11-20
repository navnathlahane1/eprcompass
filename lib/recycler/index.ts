import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/packages/db/types';

type RiskFlag = 'None' | 'Low' | 'Medium' | 'High';

type RiskResult = {
  recyclerId: string;
  riskFlag: RiskFlag;
  riskReason: string;
  reasons: string[];
};

function getServiceClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function daysUntil(dateLike?: string | null): number {
  if (!dateLike) return Number.POSITIVE_INFINITY;
  const now = new Date();
  const dt = new Date(`${dateLike}T00:00:00Z`);
  return Math.ceil((dt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function pickRiskFlag(hasHigh: boolean, hasMedium: boolean, hasLow: boolean): RiskFlag {
  if (hasHigh) return 'High';
  if (hasMedium) return 'Medium';
  if (hasLow) return 'Low';
  return 'None';
}

export async function computeRiskScore(
  recyclerId: string,
  supabaseArg?: SupabaseClient<Database>
): Promise<RiskResult> {
  const supabase = supabaseArg ?? getServiceClient();

  const { data: recycler, error: recyclerError } = await (supabase as any)
    .from('recyclers')
    .select('id, capacity_mt_pa, cpcb_cert_expiry, risk_flag, risk_reason')
    .eq('id', recyclerId)
    .maybeSingle();

  if (recyclerError) throw recyclerError;
  if (!recycler) {
    throw new Error(`Recycler not found: ${recyclerId}`);
  }

  const [{ data: latestCapacity }, { data: creditAgg }, { data: lastActivity }] = await Promise.all([
    (supabase as any)
      .from('recycler_capacity_log')
      .select('utilization_pct, month')
      .eq('recycler_id', recyclerId)
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle(),
    (supabase as any)
      .from('epr_credits')
      .select('quantity_mt')
      .eq('recycler_id', recyclerId)
      .in('status', ['Issued', 'Transferred', 'Used']),
    (supabase as any)
      .from('activities')
      .select('created_at')
      .eq('entity_type', 'recycler')
      .eq('entity_id', recyclerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  const reasons: string[] = [];
  const highReasons: string[] = [];
  const mediumReasons: string[] = [];
  const lowReasons: string[] = [];

  const utilizationPct = Number(latestCapacity?.utilization_pct || 0);
  if (utilizationPct > 90) {
    highReasons.push(`Utilization ${utilizationPct.toFixed(1)}% exceeds 90% threshold`);
  }

  const certDays = daysUntil(recycler.cpcb_cert_expiry || null);
  if (certDays < 30) {
    mediumReasons.push(`CPCB certificate expires in ${Math.max(certDays, 0)} day(s)`);
  }

  const issuedCredits = (creditAgg || []).reduce((sum: number, row: any) => sum + Number(row.quantity_mt || 0), 0);
  const annualCapacity = Number(recycler.capacity_mt_pa || 0);
  if (annualCapacity > 0 && issuedCredits > annualCapacity * 3) {
    highReasons.push(
      `Issued credits ${issuedCredits.toFixed(2)} MT exceed 3x annual capacity ${annualCapacity.toFixed(2)} MT`
    );
  }

  const lastActivityAt = lastActivity?.created_at ? new Date(lastActivity.created_at) : null;
  const inactiveDays = lastActivityAt
    ? Math.floor((Date.now() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
    : Number.POSITIVE_INFINITY;

  if (inactiveDays >= 60) {
    lowReasons.push(
      Number.isFinite(inactiveDays)
        ? `No recycler activity in ${inactiveDays} day(s)`
        : 'No recycler activity recorded yet'
    );
  }

  reasons.push(...highReasons, ...mediumReasons, ...lowReasons);

  const riskFlag = pickRiskFlag(highReasons.length > 0, mediumReasons.length > 0, lowReasons.length > 0);
  const riskReason = reasons.length > 0 ? reasons.join('; ') : 'No risk signals detected';

  if (recycler.risk_flag !== riskFlag || (recycler.risk_reason || '') !== riskReason) {
    const { error: updateError } = await (supabase as any)
      .from('recyclers')
      .update({ risk_flag: riskFlag, risk_reason: riskReason })
      .eq('id', recyclerId);

    if (updateError) throw updateError;
  }

  return {
    recyclerId,
    riskFlag,
    riskReason,
    reasons
  };
}

export async function scheduleRecyclerRiskScan(
  supabaseArg?: SupabaseClient<Database>
): Promise<{ scanned: number; updated: number; items: RiskResult[] }> {
  const supabase = supabaseArg ?? getServiceClient();

  const { data: recyclers, error } = await (supabase as any)
    .from('recyclers')
    .select('id')
    .eq('status', 'Active');

  if (error) throw error;

  const ids = (recyclers || []).map((r: any) => r.id);
  const items: RiskResult[] = [];

  for (const id of ids) {
    const result = await computeRiskScore(id, supabase);
    items.push(result);
  }

  return {
    scanned: ids.length,
    updated: items.length,
    items
  };
}
