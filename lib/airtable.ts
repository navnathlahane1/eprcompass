/**
 * Airtable CRM sync utility
 * Supabase is the source of truth. Airtable is the CRM/dashboard view.
 * All operations are fire-and-forget — Airtable failure never blocks the user.
 */

const BASE_URL = () =>
  `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${encodeURIComponent(
    process.env.AIRTABLE_TABLE_NAME || 'Leads'
  )}`;

const authHeader = () => ({
  Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
  'Content-Type': 'application/json',
});

/** Map source_page slug → human-readable Landing Page label */
const SOURCE_PAGE_LABEL: Record<string, string> = {
  'cepc-associate':                  'CEPC Core',
  'cepc-professional':               'CEPC Core',
  'cepc-expert':                     'CEPC Core',
  'pay/cepc-associate':              'CEPC Core',
  'pay/cepc-professional':           'CEPC Core',
  'pay/cepc-expert':                 'CEPC Core',
  'become-a-cepc':                   'Become a CEPC',
  'cepc-for-ca-firms':               'CA Firms',
  'pay/cepc-for-ca-firms':           'CA Firms',
  'cepc-for-company-secretaries':    'Company Secretaries',
  'pay/cepc-for-company-secretaries':'Company Secretaries',
  'cepc-for-corporate-lawyers':      'Corporate Lawyers',
  'pay/cepc-for-corporate-lawyers':  'Corporate Lawyers',
  'cepc-for-environmental-lawyers':  'Environmental Lawyers',
  'pay/cepc-for-environmental-lawyers':'Environmental Lawyers',
  'cepc-for-ehs-consultants':        'EHS Consultants',
  'pay/cepc-for-ehs-consultants':    'EHS Consultants',
  'cepc-for-esg-consultants':        'ESG Consultants',
  'pay/cepc-for-esg-consultants':    'ESG Consultants',
  'cepc-for-fmcg-consultants':       'FMCG Consultants',
  'pay/cepc-for-fmcg-consultants':   'FMCG Consultants',
  'cepc-for-hr-and-ld':              'HR & L&D',
  'pay/cepc-for-hr-and-ld':          'HR & L&D',
  'cepc-for-import-consultants':     'Import Consultants',
  'pay/cepc-for-import-consultants': 'Import Consultants',
  'cepc-for-iso-auditors':           'ISO Auditors',
  'pay/cepc-for-iso-auditors':       'ISO Auditors',
  'cepc-for-pharma-consultants':     'Pharma Consultants',
  'pay/cepc-for-pharma-consultants': 'Pharma Consultants',
  'cepc-for-supply-chain-consultants':'Supply Chain Consultants',
  'pay/cepc-for-supply-chain-consultants':'Supply Chain Consultants',
  'cepc-for-startup-incubators':     'Startup Incubators',
  'pay/cepc-for-startup-incubators': 'Startup Incubators',
  'cepc-for-trade-associations':     'Trade Associations',
  'pay/cepc-for-trade-associations': 'Trade Associations',
  'cepc-for-waste-management':       'Waste Management',
  'pay/cepc-for-waste-management':   'Waste Management',
  'women-empowerment':               'Women Empowerment',
  'pay/women-empowerment':           'Women Empowerment',
  'students':                        'Students',
  'pay/students':                    'Students',
  'internship':                      'Internship',
  'freelancer-network':              'Freelancer Network',
  'pay/freelancer-network':          'Freelancer Network',
};

export function getLandingPageLabel(sourcePage: string): string {
  return SOURCE_PAGE_LABEL[sourcePage] || sourcePage;
}

