import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { SITE_CONTACT_WHATSAPP } from '@/lib/siteContact';

// EPR Penalty Checker — captures the visitor (email + mobile) as a lead, then
// returns any penalty notices already stored for the chosen company in the
// epr_penalty_records registry. Uses the service-role admin client (the table
// is RLS-locked) and mirrors the calculator-submit lead/rate-limit pattern.

const MAX_SUBMISSIONS_PER_HOUR = 5;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  return xf.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '0.0.0.0';
}
function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}
function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}
function formatINR(n: number): string {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}
function normalize(s: any): string {
  return String(s || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Whitelisted public shape for one penalty record.
function toPublicNotice(r: any) {
  const penaltyInr = r.penalty_inr != null ? Number(r.penalty_inr) : null;
  return {
    notice_number: r.notice_number || 'REF-' + String(r.id || '').slice(0, 8).toUpperCase(),
    reference: r.notice_number || null,
    notice_type: r.notice_type || 'EPR Compliance Notice',
    notice_date: r.notice_date || null,
    deadline_date: null,
    authority: r.authority || null,
    waste_category: r.waste_category || null,
    compliance_year: r.compliance_year || null,
    compliance_fy: r.compliance_fy || null,
    applicant_type: r.applicant_type || null,
    shortfall_mt: r.shortfall_mt != null ? Number(r.shortfall_mt) : null,
    penalty_inr: penaltyInr != null && !Number.isNaN(penaltyInr) ? penaltyInr : null,
    penalty_label: penaltyInr != null && !Number.isNaN(penaltyInr) ? formatINR(penaltyInr) : null,
    violation_summary: r.violation_summary || null,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const contact = body?.contact || {};
    const company = body?.company || {};

    const rawName = String(contact?.name || '').trim();
    const email = String(contact?.email || '').trim();
    const phone = String(contact?.phone || '').trim();
    const companyName = String(company?.name || '').trim();
    const recordId = company?.id && UUID_RE.test(String(company.id)) ? String(company.id) : null;

    if (!email || !phone) return badRequest('email and mobile number are required');
    if (!EMAIL_RE.test(email)) return badRequest('A valid email is required');
    if (!companyName) return badRequest('company name is required');

    // leads.name is NOT NULL — name is optional on the form.
    const leadName = rawName || companyName || email.split('@')[0] || 'Penalty Checker Lead';

    // ── IP rate limit (hourly window) ────────────────────────────────────────
    const ipHash = hashIp(getIp(request));
    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(0, 0, 0);

    const { data: windowRow } = await (supabase as any)
      .from('ip_submissions')
      .select('id, count, window_start')
      .eq('ip_hash', ipHash)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .maybeSingle();

    if ((windowRow?.count || 0) >= MAX_SUBMISSIONS_PER_HOUR) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again in an hour.' },
        { status: 429 }
      );
    }
    if (windowRow?.id) {
      await (supabase as any).from('ip_submissions').update({ count: Number(windowRow.count || 0) + 1 }).eq('id', windowRow.id);
    } else {
      await (supabase as any).from('ip_submissions').insert({ ip_hash: ipHash, count: 1, window_start: windowStart.toISOString() });
    }

    // ── Per-mobile cap: max 3 penalty checks per mobile number ───────────────
    const MAX_CHECKS_PER_MOBILE = 3;
    const last10 = phone.replace(/\D/g, '').slice(-10);
    if (last10.length >= 8) {
      const { count: priorChecks } = await (supabase as any)
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .eq('source', 'Penalty Checker')
        .ilike('mobile', `%${last10}%`);
      if ((priorChecks || 0) >= MAX_CHECKS_PER_MOBILE) {
        return NextResponse.json(
          {
            success: false,
            error: `This mobile number has reached the limit of ${MAX_CHECKS_PER_MOBILE} penalty checks. Please reach EPR Compass on WhatsApp at ${SITE_CONTACT_WHATSAPP} for further help.`,
          },
          { status: 429 }
        );
      }
    }

    // ── Resolve penalty records for the chosen company ───────────────────────
    let resolvedCompany: { name: string; state: string | null } = { name: companyName, state: null };
    let records: any[] = [];

    if (recordId) {
      const { data: rec } = await (supabase as any)
        .from('epr_penalty_records')
        .select('*')
        .eq('id', recordId)
        .maybeSingle();
      if (rec) {
        resolvedCompany = { name: rec.company_name, state: rec.applicant_type || null };
        const { data: all } = await (supabase as any)
          .from('epr_penalty_records')
          .select('*')
          .eq('normalized_name', rec.normalized_name);
        records = (all && all.length ? all : [rec]);
      }
    } else {
      const norm = normalize(companyName);
      if (norm) {
        const { data: all, error: matchErr } = await (supabase as any)
          .from('epr_penalty_records')
          .select('*')
          .eq('normalized_name', norm);
        if (matchErr) {
          return NextResponse.json({ success: false, error: matchErr.message }, { status: 500 });
        }
        if (all && all.length) {
          records = all;
          resolvedCompany = { name: all[0].company_name, state: all[0].applicant_type || null };
        }
      }
    }

    const publicNotices = records
      .map(toPublicNotice)
      .sort((a, b) => (b.penalty_inr || 0) - (a.penalty_inr || 0));
    const hasPenalty = publicNotices.length > 0;

    const totalPenaltyInr = publicNotices.reduce((sum, n) => sum + (n.penalty_inr || 0), 0);
    const wasteCategories = Array.from(
      new Set(publicNotices.map((n) => n.waste_category).filter(Boolean))
    ) as string[];

    // ── Save the lead (real, drifted `leads` schema) ─────────────────────────
    const leadDescription = hasPenalty
      ? `EPR Penalty Checker: ${publicNotices.length} notice(s) on record for ${resolvedCompany.name}. ` +
        publicNotices
          .map((n) => `${n.notice_type} (${n.notice_number}${n.penalty_label ? `, ${n.penalty_label}` : ''})`)
          .join('; ')
      : `EPR Penalty Checker: no notice on record for ${resolvedCompany.name}.`;

    const { data: lead, error: leadError } = await (supabase as any)
      .from('leads')
      .insert({
        name: leadName,
        email,
        phone,
        mobile: phone.replace(/\D/g, ''),
        company_name: resolvedCompany.name,
        source: 'Penalty Checker',
        medium: 'website',
        page_visited: '/epr-penalty-checker',
        status: 'New',
        lead_status: 'New',
        lead_temperature: hasPenalty ? 'Hot' : 'Warm',
        waste_categories: wasteCategories.length ? wasteCategories : null,
        penalty_risk_inr: totalPenaltyInr > 0 ? totalPenaltyInr : null,
        compliance_status: hasPenalty ? 'Notice on record' : 'No notice found',
        description: leadDescription.slice(0, 1000),
        tags: ['penalty-checker'],
      })
      .select('id')
      .single();

    if (leadError) {
      return NextResponse.json({ success: false, error: leadError.message }, { status: 500 });
    }

    // ── Mirror into form_submissions for the unified inbox ───────────────────
    await (supabase as any).from('form_submissions').insert({
      module_key: 'penalty_checker',
      source: 'website',
      status: 'new',
      name: leadName,
      email,
      phone,
      company: resolvedCompany.name,
      lead_id: lead.id,
      submission_data: {
        type: 'Penalty_Checker',
        contact: { name: leadName, email, phone },
        company: { id: recordId, name: resolvedCompany.name },
        has_penalty: hasPenalty,
        notice_count: publicNotices.length,
        notices: publicNotices,
      },
      metadata: {
        ip_hash: ipHash,
        source_url: String(body?.source_url || ''),
        total_penalty_inr: totalPenaltyInr,
      },
    });

    // ── Notify admins (best-effort) ──────────────────────────────────────────
    try {
      const { data: admins } = await (supabase as any).from('profiles').select('id').eq('role', 'admin');
      if ((admins || []).length) {
        await (supabase as any).from('notifications').insert(
          (admins || []).map((admin: any) => ({
            profile_id: admin.id,
            type: 'system',
            message: hasPenalty
              ? `Penalty Checker: ${leadName} (${resolvedCompany.name}) has ${publicNotices.length} notice(s) on record`
              : `Penalty Checker lead: ${leadName} (${resolvedCompany.name})`,
            link: '/telecalling',
            read: false,
          }))
        );
      }
    } catch {
      // Non-blocking.
    }

    return NextResponse.json({
      success: true,
      lead_id: lead.id,
      company: resolvedCompany,
      has_penalty: hasPenalty,
      notices: publicNotices,
      summary: {
        notice_count: publicNotices.length,
        total_penalty_inr: totalPenaltyInr > 0 ? totalPenaltyInr : null,
        total_penalty_label: totalPenaltyInr > 0 ? formatINR(totalPenaltyInr) : null,
        waste_categories: wasteCategories,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Submission failed') },
      { status: 500 }
    );
  }
}
