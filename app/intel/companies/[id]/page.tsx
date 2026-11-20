'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { getIntelApiBaseUrl } from '@/lib/apiBaseUrl';
import IntelligencePanel from '@/app/intel/_components/IntelligencePanel';
import IntelEprDossier from '../_components/IntelEprDossier';
import IntelGoogleSalesTools from '../_components/IntelGoogleSalesTools';

type IntelCompany = {
  id: string;
  canonical_name: string;
  company_type?: string | null;
  cin: string | null;
  gstin: string | null;
  pan: string | null;
  website: string | null;
  linkedin_url: string | null;
  state: string | null;
  district: string | null;
  active_status?: string | null;
  validation_confidence?: number | null;
  updated_at: string;
};

type IntelNotice = {
  id: string;
  notice_type: string | null;
  authority: string | null;
  waste_category: string | null;
  notice_date: string | null;
  deadline_date: string | null;
  penalty_inr: number | null;
  shortfall_mt: number | null;
  confidence_score: number | null;
};

type FieldHistory = {
  id: string;
  field_name: string;
  accepted_value: unknown;
  rejected_value: unknown;
  resolution_rule: string;
  resolved_at: string;
};

type SourceDocument = {
  id: string;
  source_document_ref: string;
  source_id: string;
  document_type: string;
  ingested_at: string;
};

type IntelSource = {
  id: string;
  source_name: string;
  license_flag: string;
};

type CompanyDynamicFieldColumn = {
  id: string;
  column_key: string;
  approved_name: string | null;
  approved_type: string | null;
  applied_to_table: string | null;
  applied_column: string | null;
  applied_at: string | null;
};

type CompanyFactSheet = {
  website: string | null;
  industry_classification: string | null;
  address_full: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  year_established: string | null;
  registration_ids: string | null;
  contact_person: string | null;
  designation: string | null;
  email_direct: string | null;
  email_generic: string | null;
  phone: string | null;
  linkedin_company_url: string | null;
  linkedin_decision_maker_url: string | null;
  employee_count_band: string | null;
  revenue_band: string | null;
  parent_company: string | null;
  recent_trigger: string | null;
  tech_stack_signals: string | null;
  segment_tag: string | null;
  relevance_score: number | null;
  score_rationale: string | null;
  personalization_hook: string | null;
  opener_line: string | null;
  subject_line: string | null;
  recommended_channel: string | null;
  notes: string | null;
  ec_inr_cr: number | null;
  epr_target_mt: number | null;
  shortfall_mt: number | null;
  contact_status?: string | null;
  credit_tier?: string | null;
  partnership_priority?: string | null;
  outreach_angle?: string | null;
  cert_issue_date?: string | null;
  est_next_renewal?: string | null;
  renewal_urgency?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

type BatteryRecyclerProfile = {
  recycler_name: string | null;
  cpcb_registration_number: string | null;
  battery_categories: string[] | null;
  chemistry_capabilities: string[] | null;
  annual_processing_capacity_mt: number | null;
  authorized_capacity_mt: number | null;
  collection_centers_count: number | null;
  plant_count: number | null;
  processing_technology: string | null;
  recovery_efficiency_pct: number | null;
  black_mass_output_mt: number | null;
  compliance_status: string | null;
  cpcb_registration_valid_upto: string | null;
  state_authorization_valid_upto: string | null;
  li_credits_mt?: number | null;
  mg_credits_mt?: number | null;
  fe_credits_mt?: number | null;
  scale_indicator?: string | null;
  recycler_specialization?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

type RecyclerPartnershipProfile = {
  primary_contact_name: string | null;
  email_variant: string | null;
  partner_region: string | null;
  geo_tier: string | null;
  outreach_status: string | null;
  subject_used: string | null;
  variant_used: string | null;
  partnership_score: number | null;
  partnership_priority: string | null;
  outreach_angle: string | null;
  suggested_channel: string | null;
  recycler_specialization: string | null;
  company_type: string | null;
  scale_indicator: string | null;
  total_credits_mt: number | null;
  raw_payload?: Record<string, unknown> | null;
};

type MpcbRecyclerProfile = {
  company_name_as_per_mpcb: string | null;
  mpcb_serial_number: string | null;
  cpcb_status: string | null;
  mpcb_status: string | null;
  regional_office: string | null;
  mpcb_type: string | null;
  cpcb_type: string | null;
  capacity_allotted_mt: number | null;
  consent_authorization_ref: string | null;
  consent_valid_upto: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  remarks: string | null;
  inferred_website: string | null;
  inferred_domain: string | null;
  website_title: string | null;
  website_description: string | null;
  enrichment_provider: string | null;
  enrichment_model: string | null;
  enrichment_summary: string | null;
  enrichment_epr_categories: string[] | null;
  enrichment_keywords: string[] | null;
  enrichment_confidence: number | null;
  raw_payload?: Record<string, unknown> | null;
};

type CpcbRecyclerProfile = {
  company_name_as_per_cpcb: string | null;
  cpcb_registration_number: string | null;
  cpcb_registration_status: string | null;
  authorization_type: string | null;
  recycler_category: string | null;
  capacity_mt: number | null;
  material_categories: string[] | null;
  registration_valid_from: string | null;
  registration_valid_upto: string | null;
  contact_person: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  linkedin_url: string | null;
  state: string | null;
  city: string | null;
  address_line: string | null;
  source_label: string | null;
  verified_fields?: Record<string, unknown> | null;
  ai_generated_fields?: Record<string, unknown> | null;
  enrichment_provider: string | null;
  enrichment_model: string | null;
  enrichment_confidence: number | null;
  enrichment_timestamp: string | null;
  raw_payload?: Record<string, unknown> | null;
};

type SpcbCompanyProfile = {
  company_name_as_per_spcb: string | null;
  industry_address: string | null;
  activity: string | null;
  contact_no: string | null;
  email_id: string | null;
  capacity: string | null;
  capacity_mta: number | null;
  authorization_number: string | null;
  authorization_order_number: string | null;
  authorization_type: string | null;
  authorization_status: string | null;
  authorization_issue_date: string | null;
  authorization_valid_upto: string | null;
  hazardous_waste_categories: string[] | null;
  hazardous_waste_streams: string | null;
  authorized_quantity: number | null;
  authorized_quantity_unit: string | null;
  recycler_classification: string | null;
  facility_name: string | null;
  occupier_name: string | null;
  contact_person: string | null;
  mobile_no: string | null;
  phone_no: string | null;
  district: string | null;
  city: string | null;
  taluka: string | null;
  postal_code: string | null;
  address_line_2: string | null;
  cpcb_registration_present: boolean | null;
  cpcb_registration_number: string | null;
  registration_scope: string | null;
  spcb_status: string | null;
  remarks: string | null;
  cto_valid_upto: string | null;
  hsw_authorization_valid_upto: string | null;
  spcb_board_code: string | null;
  spcb_board_name: string | null;
  state: string | null;
  source_label: string | null;
  raw_payload?: Record<string, unknown> | null;
};

type MergeHistoryPayload = {
  mappings: Array<Record<string, unknown>>;
  audits: Array<Record<string, unknown>>;
};

type GooglePlacesData = {
  google_place_id: string | null;
  official_business_name: string | null;
  formatted_address: string | null;
  latitude: number | null;
  longitude: number | null;
  google_maps_url: string | null;
  phone_number: string | null;
  international_phone_number: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  business_status: string | null;
  active_status: string | null;
  validation_confidence: number | null;
  verified_by_google: boolean;
  place_types: string[];
  photos: Array<Record<string, unknown>>;
  opening_hours?: Record<string, unknown>;
};

type CompanyGeoData = {
  formatted_address: string | null;
  searchable_address: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  geo_hash: string | null;
  geo_accuracy_level: string | null;
};

type NearbyRecycler = {
  company_id: string;
  company_name: string | null;
  formatted_address: string | null;
  distance_km: number;
  latitude: number | null;
  longitude: number | null;
};

type CompanyLocation = {
  id: string;
  company_id: string;
  location_name: string | null;
  location_type: string;
  address_line_1: string | null;
  address_line_2: string | null;
  city: string | null;
  district: string | null;
  state: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
  google_place_id: string | null;
  google_maps_url: string | null;
  operational_status: string;
  is_primary_location: boolean;
  is_registered_office: boolean;
  is_operational_facility: boolean;
  verification_status: string;
  enrichment_confidence: string;
};

type CompanyRegistration = {
  id: string;
  registration_id: string | null;
  registration_type: string | null;
  authority: string | null;
  waste_category: string | null;
  segment_tag: string | null;
  registration_status: string | null;
  issue_date: string | null;
  valid_from: string | null;
  valid_upto: string | null;
  issuing_state: string | null;
  registered_address: string | null;
  source_label: string | null;
  source_record_ref: string | null;
  is_primary: boolean;
};

type AssociatedPerson = {
  id: string;
  company_id: string;
  person_name: string;
  designation: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
  department?: string | null;
  seniority_level?: string | null;
  source_type?: string | null;
  source_vendor?: string | null;
  confidence_score?: number | null;
  enrichment_provider?: string | null;
  enrichment_model?: string | null;
  is_placeholder?: boolean;
  last_verified_at?: string | null;
  data_points?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

type AssociatedPersonForm = {
  person_name: string;
  designation: string;
  phone: string;
  email: string;
  linkedin_url: string;
  notes: string;
  department: string;
  seniority_level: string;
  source_type: string;
  source_vendor: string;
  confidence_score: string;
};

type EditableCompanyFieldKey =
  | 'canonical_name'
  | 'company_type'
  | 'cin'
  | 'gstin'
  | 'pan'
  | 'website'
  | 'linkedin_url'
  | 'state'
  | 'district'
  | 'active_status'
  | 'validation_confidence';

const EDITABLE_COMPANY_FIELDS: Array<{
  key: EditableCompanyFieldKey;
  label: string;
  inputType: 'text' | 'number';
  step?: string;
  min?: string;
  max?: string;
}> = [
  { key: 'canonical_name', label: 'Company Name', inputType: 'text' },
  { key: 'company_type', label: 'Company Type', inputType: 'text' },
  { key: 'cin', label: 'CIN', inputType: 'text' },
  { key: 'gstin', label: 'GSTIN', inputType: 'text' },
  { key: 'pan', label: 'PAN', inputType: 'text' },
  { key: 'website', label: 'Website', inputType: 'text' },
  { key: 'linkedin_url', label: 'LinkedIn URL', inputType: 'text' },
  { key: 'state', label: 'State', inputType: 'text' },
  { key: 'district', label: 'District', inputType: 'text' },
  { key: 'active_status', label: 'Active Status', inputType: 'text' },
  { key: 'validation_confidence', label: 'Validation Confidence', inputType: 'number', step: '0.01', min: '0', max: '1' }
];

const EPR_CATEGORY_PATTERNS: Array<{ key: string; label: string; patterns: RegExp[] }> = [
  { key: 'battery', label: 'Battery', patterns: [/\bbattery\b/, /lithium/, /lead[_\s-]?acid/, /black[_\s-]?mass/] },
  { key: 'ewaste', label: 'E-Waste', patterns: [/\be[\s-]?waste\b/, /electronic[_\s-]?waste/, /waste[_\s-]?electrical/, /it[_\s-]?asset/] },
  { key: 'plastic', label: 'Plastic', patterns: [/\bplastic\b/, /packaging[_\s-]?waste/, /polymer/, /pet\b/] },
  { key: 'tyre', label: 'Tyre', patterns: [/\btyre\b/, /\btire\b/, /rubber[_\s-]?waste/] },
  { key: 'oil', label: 'Used Oil', patterns: [/used[_\s-]?oil/, /waste[_\s-]?oil/, /lubricating[_\s-]?oil/, /base[_\s-]?oil/, /\boil\b/] }
];

const SPCB_BY_STATE: Record<string, { state: string; boardCode: string; boardName: string }> = {
  andhra_pradesh: { state: 'Andhra Pradesh', boardCode: 'APPCB', boardName: 'Andhra Pradesh Pollution Control Board' },
  arunachal_pradesh: { state: 'Arunachal Pradesh', boardCode: 'APSPCB', boardName: 'Arunachal Pradesh State Pollution Control Board' },
  assam: { state: 'Assam', boardCode: 'APCB', boardName: 'Assam Pollution Control Board' },
  bihar: { state: 'Bihar', boardCode: 'BSPCB', boardName: 'Bihar State Pollution Control Board' },
  chhattisgarh: { state: 'Chhattisgarh', boardCode: 'CSPCB', boardName: 'Chhattisgarh State Pollution Control Board' },
  delhi: { state: 'Delhi', boardCode: 'DPCC', boardName: 'Delhi Pollution Control Committee' },
  goa: { state: 'Goa', boardCode: 'GSPCB', boardName: 'Goa State Pollution Control Board' },
  gujarat: { state: 'Gujarat', boardCode: 'GPCB', boardName: 'Gujarat Pollution Control Board' },
  haryana: { state: 'Haryana', boardCode: 'HSPCB', boardName: 'Haryana State Pollution Control Board' },
  himachal_pradesh: { state: 'Himachal Pradesh', boardCode: 'HPSPCB', boardName: 'Himachal Pradesh State Pollution Control Board' },
  jammu_and_kashmir: { state: 'Jammu and Kashmir', boardCode: 'JKPCC', boardName: 'Jammu and Kashmir Pollution Control Committee' },
  jharkhand: { state: 'Jharkhand', boardCode: 'JSPCB', boardName: 'Jharkhand State Pollution Control Board' },
  karnataka: { state: 'Karnataka', boardCode: 'KSPCB', boardName: 'Karnataka State Pollution Control Board' },
  kerala: { state: 'Kerala', boardCode: 'KSPCB', boardName: 'Kerala State Pollution Control Board' },
  ladakh: { state: 'Ladakh', boardCode: 'LPCC', boardName: 'Ladakh Pollution Control Committee' },
  madhya_pradesh: { state: 'Madhya Pradesh', boardCode: 'MPPCB', boardName: 'Madhya Pradesh Pollution Control Board' },
  maharashtra: { state: 'Maharashtra', boardCode: 'MPCB', boardName: 'Maharashtra Pollution Control Board' },
  manipur: { state: 'Manipur', boardCode: 'MPCB_MANIPUR', boardName: 'Manipur Pollution Control Board' },
  meghalaya: { state: 'Meghalaya', boardCode: 'MSPCB', boardName: 'Meghalaya State Pollution Control Board' },
  mizoram: { state: 'Mizoram', boardCode: 'MPCB_MIZORAM', boardName: 'Mizoram Pollution Control Board' },
  nagaland: { state: 'Nagaland', boardCode: 'NPCB', boardName: 'Nagaland Pollution Control Board' },
  odisha: { state: 'Odisha', boardCode: 'OSPCB', boardName: 'Odisha State Pollution Control Board' },
  punjab: { state: 'Punjab', boardCode: 'PPCB', boardName: 'Punjab Pollution Control Board' },
  rajasthan: { state: 'Rajasthan', boardCode: 'RSPCB', boardName: 'Rajasthan State Pollution Control Board' },
  sikkim: { state: 'Sikkim', boardCode: 'SSPCB', boardName: 'Sikkim State Pollution Control Board' },
  tamil_nadu: { state: 'Tamil Nadu', boardCode: 'TNPCB', boardName: 'Tamil Nadu Pollution Control Board' },
  telangana: { state: 'Telangana', boardCode: 'TGPCB', boardName: 'Telangana Pollution Control Board' },
  tripura: { state: 'Tripura', boardCode: 'TSPCB', boardName: 'Tripura State Pollution Control Board' },
  uttar_pradesh: { state: 'Uttar Pradesh', boardCode: 'UPPCB', boardName: 'Uttar Pradesh Pollution Control Board' },
  uttarakhand: { state: 'Uttarakhand', boardCode: 'UKPCB', boardName: 'Uttarakhand Pollution Control Board' },
  west_bengal: { state: 'West Bengal', boardCode: 'WBPCB', boardName: 'West Bengal Pollution Control Board' },
  andaman_and_nicobar_islands: { state: 'Andaman and Nicobar Islands', boardCode: 'ANPCC', boardName: 'Andaman and Nicobar Pollution Control Committee' },
  chandigarh: { state: 'Chandigarh', boardCode: 'CPCC', boardName: 'Chandigarh Pollution Control Committee' },
  dadra_and_nagar_haveli_and_daman_and_diu: { state: 'Dadra and Nagar Haveli and Daman and Diu', boardCode: 'DNHDDPCC', boardName: 'Dadra and Nagar Haveli and Daman and Diu Pollution Control Committee' },
  lakshadweep: { state: 'Lakshadweep', boardCode: 'LPCC_LAK', boardName: 'Lakshadweep Pollution Control Committee' },
  puducherry: { state: 'Puducherry', boardCode: 'PPCC', boardName: 'Puducherry Pollution Control Committee' }
};

// ── Click-to-act helpers ──────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function doCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }
  return (
    <button
      type="button"
      onClick={doCopy}
      title="Copy to clipboard"
      className="ml-1 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 transition hover:border-teal-500/60 hover:text-teal-300"
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}

function PhoneValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-500">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <a href={`tel:${value.replace(/\s/g, '')}`} className="text-teal-300 hover:underline">{value}</a>
      <CopyButton text={value} />
    </span>
  );
}

function EmailValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-500">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <a href={`mailto:${value}`} className="text-blue-300 hover:underline break-all">{value}</a>
      <CopyButton text={value} />
    </span>
  );
}

function IdValue({ value }: { value: string | null | undefined }) {
  if (!value) return <span className="text-slate-500">—</span>;
  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className="font-mono text-slate-200">{value}</span>
      <CopyButton text={value} />
    </span>
  );
}

// ── Activity timeline type ────────────────────────────────────────────────────
type TimelineEvent = {
  id: string;
  at: string;
  icon: string;
  label: string;
  detail?: string;
};

type ComplianceApplicabilityRow = {
  key: string;
  complianceType: string;
  applicable: boolean;
  registrationStatus: 'Registered' | 'In Progress' | 'Expired' | 'Not Registered' | 'Not Applicable';
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical' | '—';
  logicSignals: string[];
};

type TriggerEventRow = {
  id: string;
  event: string;
  eventDate: string | null;
  source: string;
  relevanceScore: number;
};

type RawIntelRecord = {
  id: string;
  source_id: string | null;
  external_record_id: string | null;
  observed_at: string | null;
  created_at: string;
  payload: Record<string, unknown> | null;
};

type TradeSignalTriggerRow = {
  id: string;
  event: string;
  event_date: string | null;
  source: string;
  relevance_score: number;
};

type TradeSignalRecentRecord = {
  id: string;
  observed_at: string | null;
  source_id: string | null;
  source_label: string;
  external_record_id: string | null;
  import_profile: string | null;
  iec_code: string | null;
  hs_codes: string[];
  product_categories: string[];
  certificate_issue_date: string | null;
  registration_id: string | null;
  importer_flag: boolean;
  exporter_flag: boolean;
};

type TradeSignalMonthlyActivity = {
  month: string;
  total_records: number;
  importer_signals: number;
  exporter_signals: number;
};

type TradeSignalSourceMix = {
  source_id: string | null;
  source_label: string;
  records: number;
  importer_signals: number;
  exporter_signals: number;
};

type TradeSignalsPayload = {
  summary: {
    company_name: string | null;
    importer_signals: number;
    exporter_signals: number;
    trade_records: number;
    latest_trade_date: string | null;
  };
  import_profiles: string[];
  iec_codes: string[];
  hs_codes: string[];
  product_categories: string[];
  trigger_rows: TradeSignalTriggerRow[];
  recent_records: TradeSignalRecentRecord[];
  monthly_activity: TradeSignalMonthlyActivity[];
  source_mix: TradeSignalSourceMix[];
};

function segmentTagColor(tag: string | null | undefined): string {
  const t = (tag || '').toLowerCase();
  if (/recycler|recycling/.test(t)) return 'bg-teal-900/40 text-teal-200 border border-teal-700/40';
  if (/producer|pibo|brand/.test(t)) return 'bg-amber-900/40 text-amber-200 border border-amber-700/40';
  if (/dismantler/.test(t)) return 'bg-purple-900/40 text-purple-200 border border-purple-700/40';
  if (/refurbisher/.test(t)) return 'bg-blue-900/40 text-blue-200 border border-blue-700/40';
  if (/battery/.test(t)) return 'bg-cyan-900/40 text-cyan-200 border border-cyan-700/40';
  if (/importer/.test(t)) return 'bg-fuchsia-900/40 text-fuchsia-200 border border-fuchsia-700/40';
  if (/logistics|transport/.test(t)) return 'bg-orange-900/40 text-orange-200 border border-orange-700/40';
  return 'bg-slate-800/60 text-slate-300 border border-slate-700';
}

type UpsellTagCategory = 'waste' | 'product' | 'factory' | 'import' | 'export' | 'company' | 'global';

function getUpsellTagCategory(tagName: string): UpsellTagCategory {
  const normalized = tagName.toLowerCase();

  if (/epr|waste|recycler|hazardous|cpcb|dpcc|consent|cfo|cte|plastic|battery|e-waste|pro|circular economy|iso 590|r2v3|\br2\b/.test(normalized)) return 'waste';
  if (/bis|isi|crs|stqc|wpc|tec|rohs|eta|bee|arai|aerb|cdsco|gmp|fssai|haccp|kosher|organic|gots|agmark|apeda|mpeda|ce marking|bifma|drug license|ayush/.test(normalized)) return 'product';
  if (/factory|fire noc|esic|epf|labour|shops|trade license|boiler|metrology|nsic|rera|cgwa|eia|peso/.test(normalized)) return 'factory';
  if (/\biec\b|importer|import|customs|aeo|rbi\/fema|ffmc/.test(normalized)) return 'import';
  if (/export|rcmc|apeda|mpeda/.test(normalized)) return 'export';
  if (/gst|msme|udyam|llp|startup india|csr|esg|rni|gem|ipr|trademark|hallmark|soc 2|pci dss|iso certificate|iso 14001|iso 45001|iso 22000|cmmi|fcra/.test(normalized)) return 'company';
  return 'global';
}

function getUpsellTagColorClass(tagName: string): string {
  const category = getUpsellTagCategory(tagName);
  if (category === 'waste') return 'border-emerald-500/45 bg-emerald-500/12 text-emerald-200';
  if (category === 'product') return 'border-sky-500/45 bg-sky-500/12 text-sky-200';
  if (category === 'factory') return 'border-amber-500/45 bg-amber-500/12 text-amber-200';
  if (category === 'import') return 'border-fuchsia-500/45 bg-fuchsia-500/12 text-fuchsia-200';
  if (category === 'export') return 'border-cyan-500/45 bg-cyan-500/12 text-cyan-200';
  if (category === 'company') return 'border-rose-500/45 bg-rose-500/12 text-rose-200';
  return 'border-violet-500/45 bg-violet-500/12 text-violet-200';
}

function cleanDisplayValue(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeWorkbookKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function findWorkbookValue(rawPayload: Record<string, unknown> | null | undefined, patterns: RegExp[]): string | null {
  const effectivePayload = rawPayload && typeof rawPayload.raw_row === 'object' && rawPayload.raw_row !== null
    ? rawPayload.raw_row as Record<string, unknown>
    : rawPayload;
  if (!effectivePayload) return null;

  for (const [key, value] of Object.entries(effectivePayload)) {
    if (key.startsWith('__')) continue;
    const text = cleanDisplayValue(value);
    if (!text) continue;
    const normalizedKey = normalizeWorkbookKey(key);
    if (patterns.some((pattern) => pattern.test(normalizedKey))) return text;
  }

  return null;
}

function pickWorkbookValue(...values: Array<string | number | null | undefined>): string | null {
  for (const value of values) {
    if (value === null || value === undefined) continue;
    const text = cleanDisplayValue(value);
    if (text) return text;
  }

  return null;
}

function flattenCategorySource(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenCategorySource(item));
  }
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).flatMap((item) => flattenCategorySource(item));
  }
  const text = cleanDisplayValue(value);
  return text ? [text] : [];
}

