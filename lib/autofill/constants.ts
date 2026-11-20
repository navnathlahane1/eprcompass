import type { AutomationTier, FieldDataType, FillAction, SelectorType, SessionStatus, FieldLogStatus } from './types';

export const FIELD_CATEGORY_ICONS: Record<string, string> = {
  COMPANY:      'building-2',
  CONTACT:      'user',
  ADDRESS:      'map-pin',
  EPR_DATA:     'shield',
  FINANCIAL:    'banknote',
  DOCUMENTS:    'file-text',
  PORTAL_CREDS: 'lock',
  CUSTOM:       'plus',
};

export const DATA_TYPE_LABELS: Record<FieldDataType, string> = {
  text:        'Text',
  number:      'Number',
  email:       'Email',
  phone:       'Phone',
  url:         'URL',
  date:        'Date',
  select:      'Dropdown',
  multiselect: 'Multi-Select',
  boolean:     'Yes / No',
  file:        'File Upload',
  textarea:    'Long Text',
  json:        'JSON Data',
};

export const FILL_ACTION_LABELS: Record<FillAction, string> = {
  type:       'Simulate Typing',
  set_value:  'Set Value Directly',
  click:      'Click Element',
  select:     'Select Option',
  upload:     'Upload File',
  check:      'Check/Toggle',
  clear_type: 'Clear Then Type',
};

export const SELECTOR_TYPE_LABELS: Record<SelectorType, string> = {
  css:         'CSS Selector',
  xpath:       'XPath',
  name:        'name= attribute',
  id:          'id= attribute',
  placeholder: 'placeholder= text',
  label:       'Label text',
  aria:        'aria-label',
  ai:          'AI-detected',
};

export const AUTOMATION_TIER_CONFIG: Record<AutomationTier, { label: string; color: string; description: string }> = {
  manual:     { label: 'Manual Only',  color: 'bg-gray-100 text-gray-700',   description: 'No automation — must file manually' },
  assisted:   { label: 'Autofill',     color: 'bg-blue-100 text-blue-700',   description: 'Autofill fields; human submits' },
  semi_auto:  { label: 'Semi-Auto',    color: 'bg-purple-100 text-purple-700', description: 'Autofill + guided multi-step flow' },
  full_auto:  { label: 'Full Auto',    color: 'bg-green-100 text-green-700', description: 'Full RPA — unattended submission' },
};

export const SESSION_STATUS_CONFIG: Record<SessionStatus, { label: string; color: string }> = {
  started:       { label: 'Started',       color: 'bg-blue-100 text-blue-700' },
  filling:       { label: 'Filling',       color: 'bg-yellow-100 text-yellow-700' },
  completed:     { label: 'Completed',     color: 'bg-green-100 text-green-700' },
  failed:        { label: 'Failed',        color: 'bg-red-100 text-red-700' },
  aborted:       { label: 'Aborted',       color: 'bg-gray-100 text-gray-600' },
  review_needed: { label: 'Review Needed', color: 'bg-orange-100 text-orange-700' },
};

export const FIELD_LOG_STATUS_CONFIG: Record<FieldLogStatus, { label: string; color: string; icon: string }> = {
  filled:           { label: 'Filled',            color: 'text-green-600',  icon: '✓' },
  failed:           { label: 'Failed',             color: 'text-red-600',    icon: '✗' },
  skipped:          { label: 'Skipped',            color: 'text-gray-500',   icon: '–' },
  not_found:        { label: 'Not Found',          color: 'text-orange-600', icon: '?' },
  validation_error: { label: 'Validation Error',   color: 'text-yellow-600', icon: '!' },
  field_empty:      { label: 'No Data',            color: 'text-gray-400',   icon: '○' },
};

export const CONFIDENCE_THRESHOLD = {
  VERIFIED: 90,
  RELIABLE: 70,
  NEEDS_REVIEW: 50,
} as const;

export function getConfidenceColor(score: number): string {
  if (score >= CONFIDENCE_THRESHOLD.VERIFIED) return 'text-green-600';
  if (score >= CONFIDENCE_THRESHOLD.RELIABLE) return 'text-yellow-600';
  return 'text-red-600';
}

export function getConfidenceLabel(score: number): string {
  if (score >= CONFIDENCE_THRESHOLD.VERIFIED) return 'Verified';
  if (score >= CONFIDENCE_THRESHOLD.RELIABLE) return 'Reliable';
  if (score >= CONFIDENCE_THRESHOLD.NEEDS_REVIEW) return 'Needs Review';
  return 'Unreliable';
}

export function getCompletenessBadge(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'Excellent',   color: 'bg-green-100 text-green-700' };
  if (pct >= 70) return { label: 'Good',         color: 'bg-blue-100 text-blue-700' };
  if (pct >= 40) return { label: 'Incomplete',   color: 'bg-yellow-100 text-yellow-700' };
  return           { label: 'Poor',             color: 'bg-red-100 text-red-700' };
}

// Value transform IDs used in portal_field_mappings.value_transform
export const VALUE_TRANSFORMS: Record<string, { label: string; description: string }> = {
  upper_case:    { label: 'UPPERCASE',         description: 'Convert to uppercase (e.g. PAN, GSTIN)' },
  lower_case:    { label: 'lowercase',         description: 'Convert to lowercase (e.g. email)' },
  phone_in:      { label: 'IN Phone',          description: 'Format as Indian 10-digit mobile (strip +91)' },
  phone_intl:    { label: 'Intl Phone',        description: 'E.164 international format' },
  date_ddmmyyyy: { label: 'DD/MM/YYYY',        description: 'Reformat date to DD/MM/YYYY' },
  date_yyyymmdd: { label: 'YYYY-MM-DD',        description: 'ISO date format' },
  gst_format:    { label: 'GST Format',        description: 'Validate and format 15-char GSTIN' },
  iec_format:    { label: 'IEC Format',        description: '10-digit IEC number' },
  amount_inr:    { label: 'Amount (INR)',       description: 'Indian number format (lakhs/crores)' },
  amount_usd:    { label: 'Amount (USD)',       description: 'US dollar format' },
  strip_spaces:  { label: 'Strip Spaces',      description: 'Remove all whitespace' },
  title_case:    { label: 'Title Case',        description: 'Capitalise first letter of each word' },
};
