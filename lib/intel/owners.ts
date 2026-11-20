export type IntelMetricMeta = {
  id: string;
  owner: string;
  drillHref: string;
  source: string;
  playHint: string;
};

export const INTEL_METRICS: Record<string, IntelMetricMeta> = {
  market_share: {
    id: 'market_share',
    owner: 'Head of Sales',
    drillHref: '/intel/cockpit/deals',
    source: 'v_intel_tam_by_segment × v_intel_som_actuals',
    playHint: 'Work the largest untapped state × stream this week',
  },
  untapped_pool: {
    id: 'untapped_pool',
    owner: 'Head of Sales',
    drillHref: '/intel/leads?tier=hot',
    source: 'v_intel_competitor_density',
    playHint: 'Push top untapped companies to telecalling',
  },
  addressable_segments: {
    id: 'addressable_segments',
    owner: 'CSO',
    drillHref: '/intel/cockpit/market',
    source: 'v_intel_tam_by_segment',
    playHint: 'Open a named play for the highest-TAM blank segment',
  },
  penalty_velocity: {
    id: 'penalty_velocity',
    owner: 'Head of Ops',
    drillHref: '/intel/radar',
    source: 'intel_notices (30d vs prior 30d)',
    playHint: 'Call companies with notices in the hottest state',
  },
  recycler_deficit: {
    id: 'recycler_deficit',
    owner: 'Marketplace lead',
    drillHref: '/intel/recyclers',
    source: 'intel_battery_recycler_profiles vs targets',
    playHint: 'Lock capacity in deficit states',
  },
  recycler_surplus: {
    id: 'recycler_surplus',
    owner: 'Marketplace lead',
    drillHref: '/intel/recyclers',
    source: 'intel_battery_recycler_profiles vs targets',
    playHint: 'Partner or offtake surplus capacity',
  },
  stalled_deals: {
    id: 'stalled_deals',
    owner: 'Head of Sales',
    drillHref: '/intel/cockpit/deals',
    source: 'intel_pipeline_records.warmness_stage',
    playHint: 'Re-open stalled pipeline in telecalling',
  },
  expiring_auth: {
    id: 'expiring_auth',
    owner: 'Head of Ops',
    drillHref: '/intel/expirations',
    source: 'recycler CPCB/state authorizations',
    playHint: 'Renewal outreach before expiry',
  },
};

export function metricMeta(id: string): IntelMetricMeta {
  return (
    INTEL_METRICS[id] || {
      id,
      owner: 'Intel team',
      drillHref: '/intel/cockpit',
      source: 'intel_*',
      playHint: 'Create a cockpit task',
    }
  );
}
