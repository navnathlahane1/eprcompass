import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const CLIENT_ONBOARDING = [
  { id: 'gstin', label: 'GST certificate uploaded' },
  { id: 'pan', label: 'PAN card uploaded' },
  { id: 'auth_letter', label: 'Authorization letter signed' },
  { id: 'product_details', label: 'Product/packaging details submitted' },
  { id: 'qty_data', label: 'Annual quantity data provided' },
  { id: 'cpcb_login', label: 'CPCB portal login created' },
  { id: 'registration_filed', label: 'EPR registration filed' },
  { id: 'registration_approved', label: 'EPR registration approved' }
] as const;

export const RECYCLER_ONBOARDING = [
  { id: 'cpcb_cert', label: 'CPCB certificate uploaded' },
  { id: 'gst', label: 'GST certificate uploaded' },
  { id: 'capacity_report', label: 'Capacity report submitted' },
  { id: 'bank_details', label: 'Bank details verified' },
  { id: 'agreement', label: 'Partnership agreement signed' },
  { id: 'portal_access', label: 'Portal access granted' }
] as const;

export const CEPC_ONBOARDING = [
  { id: 'application', label: 'Application received' },
  { id: 'training', label: 'Training completed' },
  { id: 'assessment', label: 'Assessment passed' },
  { id: 'cert_issued', label: 'CEPC certificate issued' },
  { id: 'agreement', label: 'Consultant agreement signed' },
  { id: 'territory', label: 'Territory assigned' },
  { id: 'portal_access', label: 'Portal access granted' }
] as const;

export const PARTNER_ONBOARDING = [
  { id: 'intro_call', label: 'Introduction call done' },
  { id: 'proposal_shared', label: 'Partnership proposal shared' },
  { id: 'agreement', label: 'Agreement signed' },
  { id: 'kit_sent', label: 'Partner kit sent' },
  { id: 'training', label: 'EPR training completed' },
  { id: 'portal_access', label: 'Portal access granted' },
  { id: 'first_referral', label: 'First referral submitted' }
] as const;

type EntityType = 'client' | 'recycler' | 'cepc' | 'partner';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function getTemplate(entityType: EntityType) {
  if (entityType === 'client') return CLIENT_ONBOARDING;
  if (entityType === 'recycler') return RECYCLER_ONBOARDING;
  if (entityType === 'cepc') return CEPC_ONBOARDING;
  return PARTNER_ONBOARDING;
}

function toChecklistSteps(entityType: EntityType) {
  return getTemplate(entityType).map((step) => ({
    id: step.id,
    label: step.label,
    done: false,
    done_at: null,
    done_by: null
  }));
}

export async function createChecklist(entityType: EntityType, entityId: string) {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) return existing.id as string;

  const { data, error } = await (supabase as any)
    .from('onboarding_checklists')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      template_name: `${entityType.toUpperCase()}_ONBOARDING`,
      steps: toChecklistSteps(entityType)
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function updateChecklistStep(checklistId: string, stepId: string, done: boolean, doneBy: string) {
  const supabase = getSupabaseAdmin();

  const { data: checklist, error: readError } = await (supabase as any)
    .from('onboarding_checklists')
    .select('id, steps')
    .eq('id', checklistId)
    .maybeSingle();

  if (readError || !checklist) throw new Error(readError?.message || 'Checklist not found');

  const steps = Array.isArray(checklist.steps) ? checklist.steps : [];
  const next = steps.map((step: any) => {
    if (step.id !== stepId) return step;
    return {
      ...step,
      done,
      done_at: done ? new Date().toISOString() : null,
      done_by: done ? doneBy : null
    };
  });

  const { data: updated, error } = await (supabase as any)
    .from('onboarding_checklists')
    .update({ steps: next, updated_at: new Date().toISOString() })
    .eq('id', checklistId)
    .select('id, entity_type, entity_id, template_name, steps, completion_pct, created_at, updated_at')
    .single();

  if (error) throw error;
  return updated;
}

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + pad, 'base64').toString('utf8');
}

export function signOnboardingToken(checklistId: string, expiresInDays = 30) {
  const secret = process.env.ONBOARDING_TOKEN_SECRET;
  if (!secret) throw new Error('Missing ONBOARDING_TOKEN_SECRET');

  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    checklist_id: checklistId,
    iat: now,
    exp: now + (expiresInDays * 24 * 60 * 60)
  };

  const h = base64UrlEncode(JSON.stringify(header));
  const p = base64UrlEncode(JSON.stringify(payload));
  const body = `${h}.${p}`;
  const signature = createHmac('sha256', secret).update(body).digest();
  return `${body}.${base64UrlEncode(signature)}`;
}

export function verifyOnboardingToken(token: string) {
  const secret = process.env.ONBOARDING_TOKEN_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [h, p, s] = parts;
  const body = `${h}.${p}`;
  const expected = base64UrlEncode(createHmac('sha256', secret).update(body).digest());
  if (expected !== s) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(p));
    if (!payload?.checklist_id || !payload?.exp) return null;
    if (Number(payload.exp) < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
