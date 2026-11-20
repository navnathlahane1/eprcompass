// ── Global Field Definitions ──────────────────────────────────────

export type FieldDataType =
  | 'text' | 'number' | 'email' | 'phone' | 'url' | 'date'
  | 'select' | 'multiselect' | 'boolean' | 'file' | 'textarea' | 'json';

export type FieldSource = 'manual' | 'import' | 'ocr' | 'api' | 'auto_mapped';

export type SelectorType = 'css' | 'xpath' | 'name' | 'id' | 'placeholder' | 'label' | 'aria' | 'ai';

export type FillAction =
  | 'type'       // Keyboard-simulate typing
  | 'set_value'  // Direct value assignment
  | 'click'      // Click element
  | 'select'     // Select dropdown option
  | 'upload'     // File upload trigger
  | 'check'      // Checkbox/radio
  | 'clear_type'; // Clear then type

export type AutomationTier = 'manual' | 'assisted' | 'semi_auto' | 'full_auto';

export type SessionType = 'chrome_extension' | 'playwright' | 'selenium' | 'api_test' | 'manual_review';

export type SessionStatus = 'started' | 'filling' | 'completed' | 'failed' | 'aborted' | 'review_needed';

export type FieldLogStatus = 'filled' | 'failed' | 'skipped' | 'not_found' | 'validation_error' | 'field_empty';

// ── Core Entities ─────────────────────────────────────────────────

