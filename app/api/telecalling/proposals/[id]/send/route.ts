/**
 * POST /api/telecalling/proposals/[id]/send
 *
 * Marks a proposal as sent, updates the linked lead's status, and — best
 * effort — emails the proposal content to the lead if they have an email
 * on file and RESEND_API_KEY is configured. Always returns a shareable
 * public link (`/proposal/[share_token]`) so the telecaller can paste it
 * into WhatsApp/manual email regardless of whether auto-send worked.
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveCallerActor } from '@/lib/telecalling/resolveCallerActor';

export const dynamic = 'force-dynamic';

async function sendProposalEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: 'Email sending is not configured (no RESEND_API_KEY).' };

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: process.env.RENEWAL_FROM_EMAIL || 'EPR Compass <support@example.com>',
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return { sent: false, reason: `Email provider error: ${text || response.status}` };
  }
  return { sent: true, reason: '' };
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const actor = await resolveCallerActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: proposal, error: fetchErr } = await actor.db
    .from('tc_proposals')
    .select('id, title, content_html, status, created_by, share_token, lead:leads(id, email, company_name, name)')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!proposal) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (proposal.created_by !== actor.id && !['admin', 'manager'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const lead = Array.isArray(proposal.lead) ? proposal.lead[0] : proposal.lead;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const link = `${siteUrl.replace(/\/$/, '')}/proposal/${proposal.share_token}`;

  let emailed = false;
  let emailReason = 'No email on file for this lead.';
  if (lead?.email && proposal.content_html) {
    const result = await sendProposalEmail(lead.email, proposal.title, proposal.content_html);
    emailed = result.sent;
    emailReason = result.reason;
  }

  const now = new Date().toISOString();
  const { data: updated, error: updateErr } = await actor.db
    .from('tc_proposals')
    .update({ status: 'sent', sent_at: now, updated_at: now })
    .eq('id', id)
    .select()
    .single();

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  if (lead?.id) {
    await actor.db.from('leads').update({ tc_status: 'Proposal Sent', updated_at: now }).eq('id', lead.id);
  }

  return NextResponse.json({ proposal: updated, link, emailed, emailReason: emailed ? '' : emailReason });
}

