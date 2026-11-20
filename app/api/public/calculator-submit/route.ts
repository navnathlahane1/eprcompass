import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendTemplateMessage, TEMPLATES } from '../../../../lib/whatsapp/client';

const MAX_SUBMISSIONS_PER_HOUR = 5;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getIp(request: Request) {
  const xf = request.headers.get('x-forwarded-for') || '';
  const ip = xf.split(',')[0]?.trim() || request.headers.get('x-real-ip') || '0.0.0.0';
  return ip;
}

function hashIp(ip: string) {
  return createHash('sha256').update(ip).digest('hex');
}

function badRequest(message: string) {
  return NextResponse.json({ success: false, error: message }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    const contact = body?.contact || {};
    const totals = body?.totals || {};
    const selectedCategories = Array.isArray(body?.selectedCategories) ? body.selectedCategories : [];

    const name = String(contact?.name || '').trim();
    const company = String(contact?.company || '').trim();
    const email = String(contact?.email || '').trim();
    const phone = String(contact?.phone || '').trim();
    const gstin = String(contact?.gstin || '').trim();
    const state = String(contact?.state || '').trim();
    const waOptedIn = Boolean(contact?.waOptIn);

    if (!name || !company || !email || !phone) {
      return badRequest('name, company, email, and phone are required');
    }

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
      await (supabase as any)
        .from('ip_submissions')
        .update({ count: Number(windowRow.count || 0) + 1 })
        .eq('id', windowRow.id);
    } else {
      await (supabase as any).from('ip_submissions').insert({
        ip_hash: ipHash,
        count: 1,
        window_start: windowStart.toISOString()
      });
    }

    const payload = {
      waste_category: selectedCategories.join(', ') || 'Not selected',
      annual_qty_mt: Number(totals?.annual_qty_mt || 0),
      obligation_mt: Number(totals?.obligation_mt || 0),
      credits_required: Number(totals?.credits_required || 0),
      estimated_cost_inr: Number(totals?.estimated_cost_inr || 0),
      contact_name: name,
      phone,
      email,
      company,
      gstin: gstin || null,
      state: state || null,
      source_url: String(body?.source_url || ''),
      wa_opted_in: waOptedIn,
      ip_hash: ipHash
    };

    const { data: submission, error: submissionError } = await (supabase as any)
      .from('calculator_submissions')
      .insert(payload)
      .select('id')
      .single();

    if (submissionError) {
      return NextResponse.json({ success: false, error: submissionError.message }, { status: 500 });
    }

    await (supabase as any).from('form_submissions').insert({
      module_key: 'calculator_form',
      source: 'website',
      status: 'new',
      name,
      email,
      phone,
      company,
      submission_data: {
        type: 'Calculator_Form',
        contact,
        totals,
        selectedCategories,
        waOptedIn
      },
      metadata: {
        ip_hash: ipHash,
        source_url: String(body?.source_url || ''),
        calculator_submission_id: submission.id
      }
    });

    await (supabase as any).from('leads').insert({
      source: 'Calculator',
      service_interest: selectedCategories,
      contact_name: name,
      company,
      email,
      phone,
      state,
      stage: 'New',
      deal_value_inr: 0
    });

    const { data: admins } = await (supabase as any)
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    if ((admins || []).length) {
      await (supabase as any).from('notifications').insert(
        (admins || []).map((admin: any) => ({
          profile_id: admin.id,
          type: 'system',
          message: `New calculator submission from ${name} (${company})`,
          link: `/admin/telecalling/leads`,
          read: false
        }))
      );
    }

    if (waOptedIn) {
      try {
        await sendTemplateMessage(phone, TEMPLATES.LEAD_REPLY, [name, 'EPR obligation report', 'within 24 hours']);
      } catch {
        // Non-blocking for submission success.
      }
    }

    return NextResponse.json({ success: true, submission_id: submission.id });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || 'Submission failed') },
      { status: 500 }
    );
  }
}
