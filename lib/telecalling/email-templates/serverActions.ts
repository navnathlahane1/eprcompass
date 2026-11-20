// Server-side utility functions — called only from Route Handlers (not from client components).
// Do NOT add 'use server' here: that directive would compile the exports as server-action
// RPC endpoints, which causes Next.js to route calls through a self-referencing HTTP fetch
// when invoked from a Route Handler, producing unpredictable 500 errors on Vercel.

import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { htmlToPlainText, sanitizeEmailHtml } from './content';
import type {
  EmailTemplate,
  EmailTemplateAttachment,
  EmailTemplateFilters,
  EmailTemplateSaveInput,
  EmailTemplateUsageAction,
  EmailTemplateWithRelations,
} from './types';

const TEMPLATE_TABLE = 'email_templates';
const ATTACHMENT_TABLE = 'email_template_attachments';
const LINK_TABLE = 'email_template_links';
const USAGE_TABLE = 'email_template_usage';
const ATTACHMENT_BUCKET = 'email-template-attachments';

function makeServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function getAuthContext(): Promise<{ userId: string; role: string }> {
  const supabase = await createServerComponentClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = String(profile?.role || '').toLowerCase();
  return { userId: user.id, role };
}

function ensureAdminRole(role: string) {
  if (!['admin', 'manager'].includes(role)) {
    throw new Error('Forbidden');
  }
}