function normalizeCategoryMatch(value: string): string | null {
  const normalized = value.toLowerCase().trim();
  for (const category of EPR_CATEGORY_PATTERNS) {
    if (category.patterns.some((pattern) => pattern.test(normalized))) return category.label;
  }
  return null;
}

function normalizeStateKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function resolveSpcbByState(value: string | null | undefined) {
  const normalized = normalizeStateKey(cleanDisplayValue(value));
  return normalized ? SPCB_BY_STATE[normalized] || null : null;
}

function findFirstValueFromObject(payload: Record<string, unknown> | null | undefined, patterns: RegExp[]): string | null {
  if (!payload) return null;

  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = normalizeWorkbookKey(key);
    if (patterns.some((pattern) => pattern.test(normalizedKey))) {
      const text = cleanDisplayValue(value);
      if (text) return text;
    }
  }

  return null;
}

function collectMatchingValuesFromObject(payload: Record<string, unknown> | null | undefined, patterns: RegExp[]): string[] {
  if (!payload) return [];

  const matches = new Set<string>();
  for (const [key, value] of Object.entries(payload)) {
    const normalizedKey = normalizeWorkbookKey(key);
    if (!patterns.some((pattern) => pattern.test(normalizedKey))) continue;
    const text = cleanDisplayValue(value);
    if (!text) continue;
    text
      .split(/[,/\n;]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => matches.add(entry));
  }

  return [...matches];
}

