export const FORM_TYPES = [
  { key: 'all', label: 'All Forms' },
  { key: 'callback_form', label: 'Callback Form' },
  { key: 'consultation_form', label: 'Consultation Form' },
  { key: 'contact_form', label: 'Contact Form' },
  { key: 'newsletter_form', label: 'Newsletter Subscription' },
  { key: 'training_form', label: 'Training Registration' },
  { key: 'webinar_form', label: 'Webinar Registration' },
  { key: 'workshop_form', label: 'Workshop Registration' },
  { key: 'job_applications', label: 'Job Applications' },
  { key: 'calculator_form', label: 'Calculator Submissions' },
  { key: 'checkout_payment_form', label: 'Checkout Payment Form' },
  { key: 'connect_request_form', label: 'Recycler Connect Requests' },
  { key: 'get_matched_form', label: 'Get Matched Requests' },
  { key: 'report_download_form', label: 'Report Downloads' },
  { key: 'facility_listing_form', label: 'Facility Listing Form' },
  { key: 'service_provider_program_application', label: 'Program Applications' },
  { key: 'network_requirement_form', label: 'Network Requirements' }
] as const;

export const VALID_FORM_KEYS = new Set(FORM_TYPES.map((item) => item.key));

export function isValidFormKey(value: string) {
  return VALID_FORM_KEYS.has(value as (typeof FORM_TYPES)[number]['key']);
}

export function getFormLabel(key: string) {
  return FORM_TYPES.find((item) => item.key === key)?.label || key;
}