export async function listEmailTemplates(filters: EmailTemplateFilters = {}): Promise<EmailTemplateWithRelations[]> {
  const { role } = await getAuthContext();
  const db = makeServiceClient();

  let query = (db as any)
    .from(TEMPLATE_TABLE)
    .select('*, attachments:email_template_attachments(*), links:email_template_links(*)')
    .order('updated_at', { ascending: false });

  const activeOnly = filters.activeOnly !== false;
  if (activeOnly || !['admin', 'manager'].includes(role)) {
    query = query.eq('is_active', true);
  }

  if (filters.category && filters.category !== 'all') {
    query = query.eq('category', filters.category);
  }

  if (filters.callStage && filters.callStage !== 'all') {
    query = query.eq('call_stage', filters.callStage);
  }

  if (filters.search) {
    query = query.or(`title.ilike.%${filters.search}%,subject.ilike.%${filters.search}%`);
  }

  const { data, error } = await query;
  if (error) {
    const message = String(error.message || '');
    const missingSchema =
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('email_templates') ||
      message.includes('email_template_attachments') ||
      message.includes('email_template_links');
    if (missingSchema) return [];
    throw new Error(error.message);
  }

  return (data || []).map((row: any) => ({
    ...row,
    attachments: (row.attachments || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
    links: (row.links || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
  }));
}

export async function getEmailTemplate(id: string): Promise<EmailTemplateWithRelations | null> {
  const list = await listEmailTemplates({ activeOnly: false });
  return list.find((item) => item.id === id) || null;
}

export async function createEmailTemplate(input: EmailTemplateSaveInput): Promise<EmailTemplate> {
  const { userId, role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();
  const bodyHtml = sanitizeEmailHtml(input.body_html || '');
  const bodyPlain = htmlToPlainText(bodyHtml);

  const { data, error } = await (db as any)
    .from(TEMPLATE_TABLE)
    .insert({
      title: input.title,
      category: input.category,
      call_stage: input.call_stage,
      subject: input.subject,
      body_html: bodyHtml,
      body_plain: bodyPlain,
      is_active: input.is_active !== false,
      created_by: userId,
      updated_by: userId,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  if (Array.isArray(input.links) && input.links.length > 0) {
    const links = input.links.map((link, index) => ({
      template_id: data.id,
      label: link.label,
      url: link.url,
      sort_order: Number.isFinite(link.sort_order) ? link.sort_order : index,
    }));

    const { error: linkError } = await (db as any).from(LINK_TABLE).insert(links);
    if (linkError) throw new Error(linkError.message);
  }

  return data;
}

export async function updateEmailTemplate(id: string, input: Partial<EmailTemplateSaveInput>): Promise<EmailTemplate> {
  const { userId, role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();
  const updates: Record<string, any> = { updated_by: userId };

  if (typeof input.title === 'string') updates.title = input.title;
  if (typeof input.category === 'string') updates.category = input.category;
  if (typeof input.call_stage === 'string') updates.call_stage = input.call_stage;
  if (typeof input.subject === 'string') updates.subject = input.subject;
  if (typeof input.is_active === 'boolean') updates.is_active = input.is_active;
  if (typeof input.body_html === 'string') {
    const bodyHtml = sanitizeEmailHtml(input.body_html || '');
    updates.body_html = bodyHtml;
    updates.body_plain = htmlToPlainText(bodyHtml);
  }

  const { data, error } = await (db as any)
    .from(TEMPLATE_TABLE)
    .update(updates)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(error.message);

  if (Array.isArray(input.links)) {
    const { error: deleteError } = await (db as any).from(LINK_TABLE).delete().eq('template_id', id);
    if (deleteError) throw new Error(deleteError.message);

    if (input.links.length > 0) {
      const links = input.links.map((link, index) => ({
        template_id: id,
        label: link.label,
        url: link.url,
        sort_order: Number.isFinite(link.sort_order) ? link.sort_order : index,
      }));

      const { error: linkError } = await (db as any).from(LINK_TABLE).insert(links);
      if (linkError) throw new Error(linkError.message);
    }
  }

  return data;
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  const { role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();
  const { error } = await (db as any)
    .from(TEMPLATE_TABLE)
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function logEmailTemplateUsage(templateId: string, action: EmailTemplateUsageAction): Promise<void> {
  const { userId } = await getAuthContext();
  const db = makeServiceClient();

  const { error } = await (db as any).from(USAGE_TABLE).insert({
    template_id: templateId,
    user_id: userId,
    action,
  });

  if (error) throw new Error(error.message);
}

export async function generateAttachmentSignedUrl(storagePath: string, expiresSeconds = 7 * 24 * 60 * 60): Promise<string> {
  await getAuthContext();
  const db = makeServiceClient();

  const { data, error } = await (db as any)
    .storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(storagePath, Math.max(60, Math.min(expiresSeconds, 7 * 24 * 60 * 60)));

  if (error) throw new Error(error.message);
  return String(data?.signedUrl || '');
}

export async function createAttachmentRecord(payload: {
  templateId: string;
  fileName: string;
  storagePath: string;
  mimeType?: string;
  sizeBytes?: number;
  sortOrder?: number;
}): Promise<EmailTemplateAttachment> {
  const { role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();
  const { data, error } = await (db as any)
    .from(ATTACHMENT_TABLE)
    .insert({
      template_id: payload.templateId,
      file_name: payload.fileName,
      storage_path: payload.storagePath,
      mime_type: payload.mimeType || null,
      size_bytes: payload.sizeBytes || null,
      sort_order: payload.sortOrder ?? 0,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAttachmentRecord(attachmentId: string): Promise<void> {
  const { role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();

  const { data: row, error: rowError } = await (db as any)
    .from(ATTACHMENT_TABLE)
    .select('id, storage_path')
    .eq('id', attachmentId)
    .single();

  if (rowError) throw new Error(rowError.message);

  const { error: dbError } = await (db as any).from(ATTACHMENT_TABLE).delete().eq('id', attachmentId);
  if (dbError) throw new Error(dbError.message);

  if (row?.storage_path) {
    await (db as any).storage.from(ATTACHMENT_BUCKET).remove([row.storage_path]);
  }
}

export async function uploadAttachmentFile(file: File, templateId: string): Promise<EmailTemplateAttachment> {
  const { role } = await getAuthContext();
  ensureAdminRole(role);

  const db = makeServiceClient();
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const fileNameBase = file.name.replace(/\.[^.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'attachment';
  const objectPath = `${templateId}/${Date.now()}-${fileNameBase}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await (db as any)
    .storage
    .from(ATTACHMENT_BUCKET)
    .upload(objectPath, buffer, { contentType: file.type || undefined, upsert: true });

  if (uploadError) throw new Error(uploadError.message);

  const { data: maxSortRow } = await (db as any)
    .from(ATTACHMENT_TABLE)
    .select('sort_order')
    .eq('template_id', templateId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  return createAttachmentRecord({
    templateId,
    fileName: file.name,
    storagePath: objectPath,
    mimeType: file.type || null,
    sizeBytes: file.size,
    sortOrder: Number(maxSortRow?.sort_order || 0) + 1,
  });
}
