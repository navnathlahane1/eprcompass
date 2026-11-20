// Global Compliance Knowledge System — TypeScript types

export type FilingType =
  | 'registration'
  | 'renewal'
  | 'quarterly_return'
  | 'half_yearly_return'
  | 'annual_return'
  | 'data_submission'
  | 'fee_payment'
  | 'audit_submission'
  | 'one_time';

export type CycleType =
  | 'monthly'
  | 'quarterly'
  | 'half_yearly'
  | 'annual'
  | 'multi_year'
  | 'one_time';

export type TaskType =
  | 'filing'
  | 'document_upload'
  | 'renewal'
  | 'registration'
  | 'data_submission'
  | 'fee_payment'
  | 'audit'
  | 'review'
  | 'other';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'waived' | 'blocked';
export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type FilingStatus = 'pending' | 'in_progress' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'overdue' | 'waived';
export type ClientComplianceStatus = 'active' | 'suspended' | 'completed' | 'pending';
export type DocumentStatus = 'uploaded' | 'verified' | 'rejected' | 'expired' | 'superseded';

export interface RegistrationParameter {
  key: string;
  label: string;
  required: boolean;
  field_type: 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'date' | 'file';
  description?: string;
  example?: string;
  options?: string[];
}

export interface RegulatoryAuthority {
  id: string;
  country_id: string;
  name: string;
  acronym?: string;
  jurisdiction: string;
  website_url?: string;
  portal_url?: string;
  description?: string;
  contact_info: Record<string, string>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // joined
  compliance_countries?: { name: string; iso2: string; flag_emoji?: string };
}

export interface FinancialYearStructure {
  id: string;
  country_id: string;
  label: string;
  short_label: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
}

export interface ComplianceFramework {
  id: string;
  country_id: string;
  compliance_type_id: string;
  authority_id?: string;
  name: string;
  short_name?: string;
  description?: string;
  legal_reference?: string;
  portal_url?: string;
  applicability_criteria?: string;
  registration_parameters: RegistrationParameter[];
  filing_notes?: string;
  internal_notes?: string;
  effective_from?: string;
  effective_to?: string;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joined
  compliance_countries?: { id: string; name: string; iso2: string; flag_emoji?: string };
  compliance_types?: { id: string; name: string; code: string; category: string; region: string };
  regulatory_authorities?: { id: string; name: string; acronym?: string };
}

export interface ComplianceFilingCycle {
  id: string;
  framework_id: string;
  cycle_code: string;
  cycle_label: string;
  cycle_type: CycleType;
  period_start_month?: number;
  period_end_month?: number;
  period_number?: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ComplianceDeadline {
  id: string;
  framework_id: string;
  cycle_id?: string;
  financial_year_id?: string;
  filing_type: FilingType;
  title: string;
  description?: string;
  due_date: string;
  submission_open_date?: string;
  grace_period_days: number;
  penalty_info?: string;
  applicable_entity_types: string[];
  reminder_days_before: number[];
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joined
  compliance_frameworks?: { id: string; name: string; short_name?: string; compliance_countries?: { name: string; iso2?: string; flag_emoji?: string } };
  compliance_filing_cycles?: { id: string; cycle_code: string; cycle_label: string };
  financial_year_structures?: { id: string; label: string; short_label: string };
}

export interface ComplianceDocumentRequirement {
  id: string;
  framework_id: string;
  document_name: string;
  document_code?: string;
  description?: string;
  is_mandatory: boolean;
  accepted_formats: string[];
  max_file_size_mb: number;
  validity_period_months?: number;
  renewal_reminder_days: number;
  sample_template_url?: string;
  notes?: string;
  applicable_filing_types: string[];
  display_order: number;
  is_active: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ── Client-side types ──────────────────────────────────────────

export interface ClientCompliance {
  id: string;
  client_id: string;
  framework_id: string;
  assigned_by?: string;
  assigned_at: string;
  status: ClientComplianceStatus;
  entity_type?: string;
  registration_no?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  compliance_frameworks?: ComplianceFramework;
  profiles?: { id: string; full_name?: string; company_name?: string };
}

export interface ClientComplianceTask {
  id: string;
  client_id: string;
  compliance_id: string;
  deadline_id?: string;
  title: string;
  description?: string;
  task_type: TaskType;
  due_date?: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigned_to?: string;
  completed_at?: string;
  completed_by?: string;
  notes?: string;
  is_auto_generated: boolean;
  metadata: Record<string, unknown>;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // joined
  client_compliances?: ClientCompliance;
  compliance_deadlines?: ComplianceDeadline;
  assignee?: { id: string; full_name?: string };
}

export interface ClientComplianceFiling {
  id: string;
  client_id: string;
  compliance_id: string;
  deadline_id: string;
  task_id?: string;
  status: FilingStatus;
  submission_date?: string;
  reference_number?: string;
  acknowledgement_url?: string;
  notes?: string;
  submitted_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  compliance_deadlines?: ComplianceDeadline;
}

export interface ClientComplianceDocument {
  id: string;
  client_id: string;
  compliance_id: string;
  requirement_id?: string;
  filing_id?: string;
  document_name: string;
  original_filename?: string;
  file_path?: string;
  file_url?: string;
  file_size_bytes?: number;
  mime_type?: string;
  validity_expiry_date?: string;
  status: DocumentStatus;
  version: number;
  notes?: string;
  verified_by?: string;
  verified_at?: string;
  rejection_reason?: string;
  uploaded_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // joined
  compliance_document_requirements?: ComplianceDocumentRequirement;
}

export interface ComplianceNotification {
  id: string;
  client_id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: string;
  is_read: boolean;
  read_at?: string;
  channels: string[];
  sent_at?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ── Dashboard / summary types ──────────────────────────────────

export interface ComplianceHubSummary {
  total_frameworks: number;
  active_tasks: number;
  overdue_tasks: number;
  upcoming_deadlines_30d: number;
  documents_pending: number;
  documents_expiring_30d: number;
  filings_submitted_this_fy: number;
}

export interface DeadlineWithStatus {
  deadline: ComplianceDeadline;
  filing?: ClientComplianceFiling;
  task?: ClientComplianceTask;
  days_remaining: number;
  is_overdue: boolean;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface FrameworkWithDeadlines extends ComplianceFramework {
  deadlines: DeadlineWithStatus[];
  document_requirements: ComplianceDocumentRequirement[];
  filing_cycles: ComplianceFilingCycle[];
  client_compliance?: ClientCompliance;
}