/** Search for an existing lead by a single field value */
async function findRecord(field: string, value: string): Promise<string | null> {
  if (!value) return null;
  try {
    const formula = encodeURIComponent(`{${field}} = "${value.replace(/"/g, '\\"')}"`);
    const res = await fetch(`${BASE_URL()}?filterByFormula=${formula}&maxRecords=1`, {
      headers: authHeader(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.records?.[0]?.id ?? null;
  } catch {
    return null;
  }
}

/** Find existing Airtable record — checks Mobile Number first, then Email */
async function findExistingLead(phone?: string, email?: string): Promise<string | null> {
  if (phone) {
    const byPhone = await findRecord('Mobile Number', phone);
    if (byPhone) return byPhone;
  }
  if (email) {
    const byEmail = await findRecord('Email', email);
    if (byEmail) return byEmail;
  }
  return null;
}

/** Create a new Airtable record */
async function createRecord(fields: Record<string, unknown>): Promise<string | null> {
  try {
    const res = await fetch(BASE_URL(), {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[airtable] create failed:', err);
      return null;
    }
    const data = await res.json();
    return data.id ?? null;
  } catch (err) {
    console.error('[airtable] create error:', err);
    return null;
  }
}

/** Update an existing Airtable record (PATCH — only updates specified fields) */
async function updateRecord(recordId: string, fields: Record<string, unknown>): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL()}/${recordId}`, {
      method: 'PATCH',
      headers: authHeader(),
      body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[airtable] update failed:', err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[airtable] update error:', err);
    return false;
  }
}

/**
 * Update specific CRM fields on an existing Airtable lead by phone/email lookup.
 * Used by the Supabase webhook to sync admin-side changes back to Airtable.
 */
export async function syncCrmFields(
  phone: string | undefined,
  email: string,
  fields: Record<string, unknown>
): Promise<void> {
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return;
  if (Object.keys(fields).length === 0) return;
  try {
    const recordId = await findExistingLead(phone, email);
    if (!recordId) {
      console.warn('[airtable] syncCrmFields: no record found for', email);
      return;
    }
    await updateRecord(recordId, fields);
  } catch (err) {
    console.error('[airtable] syncCrmFields error:', err);
  }
}

export interface LeadData {
  name: string;
  phone?: string;
  email: string;
  sourcePage: string;
  planName?: string;
  companyName?: string;
  profession?: string;
  remarks?: string;
}

export interface PaymentData {
  paymentStatus: 'Pending' | 'Paid' | 'Failed';
  paymentAmount?: number;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  paymentDate?: string;
}

/**
 * Upsert a lead into Airtable.
 * - Searches by Mobile Number first, then Email.
 * - Creates a new record if not found, otherwise updates.
 * Returns the Airtable record ID (or null on failure).
 */
export async function upsertLead(lead: LeadData, payment?: PaymentData): Promise<string | null> {
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) {
    console.warn('[airtable] credentials not configured — skipping sync');
    return null;
  }

  const landingPage = getLandingPageLabel(lead.sourcePage);

  const baseFields: Record<string, unknown> = {
    'Full Name':     lead.name,
    'Email':         lead.email,
    'Landing Page':  landingPage,
  };
  if (lead.phone)       baseFields['Mobile Number']   = lead.phone;
  if (lead.phone)       baseFields['WhatsApp Number'] = lead.phone;
  if (lead.companyName) baseFields['Company Name']    = lead.companyName;
  if (lead.profession)  baseFields['Profession']      = lead.profession;
  if (lead.remarks)     baseFields['Remarks']         = lead.remarks;

  if (payment) {
    baseFields['Payment Status']      = payment.paymentStatus;
    if (payment.paymentAmount)       baseFields['Payment Amount']      = payment.paymentAmount;
    if (payment.razorpayPaymentId)   baseFields['Razorpay Payment ID'] = payment.razorpayPaymentId;
    if (payment.razorpayOrderId)     baseFields['Razorpay Order ID']   = payment.razorpayOrderId;
    if (payment.paymentDate)         baseFields['Payment Date']        = payment.paymentDate;
  }

  try {
    const existingId = await findExistingLead(lead.phone, lead.email);

    if (existingId) {
      await updateRecord(existingId, baseFields);
      return existingId;
    } else {
      const newFields = { ...baseFields, 'Status': 'New', 'Payment Status': payment?.paymentStatus ?? 'Pending' };
      return await createRecord(newFields);
    }
  } catch (err) {
    console.error('[airtable] upsertLead error:', err);
    return null;
  }
}

/**
 * Update payment fields on an existing Airtable lead after Razorpay capture.
 * Finds the record by phone or email, then updates payment fields only.
 */
export async function syncPaymentToAirtable(
  phone: string | undefined,
  email: string,
  payment: PaymentData
): Promise<void> {
  if (!process.env.AIRTABLE_PAT || !process.env.AIRTABLE_BASE_ID) return;

  try {
    const recordId = await findExistingLead(phone, email);
    if (!recordId) {
      console.warn('[airtable] syncPayment: no existing lead found for', email);
      return;
    }

    const fields: Record<string, unknown> = {
      'Payment Status': payment.paymentStatus,
    };
    if (payment.paymentAmount)     fields['Payment Amount']      = payment.paymentAmount;
    if (payment.razorpayPaymentId) fields['Razorpay Payment ID'] = payment.razorpayPaymentId;
    if (payment.razorpayOrderId)   fields['Razorpay Order ID']   = payment.razorpayOrderId;
    if (payment.paymentDate)       fields['Payment Date']        = payment.paymentDate;
    fields['Registration Status'] = 'Registered';

    await updateRecord(recordId, fields);
  } catch (err) {
    console.error('[airtable] syncPaymentToAirtable error:', err);
  }
}
