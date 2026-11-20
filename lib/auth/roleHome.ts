/**
 * Single map of profile.role → home path after login.
 * Used by /login, /dashboard, and portal-specific forms.
 */

const ROLE_HOME: Record<string, string> = {
  admin: '/admin/dashboard',
  manager: '/admin/dashboard',
  'sales-executive': '/admin/dashboard',
  'epr-executive': '/admin/dashboard',
  operator: '/admin/dashboard',
  'hr-executive': '/admin/dashboard',
  'training-executive': '/admin/dashboard',
  client: '/portal/dashboard',
  partner: '/partner/dashboard',
  cepc: '/cepc/dashboard',
  recycler: '/recycler-portal/dashboard',
  legal: '/legal-portal/dashboard',
  compliance_manager: '/legal-portal/dashboard',
  user_manager: '/iam/dashboard',
  viewer: '/account/workspaces',
  cfo: '/finance/dashboard',
  finance_executive: '/finance/dashboard',
  academy_director: '/academy/dashboard',
  academy_manager: '/academy/dashboard',
  training_program_manager: '/academy/dashboard',
  trainer: '/academy/dashboard',
  guest_trainer: '/academy/dashboard',
  partner_trainer: '/academy/dashboard',
  learner: '/academy/dashboard',
  task_manager: '/taskmanager/dashboard',
  tendering_manager: '/tendering/dashboard',
  tendering_executive: '/tendering/dashboard',
  telecaller: '/telecalling/dashboard',
  tc_team_lead: '/telecalling/dashboard',
  tc_senior_agent: '/telecalling/dashboard',
  tc_quality_analyst: '/telecalling/dashboard',
  tc_campaign_manager: '/telecalling/dashboard',
  tc_trainer: '/telecalling/dashboard',
  lead_gen_executive: '/telecalling/dashboard',
  appointment_setter: '/telecalling/dashboard',
  crm_data_executive: '/telecalling/dashboard',
  customer_support_executive: '/telecalling/dashboard',
  knowledge_admin: '/knowledge/dashboard',
  knowledge_manager: '/knowledge/dashboard',
  knowledge_contributor: '/knowledge/dashboard',
  knowledge_viewer: '/knowledge/dashboard',
  virtual_assistant: '/ops/dashboard',
  proposal_executive: '/ops/dashboard',
  compliance_doc_executive: '/ops/dashboard',
  market_research_executive: '/ops/dashboard',
  mis_reporting_executive: '/ops/dashboard',
};

export function getRoleHomePath(role?: string | null, email?: string | null): string {
  const superAdmins = [
    process.env.SUPER_ADMIN_EMAILS,
    process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .join(',')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  if (email && superAdmins.includes(String(email).trim().toLowerCase())) {
    return '/admin/dashboard';
  }

  const key = String(role || '').toLowerCase();
  if (key.startsWith('comms_')) return '/comms/dashboard';
  return ROLE_HOME[key] || '/login';
}