export interface GlobalFieldCategory {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface GlobalFieldDefinition {
  id: string;
  field_key: string;
  display_name: string;
  category_id: string;
  data_type: FieldDataType;
  description: string | null;
  placeholder: string | null;
  validation_regex: string | null;
  validation_function: string | null;
  is_required: boolean;
  is_sensitive: boolean;
  is_multi_value: boolean;
  applicable_countries: string[];
  account_column: string | null;
  contact_column: string | null;
  profile_column: string | null;
  options: SelectOption[];
  automation_enabled: boolean;
  help_text: string | null;
  sort_order: number;
  is_active: boolean;
  // Joined
  global_field_categories?: GlobalFieldCategory;
}

export interface ClientGlobalData {
  id: string;
  client_id: string;
  field_id: string;
  value_text: string | null;
  value_number: number | null;
  value_date: string | null;
  value_boolean: boolean | null;
  value_json: unknown | null;
  value_encrypted: string | null;
  file_path: string | null;
  file_url: string | null;
  file_name: string | null;
  file_mime: string | null;
  file_size_bytes: number | null;
  validity_expires: string | null;
  is_verified: boolean;
  verified_by: string | null;
  verified_at: string | null;
  source: FieldSource;
  notes: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  // Joined
  global_field_definitions?: GlobalFieldDefinition;
}

// Resolved client data: field definition + current value
export interface ResolvedClientField {
  field: GlobalFieldDefinition;
  data: ClientGlobalData | null;
  value: string | number | boolean | string[] | null; // typed resolved value
  display_value: string;
  is_complete: boolean;
  is_verified: boolean;
}

// ── Portal Entities ───────────────────────────────────────────────

export interface CompliancePortal {
  id: string;
  name: string;
  short_name: string | null;
  portal_type: string;
  base_url: string;
  login_url: string | null;
  dashboard_url: string | null;
  description: string | null;
  tech_stack: string | null;
  has_captcha: boolean;
  has_otp: boolean;
  has_2fa: boolean;
  automation_tier: AutomationTier;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
  metadata: Record<string, unknown>;
}

export interface PortalDetectionRule {
  id: string;
  portal_id: string;
  match_type: 'hostname' | 'url_prefix' | 'url_contains' | 'url_regex';
  match_pattern: string;
  page_context: string | null;
  priority: number;
  is_active: boolean;
}

export interface FallbackSelector {
  type: SelectorType;
  value: string;
}

export interface PortalFieldMapping {
  id: string;
  portal_id: string;
  global_field_id: string;
  page_context: string | null;
  selector_type: SelectorType;
  selector_value: string;
  fallback_selectors: FallbackSelector[];
  fill_action: FillAction;
  value_transform: string | null;
  pre_fill_script: string | null;
  post_fill_script: string | null;
  required_on_portal: boolean;
  portal_validation_hint: string | null;
  confidence_score: number;
  last_verified_at: string | null;
  is_active: boolean;
  notes: string | null;
  metadata: Record<string, unknown>;
  // Joined
  global_field_definitions?: GlobalFieldDefinition;
}

export interface PortalFormStep {
  id: string;
  portal_id: string;
  filing_type: string | null;
  step_number: number;
  step_name: string;
  step_url_hint: string | null;
  description: string | null;
  fields_json: string[]; // ordered global_field_keys
  next_action: string | null;
  next_selector: string | null;
  validation_check: string | null;
  estimated_time_secs: number;
  is_active: boolean;
}

// ── Autofill Session Entities ─────────────────────────────────────

export interface AutofillSession {
  id: string;
  client_id: string;
  portal_id: string | null;
  profile_id: string;
  session_type: SessionType;
  trigger_url: string | null;
  detected_portal: string | null;
  page_context: string | null;
  status: SessionStatus;
  fields_attempted: number;
  fields_filled: number;
  fields_failed: number;
  fields_skipped: number;
  confidence_avg: number | null;
  error_message: string | null;
  user_agent: string | null;
  extension_version: string | null;
  started_at: string;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  compliance_portals?: CompliancePortal;
}

export interface AutofillFieldLog {
  id: string;
  session_id: string;
  global_field_id: string | null;
  mapping_id: string | null;
  field_key: string | null;
  selector_used: string | null;
  selector_type: string | null;
  status: FieldLogStatus;
  fill_value_preview: string | null;
  error_detail: string | null;
  confidence: number | null;
  fill_duration_ms: number | null;
  created_at: string;
}

// ── Chrome Extension API Contracts ───────────────────────────────
// These are the shapes the Chrome Extension expects from the API.

export interface DetectPortalRequest {
  url: string;
  token: string; // Bearer token from extension_api_tokens
}

export interface DetectPortalResponse {
  detected: boolean;
  portal: CompliancePortal | null;
  page_context: string | null;
  matched_rule: PortalDetectionRule | null;
}

export interface FetchMappingsRequest {
  portal_id: string;
  page_context?: string;
  token: string;
}

export interface FilledFieldPayload {
  field_key: string;
  global_field_id: string;
  mapping_id: string;
  display_value: string;
  selector_value: string;
  fill_action: FillAction;
  value_transform: string | null;
  pre_fill_script: string | null;
  post_fill_script: string | null;
  confidence_score: number;
  fallback_selectors: FallbackSelector[];
}

export interface FetchMappingsResponse {
  portal: CompliancePortal;
  page_context: string | null;
  fields: FilledFieldPayload[];
  steps: PortalFormStep[];
}

export interface StartSessionRequest {
  token: string;
  portal_id: string;
  trigger_url: string;
  page_context: string | null;
  session_type: SessionType;
  user_agent?: string;
  extension_version?: string;
}

export interface LogFieldRequest {
  session_id: string;
  token: string;
  logs: Omit<AutofillFieldLog, 'id' | 'session_id' | 'created_at'>[];
}

export interface CompleteSessionRequest {
  session_id: string;
  token: string;
  status: SessionStatus;
  fields_attempted: number;
  fields_filled: number;
  fields_failed: number;
  fields_skipped: number;
  error_message?: string;
}

// ── Data Profile / Completeness ───────────────────────────────────

export interface FieldCompleteness {
  total: number;
  filled: number;
  verified: number;
  percentage: number;
}

export interface CategoryCompleteness {
  category: GlobalFieldCategory;
  completeness: FieldCompleteness;
  fields: ResolvedClientField[];
}

export interface DataProfileSummary {
  overall: FieldCompleteness;
  by_category: CategoryCompleteness[];
  last_updated: string | null;
}

// ── Extension Token ───────────────────────────────────────────────

export interface ExtensionToken {
  id: string;
  name: string;
  scopes: string[];
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}
