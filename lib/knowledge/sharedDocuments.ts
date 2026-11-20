export const TELECALLING_DOCUMENT_ROLES = [
  'telecaller',
  'tc_team_lead',
  'tc_senior_agent',
  'tc_quality_analyst',
  'tc_campaign_manager',
  'tc_trainer',
  'lead_gen_executive',
  'appointment_setter',
  'crm_data_executive',
  'customer_support_executive',
] as const;

export function canManageKnowledgeShares(role: string): boolean {
  return role === 'admin' || role === 'manager' || role === 'knowledge_admin';
}

export function isTelecallingDocumentRole(role: string): boolean {
  return TELECALLING_DOCUMENT_ROLES.includes(role as typeof TELECALLING_DOCUMENT_ROLES[number]);
}