function toDateMs(value: string | null | undefined): number | null {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatMonthYear(value: string | null | undefined): string {
  if (!value) return '-';
  const parsed = new Date(`${value}-01T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

function toTitleLabel(value: string): string {
  return value
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function scoreToBand(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
  if (score >= 91) return 'Critical';
  if (score >= 61) return 'High';
  if (score >= 31) return 'Medium';
  return 'Low';
}

function registrationStatusFromRecords(records: CompanyRegistration[]): ComplianceApplicabilityRow['registrationStatus'] {
  if (!records.length) return 'Not Registered';
  const now = Date.now();

  const hasExpired = records.some((record) => {
    const statusText = cleanDisplayValue(record.registration_status).toLowerCase();
    if (/expired|lapsed|suspended|revoked/.test(statusText)) return true;
    const validUptoMs = toDateMs(record.valid_upto);
    return validUptoMs !== null && validUptoMs < now;
  });
  if (hasExpired) return 'Expired';

  const hasInProgress = records.some((record) => /applied|pending|under review|submitted/.test(cleanDisplayValue(record.registration_status).toLowerCase()));
  if (hasInProgress) return 'In Progress';

  return 'Registered';
}

function riskFromRegistrationStatus(status: ComplianceApplicabilityRow['registrationStatus'], applicable: boolean): ComplianceApplicabilityRow['riskLevel'] {
  if (!applicable) return '—';
  if (status === 'Expired') return 'Critical';
  if (status === 'Not Registered') return 'High';
  if (status === 'In Progress') return 'Medium';
  return 'Low';
}

function buildEmptyAssociatedPersonForm(): AssociatedPersonForm {
  return {
    person_name: '',
    designation: '',
    phone: '',
    email: '',
    linkedin_url: '',
    notes: '',
    department: '',
    seniority_level: '',
    source_type: '',
    source_vendor: '',
    confidence_score: ''
  };
}

export default function IntelCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromList = searchParams.get('from') === 'companies';
  const companyId = String(params?.id || '');

  const [company, setCompany] = useState<IntelCompany | null>(null);
  const [notices, setNotices] = useState<IntelNotice[]>([]);
  const [fieldHistory, setFieldHistory] = useState<FieldHistory[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [allCompanies, setAllCompanies] = useState<IntelCompany[]>([]);
  const [sources, setSources] = useState<IntelSource[]>([]);
  const [factSheet, setFactSheet] = useState<CompanyFactSheet | null>(null);
  const [batteryRecyclerProfile, setBatteryRecyclerProfile] = useState<BatteryRecyclerProfile | null>(null);
  const [partnershipProfile, setPartnershipProfile] = useState<RecyclerPartnershipProfile | null>(null);
  const [mpcbProfile, setMpcbProfile] = useState<MpcbRecyclerProfile | null>(null);
  const [cpcbProfile, setCpcbProfile] = useState<CpcbRecyclerProfile | null>(null);
  const [spcbCompanyProfile, setSpcbCompanyProfile] = useState<SpcbCompanyProfile | null>(null);
  const [mergeHistory, setMergeHistory] = useState<MergeHistoryPayload>({ mappings: [], audits: [] });
  const [googlePlacesData, setGooglePlacesData] = useState<GooglePlacesData | null>(null);
  const [companyGeoData, setCompanyGeoData] = useState<CompanyGeoData | null>(null);
  const [nearbyRecyclers, setNearbyRecyclers] = useState<NearbyRecycler[]>([]);
  const [geoEnrichmentLogs, setGeoEnrichmentLogs] = useState<Array<Record<string, unknown>>>([]);
  const [geoDuplicateClusters, setGeoDuplicateClusters] = useState<Array<Record<string, unknown>>>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [registrations, setRegistrations] = useState<CompanyRegistration[]>([]);
  const [associatedPeople, setAssociatedPeople] = useState<AssociatedPerson[]>([]);
  const [rawIntelRecords, setRawIntelRecords] = useState<RawIntelRecord[]>([]);
  const [tradeSignals, setTradeSignals] = useState<TradeSignalsPayload | null>(null);
  const [dynamicFieldColumns, setDynamicFieldColumns] = useState<CompanyDynamicFieldColumn[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, unknown>>({});
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [mergeLoading, setMergeLoading] = useState(false);
  const [enrichLoading, setEnrichLoading] = useState(false);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [telecallLoading, setTelecallLoading] = useState(false);
  const [telecallSuccess, setTelecallSuccess] = useState(false);
  const [addingAssociatedPerson, setAddingAssociatedPerson] = useState(false);
  const [associatedPersonForm, setAssociatedPersonForm] = useState<AssociatedPersonForm>(buildEmptyAssociatedPersonForm());
  const [editingAssociatedPersonId, setEditingAssociatedPersonId] = useState<string | null>(null);
  const [editingAssociatedPersonForm, setEditingAssociatedPersonForm] = useState<AssociatedPersonForm>(buildEmptyAssociatedPersonForm());
  const [savingAssociatedPersonId, setSavingAssociatedPersonId] = useState<string | null>(null);
  const [importingAssociatedPeople, setImportingAssociatedPeople] = useState(false);
  const [associatedPeopleImportFile, setAssociatedPeopleImportFile] = useState<File | null>(null);
  const [associatedPeopleImportVendor, setAssociatedPeopleImportVendor] = useState('');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [timelineQuickView, setTimelineQuickView] = useState(true);
  const [activeIntelTab, setActiveIntelTab] = useState<'overview' | 'compliance' | 'decision-makers' | 'imports-exports' | 'trigger-events' | 'financials' | 'locations' | 'recyclers' | 'crm-activity' | 'ai-insights' | 'intelligence'>('overview');
  const [geoStateFilter, setGeoStateFilter] = useState('all');
  const [geoDistrictFilter, setGeoDistrictFilter] = useState('all');
  const [geoRadiusKmFilter, setGeoRadiusKmFilter] = useState('50');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [provenance, setProvenance] = useState<{
    shareable: boolean;
    sources: { source_name: string; license_flag: string; reliability_tier: number | null }[];
    fields: { field_name: string; confidence_score: number | null; source: { source_name: string } | null }[];
  } | null>(null);
  const [success, setSuccess] = useState('');
  const [savingField, setSavingField] = useState<EditableCompanyFieldKey | null>(null);
  const [editableCompanyValues, setEditableCompanyValues] = useState<Record<EditableCompanyFieldKey, string>>({
    canonical_name: '',
    company_type: '',
    cin: '',
    gstin: '',
    pan: '',
    website: '',
    linkedin_url: '',
    state: '',
    district: '',
    active_status: '',
    validation_confidence: ''
  });

  function companyFieldToInputValue(field: EditableCompanyFieldKey, sourceCompany: IntelCompany | null): string {
    if (!sourceCompany) return '';
    const raw = sourceCompany[field as keyof IntelCompany];
    if (raw === null || raw === undefined) return '';
    if (field === 'validation_confidence') {
      const numeric = Number(raw);
      return Number.isFinite(numeric) ? String(numeric) : '';
    }
    return String(raw);
  }

  useEffect(() => {
    setEditableCompanyValues({
      canonical_name: companyFieldToInputValue('canonical_name', company),
      company_type: companyFieldToInputValue('company_type', company),
      cin: companyFieldToInputValue('cin', company),
      gstin: companyFieldToInputValue('gstin', company),
      pan: companyFieldToInputValue('pan', company),
      website: companyFieldToInputValue('website', company),
      linkedin_url: companyFieldToInputValue('linkedin_url', company),
      state: companyFieldToInputValue('state', company),
      district: companyFieldToInputValue('district', company),
      active_status: companyFieldToInputValue('active_status', company),
      validation_confidence: companyFieldToInputValue('validation_confidence', company)
    });
  }, [company]);

  async function fetchIntelWithFallback(path: string, token: string, init?: RequestInit) {
    const apiBaseUrl = getIntelApiBaseUrl();
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const headers = {
      ...(init?.headers || {}),
      authorization: `Bearer ${token}`
    };

    try {
      return await fetch(`${apiBaseUrl}${normalizedPath}`, {
        ...init,
        headers
      });
    } catch (primaryError) {
      if (!apiBaseUrl) {
        throw primaryError;
      }

      return fetch(normalizedPath, {
        ...init,
        headers
      });
    }
  }

  const loadData = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError('');

    const [
      companyResult,
      noticesResult,
      historyResult,
      allCompaniesResult,
      factSheetResult,
      batteryRecyclerResult,
      partnershipProfileResult,
      mpcbProfileResult,
      cpcbProfileResult,
      spcbCompanyProfileResult
    ] = await Promise.all([
      supabase.from('intel_companies').select('*').eq('id', companyId).maybeSingle(),
      supabase.from('intel_notices').select('*').eq('company_id', companyId).order('notice_date', { ascending: false }),
      supabase.from('intel_field_history').select('*').eq('entity_table', 'intel_companies').eq('entity_id', companyId).order('resolved_at', { ascending: false }).limit(50),
      supabase.from('intel_companies').select('*').neq('id', companyId).order('updated_at', { ascending: false }).limit(200),
      supabase.from('intel_company_fact_sheets').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('intel_battery_recycler_profiles').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('intel_recycler_partnership_profiles').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('intel_mpcb_recycler_profiles').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('intel_cpcb_recycler_profiles').select('*').eq('company_id', companyId).maybeSingle(),
      supabase.from('intel_spcb_company_profiles').select('*').eq('company_id', companyId).maybeSingle()
    ]);

    if (companyResult.error) {
      setError(companyResult.error.message);
      setLoading(false);
      return;
    }

    if (!companyResult.data) {
      setError('Company not found');
      setLoading(false);
      return;
    }

    setCompany(companyResult.data as IntelCompany);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (token) {
        const provRes = await fetch(`/api/intel/provenance?company_id=${encodeURIComponent(companyId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (provRes.ok) {
          const prov = await provRes.json();
          setProvenance({
            shareable: Boolean(prov.shareable),
            sources: prov.sources || [],
            fields: prov.fields || [],
          });
        }
      }
    } catch {
      /* provenance is optional */
    }
    setNotices((noticesResult.data || []) as IntelNotice[]);
    setFieldHistory((historyResult.data || []) as FieldHistory[]);
    setAllCompanies((allCompaniesResult.data || []) as IntelCompany[]);
    setFactSheet((factSheetResult.data || null) as CompanyFactSheet | null);
    setBatteryRecyclerProfile((batteryRecyclerResult.data || null) as BatteryRecyclerProfile | null);
    setPartnershipProfile((partnershipProfileResult.data || null) as RecyclerPartnershipProfile | null);
    setMpcbProfile((mpcbProfileResult.data || null) as MpcbRecyclerProfile | null);
    setCpcbProfile((cpcbProfileResult.data || null) as CpcbRecyclerProfile | null);
    setSpcbCompanyProfile((spcbCompanyProfileResult.data || null) as SpcbCompanyProfile | null);

    const sourceDocumentIds = (noticesResult.data || [])
      .map((notice: any) => notice.source_document_id)
      .filter((value: string | null) => Boolean(value));

    if (sourceDocumentIds.length > 0) {
      const docsResult = await supabase
        .from('intel_source_documents')
        .select('id, source_document_ref, source_id, document_type, ingested_at')
        .in('id', sourceDocumentIds as string[])
        .order('ingested_at', { ascending: false });

      if (!docsResult.error) {
        const docs = (docsResult.data || []) as SourceDocument[];
        setDocuments(docs);

        const sourceIds = [...new Set(docs.map((doc) => doc.source_id).filter(Boolean))];
        if (sourceIds.length > 0) {
          const sourceResult = await supabase
            .from('intel_sources')
            .select('id, source_name, license_flag')
            .in('id', sourceIds);

          if (!sourceResult.error) {
            setSources((sourceResult.data || []) as IntelSource[]);
          }
        }
      }
    } else {
      setDocuments([]);
      setSources([]);
    }

    const loadDynamicFieldsFromSupabaseFallback = async () => {
      const primaryColumnsResult = await supabase
        .from('intel_dynamic_columns')
        .select('id, column_key, approved_name, approved_type, applied_to_table, applied_column, applied_at')
        .eq('target_table', 'intel_companies')
        .in('approval_status', ['approved', 'renamed']);

      let columns = (primaryColumnsResult.data || []) as CompanyDynamicFieldColumn[];

      if (primaryColumnsResult.error) {
        const fallbackColumnsResult = await supabase
          .from('intel_dynamic_columns')
          .select('id, column_key, approved_name, approved_type, applied_to_table, applied_at')
          .eq('target_table', 'intel_companies')
          .in('approval_status', ['approved', 'renamed']);

        if (!fallbackColumnsResult.error) {
          columns = ((fallbackColumnsResult.data || []) as Array<Omit<CompanyDynamicFieldColumn, 'applied_column'>>).map(
            (row) => ({ ...row, applied_column: null })
          );
        }
      }

      const appliedColumns = [...new Set(columns.map((row) => row.applied_column).filter(Boolean))] as string[];

      let values: Record<string, unknown> = {};
      if (appliedColumns.length > 0) {
        const selectList = ['company_id', ...appliedColumns].join(',');
        const extResult = await supabase
          .from('intel_company_ext')
          .select(selectList)
          .eq('company_id', companyId)
          .maybeSingle();

        if (!extResult.error && extResult.data) {
          const extRow = extResult.data as unknown as Record<string, unknown>;
          for (const column of columns) {
            const key = column.approved_name || column.column_key;
            const sourceColumn = column.applied_column || '';
            values[key] = sourceColumn ? extRow[sourceColumn] : null;
          }
        }
      }

      setDynamicFieldColumns(columns);
      setDynamicFieldValues(values);
    };

    const {
      data: { session }
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    setTradeSignals(null);
    if (token) {
      try {
        const dynamicResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/dynamic-fields`, token);

        if (dynamicResponse.ok) {
          const dynamicPayload = await dynamicResponse.json();
          setDynamicFieldColumns((dynamicPayload.columns || []) as CompanyDynamicFieldColumn[]);
          setDynamicFieldValues((dynamicPayload.values || {}) as Record<string, unknown>);
        } else {
          await loadDynamicFieldsFromSupabaseFallback();
        }

        const mergeHistoryResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/merge-history`, token);
        if (mergeHistoryResponse.ok) {
          const mergePayload = await mergeHistoryResponse.json();
          setMergeHistory({
            mappings: mergePayload.mappings || [],
            audits: mergePayload.audits || []
          });
        }

        const geoInsightsResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/geo-insights`, token);
        if (geoInsightsResponse.ok) {
          const geoPayload = await geoInsightsResponse.json();
          setGooglePlacesData((geoPayload.google_places || null) as GooglePlacesData | null);
          setCompanyGeoData((geoPayload.geo_data || null) as CompanyGeoData | null);
          setNearbyRecyclers((geoPayload.nearby_recyclers || []) as NearbyRecycler[]);
          setGeoEnrichmentLogs((geoPayload.enrichment_logs || []) as Array<Record<string, unknown>>);
          setGeoDuplicateClusters((geoPayload.duplicate_clusters || []) as Array<Record<string, unknown>>);
        }

        const locationsResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/locations`, token);
        if (locationsResponse.ok) {
          const locationsPayload = await locationsResponse.json();
          setLocations((locationsPayload.rows || []) as CompanyLocation[]);
        }

        const registrationsResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/registrations`, token);
        if (registrationsResponse.ok) {
          const registrationsPayload = await registrationsResponse.json();
          setRegistrations((registrationsPayload.rows || []) as CompanyRegistration[]);
        } else {
          setRegistrations([]);
        }

        const associatedPeopleResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/associated-people`, token);
        if (associatedPeopleResponse.ok) {
          const associatedPeoplePayload = await associatedPeopleResponse.json();
          setAssociatedPeople((associatedPeoplePayload.rows || []) as AssociatedPerson[]);
        } else {
          setAssociatedPeople([]);
        }

        const tradeSignalsResponse = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/trade-signals`, token);
        if (tradeSignalsResponse.ok) {
          const tradeSignalsPayload = await tradeSignalsResponse.json();
          setTradeSignals((tradeSignalsPayload || null) as TradeSignalsPayload | null);
        }
      } catch {
        await loadDynamicFieldsFromSupabaseFallback();
      }
    }

    // ── Activity Timeline ─────────────────────────────────────────────────────
    try {
      const [rawRecordsRes, telecallRes] = await Promise.all([
        supabase
          .from('intel_raw_records')
          .select('id, created_at, source_id, external_record_id, observed_at, payload')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true })
          .limit(20),
        supabase
          .from('leads')
          .select('id, created_at, description')
          .ilike('company_name', companyResult.data?.canonical_name || '')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const events: TimelineEvent[] = [];
      setRawIntelRecords((rawRecordsRes.data || []) as RawIntelRecord[]);

      // Company created event
      if (companyResult.data?.updated_at) {
        events.push({
          id: 'company-created',
          at: companyResult.data.updated_at,
          icon: '🏢',
          label: 'Company record created / last updated',
        });
      }

      // Raw record imports
      for (const r of (rawRecordsRes.data || [])) {
        events.push({
          id: `raw-${r.id}`,
          at: r.created_at,
          icon: '📥',
          label: 'Imported from source',
          detail: r.source_id ? `source: ${String(r.source_id).slice(0, 8)}…` : undefined,
        });
      }

      // Notices (with deadlines)
      for (const n of (noticesResult.data || [])) {
        if (n.notice_date) {
          events.push({
            id: `notice-${n.id}`,
            at: n.notice_date,
            icon: '📋',
            label: `Notice: ${n.notice_type || 'Compliance notice'}`,
            detail: [n.authority, n.penalty_inr ? `₹${Number(n.penalty_inr).toLocaleString('en-IN')}` : null].filter(Boolean).join(' · ') || undefined,
          });
        }
      }

      // Telecalling pushes
      for (const t of (telecallRes.data || [])) {
        events.push({
          id: `tcall-${t.id}`,
          at: t.created_at,
          icon: '📞',
          label: 'Pushed to Telecalling queue',
          detail: t.description ? String(t.description).split('\n')[0] : undefined,
        });
      }

      // Sort newest first
      events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      setTimeline(events);
    } catch { /* timeline is non-critical */ }

    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalPenalty = useMemo(
    () => notices.reduce((sum, notice) => sum + Number(notice.penalty_inr || 0), 0),
    [notices]
  );

  const blockedSources = useMemo(() => sources.filter((source) => source.license_flag !== 'shareable'), [sources]);
  const pushBlockedByLicense = blockedSources.length > 0;
  const showPartnershipProfile = useMemo(() => {
    const typeSignals = [
      company?.company_type,
      factSheet?.industry_classification,
      partnershipProfile?.company_type,
      cpcbProfile?.recycler_category,
      mpcbProfile?.cpcb_type,
      mpcbProfile?.mpcb_type
    ]
      .map((entry) => cleanDisplayValue(entry).toLowerCase())
      .filter(Boolean)
      .join(' ');

    return /\brecycler\b/.test(typeSignals);
  }, [company?.company_type, factSheet?.industry_classification, partnershipProfile?.company_type, cpcbProfile?.recycler_category, mpcbProfile?.cpcb_type, mpcbProfile?.mpcb_type]);
  const isRecyclerEntity = useMemo(() => {
    if (batteryRecyclerProfile || cpcbProfile || mpcbProfile) return true;
    const signalText = [
      company?.company_type,
      factSheet?.industry_classification,
      factSheet?.segment_tag,
      partnershipProfile?.company_type,
      cpcbProfile?.recycler_category,
      mpcbProfile?.cpcb_type,
      mpcbProfile?.mpcb_type,
      ...registrations.map((registration) => registration.registration_type || ''),
      ...registrations.map((registration) => registration.waste_category || '')
    ]
      .map((entry) => cleanDisplayValue(entry).toLowerCase())
      .filter(Boolean)
      .join(' ');

    const hasRecyclerSignal = /recycler|recycling|dismantler|refurbisher|pro\b|authorized recycler/.test(signalText);
    const hasPiboSignal = /producer|pibo|brand owner|importer|manufacturer|trader/.test(signalText);
    if (hasRecyclerSignal && !hasPiboSignal) return true;
    if (hasRecyclerSignal && hasPiboSignal) return /recycler/.test(cleanDisplayValue(company?.company_type).toLowerCase());
    return false;
  }, [batteryRecyclerProfile, company?.company_type, cpcbProfile, factSheet?.industry_classification, factSheet?.segment_tag, mpcbProfile, partnershipProfile?.company_type, registrations]);
  const isPiboEntity = !isRecyclerEntity;
  useEffect(() => {
    const recyclerTabs = new Set(['overview', 'recyclers', 'compliance', 'locations', 'decision-makers', 'crm-activity', 'ai-insights', 'intelligence']);
    const piboTabs = new Set(['overview', 'compliance', 'decision-makers', 'imports-exports', 'trigger-events', 'financials', 'locations', 'recyclers', 'crm-activity', 'ai-insights', 'intelligence']);
    const allowed = isRecyclerEntity ? recyclerTabs : piboTabs;
    if (!allowed.has(activeIntelTab)) setActiveIntelTab('overview');
  }, [isRecyclerEntity, activeIntelTab]);
  const spcbProfile = useMemo(() => {
    if (!isRecyclerEntity) return null;

    const states = new Set<string>();
    if (company?.state) states.add(company.state);
    if (factSheet?.state) states.add(factSheet.state);
    for (const registration of registrations) {
      if (registration.issuing_state) states.add(registration.issuing_state);
    }

    const spcbRegistrations = [...states]
      .map((stateValue) => {
        const board = resolveSpcbByState(stateValue);
        if (!board) return null;

        const registrationsForState = registrations.filter((registration) => {
          const issuingState = cleanDisplayValue(registration.issuing_state).toLowerCase();
          const authority = cleanDisplayValue(registration.authority).toLowerCase();
          return issuingState === board.state.toLowerCase() || authority === board.boardCode.toLowerCase();
        });

        return {
          state: board.state,
          board_code: board.boardCode,
          board_name: board.boardName,
          registrations: registrationsForState
        };
      })
      .filter(Boolean) as Array<{ state: string; board_code: string; board_name: string; registrations: CompanyRegistration[] }>;

    const primary = spcbRegistrations[0] || null;
    return {
      board_name: primary?.board_name || null,
      board_code: primary?.board_code || null,
      state: primary?.state || null,
      registrations: primary?.registrations || [],
      spcb_registrations: spcbRegistrations
    };
  }, [company?.state, factSheet?.state, isRecyclerEntity, registrations]);
  const ctoRegistrations = useMemo(() => {
    return registrations.filter((registration) => {
      const registrationType = cleanDisplayValue(registration.registration_type).toLowerCase();
      const authority = cleanDisplayValue(registration.authority).toLowerCase();
      return /cto|consent to operate|consent|authorization/.test(registrationType) || /spcb|pollution control|mpcb/.test(authority);
    });
  }, [registrations]);
  const workbookSignals = useMemo(() => {
    const factRaw = factSheet?.raw_payload || null;
    const batteryRaw = batteryRecyclerProfile?.raw_payload || null;
    const partnershipRaw = partnershipProfile?.raw_payload || null;
    const mpcbRaw = mpcbProfile?.raw_payload || null;

    return {
      contactName: pickWorkbookValue(
        partnershipProfile?.primary_contact_name,
        findWorkbookValue(partnershipRaw, [/contact_name/, /contact_person/, /primary_contact/])
      ),
      email: pickWorkbookValue(factSheet?.email_direct, findWorkbookValue(factRaw, [/email/])),
      phone: pickWorkbookValue(factSheet?.phone, findWorkbookValue(factRaw, [/phone/, /mobile/, /contact_number/])),
      website: pickWorkbookValue(factSheet?.website, company?.website),
      address: pickWorkbookValue(factSheet?.address_full, findWorkbookValue(factRaw, [/full_address/, /address/])),
      postalCode: pickWorkbookValue(factSheet?.postal_code, findWorkbookValue(factRaw, [/pin_code/, /pincode/, /postal_code/])),
      contactStatus: pickWorkbookValue(
        factSheet?.contact_status,
        findWorkbookValue(factRaw, [/contact_status/])
      ),
      creditTier: pickWorkbookValue(
        factSheet?.credit_tier,
        findWorkbookValue(factRaw, [/credit_tier/])
      ),
      partnershipPriority: pickWorkbookValue(
        partnershipProfile?.partnership_priority,
        factSheet?.partnership_priority,
        findWorkbookValue(factRaw, [/partnership_priority/, /priority/])
      ),
      partnerRegion: pickWorkbookValue(
        partnershipProfile?.partner_region,
        findWorkbookValue(partnershipRaw, [/partner_region/, /region/])
      ),
      geoTier: pickWorkbookValue(
        partnershipProfile?.geo_tier,
        findWorkbookValue(partnershipRaw, [/geo_tier/])
      ),
      outreachStatus: pickWorkbookValue(
        partnershipProfile?.outreach_status,
        findWorkbookValue(partnershipRaw, [/^status$/, /outreach_status/, /campaign_status/]),
        factSheet?.contact_status,
        findWorkbookValue(factRaw, [/contact_status/])
      ),
      emailVariant: pickWorkbookValue(
        partnershipProfile?.email_variant,
        findWorkbookValue(partnershipRaw, [/email_variant/])
      ),
      certIssueDate: pickWorkbookValue(
        factSheet?.cert_issue_date,
        findWorkbookValue(factRaw, [/cert_issue_date/, /issue_date/])
      ),
      estNextRenewal: pickWorkbookValue(
        factSheet?.est_next_renewal,
        findWorkbookValue(factRaw, [/est_next_renewal/, /next_renewal/])
      ),
      renewalUrgency: pickWorkbookValue(
        factSheet?.renewal_urgency,
        findWorkbookValue(factRaw, [/renewal_urgency/])
      ),
      outreachAngle: pickWorkbookValue(
        partnershipProfile?.outreach_angle,
        factSheet?.outreach_angle,
        factSheet?.personalization_hook,
        findWorkbookValue(factRaw, [/outreach_angle/])
      ),
      subjectUsed: pickWorkbookValue(
        partnershipProfile?.subject_used,
        findWorkbookValue(partnershipRaw, [/subject_used/, /email_subject/, /subject_line/])
      ),
      variantUsed: pickWorkbookValue(
        partnershipProfile?.variant_used,
        findWorkbookValue(partnershipRaw, [/variant_used/, /campaign_variant/, /template_variant/])
      ),
      partnershipScore: pickWorkbookValue(
        partnershipProfile?.partnership_score,
        factSheet?.relevance_score,
        findWorkbookValue(partnershipRaw, [/partnership_score/, /priority_score/])
      ),
      specialization: pickWorkbookValue(
        partnershipProfile?.recycler_specialization,
        batteryRecyclerProfile?.recycler_specialization,
        findWorkbookValue(factRaw, [/recycler_specialisation/, /speciali[sz]ation/]),
        (batteryRecyclerProfile?.battery_categories || []).join(', ')
      ),
      scaleIndicator: pickWorkbookValue(
        partnershipProfile?.scale_indicator,
        batteryRecyclerProfile?.scale_indicator,
        factSheet?.employee_count_band,
        findWorkbookValue(factRaw, [/scale_indicator/])
      ),
      liCreditsMt: pickWorkbookValue(
        batteryRecyclerProfile?.li_credits_mt,
        findWorkbookValue(batteryRaw, [/li_credits/, /lithium_credits/, /li_credits_mt/])
      ),
      mgCreditsMt: pickWorkbookValue(
        batteryRecyclerProfile?.mg_credits_mt,
        findWorkbookValue(batteryRaw, [/mg_credits/, /mg_credits_mt/])
      ),
      feCreditsMt: pickWorkbookValue(
        batteryRecyclerProfile?.fe_credits_mt,
        findWorkbookValue(batteryRaw, [/fe_credits/, /fe_credits_mt/])
      ),
      mpcbStatus: pickWorkbookValue(
        mpcbProfile?.mpcb_status,
        findWorkbookValue(mpcbRaw, [/^mpcb_status$/, /mpcb_status/])
      ),
      cpcbStatus: pickWorkbookValue(
        mpcbProfile?.cpcb_status,
        findWorkbookValue(mpcbRaw, [/^cpcb_status$/, /cpcb_status/])
      ),
      mpcbType: pickWorkbookValue(
        mpcbProfile?.mpcb_type,
        findWorkbookValue(mpcbRaw, [/type_at_mpcb/, /mpcb_type/])
      ),
      cpcbType: pickWorkbookValue(
        mpcbProfile?.cpcb_type,
        findWorkbookValue(mpcbRaw, [/type_at_cpcb/, /cpcb_type/])
      ),
      regionalOffice: pickWorkbookValue(
        mpcbProfile?.regional_office,
        findWorkbookValue(mpcbRaw, [/regional_office/])
      ),
      mpcbCapacityAllotted: pickWorkbookValue(
        mpcbProfile?.capacity_allotted_mt,
        findWorkbookValue(mpcbRaw, [/capacity_allotted/, /consent.*capacity/])
      ),
      mpcbConsentRef: pickWorkbookValue(
        mpcbProfile?.consent_authorization_ref,
        findWorkbookValue(mpcbRaw, [/consent.*authorization/, /authorization_no/, /authorisation_no/])
      ),
      mpcbConsentValidity: pickWorkbookValue(
        mpcbProfile?.consent_valid_upto,
        findWorkbookValue(mpcbRaw, [/validity_of_consent_authorization/, /^validity$/, /consent.*validity/])
      ),
      mpcbRemark: pickWorkbookValue(
        mpcbProfile?.remarks,
        findWorkbookValue(mpcbRaw, [/remark/, /remarks/])
      )
    };
  }, [batteryRecyclerProfile, company?.website, factSheet, mpcbProfile, partnershipProfile]);
  const ctoExpiryStatus = useMemo(() => {
    const validityCandidates = [
      spcbCompanyProfile?.authorization_valid_upto,
      spcbCompanyProfile?.cto_valid_upto,
      workbookSignals.mpcbConsentValidity,
      ...ctoRegistrations.map((registration) => registration.valid_upto)
    ]
      .map((value) => cleanDisplayValue(value))
      .filter(Boolean);

    const validTimes = validityCandidates
      .map((value) => toDateMs(value))
      .filter((value): value is number => value !== null)
      .sort((left, right) => left - right);

    if (!validTimes.length) {
      return {
        label: 'Unknown',
        tone: 'text-slate-300 border-slate-600 bg-slate-800/60',
        daysRemaining: null as number | null
      };
    }

    const nearestExpiryMs = validTimes[0];
    const daysRemaining = Math.ceil((nearestExpiryMs - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return {
        label: 'Expired',
        tone: 'text-rose-200 border-rose-600/60 bg-rose-900/30',
        daysRemaining
      };
    }

    if (daysRemaining <= 90) {
      return {
        label: 'Expiring Soon',
        tone: 'text-amber-200 border-amber-600/60 bg-amber-900/30',
        daysRemaining
      };
    }

    return {
      label: 'Valid',
      tone: 'text-emerald-200 border-emerald-600/60 bg-emerald-900/30',
      daysRemaining
    };
  }, [ctoRegistrations, spcbCompanyProfile?.authorization_valid_upto, spcbCompanyProfile?.cto_valid_upto, workbookSignals.mpcbConsentValidity]);
  const spcbRawPayloadRows = useMemo(() => {
    const rawPayload = spcbCompanyProfile?.raw_payload;
    if (!rawPayload || typeof rawPayload !== 'object') return [] as Array<{ key: string; value: string }>;

    const effectivePayload = typeof rawPayload.raw_row === 'object' && rawPayload.raw_row !== null
      ? rawPayload.raw_row as Record<string, unknown>
      : rawPayload;

    return Object.entries(effectivePayload)
      .filter(([key, value]) => !key.startsWith('__') && value !== null && value !== undefined && cleanDisplayValue(value) !== '')
      .map(([key, value]) => ({
        key,
        value: Array.isArray(value)
          ? value.map((entry) => cleanDisplayValue(entry)).filter(Boolean).join(', ')
          : typeof value === 'object'
            ? JSON.stringify(value)
            : cleanDisplayValue(value)
      }))
      .slice(0, 30);
  }, [spcbCompanyProfile?.raw_payload]);
  const batteryCertificateIssueDates = useMemo(() => {
    const dates = new Set<string>();
    for (const registration of registrations) {
      const category = cleanDisplayValue(registration.waste_category).toLowerCase();
      const type = cleanDisplayValue(registration.registration_type).toLowerCase();
      const source = cleanDisplayValue(registration.source_label).toLowerCase();
      const issueDate = cleanDisplayValue(registration.issue_date);
      if (!issueDate) continue;

      const isBatterySignal = category.includes('battery') || type.includes('battery') || source.includes('battery');
      if (isBatterySignal) dates.add(issueDate);
    }

    if (workbookSignals.certIssueDate) dates.add(workbookSignals.certIssueDate);
    return [...dates].sort((left, right) => left.localeCompare(right));
  }, [registrations, workbookSignals.certIssueDate]);
  const certificateIssueDates = useMemo(() => {
    const dates = new Set<string>();
    for (const registration of registrations) {
      const issueDate = cleanDisplayValue(registration.issue_date);
      if (issueDate) dates.add(issueDate);
    }

    if (workbookSignals.certIssueDate) dates.add(workbookSignals.certIssueDate);
    return [...dates].sort((left, right) => left.localeCompare(right));
  }, [registrations, workbookSignals.certIssueDate]);
  const applicableEprCategories = useMemo(() => {
    const derived = new Set<string>();

    for (const notice of notices) {
      const match = normalizeCategoryMatch(cleanDisplayValue(notice.waste_category));
      if (match) derived.add(match);
    }

    if (batteryRecyclerProfile?.battery_categories?.length || batteryRecyclerProfile?.annual_processing_capacity_mt || batteryRecyclerProfile?.cpcb_registration_number) {
      derived.add('Battery');
    }

    const sourceTexts = [
      company?.canonical_name,
      company?.website,
      factSheet?.industry_classification,
      factSheet?.segment_tag,
      factSheet?.notes,
      factSheet?.score_rationale,
      factSheet?.personalization_hook,
      batteryRecyclerProfile?.recycler_name,
      batteryRecyclerProfile?.recycler_specialization,
      batteryRecyclerProfile?.processing_technology,
      workbookSignals.specialization,
      mpcbProfile?.enrichment_summary,
      ...(mpcbProfile?.enrichment_epr_categories || []),
      ...flattenCategorySource(factSheet?.raw_payload),
      ...flattenCategorySource(batteryRecyclerProfile?.raw_payload),
      ...flattenCategorySource(mpcbProfile?.raw_payload)
    ];

    for (const value of sourceTexts) {
      const match = normalizeCategoryMatch(cleanDisplayValue(value));
      if (match) derived.add(match);
    }

    return [...derived].sort((left, right) => left.localeCompare(right));
  }, [batteryRecyclerProfile, company?.canonical_name, company?.website, factSheet, mpcbProfile, notices, workbookSignals.specialization]);

  const signalCorpus = useMemo(() => {
    const chunks = [
      company?.canonical_name,
      company?.company_type,
      company?.website,
      factSheet?.industry_classification,
      factSheet?.notes,
      factSheet?.score_rationale,
      factSheet?.recent_trigger,
      factSheet?.registration_ids,
      batteryRecyclerProfile?.processing_technology,
      batteryRecyclerProfile?.recycler_specialization,
      mpcbProfile?.enrichment_summary,
      mpcbProfile?.website_description,
      cpcbProfile?.authorization_type,
      ...registrations.map((item) => item.registration_type || ''),
      ...registrations.map((item) => item.waste_category || ''),
      ...registrations.map((item) => item.authority || ''),
      ...notices.map((item) => item.notice_type || ''),
      ...notices.map((item) => item.waste_category || ''),
      ...flattenCategorySource(factSheet?.raw_payload),
      ...flattenCategorySource(batteryRecyclerProfile?.raw_payload),
      ...flattenCategorySource(mpcbProfile?.raw_payload),
      ...Object.values(dynamicFieldValues).map((value) => (typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')))
    ];
    return chunks.filter(Boolean).join(' ').toLowerCase();
  }, [batteryRecyclerProfile, company?.canonical_name, company?.company_type, company?.website, cpcbProfile?.authorization_type, dynamicFieldValues, factSheet, mpcbProfile, notices, registrations]);

  const complianceApplicability = useMemo<ComplianceApplicabilityRow[]>(() => {
    const catalog: Array<{ key: string; complianceType: string; keywords: string[] }> = [
      { key: 'plastic', complianceType: 'EPR Plastic', keywords: ['plastic', 'packaging', 'polymer', 'pet'] },
      { key: 'battery', complianceType: 'Battery EPR', keywords: ['battery', 'lithium', 'lead acid', 'black mass'] },
      { key: 'ewaste', complianceType: 'E-waste EPR', keywords: ['e-waste', 'electronic', 'waste electrical', 'it asset'] },
      { key: 'tyre', complianceType: 'Tyre EPR', keywords: ['tyre', 'tire', 'rubber'] },
      { key: 'cd_waste', complianceType: 'C&D Waste', keywords: ['construction', 'demolition', 'rera', 'infra project'] },
      { key: 'hazardous', complianceType: 'Hazardous Waste', keywords: ['hazardous', 'used oil', 'red category', 'haz waste'] }
    ];

    return catalog.map((entry) => {
      const matchedByCategory = applicableEprCategories.some((category) => category.toLowerCase().includes(entry.key.replace('_', ' ')) || entry.key.includes(category.toLowerCase()));
      const matchedByCorpus = entry.keywords.some((keyword) => signalCorpus.includes(keyword));
      const relatedRegs = registrations.filter((registration) => {
        const combined = `${registration.registration_type || ''} ${registration.waste_category || ''} ${registration.segment_tag || ''}`.toLowerCase();
        return entry.keywords.some((keyword) => combined.includes(keyword));
      });
      const applicable = matchedByCategory || matchedByCorpus || relatedRegs.length > 0;
      const registrationStatus = applicable ? registrationStatusFromRecords(relatedRegs) : 'Not Applicable';
      const riskLevel = riskFromRegistrationStatus(registrationStatus, applicable);

      const logicSignals: string[] = [];
      if (matchedByCategory) logicSignals.push('Category signal');
      if (matchedByCorpus) logicSignals.push('Business/import signal');
      if (relatedRegs.length > 0) logicSignals.push(`Registrations: ${relatedRegs.length}`);

      return {
        key: entry.key,
        complianceType: entry.complianceType,
        applicable,
        registrationStatus,
        riskLevel,
        logicSignals: logicSignals.length ? logicSignals : ['No direct signal yet']
      };
    });
  }, [applicableEprCategories, registrations, signalCorpus]);

  const riskScoreBreakdown = useMemo(() => {
    const hasMissingRegistration = complianceApplicability.some((row) => row.applicable && row.registrationStatus === 'Not Registered');
    const hasImportSignal = /import|icegate|hs code|dgft|importer/.test(signalCorpus);
    const hasRedCategorySignal = /red category|category red/.test(signalCorpus);
    const hasExpiredConsent = complianceApplicability.some((row) => row.registrationStatus === 'Expired');
    const hasActiveNotices = notices.length > 0;

    const breakdown = [
      { parameter: 'Registration missing', score: hasMissingRegistration ? 30 : 0 },
      { parameter: 'Import activity detected', score: hasImportSignal ? 20 : 0 },
      { parameter: 'Pollution category red', score: hasRedCategorySignal ? 15 : 0 },
      { parameter: 'Expired consent/registration', score: hasExpiredConsent ? 25 : 0 },
      { parameter: 'Active notices', score: hasActiveNotices ? 40 : 0 }
    ];

    const total = breakdown.reduce((sum, row) => sum + row.score, 0);
    return { breakdown, total, band: scoreToBand(total) };
  }, [complianceApplicability, notices.length, signalCorpus]);

  const stakeholderRows = useMemo(() => {
    const roleBuckets: Array<{ bucket: string; keywords: RegExp }> = [
      { bucket: 'Management', keywords: /founder|director|coo|ceo|md|vp|head/i },
      { bucket: 'Compliance', keywords: /compliance|ehs|sustainability|esg|epr/i },
      { bucket: 'Procurement', keywords: /procurement|vendor|purchase|sourcing/i },
      { bucket: 'Finance', keywords: /finance|accounts|tax|legal|audit/i }
    ];

    return associatedPeople.map((person) => {
      const bucket = roleBuckets.find((item) => item.keywords.test(cleanDisplayValue(person.designation)))?.bucket || 'Management';
      const confidenceScore = [person.email, person.phone, person.linkedin_url].filter(Boolean).length * 30 + (person.designation ? 10 : 0);
      return {
        id: person.id,
        name: person.person_name,
        designation: person.designation || '-',
        bucket,
        email: person.email,
        phone: person.phone,
        linkedin: person.linkedin_url,
        lastActivity: person.updated_at,
        confidenceScore: Math.min(100, confidenceScore)
      };
    });
  }, [associatedPeople]);

  const triggerEvents = useMemo<TriggerEventRow[]>(() => {
    const events: TriggerEventRow[] = [];

    for (const notice of notices.slice(0, 8)) {
      events.push({
        id: `notice-${notice.id}`,
        event: `${notice.notice_type || 'Regulatory notice issued'}`,
        eventDate: notice.notice_date || notice.deadline_date || null,
        source: notice.authority || 'SPCB/CPCB',
        relevanceScore: 92
      });
    }

    const upcomingExpiry = registrations
      .filter((registration) => {
        const validUpto = toDateMs(registration.valid_upto);
        if (validUpto === null) return false;
        const days = Math.ceil((validUpto - Date.now()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 90;
      })
      .slice(0, 5);

    for (const registration of upcomingExpiry) {
      events.push({
        id: `expiry-${registration.id}`,
        event: `${registration.registration_type || 'License'} expiry approaching`,
        eventDate: registration.valid_upto,
        source: registration.authority || registration.source_label || 'Registration record',
        relevanceScore: 88
      });
    }

    if (factSheet?.recent_trigger) {
      events.push({
        id: 'fact-trigger',
        event: factSheet.recent_trigger,
        eventDate: company?.updated_at || null,
        source: 'Fact sheet / web enrichment',
        relevanceScore: 75
      });
    }

    if (/import increase|imports increased|new importer/.test(signalCorpus)) {
      events.push({
        id: 'import-signal',
        event: 'Import activity increase detected',
        eventDate: company?.updated_at || null,
        source: 'DGFT/ICEGATE signal model',
        relevanceScore: 86
      });
    }

    if (/funding|raised|series [a-z]/.test(signalCorpus)) {
      events.push({
        id: 'funding-signal',
        event: 'Funding or expansion signal detected',
        eventDate: company?.updated_at || null,
        source: 'MCA/news crawl signal',
        relevanceScore: 72
      });
    }

    return events
      .sort((left, right) => (toDateMs(right.eventDate) || 0) - (toDateMs(left.eventDate) || 0))
      .slice(0, 12);
  }, [company?.updated_at, factSheet?.recent_trigger, notices, registrations, signalCorpus]);

  const fallbackImportExportIntel = useMemo(() => {
    const recentRecords = rawIntelRecords
      .map((record) => {
        const payload = record.payload || {};
        const rawRow = payload.raw_row && typeof payload.raw_row === 'object'
          ? payload.raw_row as Record<string, unknown>
          : null;
        const extractedPayload = payload.extracted_payload && typeof payload.extracted_payload === 'object'
          ? payload.extracted_payload as Record<string, unknown>
          : null;
        const classification = extractedPayload?.classification && typeof extractedPayload.classification === 'object'
          ? extractedPayload.classification as Record<string, unknown>
          : null;
        const importProfile = pickWorkbookValue(
          findFirstValueFromObject(rawRow, [/import_profile/, /profile/]),
          findFirstValueFromObject(payload, [/import_profile/]),
          company?.company_type
        );
        const iecCode = pickWorkbookValue(
          findFirstValueFromObject(rawRow, [/^iec$/, /import_export_code/, /dgft/]),
          findFirstValueFromObject(payload, [/^iec$/, /import_export_code/]),
          findWorkbookValue(factSheet?.raw_payload, [/^iec$/, /import_export_code/])
        );
        const hsCodes = collectMatchingValuesFromObject(rawRow, [/hs_code/, /^hsn$/, /hsn_code/, /tariff/]);
        const productCategories = collectMatchingValuesFromObject(rawRow, [/product_category/, /waste_category/, /category/, /material/]);
        const certificateIssueDate = pickWorkbookValue(
          findFirstValueFromObject(rawRow, [/certificate_issue_date/, /cert_issue_date/, /^issue_date$/]),
          findFirstValueFromObject(payload, [/certificate_issue_date/, /cert_issue_date/, /^issue_date$/])
        );
        const registrationId = pickWorkbookValue(
          findFirstValueFromObject(rawRow, [/registration(_number|_no|_id)?$/, /certificate(_number|_no|_id)?$/, /authori[sz]ation(_number|_no|_id)?$/]),
          findFirstValueFromObject(payload, [/registration(_number|_no|_id)?$/, /certificate(_number|_no|_id)?$/])
        );
        const importerFlag = Boolean(classification?.importer) || /importer/.test(cleanDisplayValue(importProfile).toLowerCase());
        const exporterFlag = /export|exporter/.test(`${cleanDisplayValue(importProfile)} ${cleanDisplayValue(rawRow?.applicant_type)} ${cleanDisplayValue(rawRow?.company_type)}`.toLowerCase());

        return {
          id: record.id,
          observedAt: record.observed_at || record.created_at,
          sourceId: record.source_id,
          sourceLabel: record.source_id ? `Intel source ${record.source_id.slice(0, 8)}` : 'Intel import registry',
          externalRecordId: record.external_record_id,
          importProfile: cleanDisplayValue(importProfile) || null,
          iecCode: cleanDisplayValue(iecCode) || null,
          hsCodes,
          productCategories,
          certificateIssueDate: cleanDisplayValue(certificateIssueDate) || null,
          registrationId: cleanDisplayValue(registrationId) || null,
          importerFlag,
          exporterFlag
        };
      })
      .filter((record) => record.importerFlag || record.exporterFlag || record.iecCode || record.hsCodes.length > 0 || record.registrationId || record.certificateIssueDate)
      .sort((left, right) => (toDateMs(right.observedAt) || 0) - (toDateMs(left.observedAt) || 0));

    const hsCodeSet = new Set<string>();
    const importProfiles = new Set<string>();
    const productSet = new Set<string>();
    const iecCodes = new Set<string>();
    let importerSignals = 0;
    let exporterSignals = 0;

    for (const record of recentRecords) {
      if (record.importerFlag) importerSignals += 1;
      if (record.exporterFlag) exporterSignals += 1;
      if (record.importProfile) importProfiles.add(record.importProfile);
      if (record.iecCode) iecCodes.add(record.iecCode);
      for (const hsCode of record.hsCodes) hsCodeSet.add(hsCode);
      for (const productCategory of record.productCategories) productSet.add(productCategory);
    }

    const triggerRows: TriggerEventRow[] = [];
    const latestRecord = recentRecords[0] || null;
    if (latestRecord?.importerFlag) {
      triggerRows.push({
        id: `import-profile-${latestRecord.id}`,
        event: `${latestRecord.importProfile || 'Importer'} registration ingested`,
        eventDate: latestRecord.certificateIssueDate || latestRecord.observedAt,
        source: latestRecord.sourceId ? `Intel source ${latestRecord.sourceId.slice(0, 8)}` : 'Intel import registry',
        relevanceScore: 84
      });
    }
    if (latestRecord?.iecCode) {
      triggerRows.push({
        id: `iec-${latestRecord.id}`,
        event: `IEC-linked trade record detected (${latestRecord.iecCode})`,
        eventDate: latestRecord.observedAt,
        source: 'DGFT / importer workbook signal',
        relevanceScore: 79
      });
    }
    if (latestRecord?.hsCodes.length) {
      triggerRows.push({
        id: `hs-${latestRecord.id}`,
        event: `HS code coverage mapped: ${latestRecord.hsCodes.slice(0, 3).join(', ')}`,
        eventDate: latestRecord.observedAt,
        source: 'Raw import/export payload',
        relevanceScore: 74
      });
    }

    return {
      recentRecords: recentRecords.slice(0, 8),
      importerSignals,
      exporterSignals,
      importProfiles: [...importProfiles],
      iecCodes: [...iecCodes],
      hsCodes: [...hsCodeSet],
      productCategories: [...productSet],
      latestTradeDate: latestRecord?.certificateIssueDate || latestRecord?.observedAt || null,
      triggerRows
    };
  }, [company?.company_type, factSheet?.raw_payload, rawIntelRecords]);

  const importExportIntel = useMemo(() => {
    if (!tradeSignals) return fallbackImportExportIntel;

    return {
      recentRecords: tradeSignals.recent_records.map((record) => ({
        id: record.id,
        observedAt: record.observed_at,
        sourceId: record.source_id,
        sourceLabel: record.source_label,
        externalRecordId: record.external_record_id,
        importProfile: record.import_profile,
        iecCode: record.iec_code,
        hsCodes: record.hs_codes || [],
        productCategories: record.product_categories || [],
        certificateIssueDate: record.certificate_issue_date,
        registrationId: record.registration_id,
        importerFlag: Boolean(record.importer_flag),
        exporterFlag: Boolean(record.exporter_flag)
      })),
      importerSignals: tradeSignals.summary.importer_signals || 0,
      exporterSignals: tradeSignals.summary.exporter_signals || 0,
      importProfiles: tradeSignals.import_profiles || [],
      iecCodes: tradeSignals.iec_codes || [],
      hsCodes: tradeSignals.hs_codes || [],
      productCategories: tradeSignals.product_categories || [],
      latestTradeDate: tradeSignals.summary.latest_trade_date || null,
      triggerRows: (tradeSignals.trigger_rows || []).map((row) => ({
        id: row.id,
        event: row.event,
        eventDate: row.event_date,
        source: row.source,
        relevanceScore: row.relevance_score
      }))
    };
  }, [fallbackImportExportIntel, tradeSignals]);

  const tradeMonthlyActivity = useMemo(() => {
    if (tradeSignals?.monthly_activity?.length) return tradeSignals.monthly_activity;

    const buckets = new Map<string, TradeSignalMonthlyActivity>();
    for (const record of importExportIntel.recentRecords) {
      const dateValue = record.certificateIssueDate || record.observedAt;
      const monthMs = toDateMs(dateValue);
      const monthKey = monthMs !== null ? new Date(monthMs).toISOString().slice(0, 7) : null;
      if (!monthKey) continue;

      const existing = buckets.get(monthKey) || {
        month: monthKey,
        total_records: 0,
        importer_signals: 0,
        exporter_signals: 0
      };
      existing.total_records += 1;
      if (record.importerFlag) existing.importer_signals += 1;
      if (record.exporterFlag) existing.exporter_signals += 1;
      buckets.set(monthKey, existing);
    }

    return [...buckets.values()].sort((left, right) => right.month.localeCompare(left.month)).slice(0, 6);
  }, [importExportIntel.recentRecords, tradeSignals?.monthly_activity]);

  const tradeSourceMix = useMemo(() => {
    if (tradeSignals?.source_mix?.length) return tradeSignals.source_mix;

    const buckets = new Map<string, TradeSignalSourceMix>();
    for (const record of importExportIntel.recentRecords) {
      const bucketKey = record.sourceId || record.sourceLabel;
      const existing = buckets.get(bucketKey) || {
        source_id: record.sourceId || null,
        source_label: record.sourceLabel || 'Intel import registry',
        records: 0,
        importer_signals: 0,
        exporter_signals: 0
      };
      existing.records += 1;
      if (record.importerFlag) existing.importer_signals += 1;
      if (record.exporterFlag) existing.exporter_signals += 1;
      buckets.set(bucketKey, existing);
    }

    return [...buckets.values()].sort((left, right) => right.records - left.records).slice(0, 5);
  }, [importExportIntel.recentRecords, tradeSignals?.source_mix]);

  const triggerEventsWithTradeSignals = useMemo(
    () => [...importExportIntel.triggerRows, ...triggerEvents]
      .sort((left, right) => (toDateMs(right.eventDate) || 0) - (toDateMs(left.eventDate) || 0))
      .slice(0, 12),
    [importExportIntel.triggerRows, triggerEvents]
  );

  const visibleTimeline = useMemo(
    () => (timelineQuickView ? timeline.slice(0, 8) : timeline),
    [timeline, timelineQuickView]
  );

  const geoFilteredLocations = useMemo(() => {
    const radius = Number(geoRadiusKmFilter || 0);
    return locations.filter((location) => {
      if (geoStateFilter !== 'all' && cleanDisplayValue(location.state).toLowerCase() !== geoStateFilter.toLowerCase()) return false;
      if (geoDistrictFilter !== 'all' && cleanDisplayValue(location.district || location.city).toLowerCase() !== geoDistrictFilter.toLowerCase()) return false;
      if (radius > 0 && location.latitude !== null && location.longitude !== null && companyGeoData?.latitude !== null && companyGeoData?.longitude !== null) {
        const approxKm = Math.sqrt(
          Math.pow((location.latitude || 0) - (companyGeoData.latitude || 0), 2) +
          Math.pow((location.longitude || 0) - (companyGeoData.longitude || 0), 2)
        ) * 111;
        if (approxKm > radius) return false;
      }
      return true;
    });
  }, [companyGeoData?.latitude, companyGeoData?.longitude, geoDistrictFilter, geoRadiusKmFilter, geoStateFilter, locations]);

  const marketOpportunity = useMemo(() => {
    const estimatedAnnualEprLiability = Math.round((Number(factSheet?.ec_inr_cr || 0) * 10000000) || totalPenalty * 1.5);
    const plasticTonnageEstimate = complianceApplicability.some((row) => row.key === 'plastic' && row.applicable)
      ? Math.round(Number(factSheet?.epr_target_mt || 0) * 0.4)
      : 0;
    const batteryTonnageEstimate = Math.round(Number(factSheet?.epr_target_mt || 0) * 0.6 + Number(batteryRecyclerProfile?.annual_processing_capacity_mt || 0) * 0.15);
    const expectedCertificateRequirement = complianceApplicability.filter((row) => row.applicable).length;
    const factoryCount = locations.filter((location) => /factory|plant|unit|facility/i.test(cleanDisplayValue(location.location_type))).length;
    const states = new Set<string>();
    if (company?.state) states.add(company.state);
    if (factSheet?.state) states.add(factSheet.state);
    for (const location of locations) if (location.state) states.add(location.state);
    const stateCoverage = states.size;
    const vendorPotential = nearbyRecyclers.length + (showPartnershipProfile ? 1 : 0);
    const expectedConsultingValue = Math.max(120000, Math.round(estimatedAnnualEprLiability * 0.02 + riskScoreBreakdown.total * 3500));
    const tamEstimate = Math.round(expectedConsultingValue * 1.8);
    const potentialMonthlyBilling = Math.round(expectedConsultingValue / 12);

    return {
      estimatedAnnualEprLiability,
      plasticTonnageEstimate,
      batteryTonnageEstimate,
      expectedCertificateRequirement,
      factoryCount,
      stateCoverage,
      vendorPotential,
      expectedConsultingValue,
      tamEstimate,
      potentialMonthlyBilling
    };
  }, [batteryRecyclerProfile?.annual_processing_capacity_mt, company?.state, complianceApplicability, factSheet?.ec_inr_cr, factSheet?.epr_target_mt, factSheet?.state, locations, nearbyRecyclers.length, riskScoreBreakdown.total, showPartnershipProfile, totalPenalty]);

  const benchmarkMetrics = useMemo(() => {
    const peers = allCompanies.filter((item) => item.company_type === company?.company_type || item.state === company?.state);
    const peerCount = peers.length;
    const peerNoticesAvg = peerCount ? peers.reduce((sum, item: any) => sum + Number(item.notices || 0), 0) / peerCount : 0;
    const peerPenaltyAvg = peerCount ? peers.reduce((sum, item: any) => sum + Number(item.penalty_inr || 0), 0) / peerCount : 0;
    const peerComplianceMaturity = peerCount ? Math.min(100, Math.round(55 + peerCount / 10)) : 55;
    return {
      peerCount,
      peerNoticesAvg,
      peerPenaltyAvg,
      peerComplianceMaturity,
      companyNotices: notices.length,
      companyPenalty: totalPenalty
    };
  }, [allCompanies, company?.company_type, company?.state, notices.length, totalPenalty]);

  const governmentDataSignals = useMemo(() => {
    const has = (value: string) => signalCorpus.includes(value);
    const sourceRows = [
      { source: 'CPCB', authority: registrations.some((item) => /cpcb/i.test(cleanDisplayValue(item.authority))) || notices.some((item) => /cpcb/i.test(cleanDisplayValue(item.authority))), applicability: 'High' },
      { source: 'SPCB', authority: registrations.some((item) => /spcb|pollution control|mpcb/i.test(cleanDisplayValue(item.authority))) || notices.some((item) => /spcb|mpcb|pollution control/i.test(cleanDisplayValue(item.authority))), applicability: 'High' },
      { source: 'DGFT', authority: has('dgft') || has('import') || importExportIntel.iecCodes.length > 0, applicability: importExportIntel.importerSignals > 0 ? 'High' : has('import') ? 'Medium' : 'Low' },
      { source: 'ICEGATE', authority: has('icegate') || has('hs code') || importExportIntel.hsCodes.length > 0, applicability: importExportIntel.hsCodes.length > 0 ? 'High' : has('icegate') ? 'Medium' : 'Low' },
      { source: 'MCA', authority: Boolean(company?.cin), applicability: 'Medium' },
      { source: 'GeM', authority: has('gem') || has('tender'), applicability: has('tender') ? 'Medium' : 'Low' },
      { source: 'RERA', authority: has('rera'), applicability: has('rera') ? 'Medium' : 'Low' },
      { source: 'BIS', authority: has('bis'), applicability: has('bis') ? 'Low' : 'Low' },
      { source: 'NSWS', authority: has('nsws'), applicability: has('nsws') ? 'Low' : 'Low' }
    ];

    const latestFreshness = [company?.updated_at, ...notices.map((item) => item.notice_date || null), ...registrations.map((item) => item.issue_date || null)]
      .filter(Boolean)
      .sort((a, b) => (toDateMs(b || null) || 0) - (toDateMs(a || null) || 0))[0] || null;

    return {
      latestFreshness,
      rows: sourceRows.map((row) => ({
        ...row,
        freshness: latestFreshness,
        state: company?.state || factSheet?.state || '-'
      }))
    };
  }, [company?.cin, company?.state, company?.updated_at, factSheet?.state, importExportIntel.hsCodes.length, importExportIntel.iecCodes.length, importExportIntel.importerSignals, notices, registrations, signalCorpus]);

  const engagementIntel = useMemo(() => {
    const lastContactedEvent = timeline.find((event) => /telecalling|note added/i.test(event.label));
    const proposalMentioned = timeline.some((event) => /proposal/i.test(`${event.label} ${event.detail || ''}`.toLowerCase()));
    const conversionProbability = Math.min(95, Math.max(18, Math.round(28 + marketOpportunity.vendorPotential * 4 + (100 - riskScoreBreakdown.total) * 0.2 + stakeholderRows.length * 5)));
    return {
      lastContacted: lastContactedEvent?.at || null,
      callRecordings: timeline.filter((event) => /telecalling/i.test(event.label)).length,
      proposalSent: proposalMentioned,
      meetingNotes: timeline.filter((event) => /note added/i.test(event.label)).length,
      whatsappStatus: stakeholderRows.some((row) => Boolean(row.phone)) ? 'Reachable' : 'Unknown',
      followUpDueDays: triggerEventsWithTradeSignals.length > 0 ? 2 : 7,
      proposalAmount: marketOpportunity.expectedConsultingValue,
      conversionProbability
    };
  }, [marketOpportunity.expectedConsultingValue, marketOpportunity.vendorPotential, riskScoreBreakdown.total, stakeholderRows, timeline, triggerEventsWithTradeSignals.length]);

  const aiRecommendations = useMemo(() => {
    const recommendations: Array<{ insight: string; pitch: string; script: string; pricing: string }> = [];
    const batteryRow = complianceApplicability.find((row) => row.key === 'battery');
    if (batteryRow?.applicable && batteryRow.registrationStatus !== 'Registered') {
      recommendations.push({
        insight: 'High probability Battery EPR lead',
        pitch: 'Urgency-led: avoid registration and return filing disruption',
        script: 'We noticed battery compliance risk signals in your profile. We can close registration and return readiness in one managed sprint.',
        pricing: 'INR 2.4L - 6.5L annual'
      });
    }
    if (riskScoreBreakdown.band === 'Critical' || riskScoreBreakdown.band === 'High') {
      recommendations.push({
        insight: 'Likely non-compliant importer',
        pitch: 'Risk-led: notices, expiry, and import-linked exposure',
        script: 'Your current compliance risk score is elevated. A 30-day remediation plan can reduce notice exposure and improve filing continuity.',
        pricing: 'INR 1.8L - 4.2L remediation'
      });
    }
    if (complianceApplicability.filter((row) => row.applicable).length >= 2) {
      recommendations.push({
        insight: 'Cross-sell multi-category EPR stack',
        pitch: 'Consolidate plastic + battery/e-waste operations with one managed governance model',
        script: 'You are eligible for multi-category compliance optimization. Consolidating vendors can reduce execution overhead and improve audit traceability.',
        pricing: 'INR 3.6L - 12L annual retainer'
      });
    }
    if (!recommendations.length) {
      recommendations.push({
        insight: 'Good candidate for annual advisory retainer',
        pitch: 'Preventive governance and filing cadence assurance',
        script: 'Your account looks ready for a proactive annual compliance model with quarterly health checks and filing operations.',
        pricing: 'INR 1.2L - 3L annual'
      });
    }
    return recommendations.slice(0, 4);
  }, [complianceApplicability, riskScoreBreakdown.band]);

  const leadPrioritySegments = useMemo(() => {
    return [
      { segment: 'Hot leads', value: riskScoreBreakdown.band === 'Critical' || engagementIntel.conversionProbability >= 70 },
      { segment: 'Expiring licenses', value: triggerEventsWithTradeSignals.some((event) => /expiry approaching/i.test(event.event)) },
      { segment: 'High revenue potential', value: marketOpportunity.expectedConsultingValue >= 500000 },
      { segment: 'New importers', value: importExportIntel.importerSignals > 0 },
      { segment: 'Non-compliant entities', value: complianceApplicability.some((row) => row.riskLevel === 'Critical' || row.riskLevel === 'High') },
      { segment: 'Recently funded/expanded', value: triggerEventsWithTradeSignals.some((event) => /funding|expansion/i.test(event.event.toLowerCase())) },
      { segment: 'High conversion probability', value: engagementIntel.conversionProbability >= 60 }
    ];
  }, [complianceApplicability, engagementIntel.conversionProbability, importExportIntel.importerSignals, marketOpportunity.expectedConsultingValue, riskScoreBreakdown.band, triggerEventsWithTradeSignals]);

  const upsellServiceTags = useMemo(() => {
    const tags = new Map<string, string>();
    const combinedSignals = [
      signalCorpus,
      company?.company_type || '',
      factSheet?.industry_classification || '',
      factSheet?.segment_tag || '',
      company?.canonical_name || '',
      ...(registrations.map((item) => `${item.registration_type || ''} ${item.authority || ''} ${item.waste_category || ''}`))
    ]
      .join(' ')
      .toLowerCase();

    const addTag = (name: string, condition: boolean, reason: string) => {
      if (!condition) return;
      if (!tags.has(name)) tags.set(name, reason);
    };

    const hasSignal = (pattern: RegExp) => pattern.test(combinedSignals);
    const hasAnySignal = (patterns: RegExp[]) => patterns.some((pattern) => hasSignal(pattern));

    const isImporterExporter = importExportIntel.importerSignals > 0 || importExportIntel.exporterSignals > 0 || importExportIntel.iecCodes.length > 0;
    const isManufacturer = hasAnySignal([/manufactur/, /factory/, /plant/, /producer/, /brand owner/, /pibo/, /industrial/]);
    const isElectronics = hasAnySignal([/electronic/, /ewaste/, /battery/, /telecom/, /wireless/, /it asset/, /appliance/]);
    const isAutomotive = hasAnySignal([/automotive/, /vehicle/, /auto component/, /tyre/]);
    const isFoodAgri = hasAnySignal([/food/, /beverage/, /packag(ed|ing) food/, /agri/, /marine/, /seafood/, /organic/, /farm/]);
    const isHealthcare = hasAnySignal([/pharma/, /medical/, /drug/, /cosmetic/, /healthcare/, /device/]);
    const isRecycler = hasAnySignal([/recycler/, /recycling/, /dismantler/, /refurbisher/, /hazardous waste recycler/, /authorized recycler/]);
    const isInfraRealEstate = hasAnySignal([/construction/, /infrastructure/, /real estate/, /builder/, /project/]);
    const isSecurityBusiness = hasAnySignal([/security/, /guarding/, /surveillance/]);
    const isFinanceFx = hasAnySignal([/finance/, /financial/, /forex/, /money changer/, /remittance/, /lending/]);
    const isSoftwareTech = hasAnySignal([/software/, /it services/, /technology/, /saas/]);
    const isJewellery = hasAnySignal([/jewell/, /gold/, /silver/, /precious/]);
    const isFurniture = hasAnySignal([/furniture/, /office chair/, /interior/]);
    const isHazChemEnergy = hasAnySignal([/hazardous/, /chemical/, /gas/, /petro/, /energy/, /radiation/, /nuclear/]);
    const isConsumerRetail = hasAnySignal([/retail/, /fmcg/, /packaging/, /consumer/, /ecommerce/, /warehouse/]);
    const hasLabourSignal = isManufacturer || hasAnySignal([/employee/, /workforce/, /labour/, /staff/, /plant manpower/]);
    const isExportOriented = isImporterExporter || hasAnySignal([/export/, /international/, /overseas/]);
    const isConstructionHeavy = isInfraRealEstate || hasAnySignal([/epc/, /contractor/, /project site/, /civil/]);

    addTag('EPR Registration', applicableEprCategories.length > 0 || hasAnySignal([/epr/, /plastic waste/, /battery waste/, /ewaste/]), 'EPR waste-category or compliance signals detected');
    addTag('PRO', applicableEprCategories.length > 0 || hasSignal(/producer responsibility/), 'EPR/producer-responsibility operational signal present');
    addTag('CPCB', applicableEprCategories.length > 0 || hasSignal(/cpcb/), 'CPCB-linked registrations/notices found');
    addTag('DPCC', cleanDisplayValue(company?.state).toLowerCase() === 'delhi' || hasSignal(/dpcc/), 'Delhi geography or DPCC authority signal found');
    addTag('CFO', isManufacturer || isHazChemEnergy, 'Manufacturing/hazardous operations suggest consent-to-operate need');
    addTag('CGWA', isManufacturer || isInfraRealEstate || isHazChemEnergy, 'Water-intensive industrial/infra signal detected');
    addTag('EIA', isInfraRealEstate || isHazChemEnergy || hasSignal(/environmental impact/), 'Infra/environment-sensitive activity signal detected');
    addTag('ESDD', isHazChemEnergy || hasSignal(/due diligence/), 'Environmental due-diligence risk signal present');
    addTag('PESO', isHazChemEnergy || hasSignal(/explosive/), 'Hazardous/flammable material handling signal found');
    addTag('ISO 59010 Circular Economy', isRecycler || hasSignal(/circular economy|resource recovery|material loop/), 'Recycler/circular-economy signal suggests ISO 59010 implementation readiness');
    addTag('ISO 59004 Circular Economy', isRecycler || hasSignal(/circular economy|resource efficiency|secondary material/), 'Recycler operations indicate circular-economy framework applicability (ISO 59004)');
    addTag('R2v3 Certification', isRecycler || hasSignal(/e-waste recycler|electronics recycler|it asset disposal/), 'Recycler/e-waste processing signal suggests R2v3 certification relevance');

    addTag('IEC', isImporterExporter || hasSignal(/\biec\b/), 'Import-export activity or IEC trace detected');
    addTag('AEO', isImporterExporter || hasSignal(/customs/), 'Customs/import-export signals suggest AEO potential');
    addTag('RCMC', isImporterExporter || hasSignal(/export promotion/), 'Export-oriented signal indicates RCMC relevance');
    addTag('RBI/FEMA', isImporterExporter || isFinanceFx, 'Cross-border trade/forex compliance signal detected');
    addTag('GeM', isManufacturer || isImporterExporter || hasSignal(/government procurement|tender|gem/), 'Government procurement or tender signal detected');

    const productCertificationEligible = !isRecycler;
    addTag('BIS', productCertificationEligible && (isElectronics || isAutomotive || isManufacturer), 'Product standardization signal in manufacturing/electronics/auto');
    addTag('ISI Certification', productCertificationEligible && (isElectronics || isManufacturer), 'Product conformity signal for electronics/manufacturing');
    addTag('CRS Certification', productCertificationEligible && (isElectronics || hasSignal(/wireless|telecom/)), 'Electronics/telecom product certification signal detected');
    addTag('STQC Certification', productCertificationEligible && (isElectronics || isSoftwareTech || hasSignal(/stqc/)), 'IT/electronics quality-testing signal detected');
    addTag('WPC', productCertificationEligible && (isElectronics || hasSignal(/wireless|radio frequency/)), 'Wireless/RF product signal detected');
    addTag('TEC', productCertificationEligible && (isElectronics || hasSignal(/telecom/)), 'Telecom equipment/service signal detected');
    addTag('ROHS', productCertificationEligible && (isElectronics || isAutomotive), 'Electronics/auto compliance signal indicates RoHS relevance');
    addTag('ETA', productCertificationEligible && (isElectronics || hasSignal(/telecom|rf/)), 'RF/telecom import signal indicates ETA relevance');
    addTag('BEE', productCertificationEligible && (isElectronics || hasSignal(/energy efficient|appliance/)), 'Energy-efficient appliance/electronics signal detected');
    addTag('ARAI Approval', productCertificationEligible && isAutomotive, 'Automotive product/vehicle signal detected');
    addTag('AERB', productCertificationEligible && (isHazChemEnergy || hasSignal(/radiation|x-ray|nuclear/)), 'Radiation/nuclear instrumentation signal detected');

    addTag('CDSCO', productCertificationEligible && isHealthcare, 'Pharma/medical device signal detected');
    addTag('GMP', productCertificationEligible && (isHealthcare || isFoodAgri), 'Food/pharma processing quality-control signal detected');
    addTag('FSSAI', productCertificationEligible && isFoodAgri, 'Food/agri processing or packaging signal detected');
    addTag('HACCP', productCertificationEligible && isFoodAgri, 'Food safety process signal detected');
    addTag('KOSHER', productCertificationEligible && isFoodAgri, 'Food export/processing signal suggests certification upsell');
    addTag('ORGANIC', productCertificationEligible && isFoodAgri, 'Agri/food segment signal supports organic certification');
    addTag('GOTS', productCertificationEligible && hasSignal(/textile|garment|cotton|fabric|apparel/), 'Textile/apparel signal detected');
    addTag('AGMARK', productCertificationEligible && isFoodAgri, 'Agri commodity quality-marking relevance detected');
    addTag('APEDA', productCertificationEligible && isFoodAgri, 'Agri export-oriented signal detected');
    addTag('MPEDA', productCertificationEligible && isFoodAgri && hasSignal(/marine|seafood|fish/), 'Marine/seafood processing signal detected');

    addTag('PSARA', isSecurityBusiness, 'Private security service signal detected');
    addTag('NBFC', isFinanceFx && hasSignal(/lending|loan|credit/), 'Financial lending/credit signal detected');
    addTag('FFMC', isFinanceFx && hasSignal(/forex|money changer|currency/), 'Forex/money changing signal detected');

    addTag('ISO Certificate', true, 'Universal quality management upsell baseline');
    addTag('GST', !company?.gstin || hasSignal(/gst/), 'GSTIN missing or GST activity signal found');
    addTag('MSME', true, 'General business growth and incentives readiness upsell');
    addTag('ESIC Registration', isManufacturer || hasSignal(/employee|workforce|labour/), 'Workforce/labour signal suggests ESIC applicability');
    addTag('EPF Registration', isManufacturer || hasSignal(/employee|workforce|labour/), 'Employee base signal suggests EPF applicability');
    addTag('LLP', true, 'Entity structuring/optimization upsell opportunity');
    addTag('IPR', isManufacturer || isSoftwareTech || hasSignal(/brand|product|design|patent/), 'Brand/product IP protection signal detected');
    addTag('HALLMARK / TRADEMARK', isJewellery || hasSignal(/brand|trademark|hallmark/), 'Brand/jewellery trademark-hallmark signal detected');
    addTag('CE MARKING CERTIFICATION', productCertificationEligible && (isElectronics || isAutomotive || isManufacturer || isHealthcare), 'Export-grade product conformity signal detected');
    addTag('CMMI', isSoftwareTech, 'Software engineering maturity signal detected');
    addTag('BIFMA', productCertificationEligible && isFurniture, 'Furniture/interiors product compliance signal detected');
    addTag('RERA', isInfraRealEstate, 'Real-estate/construction project signal detected');
    addTag('RNI', hasSignal(/publishing|newspaper|media/), 'Publishing/media operations signal detected');
    addTag('NSIC', isManufacturer || hasSignal(/government supply|public procurement/), 'MSME manufacturing/government supply signal detected');
    addTag('CSR', hasSignal(/corporate|enterprise|large/) || (marketOpportunity.expectedConsultingValue >= 500000), 'Enterprise-scale profile suggests CSR framework consulting');
    addTag('ESG', true, 'Sustainability reporting and governance upsell baseline');
    addTag('BARCODE', isManufacturer || isFoodAgri || hasSignal(/retail|fmcg|packaging/), 'Retail/FMCG/packaged-product signal detected');
    addTag('FCRA', hasSignal(/ngo|foundation|donation|foreign contribution/), 'NGO/foreign-contribution activity signal detected');

    addTag('CTE (Consent to Establish)', isConstructionHeavy || isManufacturer || isHazChemEnergy, 'New setup/expansion industrial signal indicates CTE need');
    addTag('Factory License', isManufacturer || hasSignal(/factory act|manufacturing unit|plant/), 'Factory/manufacturing operations signal detected');
    addTag('Trade License', isConsumerRetail || hasSignal(/municipal|shop|commercial establishment/), 'Commercial retail/municipal operation signal detected');
    addTag('Shops & Establishment Registration', isConsumerRetail || hasSignal(/office|branch|shop/), 'Office/shop establishment signal detected');
    addTag('Labour License', hasLabourSignal, 'Workforce and labour-compliance signal detected');
    addTag('Fire NOC', isConstructionHeavy || isManufacturer || isConsumerRetail, 'Facility safety and occupancy signal indicates Fire NOC relevance');
    addTag('Hazardous Waste Authorization', isHazChemEnergy || hasSignal(/hazardous waste|chemical waste/), 'Hazardous process/waste signal detected');
    addTag('Plastic Waste Authorization', hasSignal(/plastic|packaging waste|polymer/), 'Plastic/packaging waste obligation signal detected');
    addTag('E-Waste Authorization', hasSignal(/e-waste|electronic waste|it asset/), 'Electronic waste lifecycle signal detected');
    addTag('Battery Waste Authorization', hasSignal(/battery waste|lithium|lead acid|black mass/), 'Battery lifecycle/waste signal detected');

    addTag('Drug License', isHealthcare || hasSignal(/medicine|formulation|pharmacy/), 'Pharma/medical supply-chain signal detected');
    addTag('AYUSH License', hasSignal(/ayurveda|ayush|herbal|nutraceutical/), 'AYUSH/herbal product signal detected');
    addTag('Importer License Advisory', isImporterExporter, 'Cross-border trade operations signal detected');
    addTag('Export Documentation Suite', isExportOriented, 'Export-intent operations signal detected');

    addTag('ISO 14001', isManufacturer || isHazChemEnergy || applicableEprCategories.length > 0, 'Environmental management system relevance detected');
    addTag('ISO 45001', hasLabourSignal || isManufacturer, 'Occupational health and safety signal detected');
    addTag('ISO 22000', isFoodAgri, 'Food safety management signal detected');
    addTag('SOC 2', isSoftwareTech || hasSignal(/data security|cloud|saas/), 'Data-security/service-assurance signal detected');
    addTag('PCI DSS', hasSignal(/payment|card|fintech|gateway/), 'Card/payment processing signal detected');
    addTag('Startup India Registration', hasSignal(/startup|seed|series [a-z]|incubation/), 'Startup/funding-stage signal detected');
    addTag('Udyam Registration', true, 'MSME formalization and scheme-readiness upsell');

    addTag('Boiler Registration', isManufacturer && hasSignal(/boiler|steam|process heat/), 'Boiler/process-heat operations signal detected');
    addTag('Legal Metrology Registration', isConsumerRetail || hasSignal(/packaged commodity|weights and measures|metrology/), 'Packaged commodity/metrology signal detected');
    addTag('Import-Export Code Renewal', importExportIntel.iecCodes.length > 0, 'Existing IEC footprint suggests renewal/maintenance upsell');
    addTag('Vendor Compliance Audit', marketOpportunity.vendorPotential > 2 || nearbyRecyclers.length > 0, 'Multi-vendor network signal suggests audit opportunity');

    return Array.from(tags.entries()).map(([service, reason]) => ({ service, reason }));
  }, [
    applicableEprCategories.length,
    company?.canonical_name,
    company?.company_type,
    company?.gstin,
    company?.state,
    factSheet?.industry_classification,
    factSheet?.segment_tag,
    importExportIntel.exporterSignals,
    importExportIntel.iecCodes.length,
    importExportIntel.importerSignals,
    marketOpportunity.expectedConsultingValue,
    marketOpportunity.vendorPotential,
    nearbyRecyclers.length,
    registrations,
    signalCorpus
  ]);

  const dataCompletionScore = useMemo(() => {
    const checks = [
      Boolean(company?.canonical_name),
      Boolean(company?.state || company?.district),
      Boolean(company?.website || company?.linkedin_url || factSheet?.website || factSheet?.linkedin_company_url),
      Boolean(company?.cin || company?.gstin || company?.pan),
      Boolean(company?.active_status || company?.validation_confidence !== null),
      Boolean(factSheet?.industry_classification || factSheet?.segment_tag),
      Boolean(factSheet?.email_direct || factSheet?.email_generic || factSheet?.phone),
      Boolean(companyGeoData?.latitude !== null && companyGeoData?.longitude !== null),
      registrations.length > 0,
      locations.length > 0,
      associatedPeople.length > 0,
      Boolean(googlePlacesData?.google_place_id || googlePlacesData?.verified_by_google)
    ];

    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [
    associatedPeople.length,
    company?.active_status,
    company?.canonical_name,
    company?.cin,
    company?.district,
    company?.gstin,
    company?.linkedin_url,
    company?.pan,
    company?.state,
    company?.validation_confidence,
    company?.website,
    companyGeoData?.latitude,
    companyGeoData?.longitude,
    factSheet?.email_direct,
    factSheet?.email_generic,
    factSheet?.industry_classification,
    factSheet?.linkedin_company_url,
    factSheet?.phone,
    factSheet?.segment_tag,
    factSheet?.website,
    googlePlacesData?.google_place_id,
    googlePlacesData?.verified_by_google,
    locations.length,
    registrations.length
  ]);

  async function handleMerge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!mergeTargetId) return;

    setMergeLoading(true);
    setError('');
    setSuccess('');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      setMergeLoading(false);
      setError('No active session token found.');
      return;
    }

    const response = await fetch(`/api/intel/companies/${companyId}/merge`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ target_company_id: mergeTargetId })
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Merge failed');
      setMergeLoading(false);
      return;
    }

    setSuccess(`Merged into target company. Conflicts resolved: ${payload.conflicts_resolved || 0}`);
    setMergeLoading(false);
    await loadData();
  }

  async function withTokenHeaders() {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) return null;
    return {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json'
    };
  }

  async function generateStrategy() {
    setStrategyLoading(true);
    setError('');
    setSuccess('');

    const headers = await withTokenHeaders();
    if (!headers) {
      setStrategyLoading(false);
      setError('No active session token found.');
      return;
    }

    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    const response = await fetchIntelWithFallback(`/api/intel/strategy/${companyId}`, token, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Strategy generation failed');
      setStrategyLoading(false);
      return;
    }

    setSuccess('Closing strategy generated and saved to pipeline record.');
    setStrategyLoading(false);
  }

  async function enrichProfileNow() {
    setEnrichLoading(true);
    setError('');
    setSuccess('');

    const headers = await withTokenHeaders();
    if (!headers) {
      setEnrichLoading(false);
      setError('No active session token found.');
      return;
    }

    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    const response = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/enrichment/google`, token, {
      method: 'POST',
      headers,
      body: JSON.stringify({ force_refresh: true })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || 'Profile enrichment failed');
      setEnrichLoading(false);
      return;
    }

    setSuccess('Profile enrichment triggered successfully. Refreshing company data...');
    setEnrichLoading(false);
    await loadData();
  }

  async function addAssociatedPerson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId || addingAssociatedPerson) return;

    const personName = associatedPersonForm.person_name.trim();
    const designation = associatedPersonForm.designation.trim();
    const phone = associatedPersonForm.phone.trim();
    const email = associatedPersonForm.email.trim();
    const linkedinUrl = associatedPersonForm.linkedin_url.trim();
    const notes = associatedPersonForm.notes.trim();
    const department = associatedPersonForm.department.trim();
    const seniorityLevel = associatedPersonForm.seniority_level.trim();
    const sourceType = associatedPersonForm.source_type.trim();
    const sourceVendor = associatedPersonForm.source_vendor.trim();
    const confidenceScore = associatedPersonForm.confidence_score.trim();
    if (!phone && !email && !linkedinUrl) {
      setError('Provide at least one contact detail: phone, email, or LinkedIn URL.');
      return;
    }

    setAddingAssociatedPerson(true);
    setError('');
    setSuccess('');

    const headers = await withTokenHeaders();
    if (!headers) {
      setAddingAssociatedPerson(false);
      setError('No active session token found.');
      return;
    }

    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    const response = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/associated-people`, token, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        person_name: personName || null,
        designation: designation || null,
        phone: phone || null,
        email: email || null,
        linkedin_url: linkedinUrl || null,
        notes: notes || null,
        department: department || null,
        seniority_level: seniorityLevel || null,
        source_type: sourceType || null,
        source_vendor: sourceVendor || null,
        confidence_score: confidenceScore ? Number(confidenceScore) : null
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || 'Failed to add associated person');
      setAddingAssociatedPerson(false);
      return;
    }

    if (payload.row) {
      setAssociatedPeople((current) => {
        const row = payload.row as AssociatedPerson;
        const exists = current.some((person) => person.id === row.id);
        if (exists) return current.map((person) => (person.id === row.id ? row : person));
        return [row, ...current];
      });
    } else {
      await loadData();
    }

    setAssociatedPersonForm(buildEmptyAssociatedPersonForm());
    setSuccess(payload.action === 'updated' ? 'Existing associated person merged via dedupe.' : 'Associated person added successfully.');
    setAddingAssociatedPerson(false);
  }

  async function importAssociatedPeople() {
    if (!companyId || importingAssociatedPeople) return;
    if (!associatedPeopleImportFile) {
      setError('Select a vendor file to import.');
      return;
    }

    setImportingAssociatedPeople(true);
    setError('');
    setSuccess('');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      setImportingAssociatedPeople(false);
      setError('No active session token found.');
      return;
    }

    const formData = new FormData();
    formData.append('file', associatedPeopleImportFile);
    if (associatedPeopleImportVendor.trim()) {
      formData.append('source_vendor', associatedPeopleImportVendor.trim());
    }

    const response = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/associated-people/import`, token, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`
      },
      body: formData
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || 'Failed to import associated people');
      setImportingAssociatedPeople(false);
      return;
    }

    if (Array.isArray(payload.rows)) {
      setAssociatedPeople(payload.rows as AssociatedPerson[]);
    } else {
      await loadData();
    }

    const summary = payload.summary || {};
    setSuccess(
      `Import complete: ${Number(summary.inserted || 0).toLocaleString('en-IN')} inserted, ` +
      `${Number(summary.deduped_updated || 0).toLocaleString('en-IN')} merged, ` +
      `${Number(summary.skipped_rows || 0).toLocaleString('en-IN')} skipped.`
    );
    setAssociatedPeopleImportFile(null);
    setAssociatedPeopleImportVendor('');
    setImportingAssociatedPeople(false);
  }

  function startEditingAssociatedPerson(person: AssociatedPerson) {
    setEditingAssociatedPersonId(person.id);
    setEditingAssociatedPersonForm({
      person_name: person.person_name || '',
      designation: person.designation || '',
      phone: person.phone || '',
      email: person.email || '',
      linkedin_url: person.linkedin_url || '',
      notes: person.notes || '',
      department: person.department || '',
      seniority_level: person.seniority_level || '',
      source_type: person.source_type || '',
      source_vendor: person.source_vendor || '',
      confidence_score: person.confidence_score === null || person.confidence_score === undefined ? '' : String(person.confidence_score)
    });
  }

  function cancelEditingAssociatedPerson() {
    setEditingAssociatedPersonId(null);
    setEditingAssociatedPersonForm(buildEmptyAssociatedPersonForm());
  }

  async function saveAssociatedPerson(personId: string) {
    if (!companyId || savingAssociatedPersonId) return;

    const personName = editingAssociatedPersonForm.person_name.trim();
    const designation = editingAssociatedPersonForm.designation.trim();
    const phone = editingAssociatedPersonForm.phone.trim();
    const email = editingAssociatedPersonForm.email.trim();
    const linkedinUrl = editingAssociatedPersonForm.linkedin_url.trim();
    const notes = editingAssociatedPersonForm.notes.trim();
    const department = editingAssociatedPersonForm.department.trim();
    const seniorityLevel = editingAssociatedPersonForm.seniority_level.trim();
    const sourceType = editingAssociatedPersonForm.source_type.trim();
    const sourceVendor = editingAssociatedPersonForm.source_vendor.trim();
    const confidenceScore = editingAssociatedPersonForm.confidence_score.trim();

    if (!phone && !email && !linkedinUrl) {
      setError('Provide at least one contact detail: phone, email, or LinkedIn URL.');
      return;
    }

    setSavingAssociatedPersonId(personId);
    setError('');

    const headers = await withTokenHeaders();
    if (!headers) {
      setSavingAssociatedPersonId(null);
      setError('No active session token found.');
      return;
    }

    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    const response = await fetchIntelWithFallback(`/api/intel/companies/${companyId}/associated-people/${personId}`, token, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        person_name: personName || null,
        designation: designation || null,
        phone: phone || null,
        email: email || null,
        linkedin_url: linkedinUrl || null,
        notes: notes || null,
        department: department || null,
        seniority_level: seniorityLevel || null,
        source_type: sourceType || null,
        source_vendor: sourceVendor || null,
        confidence_score: confidenceScore ? Number(confidenceScore) : null
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(payload.error || 'Failed to update associated person');
      setSavingAssociatedPersonId(null);
      return;
    }

    if (payload.row) {
      setAssociatedPeople((current) => current.map((person) => (person.id === personId ? payload.row as AssociatedPerson : person)));
    }

    setSuccess('Associated person updated successfully.');
    setSavingAssociatedPersonId(null);
    cancelEditingAssociatedPerson();
  }

  async function pushToZoho() {
    setPushLoading(true);
    setError('');
    setSuccess('');

    const headers = await withTokenHeaders();
    if (!headers) {
      setPushLoading(false);
      setError('No active session token found.');
      return;
    }

    const token = String(headers.authorization || '').replace(/^Bearer\s+/i, '');
    const response = await fetchIntelWithFallback(`/api/intel/crm/zoho/push/${companyId}`, token, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error || 'Zoho push failed');
      setPushLoading(false);
      return;
    }

    setSuccess('Zoho CRM push allowed (dry-run stub completed).');
    setPushLoading(false);
  }

  async function pushToTelecalling() {
    if (!company) return;
    setTelecallLoading(true);
    setTelecallSuccess(false);
    setError('');
    setSuccess('');

    try {
      const phone =
        workbookSignals.phone ||
        mpcbProfile?.contact_phone ||
        cpcbProfile?.contact_phone ||
        factSheet?.phone ||
        null;
      const email =
        factSheet?.email_direct ||
        factSheet?.email_generic ||
        mpcbProfile?.contact_email ||
        cpcbProfile?.contact_email ||
        null;
      const segment =
        factSheet?.segment_tag ||
        company.company_type ||
        partnershipProfile?.company_type ||
        null;
      const notesLines: string[] = [`Source: Intel module — ${new Date().toLocaleDateString('en-IN')}`];
      if (notices.length > 0) notesLines.push(`Notices: ${notices.length} · Penalty: ₹${totalPenalty.toLocaleString('en-IN')}`);
      if (applicableEprCategories.length > 0) notesLines.push(`EPR Categories: ${applicableEprCategories.join(', ')}`);
      if (factSheet?.personalization_hook) notesLines.push(`Hook: ${factSheet.personalization_hook}`);

      const { error: insertError } = await supabase.from('leads').insert({
        company_name: company.canonical_name,
        name: company.canonical_name,
        phone: phone || null,
        email: email || null,
        state: company.state || factSheet?.state || null,
        source: 'intel',
        stage: 'New',
        tc_status: 'New',
        tags: segment ? [segment] : [],
        description: notesLines.join('\n'),
      });

      if (insertError) throw new Error(insertError.message);

      setTelecallSuccess(true);
      setSuccess(`${company.canonical_name} pushed to Telecalling queue.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to push to telecalling');
    } finally {
      setTelecallLoading(false);
    }
  }

  async function saveCompanyField(field: EditableCompanyFieldKey) {
    if (!companyId || !company) return;
    if (savingField) return;

    const currentValue = companyFieldToInputValue(field, company);
    const draftValue = String(editableCompanyValues[field] || '');
    if (draftValue === currentValue) return;

    setSavingField(field);
    setError('');
    setSuccess('');

    const {
      data: { session }
    } = await supabase.auth.getSession();

    const token = session?.access_token;
    if (!token) {
      setError('No active session token found.');
      setSavingField(null);
      return;
    }

    const trimmed = draftValue.trim();
    const payload: Record<string, string | number | null> = {};

    if (field === 'validation_confidence') {
      if (!trimmed) {
        payload[field] = null;
      } else {
        const numeric = Number(trimmed);
        if (!Number.isFinite(numeric)) {
          setError('Validation Confidence must be numeric.');
          setSavingField(null);
          return;
        }
        payload[field] = numeric;
      }
    } else {
      if (field === 'canonical_name' && !trimmed) {
        setError('Company Name cannot be empty.');
        setSavingField(null);
        return;
      }
      payload[field] = trimmed || null;
    }

    const response = await fetchIntelWithFallback(`/api/intel/companies/${companyId}`, token, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responsePayload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(responsePayload.error || `Failed to update ${field}.`);
      setSavingField(null);
      return;
    }

    if (responsePayload.company) {
      setCompany(responsePayload.company as IntelCompany);
    }
    setSuccess(`${EDITABLE_COMPANY_FIELDS.find((entry) => entry.key === field)?.label || field} updated.`);
    setSavingField(null);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Intel Company Detail</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">{company?.canonical_name || 'Loading...'}</h1>
              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${isRecyclerEntity ? 'border border-teal-700/40 bg-teal-900/40 text-teal-200' : 'border border-blue-700/40 bg-blue-900/40 text-blue-200'}`}>
                {isRecyclerEntity ? 'Recycler / PRO' : 'Producer / PIBO'}
              </span>
              {company?.company_type && (
                <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${segmentTagColor(company.company_type)}`}>
                  {company.company_type}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {company?.state ? `${company.state}${company.district ? ` · ${company.district}` : ''}` : 'Location pending'}
            </p>
            {provenance ? (
              <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-[11px] text-slate-300">
                <p>
                  License{' '}
                  <span className={provenance.shareable ? 'font-semibold text-teal-300' : 'font-semibold text-amber-300'}>
                    {provenance.shareable ? 'shareable' : 'internal-use-only'}
                  </span>
                  {provenance.sources.length ? (
                    <span className="text-slate-500">
                      {' '}· {provenance.sources.map((s) => `${s.source_name} (tier ${s.reliability_tier ?? '—'})`).join(' · ')}
                    </span>
                  ) : (
                    <span className="text-slate-500"> · no linked sources yet</span>
                  )}
                </p>
                {provenance.fields[0]?.source ? (
                  <p className="mt-1 text-slate-500">
                    Latest field {provenance.fields[0].field_name} from {provenance.fields[0].source.source_name}
                    {provenance.fields[0].confidence_score != null
                      ? ` · confidence ${(Number(provenance.fields[0].confidence_score) * 100).toFixed(0)}%`
                      : ''}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <Link
                href="/intel/field-explainer#company-core"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300 transition hover:border-teal-500/50 hover:text-teal-200"
              >
                ? Company fields
              </Link>
              <Link
                href="/intel/field-explainer#contacts-sendpilot-leadrocks"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300 transition hover:border-teal-500/50 hover:text-teal-200"
              >
                ? Contact and email fields
              </Link>
              <Link
                href="/intel/field-explainer#scoring-segmentation-strategy"
                className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-slate-300 transition hover:border-teal-500/50 hover:text-teal-200"
              >
                ? Scoring fields
              </Link>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex max-w-xl flex-wrap items-center justify-end gap-2">
              <div
                className="grid h-10 w-10 place-items-center rounded-full border border-slate-700"
                style={{ background: `conic-gradient(rgb(20 184 166) ${dataCompletionScore}%, rgb(51 65 85) 0)` }}
                aria-label={`Data completion score ${dataCompletionScore} percent`}
                title={`Data completion: ${dataCompletionScore}%`}
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-slate-950 text-[9px] font-semibold text-teal-300">
                  {dataCompletionScore}
                </div>
              </div>
              {applicableEprCategories.length > 0 ? (
                applicableEprCategories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200"
                  >
                    {category}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-slate-700 bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Category Pending
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              {fromList ? (
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300"
                >
                  ← Back (preserve filters)
                </button>
              ) : (
                <Link href="/intel/companies" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
                  ← Companies
                </Link>
              )}
              <Link href="/intel/export" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
                Export
              </Link>
              <Link href="/intel/dynamic-columns" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
                Dynamic Columns
              </Link>
              <Link href="/intel" className="rounded-md border border-slate-700 px-3 py-2 text-xs font-semibold hover:border-teal-400 hover:text-teal-300">
                Intel Home
              </Link>
            </div>
          </div>
        </div>

        {error ? <p className="mb-3 text-sm text-rose-300">{error}</p> : null}
        {success ? <p className="mb-3 text-sm text-emerald-300">{success}</p> : null}

        <div className="mb-6 grid gap-4 xl:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 xl:sticky xl:top-20 xl:h-fit">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Intelligence Menu</p>
            <nav className="mt-3 space-y-1 text-xs">
              {[
                { href: '#lead-prioritization', label: 'Dashboard' },
                { href: '#company-overview', label: 'Companies' },
                { href: '#compliance-applicability', label: 'Compliance' },
                { href: '#trigger-events', label: 'Trigger Events' },
                { href: '#geographic-intelligence', label: 'Maps' },
                { href: '#recycler-intelligence', label: 'Recyclers' },
                { href: '#market-opportunity', label: 'Opportunities' },
                { href: '#engagement-crm', label: 'CRM' },
                { href: '#ai-recommendation', label: 'AI Insights' },
                { href: '#sector-benchmarking', label: 'Reports' }
              ].map((item) => (
                <a key={item.href} href={item.href} className="block rounded-md border border-slate-800 px-2 py-1.5 text-slate-300 transition hover:border-teal-500/50 hover:bg-slate-950/70 hover:text-teal-200">
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Activity Timeline</p>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setTimelineQuickView(true)}
                    className={`rounded border px-1.5 py-0.5 ${timelineQuickView ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-300'}`}
                  >
                    Quick
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimelineQuickView(false)}
                    className={`rounded border px-1.5 py-0.5 ${!timelineQuickView ? 'border-teal-500/60 bg-teal-500/15 text-teal-200' : 'border-slate-700 text-slate-300'}`}
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add info update..."
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:border-teal-400 focus:outline-none"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && noteText.trim() && !savingNote) {
                      setSavingNote(true);
                      const { error: err } = await supabase.from('leads').insert({
                        company_name: company?.canonical_name || '',
                        name: company?.canonical_name || '',
                        state: company?.state || null,
                        source: 'intel_note',
                        description: `📝 Note: ${noteText.trim()}`,
                      });
                      if (!err) {
                        setTimeline((prev) => [{
                          id: `note-${Date.now()}`,
                          at: new Date().toISOString(),
                          icon: '📝',
                          label: 'Note added',
                          detail: noteText.trim(),
                        }, ...prev]);
                        setNoteText('');
                      }
                      setSavingNote(false);
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={!noteText.trim() || savingNote}
                  onClick={async () => {
                    if (!noteText.trim() || savingNote) return;
                    setSavingNote(true);
                    const { error: err } = await supabase.from('leads').insert({
                      company_name: company?.canonical_name || '',
                      name: company?.canonical_name || '',
                      state: company?.state || null,
                      source: 'intel_note',
                      description: `📝 Note: ${noteText.trim()}`,
                    });
                    if (!err) {
                      setTimeline((prev) => [{
                        id: `note-${Date.now()}`,
                        at: new Date().toISOString(),
                        icon: '📝',
                        label: 'Note added',
                        detail: noteText.trim(),
                      }, ...prev]);
                      setNoteText('');
                    }
                    setSavingNote(false);
                  }}
                  className="w-full rounded-md border border-teal-600/50 bg-teal-500/15 px-2 py-1.5 text-[11px] font-semibold text-teal-200 transition hover:bg-teal-500/25 disabled:opacity-50"
                >
                  {savingNote ? 'Saving…' : '+ Add'}
                </button>
              </div>

              {timeline.length === 0 ? (
                <p className="mt-3 text-xs text-slate-500">No activity yet.</p>
              ) : (
                <ol className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                  {visibleTimeline.map((ev) => (
                    <li key={ev.id} className="rounded-md border border-slate-800 bg-slate-950/60 px-2 py-1.5">
                      <p className="text-[11px] font-semibold text-slate-200">{ev.icon} {ev.label}</p>
                      {ev.detail ? <p className="mt-0.5 text-[10px] text-slate-400">{ev.detail}</p> : null}
                      <p className="mt-0.5 text-[10px] text-slate-500">{new Date(ev.at).toLocaleDateString('en-IN')}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>

          <div className="space-y-4">
            <div className="rounded-2xl border border-teal-600/30 bg-gradient-to-br from-teal-500/10 via-slate-900/80 to-cyan-500/10 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Sales Intelligence Header</p>
                  <h2 className="mt-1 text-xl font-bold">{company?.canonical_name || 'Company Snapshot'}</h2>
                  <p className="mt-1 text-xs text-slate-300">
                    Compliance score: {riskScoreBreakdown.total} ({riskScoreBreakdown.band}) · Opportunity value: INR {marketOpportunity.expectedConsultingValue.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <a href={workbookSignals.phone ? `tel:${workbookSignals.phone.replace(/\s/g, '')}` : '#'} className="rounded-md border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
                    Call
                  </a>
                  <a href={workbookSignals.email ? `mailto:${workbookSignals.email}` : '#'} className="rounded-md border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
                    Email
                  </a>
                  <a href={(company?.linkedin_url || factSheet?.linkedin_company_url || '#').startsWith('http') ? (company?.linkedin_url || factSheet?.linkedin_company_url || '#') : `https://${company?.linkedin_url || factSheet?.linkedin_company_url || ''}`} target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 px-3 py-2 font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300">
                    LinkedIn
                  </a>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Compliance Score</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{riskScoreBreakdown.total} / 130</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Opportunity Value</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">INR {marketOpportunity.expectedConsultingValue.toLocaleString('en-IN')}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Conversion Probability</p>
                  <p className="mt-1 text-lg font-semibold text-slate-100">{engagementIntel.conversionProbability}%</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="mb-2 text-[11px] text-slate-500">
                Showing a {isRecyclerEntity ? 'recycler / PRO' : 'producer / PIBO'} workspace — fields that don’t apply are hidden.
              </p>
              <div className="flex flex-wrap gap-2">
                {(isRecyclerEntity
                  ? [
                      { key: 'overview', label: 'Overview' },
                      { key: 'recyclers', label: 'Plant & capacity' },
                      { key: 'compliance', label: 'Authorizations' },
                      { key: 'locations', label: 'Plants & sites' },
                      { key: 'decision-makers', label: 'Decision makers' },
                      { key: 'crm-activity', label: 'CRM' },
                      { key: 'ai-insights', label: 'AI insights' },
                      { key: 'intelligence', label: 'Intelligence' },
                    ]
                  : [
                      { key: 'overview', label: 'Overview' },
                      { key: 'compliance', label: 'Obligations' },
                      { key: 'decision-makers', label: 'Decision makers' },
                      { key: 'imports-exports', label: 'Imports/Exports' },
                      { key: 'trigger-events', label: 'Trigger events' },
                      { key: 'financials', label: 'Financials' },
                      { key: 'locations', label: 'Locations' },
                      { key: 'recyclers', label: 'Recycler network' },
                      { key: 'crm-activity', label: 'CRM' },
                      { key: 'ai-insights', label: 'AI insights' },
                      { key: 'intelligence', label: 'Intelligence' },
                    ]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveIntelTab(tab.key as typeof activeIntelTab)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      activeIntelTab === tab.key
                        ? 'border-teal-500/60 bg-teal-500/20 text-teal-200'
                        : 'border-slate-700 bg-slate-950/70 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {(activeIntelTab === 'overview' || activeIntelTab === 'compliance' || activeIntelTab === 'recyclers') && companyId ? (
              <>
                <IntelGoogleSalesTools companyId={companyId} />
                <IntelEprDossier companyId={companyId} isRecycler={isRecyclerEntity} />
              </>
            ) : null}

            {(activeIntelTab === 'overview' || activeIntelTab === 'financials') && (
              <div id="company-overview" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-teal-300">1. Company Overview Block</h3>
                  <Link
                    href="/intel/field-explainer#company-core"
                    className="text-[11px] font-semibold text-slate-400 transition hover:text-teal-300"
                  >
                    ? Explain these fields
                  </Link>
                </div>
                <div className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Upsell Opportunity Tags</p>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="rounded border border-emerald-500/45 bg-emerald-500/12 px-2 py-0.5 text-emerald-200">Waste</span>
                    <span className="rounded border border-sky-500/45 bg-sky-500/12 px-2 py-0.5 text-sky-200">Product</span>
                    <span className="rounded border border-amber-500/45 bg-amber-500/12 px-2 py-0.5 text-amber-200">Factory</span>
                    <span className="rounded border border-fuchsia-500/45 bg-fuchsia-500/12 px-2 py-0.5 text-fuchsia-200">Import</span>
                    <span className="rounded border border-cyan-500/45 bg-cyan-500/12 px-2 py-0.5 text-cyan-200">Export</span>
                    <span className="rounded border border-rose-500/45 bg-rose-500/12 px-2 py-0.5 text-rose-200">Company</span>
                    <span className="rounded border border-violet-500/45 bg-violet-500/12 px-2 py-0.5 text-violet-200">Global</span>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {upsellServiceTags.length === 0 ? (
                      <span className="rounded border border-slate-700 bg-slate-900/70 px-2 py-0.5 text-[11px] text-slate-500">No upsell mapping yet</span>
                    ) : upsellServiceTags.map((tag) => (
                      <span
                        key={tag.service}
                        title={tag.reason}
                        className={`group relative rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getUpsellTagColorClass(tag.service)}`}
                      >
                        {tag.service}
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-64 -translate-x-1/2 rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] font-medium text-slate-300 shadow-lg group-hover:block"
                        >
                          {tag.reason}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Company name</p><p className="mt-1 text-sm">{company?.canonical_name || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Industry</p><p className="mt-1 text-sm">{factSheet?.industry_classification || company?.company_type || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">CIN / GST / IEC</p><p className="mt-1 text-sm">{[company?.cin, company?.gstin, findWorkbookValue(factSheet?.raw_payload, [/\biec\b/, /import.*export/])].filter(Boolean).join(' / ') || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Headquarters</p><p className="mt-1 text-sm">{workbookSignals.address || [factSheet?.city, factSheet?.state].filter(Boolean).join(', ') || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Plant locations</p><p className="mt-1 text-sm">{locations.filter((location) => /plant|factory|facility|unit/i.test(cleanDisplayValue(location.location_type))).length}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Website</p><p className="mt-1 text-sm break-all">{company?.website || factSheet?.website || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Employee size</p><p className="mt-1 text-sm">{factSheet?.employee_count_band || workbookSignals.scaleIndicator || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Revenue estimate</p><p className="mt-1 text-sm">{factSheet?.revenue_band || `INR ${(marketOpportunity.estimatedAnnualEprLiability / 10000000).toFixed(2)} Cr inferred`}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Group company relationships</p><p className="mt-1 text-sm">{factSheet?.parent_company || findWorkbookValue(factSheet?.raw_payload, [/parent_company/, /group_company/, /subsidiary/]) || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Operational states</p><p className="mt-1 text-sm">{Array.from(new Set(locations.map((location) => location.state).filter(Boolean))).join(', ') || company?.state || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3 lg:col-span-2"><p className="text-[11px] uppercase tracking-wide text-slate-400">Compliance categories applicable</p><p className="mt-1 text-sm">{complianceApplicability.filter((row) => row.applicable).map((row) => row.complianceType).join(', ') || 'No applicability detected yet'}</p></div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Quick qualification: target account, applicable services, and enterprise/SME fit in one panel.</p>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'compliance') && (
              <div id="compliance-applicability" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-teal-300">2. Compliance Applicability Engine</h3>
                  <Link
                    href="/intel/field-explainer#registration-compliance"
                    className="text-[11px] font-semibold text-slate-400 transition hover:text-teal-300"
                  >
                    ? Explain these fields
                  </Link>
                </div>
                <p className="mt-1 text-xs text-slate-400">Logic uses product categories, import/export signals, manufacturing patterns, marketplace and license traces from available records.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-2 py-2">Compliance Type</th>
                        <th className="px-2 py-2">Applicable</th>
                        <th className="px-2 py-2">Registration Status</th>
                        <th className="px-2 py-2">Risk Level</th>
                        <th className="px-2 py-2">Intelligence Logic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {complianceApplicability.map((row) => (
                        <tr key={row.key} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-200">{row.complianceType}</td>
                          <td className="px-2 py-2 text-slate-300">{row.applicable ? 'Yes' : 'No'}</td>
                          <td className="px-2 py-2 text-slate-300">{row.registrationStatus}</td>
                          <td className="px-2 py-2 text-slate-300">{row.riskLevel}</td>
                          <td className="px-2 py-2 text-slate-400">{row.logicSignals.join(' · ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'decision-makers') && (
              <div id="decision-makers" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-teal-300">3. Decision Maker and Stakeholder Block</h3>
                  <Link
                    href="/intel/field-explainer#contacts-sendpilot-leadrocks"
                    className="text-[11px] font-semibold text-slate-400 transition hover:text-teal-300"
                  >
                    ? Explain these fields
                  </Link>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-2 py-2">Segment</th>
                        <th className="px-2 py-2">Name</th>
                        <th className="px-2 py-2">Designation</th>
                        <th className="px-2 py-2">LinkedIn</th>
                        <th className="px-2 py-2">Email</th>
                        <th className="px-2 py-2">Phone</th>
                        <th className="px-2 py-2">Last Activity</th>
                        <th className="px-2 py-2">Confidence</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stakeholderRows.length === 0 ? (
                        <tr><td colSpan={8} className="px-2 py-4 text-center text-slate-500">No stakeholder records yet.</td></tr>
                      ) : stakeholderRows.map((person) => (
                        <tr key={person.id} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-300">{person.bucket}</td>
                          <td className="px-2 py-2 text-slate-200">{person.name}</td>
                          <td className="px-2 py-2 text-slate-300">{person.designation}</td>
                          <td className="px-2 py-2 text-slate-300">{person.linkedin || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{person.email || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{person.phone || '-'}</td>
                          <td className="px-2 py-2 text-slate-400">{formatDate(person.lastActivity)}</td>
                          <td className="px-2 py-2 text-slate-300">{person.confidenceScore}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'trigger-events') && (
              <div id="trigger-events" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">4. Trigger Events Block</h3>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-2 py-2">Event</th>
                        <th className="px-2 py-2">Event Date</th>
                        <th className="px-2 py-2">Source</th>
                        <th className="px-2 py-2">Relevance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triggerEventsWithTradeSignals.length === 0 ? (
                        <tr><td colSpan={4} className="px-2 py-4 text-center text-slate-500">No trigger events detected yet.</td></tr>
                      ) : triggerEventsWithTradeSignals.map((event) => (
                        <tr key={event.id} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-200">{event.event}</td>
                          <td className="px-2 py-2 text-slate-300">{formatDate(event.eventDate)}</td>
                          <td className="px-2 py-2 text-slate-300">{event.source}</td>
                          <td className="px-2 py-2 text-slate-300">{event.relevanceScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {isPiboEntity && activeIntelTab === 'imports-exports' && (
              <div id="imports-exports-intel" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">Imports and Exports Intelligence</h3>
                <p className="mt-1 text-xs text-slate-400">Built from actual Intel raw records, importer workbook fields, IEC traces, and any mapped HS codes already ingested for this company.</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Importer signals</p><p className="mt-1 text-sm">{importExportIntel.importerSignals}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Exporter signals</p><p className="mt-1 text-sm">{importExportIntel.exporterSignals}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">IEC codes</p><p className="mt-1 text-sm break-all">{importExportIntel.iecCodes.join(', ') || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">HS codes mapped</p><p className="mt-1 text-sm">{importExportIntel.hsCodes.slice(0, 6).join(', ') || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Latest trade-linked date</p><p className="mt-1 text-sm">{formatDate(importExportIntel.latestTradeDate)}</p></div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Observed import profiles</p>
                    <p className="mt-1 text-sm text-slate-200">{importExportIntel.importProfiles.join(', ') || 'No importer/exporter profile mapped yet'}</p>
                    <p className="mt-2 text-[11px] text-slate-400">Product categories: {importExportIntel.productCategories.join(', ') || '-'}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Trade-trigger highlights</p>
                    <ul className="mt-2 space-y-2 text-xs text-slate-300">
                      {importExportIntel.triggerRows.length === 0 ? (
                        <li className="text-slate-500">No record-backed trade triggers available yet.</li>
                      ) : importExportIntel.triggerRows.map((event) => (
                        <li key={event.id} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                          <p className="font-medium text-slate-200">{event.event}</p>
                          <p className="mt-1 text-slate-400">{formatDate(event.eventDate)} · {event.source}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Monthly trade activity</p>
                    <ul className="mt-2 space-y-2 text-xs text-slate-300">
                      {tradeMonthlyActivity.length === 0 ? (
                        <li className="text-slate-500">No monthly trade trend is available yet.</li>
                      ) : tradeMonthlyActivity.map((row) => (
                        <li key={row.month} className="flex items-center justify-between rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                          <span className="text-slate-200">{formatMonthYear(row.month)}</span>
                          <span className="text-slate-400">{row.total_records} records · {row.importer_signals} importer · {row.exporter_signals} exporter</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Trade source coverage</p>
                    <ul className="mt-2 space-y-2 text-xs text-slate-300">
                      {tradeSourceMix.length === 0 ? (
                        <li className="text-slate-500">No trade source breakdown is available yet.</li>
                      ) : tradeSourceMix.map((source) => (
                        <li key={`${source.source_id || source.source_label}`} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                          <p className="font-medium text-slate-200">{source.source_label}</p>
                          <p className="mt-1 text-slate-400">{source.records} records · {source.importer_signals} importer · {source.exporter_signals} exporter</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-2 py-2">Observed date</th>
                        <th className="px-2 py-2">Source</th>
                        <th className="px-2 py-2">Import profile</th>
                        <th className="px-2 py-2">IEC</th>
                        <th className="px-2 py-2">Registration</th>
                        <th className="px-2 py-2">HS codes</th>
                        <th className="px-2 py-2">External ref</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importExportIntel.recentRecords.length === 0 ? (
                        <tr><td colSpan={7} className="px-2 py-4 text-center text-slate-500">No company-linked trade records found in Intel raw records.</td></tr>
                      ) : importExportIntel.recentRecords.map((record) => (
                        <tr key={record.id} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-300">{formatDate(record.certificateIssueDate || record.observedAt)}</td>
                          <td className="px-2 py-2 text-slate-300">{record.sourceLabel || '-'}</td>
                          <td className="px-2 py-2 text-slate-200">{record.importProfile || (record.importerFlag ? 'Importer signal' : record.exporterFlag ? 'Exporter signal' : '-')}</td>
                          <td className="px-2 py-2 text-slate-300">{record.iecCode || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{record.registrationId || '-'}</td>
                          <td className="px-2 py-2 text-slate-300">{record.hsCodes.join(', ') || '-'}</td>
                          <td className="px-2 py-2 text-slate-500">{record.externalRecordId || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'compliance') && (
              <div id="compliance-risk-score" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">5. Compliance Risk Score Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {riskScoreBreakdown.breakdown.map((item) => (
                    <div key={item.parameter} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{item.parameter}</p>
                      <p className="mt-1 text-lg font-semibold text-slate-100">+{item.score}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-sm text-slate-200">Final Risk Band: <span className="font-semibold">{riskScoreBreakdown.band}</span> ({riskScoreBreakdown.total})</p>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'financials') && (
              <div id="market-opportunity" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">6. Market Opportunity Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Estimated annual EPR liability</p><p className="mt-1 text-sm">INR {marketOpportunity.estimatedAnnualEprLiability.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Plastic tonnage estimate</p><p className="mt-1 text-sm">{marketOpportunity.plasticTonnageEstimate} MT</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Battery tonnage estimate</p><p className="mt-1 text-sm">{marketOpportunity.batteryTonnageEstimate} MT</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Expected certificate requirement</p><p className="mt-1 text-sm">{marketOpportunity.expectedCertificateRequirement}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Number of factories</p><p className="mt-1 text-sm">{marketOpportunity.factoryCount}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">State coverage</p><p className="mt-1 text-sm">{marketOpportunity.stateCoverage}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Vendor potential</p><p className="mt-1 text-sm">{marketOpportunity.vendorPotential}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Expected consulting value</p><p className="mt-1 text-sm">INR {marketOpportunity.expectedConsultingValue.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">TAM estimate</p><p className="mt-1 text-sm">INR {marketOpportunity.tamEstimate.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Potential monthly billing</p><p className="mt-1 text-sm">INR {marketOpportunity.potentialMonthlyBilling.toLocaleString('en-IN')}</p></div>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'locations') && (
              <div id="geographic-intelligence" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">7. Geographic Intelligence Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <select value={geoStateFilter} onChange={(event) => setGeoStateFilter(event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                    <option value="all">All states</option>
                    {Array.from(new Set(locations.map((location) => location.state).filter(Boolean))).map((value) => <option key={value as string} value={value as string}>{value}</option>)}
                  </select>
                  <select value={geoDistrictFilter} onChange={(event) => setGeoDistrictFilter(event.target.value)} className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                    <option value="all">All districts</option>
                    {Array.from(new Set(locations.map((location) => location.district || location.city).filter(Boolean))).map((value) => <option key={value as string} value={value as string}>{value}</option>)}
                  </select>
                  <input value={geoRadiusKmFilter} onChange={(event) => setGeoRadiusKmFilter(event.target.value)} placeholder="Pin code radius (km)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm" />
                </div>
                <p className="mt-2 text-xs text-slate-400">Showing {geoFilteredLocations.length} matching locations, {nearbyRecyclers.length} nearby recyclers, jurisdiction via mapped SPCB.</p>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'compliance') && (
              <div id="compliance-timeline" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">8. Compliance Timeline Block</h3>
                <div className="mt-3 space-y-2 text-sm">
                  {[
                    ...registrations.map((registration) => ({ date: registration.issue_date || registration.valid_upto, label: `${registration.registration_type || 'Registration'} · ${registration.registration_status || '-'}` })),
                    ...notices.map((notice) => ({ date: notice.notice_date || notice.deadline_date, label: `${notice.notice_type || 'Notice'} · ${notice.authority || '-'}` }))
                  ].sort((left, right) => (toDateMs(right.date) || 0) - (toDateMs(left.date) || 0)).slice(0, 10).map((item, idx) => (
                    <div key={`${item.label}-${idx}`} className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <p className="text-slate-200">{item.label}</p>
                      <p className="text-xs text-slate-400">{formatDate(item.date)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isPiboEntity && (activeIntelTab === 'overview' || activeIntelTab === 'recyclers') && (
              <div id="competitor-vendor-intel" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">9. Competitor and Vendor Intelligence Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Existing consultants</p><p className="mt-1 text-sm">{findWorkbookValue(factSheet?.raw_payload, [/consultant/, /agency/]) || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Existing recyclers</p><p className="mt-1 text-sm">{nearbyRecyclers.length}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">PRO partners</p><p className="mt-1 text-sm">{findWorkbookValue(factSheet?.raw_payload, [/\bpro\b/, /producer responsibility/]) || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Competitor agencies</p><p className="mt-1 text-sm">{findWorkbookValue(factSheet?.raw_payload, [/competitor/, /alternate agency/]) || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Vendor replacement opportunity</p><p className="mt-1 text-sm">{marketOpportunity.vendorPotential > 3 ? 'High' : 'Medium'}</p></div>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'ai-insights') && (
              <div id="ai-recommendation" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">10. AI Recommendation Block</h3>
                <div className="mt-3 space-y-3">
                  {aiRecommendations.map((item, index) => (
                    <div key={`${item.insight}-${index}`} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-sm font-semibold text-slate-100">{item.insight}</p>
                      <p className="mt-1 text-xs text-slate-300">Pitch angle: {item.pitch}</p>
                      <p className="mt-1 text-xs text-slate-400">Suggested outreach script: {item.script}</p>
                      <p className="mt-1 text-xs text-cyan-300">Suggested pricing range: {item.pricing}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'crm-activity') && (
              <div id="engagement-crm" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">11. Engagement and CRM Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Last contacted</p><p className="mt-1 text-sm">{formatDate(engagementIntel.lastContacted)}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Call recordings</p><p className="mt-1 text-sm">{engagementIntel.callRecordings}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Proposal sent</p><p className="mt-1 text-sm">{engagementIntel.proposalSent ? 'Yes' : 'No'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Meeting notes</p><p className="mt-1 text-sm">{engagementIntel.meetingNotes}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">WhatsApp status</p><p className="mt-1 text-sm">{engagementIntel.whatsappStatus}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Follow-up reminder</p><p className="mt-1 text-sm">{engagementIntel.followUpDueDays} day(s)</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Proposal amount</p><p className="mt-1 text-sm">INR {engagementIntel.proposalAmount.toLocaleString('en-IN')}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Conversion probability</p><p className="mt-1 text-sm">{engagementIntel.conversionProbability}%</p></div>
                </div>
              </div>
            )}

            {isPiboEntity && (activeIntelTab === 'overview' || activeIntelTab === 'financials') && (
              <div id="sector-benchmarking" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">12. Sector Benchmarking Block</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Similar companies</p><p className="mt-1 text-sm">{benchmarkMetrics.peerCount}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Industry avg notices</p><p className="mt-1 text-sm">{benchmarkMetrics.peerNoticesAvg.toFixed(1)}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Compliance maturity avg</p><p className="mt-1 text-sm">{benchmarkMetrics.peerComplianceMaturity}%</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Avg EPR spend proxy</p><p className="mt-1 text-sm">INR {Math.round(benchmarkMetrics.peerPenaltyAvg * 2).toLocaleString('en-IN')}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Typical recycling partners</p><p className="mt-1 text-sm">{nearbyRecyclers.length || '-'}</p></div>
                </div>
              </div>
            )}

            {isPiboEntity && (activeIntelTab === 'overview' || activeIntelTab === 'imports-exports') && (
              <div id="government-data" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">13. Government Data Block</h3>
                <p className="mt-1 text-xs text-slate-400">Organized by freshness, authority, state, and applicability.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                        <th className="px-2 py-2">Source authority</th>
                        <th className="px-2 py-2">Freshness</th>
                        <th className="px-2 py-2">State</th>
                        <th className="px-2 py-2">Applicability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {governmentDataSignals.rows.map((row) => (
                        <tr key={row.source} className="border-b border-slate-900">
                          <td className="px-2 py-2 text-slate-200">{row.source}</td>
                          <td className="px-2 py-2 text-slate-300">{formatDate(row.freshness)}</td>
                          <td className="px-2 py-2 text-slate-300">{row.state}</td>
                          <td className="px-2 py-2 text-slate-300">{row.applicability}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {(activeIntelTab === 'overview' || activeIntelTab === 'compliance') && (
              <div id="lead-prioritization" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">14. Lead Prioritization Dashboard</h3>
                <p className="mt-1 text-xs text-slate-400">Filters available: industry, state, compliance type, risk score, revenue size.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {leadPrioritySegments.map((segment) => (
                    <div key={segment.segment} className="rounded-md border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">{segment.segment}</p>
                      <p className={`mt-1 text-sm font-semibold ${segment.value ? 'text-emerald-300' : 'text-slate-400'}`}>{segment.value ? 'Yes' : 'No'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {isRecyclerEntity && (activeIntelTab === 'overview' || activeIntelTab === 'recyclers') && (
              <div id="recycler-intelligence" className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                <h3 className="text-sm font-semibold text-teal-300">15. Plant, capacity and authorizations</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Authorized recyclers</p><p className="mt-1 text-sm">{nearbyRecyclers.length}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Capacity</p><p className="mt-1 text-sm">{batteryRecyclerProfile?.annual_processing_capacity_mt ?? cpcbProfile?.capacity_mt ?? '-'} MT</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">State approvals</p><p className="mt-1 text-sm">{spcbProfile?.spcb_registrations?.length || (company?.state ? 1 : 0)}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">CPCB/SPCB status</p><p className="mt-1 text-sm">{cpcbProfile?.cpcb_registration_status || workbookSignals.mpcbStatus || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Material specialization</p><p className="mt-1 text-sm">{(cpcbProfile?.material_categories || []).join(', ') || workbookSignals.specialization || '-'}</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Actual processing capacity</p><p className="mt-1 text-sm">{batteryRecyclerProfile?.authorized_capacity_mt ?? '-'} MT</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Geo radius</p><p className="mt-1 text-sm">{geoRadiusKmFilter} km</p></div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/60 p-3"><p className="text-[11px] uppercase tracking-wide text-slate-400">Historical credit generation</p><p className="mt-1 text-sm">Li: {workbookSignals.liCreditsMt || '-'} · Mg: {workbookSignals.mgCreditsMt || '-'} · Fe: {workbookSignals.feCreditsMt || '-'}</p></div>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-xl border border-cyan-700/30 bg-cyan-950/10 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Partnership Block</p>
                      <span className="rounded border border-cyan-700/40 bg-cyan-900/30 px-2 py-0.5 text-[10px] text-cyan-200">
                        {showPartnershipProfile ? 'Recycler Profile' : 'General Profile'}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Primary Contact</p><p className="text-sm text-slate-200">{workbookSignals.contactName || '-'}</p></div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Partner Region</p><p className="text-sm text-slate-200">{workbookSignals.partnerRegion || '-'}</p></div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Geo Tier</p><p className="text-sm text-slate-200">{workbookSignals.geoTier || '-'}</p></div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Outreach Status</p><p className="text-sm text-slate-200">{workbookSignals.outreachStatus || '-'}</p></div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Partnership Priority</p><p className="text-sm text-slate-200">{workbookSignals.partnershipPriority || '-'}</p></div>
                      <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Partnership Score</p><p className="text-sm text-slate-200">{workbookSignals.partnershipScore || '-'}</p></div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-amber-700/30 bg-amber-950/10 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-300">State Pollution Control Board + CTO Block</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold ${ctoExpiryStatus.tone}`}>
                          {ctoExpiryStatus.label}
                          {ctoExpiryStatus.daysRemaining !== null ? ` · ${ctoExpiryStatus.daysRemaining}d` : ''}
                        </span>
                        <span className="rounded border border-slate-700 bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold text-slate-200">
                          SPCB: {spcbCompanyProfile?.spcb_status || spcbCompanyProfile?.authorization_status || workbookSignals.mpcbStatus || 'Unknown'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-3">
                      <p className="text-[11px] uppercase tracking-wide text-slate-400">Compliance Snapshot</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">SPCB Board</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.spcb_board_name || spcbProfile?.board_name || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">State</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.state || spcbProfile?.state || company?.state || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Registration Scope</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.registration_scope || (spcbCompanyProfile?.cpcb_registration_present ? 'spcb_and_cpcb' : 'spcb_only')}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorization Number</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.authorization_number || spcbCompanyProfile?.authorization_order_number || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorization Validity</p><p className="text-sm text-slate-200">{formatDate(spcbCompanyProfile?.authorization_valid_upto)}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">CPCB Status</p><p className="text-sm text-slate-200">{workbookSignals.cpcbStatus || cpcbProfile?.cpcb_registration_status || '-'}</p></div>
                      </div>
                    </div>

                    <details className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-3" aria-label="Entity and contact details">
                      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-400">Entity and Contact</summary>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 sm:col-span-2"><p className="text-[10px] uppercase text-slate-500">Name and Address of Industry</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.company_name_as_per_spcb || company?.canonical_name || '-'}</p><p className="mt-1 text-xs text-slate-400">{spcbCompanyProfile?.industry_address || workbookSignals.address || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Activity</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.activity || workbookSignals.specialization || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Capacity</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.capacity || (spcbCompanyProfile?.capacity_mta ? `${spcbCompanyProfile.capacity_mta} MTA` : null) || (workbookSignals.mpcbCapacityAllotted ? `${workbookSignals.mpcbCapacityAllotted} MT` : '-')}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Contact Person</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.contact_person || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Mobile / Phone</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.mobile_no || spcbCompanyProfile?.phone_no || spcbCompanyProfile?.contact_no || workbookSignals.phone || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Email</p><p className="text-sm text-slate-200 break-all">{spcbCompanyProfile?.email_id || workbookSignals.email || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">District / City / Taluka / PIN</p><p className="text-sm text-slate-200">{[spcbCompanyProfile?.district, spcbCompanyProfile?.city, spcbCompanyProfile?.taluka, spcbCompanyProfile?.postal_code].filter(Boolean).join(' · ') || '-'}</p></div>
                      </div>
                    </details>

                    <details className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-3" aria-label="Hazardous and consent details">
                      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-400">Hazardous and Consent Details</summary>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorization Type</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.authorization_type || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorization Status</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.authorization_status || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorization Issued</p><p className="text-sm text-slate-200">{formatDate(spcbCompanyProfile?.authorization_issue_date)}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Hazardous Categories</p><p className="text-sm text-slate-200">{(spcbCompanyProfile?.hazardous_waste_categories || []).join(', ') || spcbCompanyProfile?.hazardous_waste_streams || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Authorized Quantity</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.authorized_quantity ? `${spcbCompanyProfile.authorized_quantity} ${spcbCompanyProfile.authorized_quantity_unit || ''}`.trim() : '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Recycler Classification</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.recycler_classification || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Facility / Occupier</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.facility_name || spcbCompanyProfile?.occupier_name || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">CTO/Consent Ref</p><p className="text-sm text-slate-200">{workbookSignals.mpcbConsentRef || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Validity of CTO</p><p className="text-sm text-slate-200">{formatDate(spcbCompanyProfile?.cto_valid_upto || workbookSignals.mpcbConsentValidity)}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Validity of HSW Authorization</p><p className="text-sm text-slate-200">{formatDate(spcbCompanyProfile?.hsw_authorization_valid_upto)}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">CPCB Registration No.</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.cpcb_registration_number || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Regional Office</p><p className="text-sm text-slate-200">{workbookSignals.regionalOffice || '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2"><p className="text-[10px] uppercase text-slate-500">Consent Capacity</p><p className="text-sm text-slate-200">{workbookSignals.mpcbCapacityAllotted ? `${workbookSignals.mpcbCapacityAllotted} MT` : '-'}</p></div>
                        <div className="rounded border border-slate-800 bg-slate-950/60 px-3 py-2 lg:col-span-3"><p className="text-[10px] uppercase text-slate-500">Remarks</p><p className="text-sm text-slate-200">{spcbCompanyProfile?.remarks || workbookSignals.mpcbRemark || '-'}</p></div>
                      </div>
                    </details>

                    <details className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-3" aria-label="CTO and SPCB linked registrations">
                      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-400">CTO / SPCB-linked Registrations</summary>
                      {ctoRegistrations.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">No CTO/SPCB registration rows mapped yet.</p>
                      ) : (
                        <ul className="mt-2 space-y-1 text-xs text-slate-300">
                          {ctoRegistrations.slice(0, 6).map((registration) => (
                            <li key={registration.id} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-1.5">
                              {registration.registration_type || 'Registration'} · {registration.registration_status || '-'} · {registration.authority || '-'} · valid till {formatDate(registration.valid_upto)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>

                    <details className="mt-3 rounded border border-slate-800 bg-slate-950/50 p-3" aria-label="Additional SPCB source columns">
                      <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-wide text-slate-400">Additional SPCB Source Columns</summary>
                      {spcbRawPayloadRows.length === 0 ? (
                        <p className="mt-2 text-xs text-slate-500">No additional raw row columns available yet.</p>
                      ) : (
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {spcbRawPayloadRows.map((row) => (
                            <div key={row.key} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-1.5">
                              <p className="text-[10px] uppercase text-slate-500">{toTitleLabel(row.key)}</p>
                              <p className="mt-0.5 text-xs text-slate-300 break-words">{row.value}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </details>
                  </div>
                </div>
              </div>
            )}

            {activeIntelTab === 'intelligence' && company && (
              <IntelligencePanel companyId={company.id} />
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-teal-300">Editable Company Information</h2>
            <p className="text-xs text-slate-400">Edit inline and save each field directly.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {EDITABLE_COMPANY_FIELDS.map((fieldConfig) => (
              <div key={fieldConfig.key} className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <label className="mb-1 block text-[11px] uppercase tracking-wide text-slate-400" htmlFor={`editable-${fieldConfig.key}`}>
                  {fieldConfig.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={`editable-${fieldConfig.key}`}
                    type={fieldConfig.inputType}
                    step={fieldConfig.step}
                    min={fieldConfig.min}
                    max={fieldConfig.max}
                    value={editableCompanyValues[fieldConfig.key]}
                    onChange={(event) => {
                      const value = event.target.value;
                      setEditableCompanyValues((current) => ({
                        ...current,
                        [fieldConfig.key]: value
                      }));
                    }}
                    onBlur={() => {
                      void saveCompanyField(fieldConfig.key);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void saveCompanyField(fieldConfig.key);
                      }
                    }}
                    disabled={savingField === fieldConfig.key || loading}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 outline-none focus:border-teal-400 disabled:opacity-70"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      void saveCompanyField(fieldConfig.key);
                    }}
                    disabled={savingField === fieldConfig.key || loading}
                    className="rounded border border-slate-700 px-2 py-1.5 text-xs font-semibold text-slate-200 hover:border-teal-400 hover:text-teal-300 disabled:opacity-60"
                  >
                    {savingField === fieldConfig.key ? 'Saving' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-teal-300">Associated People</h2>
            <span className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">
              {associatedPeople.length.toLocaleString('en-IN')} Added
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Add contacts from enrichment/vendor files (phone-only allowed). You can update unknown names and intelligence fields later.
          </p>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-3">
            <p className="text-xs font-semibold text-slate-300">Bulk Import (Vendor File)</p>
            <p className="mt-1 text-xs text-slate-500">Upload .xlsx or .csv. Dedupe runs by phone, email, and LinkedIn within this company.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(event) => {
                  const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
                  setAssociatedPeopleImportFile(file);
                }}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200 file:mr-3 file:rounded file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:font-semibold file:text-slate-100"
              />
              <input
                type="text"
                value={associatedPeopleImportVendor}
                onChange={(event) => setAssociatedPeopleImportVendor(event.target.value)}
                placeholder="Vendor Name (optional default)"
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
              />
              <div className="sm:col-span-2 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => { void importAssociatedPeople(); }}
                  disabled={importingAssociatedPeople || !associatedPeopleImportFile}
                  className="rounded-md bg-cyan-700 px-4 py-2 text-xs font-semibold text-white hover:bg-cyan-600 disabled:opacity-60"
                >
                  {importingAssociatedPeople ? 'Importing...' : 'Import Vendor Contacts'}
                </button>
              </div>
            </div>
          </div>

          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" onSubmit={addAssociatedPerson}>
            <input
              type="text"
              value={associatedPersonForm.person_name}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, person_name: event.target.value }))}
              placeholder="Person Name (optional for vendor rows)"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.designation}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, designation: event.target.value }))}
              placeholder="Designation"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.phone}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, phone: event.target.value }))}
              placeholder="Phone Number"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="email"
              value={associatedPersonForm.email}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="Email"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="url"
              value={associatedPersonForm.linkedin_url}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, linkedin_url: event.target.value }))}
              placeholder="LinkedIn Profile URL"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.notes}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="Notes"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.department}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, department: event.target.value }))}
              placeholder="Department (Ops, Compliance, Procurement)"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.seniority_level}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, seniority_level: event.target.value }))}
              placeholder="Seniority (Manager/Director/CXO)"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.source_type}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, source_type: event.target.value }))}
              placeholder="Source Type (vendor_dataset/enrichment/manual)"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="text"
              value={associatedPersonForm.source_vendor}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, source_vendor: event.target.value }))}
              placeholder="Source Vendor"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={associatedPersonForm.confidence_score}
              onChange={(event) => setAssociatedPersonForm((current) => ({ ...current, confidence_score: event.target.value }))}
              placeholder="Confidence (0-1)"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-400"
            />
            <div className="sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                disabled={addingAssociatedPerson}
                className="rounded-md bg-teal-700 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
              >
                {addingAssociatedPerson ? 'Adding Person...' : 'Add Associated Person'}
              </button>
            </div>
          </form>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-2 py-2">Person</th>
                  <th className="px-2 py-2">Designation</th>
                  <th className="px-2 py-2">Prospect Intel</th>
                  <th className="px-2 py-2">Phone</th>
                  <th className="px-2 py-2">Email</th>
                  <th className="px-2 py-2">LinkedIn</th>
                  <th className="px-2 py-2">Added</th>
                  <th className="px-2 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {associatedPeople.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-4 text-center text-slate-500">
                      No associated people added yet.
                    </td>
                  </tr>
                ) : (
                  associatedPeople.map((person) => (
                    <tr key={person.id} className="border-b border-slate-900">
                      <td className="px-2 py-2 text-slate-200">
                        <div className="flex flex-col gap-1">
                          {editingAssociatedPersonId === person.id ? (
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.person_name}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, person_name: event.target.value }))}
                              placeholder="Person Name"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
                            />
                          ) : (
                            <span>{person.person_name}</span>
                          )}
                          {person.notes ? <span className="text-xs text-slate-500">{person.notes}</span> : null}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <input
                            type="text"
                            value={editingAssociatedPersonForm.designation}
                            onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, designation: event.target.value }))}
                            placeholder="Designation"
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
                          />
                        ) : (person.designation || '-')}
                      </td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <div className="grid gap-1">
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.department}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, department: event.target.value }))}
                              placeholder="Department"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.seniority_level}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, seniority_level: event.target.value }))}
                              placeholder="Seniority"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.source_type}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, source_type: event.target.value }))}
                              placeholder="Source type"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.source_vendor}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, source_vendor: event.target.value }))}
                              placeholder="Source vendor"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="1"
                              value={editingAssociatedPersonForm.confidence_score}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, confidence_score: event.target.value }))}
                              placeholder="Confidence"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                            <input
                              type="text"
                              value={editingAssociatedPersonForm.notes}
                              onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, notes: event.target.value }))}
                              placeholder="Notes"
                              className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100 outline-none focus:border-teal-400"
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 text-xs">
                            <span>{person.department || '—'} · {person.seniority_level || '—'}</span>
                            <span className="text-slate-500">{person.source_type || 'manual'}{person.source_vendor ? ` · ${person.source_vendor}` : ''}</span>
                            <span className="text-cyan-300">Confidence: {person.confidence_score ?? '—'}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <input
                            type="text"
                            value={editingAssociatedPersonForm.phone}
                            onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, phone: event.target.value }))}
                            placeholder="Phone"
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
                          />
                        ) : <PhoneValue value={person.phone} />}
                      </td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <input
                            type="email"
                            value={editingAssociatedPersonForm.email}
                            onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, email: event.target.value }))}
                            placeholder="Email"
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
                          />
                        ) : <EmailValue value={person.email} />}
                      </td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <input
                            type="url"
                            value={editingAssociatedPersonForm.linkedin_url}
                            onChange={(event) => setEditingAssociatedPersonForm((current) => ({ ...current, linkedin_url: event.target.value }))}
                            placeholder="LinkedIn URL"
                            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm text-slate-100 outline-none focus:border-teal-400"
                          />
                        ) : (
                          person.linkedin_url ? (
                            <span className="flex flex-wrap items-center gap-1">
                              <a
                                href={person.linkedin_url.startsWith('http') ? person.linkedin_url : `https://${person.linkedin_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-300 hover:underline break-all"
                              >
                                {person.linkedin_url}
                              </a>
                              <CopyButton text={person.linkedin_url} />
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )
                        )}
                      </td>
                      <td className="px-2 py-2 text-slate-400">{new Date(person.created_at).toLocaleDateString('en-IN')}</td>
                      <td className="px-2 py-2 text-slate-300">
                        {editingAssociatedPersonId === person.id ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { void saveAssociatedPerson(person.id); }}
                              disabled={savingAssociatedPersonId === person.id}
                              className="rounded border border-teal-600 px-2 py-1 text-xs text-teal-200 hover:bg-teal-900/40 disabled:opacity-60"
                            >
                              {savingAssociatedPersonId === person.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditingAssociatedPerson}
                              disabled={savingAssociatedPersonId === person.id}
                              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-slate-500"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEditingAssociatedPerson(person)}
                            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:border-teal-400 hover:text-teal-300"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Total Notices</p>
            <p className="mt-1 text-2xl font-semibold">{notices.length}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Penalty Sum (INR)</p>
            <p className="mt-1 text-2xl font-semibold">{totalPenalty.toLocaleString('en-IN')}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs text-slate-400">Conflict Log Entries</p>
            <p className="mt-1 text-2xl font-semibold">{fieldHistory.length}</p>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-teal-300">Locations</h2>
            <span className="rounded bg-cyan-900/35 px-2 py-1 text-xs font-semibold text-cyan-200">
              {locations.length.toLocaleString('en-IN')} Locations
            </span>
          </div>
          {locations.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-2">Location</th>
                    <th className="px-2 py-2">Type</th>
                    <th className="px-2 py-2">City</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Postal</th>
                    <th className="px-2 py-2">Operational</th>
                    <th className="px-2 py-2">Verification</th>
                    <th className="px-2 py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id} className="border-b border-slate-900">
                      <td className="px-2 py-2 text-slate-200">
                        <div className="flex flex-col gap-1">
                          <span>{location.location_name || location.address_line_1 || '-'}</span>
                          <span className="text-xs text-slate-400">{location.address_line_1 || '-'}</span>
                          <div className="flex flex-wrap gap-1">
                            {location.is_primary_location ? <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">Primary</span> : null}
                            {location.is_registered_office ? <span className="rounded bg-blue-900/40 px-2 py-0.5 text-[10px] text-blue-300">Registered</span> : null}
                            {location.is_operational_facility ? <span className="rounded bg-violet-900/40 px-2 py-0.5 text-[10px] text-violet-300">Operational</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-slate-300">{location.location_type}</td>
                      <td className="px-2 py-2 text-slate-300">{location.city || location.district || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{location.state || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{location.postal_code || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{location.operational_status || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{location.verification_status || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{location.enrichment_confidence || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/50 p-6 text-center">
              <p className="text-2xl">📍</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">No locations on file</p>
              <p className="mt-1 text-xs text-slate-500">Locations are enriched via the Google Places geo pipeline. Run geo enrichment to populate this section.</p>
            </div>
          )}
        </div>

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-teal-300">EPR Registrations</h2>
            <span className="rounded bg-emerald-900/35 px-2 py-1 text-xs font-semibold text-emerald-200">
              {registrations.length.toLocaleString('en-IN')} Records
            </span>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Certificate Issue Date(s): {certificateIssueDates.length > 0 ? certificateIssueDates.join(', ') : '-'}
          </p>
          {registrations.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-2 py-2">Registration</th>
                    <th className="px-2 py-2">Authority</th>
                    <th className="px-2 py-2">Category</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Issue Date</th>
                    <th className="px-2 py-2">Validity</th>
                    <th className="px-2 py-2">State</th>
                    <th className="px-2 py-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((registration) => (
                    <tr key={registration.id} className="border-b border-slate-900">
                      <td className="px-2 py-2 text-slate-200">
                        <div className="flex flex-col gap-1">
                          <span>{registration.registration_id || registration.registration_type || '-'}</span>
                          <span className="text-xs text-slate-400">{registration.registration_type || '-'}</span>
                          <div className="flex flex-wrap gap-1">
                            {registration.is_primary ? <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[10px] text-emerald-300">Primary</span> : null}
                            {registration.segment_tag ? <span className="rounded bg-cyan-900/40 px-2 py-0.5 text-[10px] text-cyan-300">{registration.segment_tag}</span> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-slate-300">{registration.authority || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{registration.waste_category || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{registration.registration_status || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{registration.issue_date || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{registration.valid_from || '-'} to {registration.valid_upto || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">{registration.issuing_state || '-'}</td>
                      <td className="px-2 py-2 text-slate-300">
                        <div className="flex flex-col gap-1">
                          <span>{registration.source_label || '-'}</span>
                          <span className="text-xs text-slate-500">{registration.source_record_ref || '-'}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No child EPR registrations are attached to this company yet.</p>
          )}
        </div>

        {showPartnershipProfile ? (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-teal-300">Partnership Profile</h2>
            {partnershipProfile || workbookSignals.contactName || workbookSignals.partnerRegion || workbookSignals.partnershipPriority ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Primary Contact</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.contactName || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Email Variant</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.emailVariant || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Partner Region</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.partnerRegion || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Geo Tier</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.geoTier || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Outreach Status</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.outreachStatus || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Partnership Score</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.partnershipScore || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Partnership Priority</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.partnershipPriority || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Suggested Channel</p>
                  <p className="mt-1 text-sm text-slate-200">{partnershipProfile?.suggested_channel || factSheet?.recommended_channel || '-'}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Outreach Angle</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.outreachAngle || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recycler Specialisation</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.specialization || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Subject Used</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.subjectUsed || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Variant Used</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.variantUsed || '-'}</p>
                </div>
              </div>
            </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Partnership profile not available for this company yet.</p>
            )}
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-teal-300">Company Fact Sheet</h2>
          {factSheet ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
                <p className="mt-1 text-sm"><EmailValue value={workbookSignals.email} /></p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Contact Number</p>
                <p className="mt-1 text-sm"><PhoneValue value={workbookSignals.phone} /></p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Website</p>
                <p className="mt-1 break-all text-sm">
                  {workbookSignals.website ? (
                    <span className="flex flex-wrap items-center gap-1">
                      <a href={workbookSignals.website.startsWith('http') ? workbookSignals.website : `https://${workbookSignals.website}`} target="_blank" rel="noreferrer" className="text-blue-300 hover:underline">{workbookSignals.website}</a>
                      <CopyButton text={workbookSignals.website} />
                    </span>
                  ) : <span className="text-slate-500">—</span>}
                </p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Postal Code</p>
                <p className="mt-1 text-sm text-slate-200">{workbookSignals.postalCode || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Registration IDs</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.registration_ids || registrations.map((item) => item.registration_id).filter(Boolean).join(', ') || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Industry</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.industry_classification || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Segment Tag</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.segment_tag || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Relevance Score</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.relevance_score ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Recommended Channel</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.recommended_channel || '-'}</p>
              </div>
              {isPiboEntity ? (
                <>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">EC (INR Cr)</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.ec_inr_cr ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">EPR Target (MT)</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.epr_target_mt ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Shortfall (MT)</p>
                <p className="mt-1 text-sm text-slate-200">{factSheet.shortfall_mt ?? '-'}</p>
              </div>
                </>
              ) : (
                <>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Annual capacity (MT)</p>
                <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile?.annual_processing_capacity_mt ?? cpcbProfile?.capacity_mt ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorized capacity (MT)</p>
                <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile?.authorized_capacity_mt ?? mpcbProfile?.capacity_allotted_mt ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Material / chemistry</p>
                <p className="mt-1 text-sm text-slate-200">{(cpcbProfile?.material_categories || batteryRecyclerProfile?.battery_categories || []).join(', ') || '-'}</p>
              </div>
                </>
              )}
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Location</p>
                <p className="mt-1 text-sm text-slate-200">{[factSheet.city, factSheet.state, factSheet.country].filter(Boolean).join(', ') || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">Address</p>
                <p className="mt-1 text-sm text-slate-200">{workbookSignals.address || '-'}</p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Fact sheet not available for this company yet.</p>
          )}
        </div>

        {isRecyclerEntity ? (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-teal-300">Battery Recycler Profile</h2>
          {batteryRecyclerProfile ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recycler Name</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.recycler_name || company?.canonical_name || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">CPCB Registration</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.cpcb_registration_number || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Annual Capacity (MT/Yr)</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.annual_processing_capacity_mt ?? '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Compliance Status</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.compliance_status || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Battery Categories</p>
                  <p className="mt-1 text-sm text-slate-200">{(batteryRecyclerProfile.battery_categories || []).join(', ') || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Chemistry Capability</p>
                  <p className="mt-1 text-sm text-slate-200">{(batteryRecyclerProfile.chemistry_capabilities || []).join(', ') || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Scale Indicator</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.scaleIndicator || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recycler Specialisation</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.specialization || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorized Capacity (MT/Yr)</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.authorized_capacity_mt ?? '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Plants / Centers</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {batteryRecyclerProfile.plant_count ?? '-'} / {batteryRecyclerProfile.collection_centers_count ?? '-'}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Li Credits (MT)</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.liCreditsMt || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Mg Credits (MT)</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mgCreditsMt || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Fe Credits (MT)</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.feCreditsMt || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Processing Technology</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.processing_technology || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recovery Efficiency (%)</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.recovery_efficiency_pct ?? '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Black Mass Output (MT)</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryRecyclerProfile.black_mass_output_mt ?? '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Validity (CPCB / State)</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {batteryRecyclerProfile.cpcb_registration_valid_upto || '-'} / {batteryRecyclerProfile.state_authorization_valid_upto || '-'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Certificate Issue Date (Battery)</p>
                  <p className="mt-1 text-sm text-slate-200">{batteryCertificateIssueDates[0] || '-'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {batteryCertificateIssueDates.length > 1 ? batteryCertificateIssueDates.join(', ') : 'Single certificate issue date available'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Battery recycler profile not available for this company yet.</p>
          )}
        </div>
        ) : null}

        {isRecyclerEntity ? (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-teal-300">CPCB Registration Profile</h2>
          {cpcbProfile ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Registration Number</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.cpcb_registration_number || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Registration Status</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.cpcb_registration_status || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorization Type</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.authorization_type || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Recycler Category</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.recycler_category || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Capacity (MT)</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.capacity_mt ?? '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Material Categories</p>
                  <p className="mt-1 text-sm text-slate-200">{(cpcbProfile.material_categories || []).join(', ') || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Validity</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.registration_valid_from || '-'} to {cpcbProfile.registration_valid_upto || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Contact Person</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.contact_person || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Email</p>
                  <p className="mt-1 text-sm"><EmailValue value={cpcbProfile.contact_email} /></p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Phone</p>
                  <p className="mt-1 text-sm"><PhoneValue value={cpcbProfile.contact_phone} /></p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Address</p>
                  <p className="mt-1 text-sm text-slate-200">{cpcbProfile.address_line || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">AI Enrichment</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {cpcbProfile.enrichment_provider || '-'} / {cpcbProfile.enrichment_model || '-'} / {cpcbProfile.enrichment_confidence ?? '-'}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">CPCB profile not available for this company yet.</p>
          )}
        </div>
        ) : null}

        {isRecyclerEntity ? (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-sm font-semibold text-teal-300">State Pollution Control Board</h2>
            <p className="mt-1 text-xs text-slate-400">
              {(spcbProfile?.board_name && spcbProfile?.board_code)
                ? `${spcbProfile.board_name} (${spcbProfile.board_code})`
                : 'State board mapping will appear once a valid issuing state is available.'}
            </p>
            {(spcbProfile?.registrations?.length || mpcbProfile) ? (
              <>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Board</p>
                    <p className="mt-1 text-sm text-slate-200">{spcbProfile?.board_name || mpcbProfile?.regional_office || '-'}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Board Code</p>
                    <p className="mt-1 text-sm text-slate-200">{spcbProfile?.board_code || mpcbProfile?.mpcb_type || '-'}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">State</p>
                    <p className="mt-1 text-sm text-slate-200">{spcbProfile?.state || company?.state || factSheet?.state || '-'}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Active Registrations</p>
                    <p className="mt-1 text-sm text-slate-200">{spcbProfile?.registrations?.length || 0}</p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorization Number</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {spcbProfile?.registrations?.[0]?.registration_id || mpcbProfile?.consent_authorization_ref || '-'}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Registration Status</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {spcbProfile?.registrations?.[0]?.registration_status || mpcbProfile?.mpcb_status || workbookSignals.mpcbStatus || '-'}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Validity</p>
                    <p className="mt-1 text-sm text-slate-200">
                      {spcbProfile?.registrations?.[0]?.valid_from || '-'} to {spcbProfile?.registrations?.[0]?.valid_upto || mpcbProfile?.consent_valid_upto || '-'}
                    </p>
                  </div>
                  <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">Authorized Capacity (MT)</p>
                    <p className="mt-1 text-sm text-slate-200">{mpcbProfile?.capacity_allotted_mt ?? workbookSignals.mpcbCapacityAllotted ?? '-'}</p>
                  </div>
                </div>

                {spcbProfile?.spcb_registrations?.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[860px] text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wide text-slate-400">
                          <th className="px-2 py-2">State</th>
                          <th className="px-2 py-2">Board</th>
                          <th className="px-2 py-2">Registrations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {spcbProfile.spcb_registrations.map((entry, index) => (
                          <tr key={`${entry.state}-${entry.board_code}-${index}`} className="border-b border-slate-900">
                            <td className="px-2 py-2 text-slate-200">{entry.state}</td>
                            <td className="px-2 py-2 text-slate-300">{entry.board_name} ({entry.board_code})</td>
                            <td className="px-2 py-2 text-slate-300">{entry.registrations.length}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-400">SPCB profile not available for this recycler yet.</p>
            )}
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-teal-300">Google Maps and Geolocation Intelligence</h2>
          {googlePlacesData || companyGeoData ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Google Place</p>
                  <p className="mt-1 text-sm text-slate-200">{googlePlacesData?.official_business_name || company?.canonical_name || '-'}</p>
                  <p className="mt-1 break-all text-xs text-slate-400">{googlePlacesData?.google_place_id || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Google Verified</p>
                  <p className="mt-1 text-sm text-slate-200">{googlePlacesData?.verified_by_google ? 'Verified' : 'Needs Review'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Business Status</p>
                  <p className="mt-1 text-sm text-slate-200">{googlePlacesData?.business_status || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Active Status</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {googlePlacesData?.active_status || company?.active_status || '-'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Validation Confidence</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {googlePlacesData?.validation_confidence ?? company?.validation_confidence ?? '-'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Rating</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {googlePlacesData?.rating ?? '-'} {googlePlacesData?.review_count ? `(${googlePlacesData.review_count} reviews)` : ''}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Coordinates</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {companyGeoData?.latitude ?? googlePlacesData?.latitude ?? '-'}, {companyGeoData?.longitude ?? googlePlacesData?.longitude ?? '-'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Standardized Address</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {companyGeoData?.formatted_address || googlePlacesData?.formatted_address || '-'}
                  </p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Geo Accuracy</p>
                  <p className="mt-1 text-sm text-slate-200">{companyGeoData?.geo_accuracy_level || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Geo Hash</p>
                  <p className="mt-1 break-all text-sm text-slate-200">{companyGeoData?.geo_hash || '-'}</p>
                </div>
              </div>

              {(companyGeoData?.latitude ?? googlePlacesData?.latitude) !== null &&
              (companyGeoData?.longitude ?? googlePlacesData?.longitude) !== null ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                  <iframe
                    title="Company location map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(
                      `${companyGeoData?.latitude ?? googlePlacesData?.latitude},${companyGeoData?.longitude ?? googlePlacesData?.longitude}`
                    )}&z=14&output=embed`}
                    className="h-72 w-full"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              ) : null}

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Nearby Recyclers</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {nearbyRecyclers.length === 0 ? (
                      <li className="text-slate-500">No nearby recyclers found in current radius window.</li>
                    ) : (
                      nearbyRecyclers.slice(0, 8).map((item) => (
                        <li key={item.company_id} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                          <p className="font-medium text-slate-200">{item.company_name || item.company_id}</p>
                          <p className="mt-1 text-slate-400">{item.formatted_address || '-'}</p>
                          <p className="text-slate-500">{item.distance_km.toFixed(2)} km</p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Geo Enrichment Telemetry</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {geoEnrichmentLogs.length === 0 ? (
                      <li className="text-slate-500">No geo enrichment logs available.</li>
                    ) : (
                      geoEnrichmentLogs.slice(0, 6).map((log, index) => (
                        <li key={`geo-log-${index}`} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                          <p className="font-medium text-slate-200">{String(log.status || 'unknown')}</p>
                          <p className="mt-1 text-slate-400">
                            Confidence: {String(log.confidence_score ?? '-')} · Duration: {String(log.duration_ms ?? '-')} ms
                          </p>
                          <p className="text-slate-500">
                            {log.created_at ? new Date(String(log.created_at)).toLocaleString() : '-'}
                          </p>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>

              {geoDuplicateClusters.length > 0 ? (
                <div className="mt-4 rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Geo Duplicate Signals</p>
                  <ul className="mt-2 space-y-2 text-xs text-slate-300">
                    {geoDuplicateClusters.slice(0, 6).map((cluster, index) => (
                      <li key={`geo-cluster-${index}`} className="rounded border border-slate-800 bg-slate-900/70 px-2 py-2">
                        <p className="font-medium text-slate-200">{String(cluster.duplicate_class || '-')}</p>
                        <p className="mt-1 text-slate-400">Confidence: {String(cluster.duplicate_confidence ?? '-')}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Google geo enrichment has not been run for this company yet.</p>
          )}
        </div>

        {isRecyclerEntity ? (
        <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-sm font-semibold text-teal-300">MPCB Registration Profile</h2>
          {mpcbProfile || workbookSignals.mpcbStatus || workbookSignals.cpcbStatus ? (
            <>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MPCB Status</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbStatus || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">CPCB Status</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.cpcbStatus || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Regional Office</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.regionalOffice || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MPCB Type / CPCB Type</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbType || '-'} / {workbookSignals.cpcbType || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Capacity Allotted (MT/A)</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbCapacityAllotted || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Consent Validity</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbConsentValidity || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Consent / Authorization Ref</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbConsentRef || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MPCB Contact Email</p>
                  <p className="mt-1 text-sm"><EmailValue value={mpcbProfile?.contact_email || workbookSignals.email} /></p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MPCB Contact Number</p>
                  <p className="mt-1 text-sm"><PhoneValue value={mpcbProfile?.contact_phone || workbookSignals.phone} /></p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">MPCB Remarks</p>
                  <p className="mt-1 text-sm text-slate-200">{workbookSignals.mpcbRemark || '-'}</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">AI Enrichment Summary</p>
                  <p className="mt-1 text-sm text-slate-200">{mpcbProfile?.enrichment_summary || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">AI EPR Categories</p>
                  <p className="mt-1 text-sm text-slate-200">{(mpcbProfile?.enrichment_epr_categories || []).join(', ') || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">AI Keywords</p>
                  <p className="mt-1 text-sm text-slate-200">{(mpcbProfile?.enrichment_keywords || []).join(', ') || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Inferred Website</p>
                  <p className="mt-1 break-all text-sm text-slate-200">{mpcbProfile?.inferred_website || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Website Title</p>
                  <p className="mt-1 text-sm text-slate-200">{mpcbProfile?.website_title || '-'}</p>
                </div>
                <div className="rounded-md border border-slate-800 bg-slate-950/70 p-3 sm:col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">Website Description</p>
                  <p className="mt-1 text-sm text-slate-200">{mpcbProfile?.website_description || '-'}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-400">MPCB profile not available for this company yet.</p>
          )}
        </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-teal-300">Notice History</h2>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs text-slate-400">
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Authority</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Notice Date</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-3 py-2">Penalty</th>
                    <th className="px-3 py-2">Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-4 text-slate-400">
                        Loading notices...
                      </td>
                    </tr>
                  ) : notices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center">
                        <p className="text-2xl">📋</p>
                        <p className="mt-2 text-sm font-semibold text-slate-300">No regulatory notices yet</p>
                        <p className="mt-1 text-xs text-slate-500">
                          Notices are ingested via Discovery Ops or file upload. This company is clean for now.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    notices.map((notice) => (
                      <tr key={notice.id} className="border-b border-slate-900">
                        <td className="px-3 py-2 text-slate-100">{notice.notice_type || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{notice.authority || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{notice.waste_category || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{notice.notice_date || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{notice.deadline_date || '-'}</td>
                        <td className="px-3 py-2 text-slate-300">{Number(notice.penalty_inr || 0).toLocaleString('en-IN')}</td>
                        <td className="px-3 py-2 text-slate-300">{Number(notice.confidence_score || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Merge Company</h2>
              <form className="mt-3 space-y-3" onSubmit={handleMerge}>
                <select
                  value={mergeTargetId}
                  onChange={(event) => setMergeTargetId(event.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-teal-400"
                >
                  <option value="">Select target company</option>
                  {allCompanies.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.canonical_name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={!mergeTargetId || mergeLoading}
                  className="w-full rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-60"
                >
                  {mergeLoading ? 'Merging...' : 'Merge Into Target'}
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Suggested Actions</h2>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={enrichProfileNow}
                  disabled={enrichLoading}
                  className="w-full rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-600 disabled:opacity-60"
                >
                  {enrichLoading ? 'Enriching Profile...' : 'Enrich Profile'}
                </button>
                <button
                  type="button"
                  onClick={generateStrategy}
                  disabled={strategyLoading}
                  className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
                >
                  {strategyLoading ? 'Generating Strategy...' : 'Generate Closing Strategy'}
                </button>
                <button
                  type="button"
                  onClick={pushToZoho}
                  disabled={pushBlockedByLicense || pushLoading}
                  className="w-full rounded-md bg-indigo-700 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  {pushLoading ? 'Pushing...' : 'Push To Zoho CRM'}
                </button>
                <button
                  type="button"
                  onClick={pushToTelecalling}
                  disabled={telecallLoading || telecallSuccess}
                  className={`w-full rounded-md px-3 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed ${
                    telecallSuccess
                      ? 'bg-emerald-700 disabled:bg-emerald-800 disabled:text-emerald-300'
                      : 'bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-400'
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {telecallLoading ? (
                      <>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 animate-spin" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity=".25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                        Adding to queue…
                      </>
                    ) : telecallSuccess ? (
                      <>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Added to Telecalling
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5 19.79 19.79 0 0 1 1.62 4.9a2 2 0 0 1 1.99-2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.1a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                        Push to Telecalling
                      </>
                    )}
                  </span>
                </button>
              </div>
              {pushBlockedByLicense ? (
                <p className="mt-2 text-xs text-amber-300">
                  Push disabled: one or more contributing sources are not shareable.
                </p>
              ) : null}
              <p className="mt-2 text-[11px] text-slate-500">
                Telecalling push inserts this company into the <code>leads</code> queue with any available contact info.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Sources Panel</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {documents.length === 0 ? (
                  <li className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 text-center">
                    <p className="text-xl">📂</p>
                    <p className="mt-1.5 text-xs font-semibold text-slate-300">No source documents linked</p>
                    <p className="mt-1 text-[11px] text-slate-500">Upload documents or run a Discovery job to attach sources.</p>
                  </li>
                ) : (
                  documents.map((doc) => (
                    <li key={doc.id} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
                      <p className="font-medium text-slate-200">{doc.source_document_ref}</p>
                      <p className="mt-1 text-slate-400">{doc.document_type} · source {doc.source_id}</p>
                      <p className="text-slate-500">{new Date(doc.ingested_at).toLocaleString()}</p>
                      <p className="text-slate-500">
                        License:{' '}
                        {sources.find((source) => source.id === doc.source_id)?.license_flag || 'internal-use-only'}
                      </p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Dynamic Fields</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {dynamicFieldColumns.length === 0 ? (
                  <li className="text-slate-500">No applied dynamic fields.</li>
                ) : (
                  dynamicFieldColumns.map((column) => {
                    const key = column.approved_name || column.column_key;
                    const value = dynamicFieldValues[key];
                    return (
                      <li key={column.id} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
                        <p className="font-medium text-slate-200">{key}</p>
                        <p className="mt-1 text-slate-300">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}
                        </p>
                        <p className="text-slate-500">
                          {column.applied_to_table}.{column.applied_column} · {column.approved_type || 'text'}
                        </p>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Conflict Log</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {fieldHistory.length === 0 ? (
                  <li className="text-slate-500">No conflicts logged.</li>
                ) : (
                  fieldHistory.slice(0, 12).map((entry) => (
                    <li key={entry.id} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
                      <p className="font-medium text-slate-200">{entry.field_name}</p>
                      <p className="mt-1 text-slate-400">Rule: {entry.resolution_rule}</p>
                      <p className="text-slate-500">Resolved: {new Date(entry.resolved_at).toLocaleString()}</p>
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <h2 className="text-sm font-semibold text-teal-300">Duplicate Merge History</h2>
              <ul className="mt-3 space-y-2 text-xs text-slate-300">
                {(mergeHistory.mappings || []).length === 0 && (mergeHistory.audits || []).length === 0 ? (
                  <li className="text-xs text-slate-500 italic">No merge history — this record has not been merged with any other entity.</li>
                ) : (
                  <>
                    {(mergeHistory.mappings || []).slice(0, 6).map((entry, index) => (
                      <li key={`map-${index}`} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
                        <p className="font-medium text-slate-200">Mapping</p>
                        <p className="mt-1 text-slate-400">
                          Source {(entry.source_company_id as string) || '-'} to survivor {(entry.survivor_company_id as string) || '-'}
                        </p>
                        <p className="text-slate-500">Merged: {entry.merged_at ? new Date(String(entry.merged_at)).toLocaleString() : '-'}</p>
                      </li>
                    ))}
                    {(mergeHistory.audits || []).slice(0, 6).map((entry, index) => (
                      <li key={`audit-${index}`} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
                        <p className="font-medium text-slate-200">Audit</p>
                        <p className="mt-1 text-slate-400">Method: {(entry.merge_method as string) || '-'}</p>
                        <p className="text-slate-400">Conflicts resolved: {Number(entry.conflicts_resolved || 0)}</p>
                        <p className="text-slate-500">At: {entry.performed_at ? new Date(String(entry.performed_at)).toLocaleString() : '-'}</p>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>

      </section>
    </main>
  );
}
