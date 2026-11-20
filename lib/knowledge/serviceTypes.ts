// EPR service types a Knowledge category can be tagged with (mirrors
// the `service_type` values used for client services/billing elsewhere
// in the app — kept as a separate literal list here since the two
// domains are decoupled at the DB level).
export const KNOWLEDGE_SERVICE_TYPES = [
  'Registration',
  'Filing',
  'Renewal',
  'Certificate',
  'Consulting',
] as const;

export type KnowledgeServiceType = (typeof KNOWLEDGE_SERVICE_TYPES)[number];

export function isKnowledgeServiceType(value: unknown): value is KnowledgeServiceType {
  return typeof value === 'string' && (KNOWLEDGE_SERVICE_TYPES as readonly string[]).includes(value);
}
