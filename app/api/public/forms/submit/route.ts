import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { extractSummaryFields, resolveFormModuleKey } from '@/lib/forms/modules';

const LANDING_PAGE_SOURCE_ID = process.env.LANDING_PAGE_INTEL_SOURCE_ID ?? 'c2d3e4f5-a6b7-4890-cdef-012345678901';

const LANDING_PAGE_MODULE_KEYS = new Set([
  'cepc_application',
  'cepc_ehs_consultants',
  'cepc_ca_firms',
  'cepc_company_secretaries',
  'cepc_esg_consultants',
  'cepc_iso_auditors',
  'cepc_waste_management',
  'cepc_import_consultants',
  'cepc_trade_associations',
  'cepc_environmental_lawyers',
  'cepc_supply_chain_consultants',
  'cepc_pharma_consultants',
  'cepc_fmcg_consultants',
  'cepc_hr_and_ld',
  'cepc_startup_incubators',
  'cepc_corporate_lawyers',
  'freelancer_network_application',
]);

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 15;
const MIN_SUBMIT_AGE_MS = 1500;

const ipSubmissionStore = new Map<string, { count: number; windowStart: number }>();

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getGoogleScriptUrl() {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL?.trim() ||
    process.env.GOOGLE_APPS_SCRIPT_URL?.trim() ||
    ''
  );
}

function getClientIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  return xf.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null;
}

function isEmail(value: string | null | undefined) {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function isLikelyPhone(value: string | null | undefined) {
  if (!value) return false;
  return /^\+?[0-9\s()-]{10,15}$/.test(String(value).trim());
}

function hitRateLimit(ip: string | null) {
  if (!ip) return false;

  const now = Date.now();
  const current = ipSubmissionStore.get(ip);
  if (!current || now - current.windowStart > RATE_LIMIT_WINDOW_MS) {
    ipSubmissionStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (current.count >= RATE_LIMIT_MAX_SUBMISSIONS) {
    return true;
  }

  ipSubmissionStore.set(ip, { count: current.count + 1, windowStart: current.windowStart });
  return false;
}

function isSpamSubmission(payload: Record<string, any>) {
  const honeypot = String(payload.website || payload.company_website || '').trim();
  if (honeypot) return true;

  if (payload.submitted_at != null && payload.submitted_at !== '') {
    const submittedAt = Number(payload.submitted_at || 0);
    if (!submittedAt || Number.isNaN(submittedAt)) return true;
    if (Date.now() - submittedAt < MIN_SUBMIT_AGE_MS) return true;
  }

  return false;
}

function validatePayload(moduleKey: string, summary: { name: string | null; email: string | null; phone: string | null }) {
  if (!isEmail(summary.email)) {
    return 'Please provide a valid email address.';
  }

  if (!['newsletter_form', 'job_applications'].includes(moduleKey) && !isLikelyPhone(summary.phone)) {
    return 'Please provide a valid phone number.';
  }

  if (moduleKey !== 'newsletter_form' && !String(summary.name || '').trim()) {
    return 'Please provide your name.';
  }

  return null;
}

function sanitizePayload(payload: Record<string, any>) {
  // Resume uploads are already persisted in downstream integrations; avoid bloating row size.
  if (typeof payload.fileBase64 === 'string' && payload.fileBase64.length > 0) {
    return {
      ...payload,
      fileBase64: null,
      fileBase64Length: payload.fileBase64.length
    };
  }
  return payload;
}

async function forwardToGoogleScript(payload: Record<string, any>) {
  const scriptUrl = getGoogleScriptUrl();
  if (!scriptUrl) {
    return { forwarded: false, message: 'Google Script URL not configured' };
  }

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();
    let parsed: any = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {
      parsed = { message: raw };
    }

    if (!response.ok || (parsed.status && parsed.status !== 'success')) {
      return {
        forwarded: false,
        message: parsed.message || 'Forwarding to Google Script failed'
      };
    }

    return { forwarded: true, message: 'Forwarded to Google Script' };
  } catch (error: any) {
    return {
      forwarded: false,
      message: String(error?.message || 'Unable to reach Google Script')
    };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const moduleKey = resolveFormModuleKey((body as any).type);
    if (!moduleKey) {
      return NextResponse.json(
        { success: false, error: 'Unknown form type. Add mapping for this form type first.' },
        { status: 400 }
      );
    }

    const ipAddress = getClientIp(request);
    if (hitRateLimit(ipAddress)) {
      return NextResponse.json(
        { success: false, error: 'Too many submissions from this network. Please try again later.' },
        { status: 429 }
      );
    }

    if (isSpamSubmission(body as Record<string, any>)) {
      return NextResponse.json({ success: true, data: null, forwarded: { forwarded: false, message: 'Spam blocked' } });
    }

    const supabase = getSupabaseAdmin();
    const payload = sanitizePayload(body as Record<string, any>);
    const summary = extractSummaryFields(payload);
    const validationError = validatePayload(moduleKey, summary);
    if (validationError) {
      return NextResponse.json({ success: false, error: validationError }, { status: 400 });
    }

    const metadata = {
      user_agent: request.headers.get('user-agent') || null,
      ip_address: ipAddress,
      received_at: new Date().toISOString()
    };

    const { data, error } = await (supabase as any)
      .from('form_submissions')
      .insert({
        module_key: moduleKey,
        source: 'website',
        status: 'new',
        ...summary,
        submission_data: payload,
        metadata: metadata
      })
      .select('id, module_key, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: `Failed to store form submission: ${error.message}` },
        { status: 500 }
      );
    }

    const forwarded = await forwardToGoogleScript(payload);

    // Stage into Intel portal if this is a landing page submission
    if (LANDING_PAGE_MODULE_KEYS.has(moduleKey)) {
      await (supabase as any).from('intel_raw_records').insert({
        source_id: LANDING_PAGE_SOURCE_ID,
        external_record_id: data.id,
        source_type: 'landing_page_form',
        payload: {
          name: summary.name,
          email: summary.email,
          phone: summary.phone,
          company: summary.company,
          audience_segment: payload.audience_segment || null,
          module_key: moduleKey,
          qualification: payload.qualification || null,
          experience: payload.experience || null,
          city: payload.city || null,
          state: payload.state || null,
          message: payload.message || null,
          occupation: payload.occupation || null,
          expertise: payload.expertise || null,
          waste_categories: payload.wasteCategories || null,
        },
        observed_at: new Date().toISOString(),
        review_status: 'pending',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      forwarded
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Failed to submit form') },
      { status: 500 }
    );
  }
}
