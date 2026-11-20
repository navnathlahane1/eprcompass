export type FormModuleKey =
  | 'contact_form'
  | 'consultation_form'
  | 'callback_form'
  | 'newsletter_form'
  | 'training_form'
  | 'workshop_form'
  | 'webinar_form'
  | 'job_applications'
  | 'calculator_form'
  | 'checkout_payment_form'
  | 'connect_request_form'
  | 'get_matched_form'
  | 'report_download_form'
  | 'facility_listing_form'
  | 'service_provider_program_application'
  | 'network_requirement_form'
  // CEPC landing pages (audience-segmented)
  | 'cepc_application'
  | 'cepc_ehs_consultants'
  | 'cepc_ca_firms'
  | 'cepc_company_secretaries'
  | 'cepc_esg_consultants'
  | 'cepc_iso_auditors'
  | 'cepc_waste_management'
  | 'cepc_import_consultants'
  | 'cepc_trade_associations'
  | 'cepc_environmental_lawyers'
  | 'cepc_supply_chain_consultants'
  | 'cepc_pharma_consultants'
  | 'cepc_fmcg_consultants'
  | 'cepc_hr_and_ld'
  | 'cepc_startup_incubators'
  | 'cepc_corporate_lawyers'
  | 'freelancer_network_application';

const TYPE_TO_MODULE: Record<string, FormModuleKey> = {
  contact_form: 'contact_form',
  consultation_form: 'consultation_form',
  quick_consultation_form: 'consultation_form',
  callback_form: 'callback_form',
  newsletter_form: 'newsletter_form',
  training_form: 'training_form',
  workshop_form: 'workshop_form',
  webinar_form: 'webinar_form',
  job_applications: 'job_applications',
  calculator_form: 'calculator_form',
  checkout_payment_form: 'checkout_payment_form',
  connect_request_form: 'connect_request_form',
  get_matched_form: 'get_matched_form',
  report_download_form: 'report_download_form',
  facility_listing_form: 'facility_listing_form',
  service_provider_program_application: 'service_provider_program_application',
  network_requirement_form: 'network_requirement_form',
  // CEPC landing pages
  cepc_application: 'cepc_application',
  cepc_ehs_consultants: 'cepc_ehs_consultants',
  cepc_ca_firms: 'cepc_ca_firms',
  cepc_company_secretaries: 'cepc_company_secretaries',
  cepc_esg_consultants: 'cepc_esg_consultants',
  cepc_iso_auditors: 'cepc_iso_auditors',
  cepc_waste_management: 'cepc_waste_management',
  cepc_import_consultants: 'cepc_import_consultants',
  cepc_trade_associations: 'cepc_trade_associations',
  cepc_environmental_lawyers: 'cepc_environmental_lawyers',
  cepc_supply_chain_consultants: 'cepc_supply_chain_consultants',
  cepc_pharma_consultants: 'cepc_pharma_consultants',
  cepc_fmcg_consultants: 'cepc_fmcg_consultants',
  cepc_hr_and_ld: 'cepc_hr_and_ld',
  cepc_startup_incubators: 'cepc_startup_incubators',
  cepc_corporate_lawyers: 'cepc_corporate_lawyers',
  freelancer_network_application: 'freelancer_network_application',
};

function toKey(value: unknown): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function resolveFormModuleKey(type: unknown): FormModuleKey | null {
  const key = toKey(type);
  return TYPE_TO_MODULE[key] || null;
}

export function extractSummaryFields(payload: Record<string, any>) {
  return {
    name: String(payload.name || payload.fullName || payload.firstName || '').trim() || null,
    email: String(payload.email || '').trim() || null,
    phone: String(payload.phone || payload.mobile || '').trim() || null,
    company: String(payload.company || payload.practice || payload.occupation || '').trim() || null
  };
}
