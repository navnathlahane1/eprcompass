export const EPR_STREAMS = [
  { id: 'plastic', label: 'Plastic' },
  { id: 'e_waste', label: 'E-waste' },
  { id: 'battery', label: 'Battery' },
  { id: 'tyre', label: 'Tyre' },
  { id: 'used_oil', label: 'Used oil' },
  { id: 'elv', label: 'ELV' },
  { id: 'cd', label: 'C&D' },
  { id: 'non_ferrous', label: 'Non-ferrous' },
] as const;

export const ENTITY_ROLES = [
  { id: 'producer', label: 'Producer' },
  { id: 'importer', label: 'Importer' },
  { id: 'brand_owner', label: 'Brand owner' },
  { id: 'recycler', label: 'Recycler' },
  { id: 'pro', label: 'PRO' },
  { id: 'aggregator', label: 'Aggregator' },
  { id: 'dismantler', label: 'Dismantler' },
  { id: 'refurbisher', label: 'Refurbisher' },
  { id: 'other', label: 'Other' },
] as const;

export type IntelDossier = {
  company: {
    id: string;
    entity_roles: string[];
    iec: string | null;
    udyam: string | null;
    whatsapp: string | null;
    phone: string | null;
    email: string | null;
    cpcb_portal_id: string | null;
    job_worker_liable: boolean | null;
    marketplace_seller_ids: Record<string, string>;
    parent_company_id: string | null;
  };
  obligations: Record<string, unknown>[];
  authorizations: Record<string, unknown>[];
  stream_profiles: Record<string, unknown>[];
  pro_agreements: Record<string, unknown>[];
  credit_purchases: Record<string, unknown>[];
  documents: Record<string, unknown>[];
};
