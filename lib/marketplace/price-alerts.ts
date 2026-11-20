import { createClient } from '@supabase/supabase-js';
import { sendTextMessage } from '@/lib/whatsapp/client';

type TriggerResult = {
  triggered: number;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function sendAlertEmail(to: string, subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: process.env.RENEWAL_FROM_EMAIL || 'EPR Compass <support@example.com>',
      to: [to],
      subject,
      text
    })
  });

  return response.ok;
}

export async function checkPriceAlerts(wasteCategory: string, currentRate: number): Promise<TriggerResult> {
  const supabase = getSupabaseAdmin();
  const { data: alerts } = await (supabase as any)
    .from('credit_price_alerts')
    .select('id, client_id, waste_category, target_rate_inr, alert_type, channel, status')
    .eq('waste_category', wasteCategory)
    .eq('status', 'Active');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  let triggered = 0;
  for (const alert of alerts || []) {
    const targetRate = Number(alert.target_rate_inr || 0);
    const shouldTrigger =
      (alert.alert_type === 'Below' && currentRate <= targetRate) ||
      (alert.alert_type === 'Above' && currentRate >= targetRate);

    if (!shouldTrigger) continue;

    const { data: client } = await (supabase as any)
      .from('clients')
      .select('id, profile_id')
      .eq('id', alert.client_id)
      .maybeSingle();

    const { data: profile } = client?.profile_id
      ? await (supabase as any)
          .from('profiles')
          .select('id, email, phone, company_name, full_name')
          .eq('id', client.profile_id)
          .maybeSingle()
      : { data: null };

    if (!profile) continue;
    const company = profile.company_name || profile.full_name || 'Client';
    const message = [
      `EPR credit price for ${wasteCategory} has reached ₹${Number(currentRate).toLocaleString('en-IN')}/MT.`,
      `Your target was ₹${Number(targetRate).toLocaleString('en-IN')}/MT.`,
      `View listings: ${siteUrl}/marketplace`
    ].join(' ');

    if (alert.channel === 'Email' || alert.channel === 'Both') {
      if (profile.email) {
        await sendAlertEmail(
          profile.email,
          `Price Alert: ${wasteCategory} credits at INR ${Number(currentRate).toLocaleString('en-IN')}/MT`,
          `Hello ${company},\n\n${message}`
        );
      }
    }

    if (alert.channel === 'WhatsApp' || alert.channel === 'Both') {
      if (profile.phone) {
        await sendTextMessage(profile.phone, message);
      }
    }

    await (supabase as any)
      .from('credit_price_alerts')
      .update({ status: 'Triggered', triggered_at: new Date().toISOString() })
      .eq('id', alert.id);

    triggered += 1;
  }

  return { triggered };
}

