import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { OAuth2Client } from 'google-auth-library';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

// Labels/senders we skip — automated noise
const SKIP_SENDERS = [
  'noreply', 'no-reply', 'donotreply', 'notifications@', 'support@',
  'mailer-daemon', 'bounce', 'postmaster', 'alert@', 'billing@',
];

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

function makeOAuthClient() {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );
}

async function getValidToken(account: any): Promise<string | null> {
  const client = makeOAuthClient();
  client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
    expiry_date: account.token_expiry ? new Date(account.token_expiry).getTime() : undefined,
  });

  try {
    const { token } = await client.getAccessToken();
    return token || null;
  } catch {
    return null;
  }
}

function parseFromHeader(from: string): { name: string; email: string } {
  const match = from.match(/^"?([^"<]+?)"?\s*<([^>]+)>$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  const emailOnly = from.match(/([^\s]+@[^\s]+)/);
  return { name: '', email: emailOnly?.[1] || from };
}

function extractCompanyFromEmail(email: string): string {
  const domain = email.split('@')[1] || '';
  if (['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'yahoo.co.in', 'rediffmail.com'].includes(domain)) return '';
  return domain.replace(/\.(com|in|co\.in|net|org|io)$/, '').replace(/[-_]/g, ' ');
}

function isLikelyLead(from: string, subject: string, labels: string[]): boolean {
  const lowerFrom = from.toLowerCase();
  if (SKIP_SENDERS.some(s => lowerFrom.includes(s))) return false;
  if (labels.includes('CATEGORY_PROMOTIONS') || labels.includes('CATEGORY_UPDATES') || labels.includes('SPAM')) return false;
  return true;
}

function decodeBase64(str: string): string {
  try { return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'); }
  catch { return ''; }
}

function extractSnippetFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64(payload.body.data).slice(0, 500);
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const result = extractSnippetFromPayload(part);
      if (result) return result;
    }
  }
  return '';
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = db();

  // Load all connected Gmail accounts
  const { data: accounts, error: accErr } = await supabase
    .from('email_accounts')
    .select('*')
    .eq('provider', 'gmail');

  if (accErr || !accounts?.length) {
    return NextResponse.json({ synced: 0, message: 'No Gmail accounts connected' });
  }

  // Load already-staged email message IDs
  const { data: existing } = await supabase
    .from('intel_raw_records')
    .select('external_record_id')
    .eq('source_type', 'email_gmail');

  const alreadyStaged = new Set((existing || []).map((r: any) => r.external_record_id));

  let totalSynced = 0;
  const errors: string[] = [];

  for (const account of accounts) {
    const accessToken = await getValidToken(account);
    if (!accessToken) { errors.push(`${account.email}: token refresh failed`); continue; }

    // Search Gmail: INBOX messages, last 90 days, not sent by us
    const query = 'in:inbox -from:me -label:sent newer_than:90d';
    const searchRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=50`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!searchRes.ok) { errors.push(`${account.email}: gmail search failed`); continue; }
    const searchData = await searchRes.json();
    const messageIds: string[] = (searchData.messages || []).map((m: any) => m.id);

    const newIds = messageIds.filter(id => !alreadyStaged.has(id));
    if (!newIds.length) continue;

    const rows: any[] = [];

    for (const msgId of newIds.slice(0, 30)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (!msgRes.ok) continue;
      const msg = await msgRes.json();

      const headers: Record<string, string> = {};
      (msg.payload?.headers || []).forEach((h: any) => { headers[h.name.toLowerCase()] = h.value; });

      const from = headers['from'] || '';
      const subject = headers['subject'] || '(no subject)';
      const date = headers['date'] || '';
      const labels: string[] = msg.labelIds || [];

      if (!isLikelyLead(from, subject, labels)) continue;

      const { name: fromName, email: fromEmail } = parseFromHeader(from);
      const company = extractCompanyFromEmail(fromEmail);
      const bodySnippet = extractSnippetFromPayload(msg.payload) || msg.snippet || '';

      rows.push({
        source_type: 'email_gmail',
        source_id: account.id,
        external_record_id: msgId,
        review_status: 'pending',
        payload: {
          from_name: fromName,
          from_email: fromEmail,
          subject,
          company,
          date,
          snippet: bodySnippet.slice(0, 800),
          labels,
          gmail_account: account.email,
        },
      });
    }

    if (rows.length) {
      const { error: insertErr } = await supabase.from('intel_raw_records').insert(rows);
      if (!insertErr) {
        totalSynced += rows.length;
        await supabase.from('email_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);
      }
    }
  }

  return NextResponse.json({ synced: totalSynced, errors });
}
