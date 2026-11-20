import { createClient } from '@supabase/supabase-js';
import { sendTemplateMessage, TEMPLATES } from '../whatsapp/client';

type StepDef = {
  step: number;
  daysBefore: number;
  channel: 'Email' | 'WhatsApp' | 'Both';
  templateName: string;
};

const STEPS: StepDef[] = [
  { step: 1, daysBefore: 90, channel: 'Both', templateName: TEMPLATES.RENEWAL_90D },
  { step: 2, daysBefore: 60, channel: 'Both', templateName: TEMPLATES.RENEWAL_60D },
  { step: 3, daysBefore: 30, channel: 'Both', templateName: TEMPLATES.RENEWAL_30D },
  { step: 4, daysBefore: 7, channel: 'WhatsApp', templateName: TEMPLATES.RENEWAL_7D }
];

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function startOfDayUtc(dateInput: string | Date) {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function triggerFromDueDate(dueDate: string, daysBefore: number) {
  const d = startOfDayUtc(dueDate);
  d.setUTCDate(d.getUTCDate() - daysBefore);
  return d;
}

async function sendRenewalEmail(args: {
  to: string;
  company: string;
  category: string;
  dueDate: string;
  daysLeft: number;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: 'RESEND_API_KEY missing' };

  const subject = `Your ${args.category} EPR renewal is due in ${args.daysLeft} days — ${args.company}`;
  const text = [
    `Hello ${args.company},`,
    '',
    `Your ${args.category} EPR renewal is due on ${args.dueDate}.`,
    `Remaining time: ${args.daysLeft} days.`,
    '',
    'Please share any pending documents and complete payment, if due.',
    'Regards,',
    'EPR Compass Team'
  ].join('\n');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${key}`
    },
    body: JSON.stringify({
      from: process.env.RENEWAL_FROM_EMAIL || 'EPR Compass <support@example.com>',
      to: [args.to],
      subject,
      text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    return { ok: false, reason: body || 'Email send failed' };
  }

  return { ok: true };
}

export async function createRenewalSequence(clientId: string, serviceId: string) {
  const supabase = getSupabaseAdmin();

  const { data: service, error: serviceError } = await (supabase as any)
    .from('services')
    .select('id, due_date')
    .eq('id', serviceId)
    .maybeSingle();

  if (serviceError || !service?.due_date) {
    throw new Error(serviceError?.message || 'Service due_date not found');
  }

  const firstTrigger = triggerFromDueDate(service.due_date, 90).toISOString();

  const { data: sequence, error } = await (supabase as any)
    .from('renewal_sequences')
    .insert({
      client_id: clientId,
      service_id: serviceId,
      renewal_date: service.due_date,
      sequence_status: 'Running',
      current_step: 0,
      next_trigger_at: firstTrigger
    })
    .select('id')
    .single();

  if (error) throw error;

  return sequence.id as string;
}

export async function processRenewalStep(sequenceId: string) {
  const supabase = getSupabaseAdmin();

  try {
    const { data: sequence, error: sequenceError } = await (supabase as any)
      .from('renewal_sequences')
      .select('id, client_id, service_id, renewal_date, sequence_status, current_step, next_trigger_at')
      .eq('id', sequenceId)
      .maybeSingle();

    if (sequenceError || !sequence) {
      return { sent: false, channel: 'Both', step: 0, reason: sequenceError?.message || 'Sequence not found' };
    }

    if (sequence.sequence_status !== 'Running') {
      return { sent: false, channel: 'Both', step: Number(sequence.current_step || 0), reason: 'Sequence not running' };
    }

    const [{ data: client }, { data: service }, { data: profile }] = await Promise.all([
      (supabase as any)
        .from('clients')
        .select('id, profile_id, status')
        .eq('id', sequence.client_id)
        .maybeSingle(),
      (supabase as any)
        .from('services')
        .select('id, waste_category, due_date')
        .eq('id', sequence.service_id)
        .maybeSingle(),
      (supabase as any)
        .from('profiles')
        .select('id, email, company_name, full_name, phone')
        .eq('id', (await (supabase as any)
          .from('clients')
          .select('profile_id')
          .eq('id', sequence.client_id)
          .maybeSingle()).data?.profile_id)
        .maybeSingle()
    ]);

    if (client?.status === 'Churned') {
      await cancelRenewalSequence(sequenceId, 'Client churned');
      return { sent: false, channel: 'Both', step: Number(sequence.current_step || 0), reason: 'Client churned' };
    }

    const nextStepNumber = Number(sequence.current_step || 0) + 1;
    const stepDef = STEPS.find((s) => s.step === nextStepNumber);
    if (!stepDef || !service?.due_date) {
      await (supabase as any)
        .from('renewal_sequences')
        .update({ sequence_status: 'Completed', next_trigger_at: null })
        .eq('id', sequenceId);
      return { sent: false, channel: 'Both', step: nextStepNumber, reason: 'No pending step' };
    }

    const company = profile?.company_name || profile?.full_name || 'Client';
    const phone = profile?.phone || null;
    const email = profile?.email || null;
    const dueDate = service.due_date;
    const due = new Date(`${dueDate}T00:00:00Z`);
    const daysLeft = Math.max(0, Math.ceil((due.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

    let sentAny = false;
    let channelUsed: 'Email' | 'WhatsApp' | 'Both' = stepDef.channel;

    if (stepDef.channel === 'Email' || stepDef.channel === 'Both') {
      if (email) {
        const emailResult = await sendRenewalEmail({
          to: email,
          company,
          category: String(service.waste_category || 'EPR'),
          dueDate,
          daysLeft
        });

        await (supabase as any).from('renewal_sequence_log').insert({
          sequence_id: sequenceId,
          step: stepDef.step,
          channel: stepDef.channel === 'Both' ? 'Email' : stepDef.channel,
          template_name: `email_renewal_${stepDef.daysBefore}d`,
          message_preview: `Renewal in ${daysLeft} days for ${company}`,
          status: emailResult.ok ? 'Sent' : 'Failed',
          sent_at: emailResult.ok ? new Date().toISOString() : null
        });

        if (emailResult.ok) sentAny = true;
      } else {
        await (supabase as any).from('renewal_sequence_log').insert({
          sequence_id: sequenceId,
          step: stepDef.step,
          channel: 'Email',
          template_name: `email_renewal_${stepDef.daysBefore}d`,
          message_preview: 'Skipped due to missing email',
          status: 'Skipped'
        });
      }
    }

    if (stepDef.channel === 'WhatsApp' || stepDef.channel === 'Both') {
      if (phone) {
        const waResult = await sendTemplateMessage(phone, stepDef.templateName as any, [
          company,
          String(service.waste_category || 'EPR'),
          String(daysLeft),
          dueDate
        ]);

        await (supabase as any).from('renewal_sequence_log').insert({
          sequence_id: sequenceId,
          step: stepDef.step,
          channel: stepDef.channel === 'Both' ? 'WhatsApp' : stepDef.channel,
          template_name: stepDef.templateName,
          message_preview: `WA renewal template ${stepDef.templateName}`,
          status: waResult.success ? 'Sent' : 'Failed',
          sent_at: waResult.success ? new Date().toISOString() : null
        });

        if (waResult.success) sentAny = true;
      } else {
        await (supabase as any).from('renewal_sequence_log').insert({
          sequence_id: sequenceId,
          step: stepDef.step,
          channel: 'WhatsApp',
          template_name: stepDef.templateName,
          message_preview: 'Skipped due to missing phone',
          status: 'Skipped'
        });
      }
    }

    const nextStep = stepDef.step + 1;
    const nextStepDef = STEPS.find((s) => s.step === nextStep);

    await (supabase as any)
      .from('renewal_sequences')
      .update({
        current_step: stepDef.step,
        sequence_status: nextStepDef ? 'Running' : 'Completed',
        next_trigger_at: nextStepDef ? triggerFromDueDate(dueDate, nextStepDef.daysBefore).toISOString() : null
      })
      .eq('id', sequenceId);

    return { sent: sentAny, channel: channelUsed, step: stepDef.step };
  } catch (error: any) {
    const supabaseSafe = getSupabaseAdmin();
    await (supabaseSafe as any).from('renewal_sequence_log').insert({
      sequence_id: sequenceId,
      step: 0,
      channel: 'Both',
      template_name: 'process_error',
      message_preview: String(error?.message || 'Unknown processRenewalStep error'),
      status: 'Failed',
      sent_at: new Date().toISOString()
    });

    return { sent: false, channel: 'Both', step: 0, reason: String(error?.message || 'Unknown error') };
  }
}

export async function cancelRenewalSequence(sequenceId: string, reason: string) {
  const supabase = getSupabaseAdmin();

  await (supabase as any)
    .from('renewal_sequences')
    .update({ sequence_status: 'Cancelled', next_trigger_at: null })
    .eq('id', sequenceId);

  await (supabase as any).from('renewal_sequence_log').insert({
    sequence_id: sequenceId,
    step: 0,
    channel: 'Both',
    template_name: 'cancel',
    message_preview: reason,
    status: 'Skipped',
    sent_at: new Date().toISOString()
  });
}

