import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';
import { isSuperAdmin } from '@/lib/admin/isSuperAdmin';

type TargetMode = 'role' | 'individual' | 'group' | 'all';

type MessageType = 'info' | 'warning' | 'announcement' | 'urgent';

type CreateAnnouncementPayload = {
  title?: string;
  body?: string;
  imageUrl?: string;
  linkUrl?: string;
  targetMode?: TargetMode;
  targetRoles?: string[];
  targetProfileIds?: string[];
  messageType?: MessageType;
};

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
}

async function getAuthorizedAdminId() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  const canManage = ['admin', 'manager'].includes(profile?.role || '') || isSuperAdmin(user.email);
  if (!canManage) return null;

  return user.id;
}

function validHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const adminId = await getAuthorizedAdminId();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = adminClient();
    const { data, error } = await (admin as any)
      .from('announcements')
      .select('id, title, body, image_url, link_url, target_mode, target_roles, target_profile_ids, created_at, expires_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const announcements = Array.isArray(data) ? data : [];
    if (announcements.length === 0) {
      return NextResponse.json({ rows: [] });
    }

    const ids = announcements.map((item: any) => item.id);
    const { data: recipientRows } = await (admin as any)
      .from('announcement_recipients')
      .select('announcement_id, profile_id')
      .in('announcement_id', ids);

    const countMap = new Map<string, number>();
    for (const row of recipientRows || []) {
      countMap.set(row.announcement_id, (countMap.get(row.announcement_id) || 0) + 1);
    }

    const rows = announcements.map((item: any) => ({
      ...item,
      recipient_count: countMap.get(item.id) || 0
    }));

    return NextResponse.json({ rows });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch announcements.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const adminId = await getAuthorizedAdminId();
    if (!adminId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as CreateAnnouncementPayload;
    const title = String(body?.title || '').trim();
    const message = String(body?.body || '').trim();
    const imageUrl = String(body?.imageUrl || '').trim();
    const linkUrl = String(body?.linkUrl || '').trim();
    const targetMode = (body?.targetMode || 'role') as TargetMode;
    const VALID_MESSAGE_TYPES: MessageType[] = ['info', 'warning', 'announcement', 'urgent'];
    const messageType: MessageType = VALID_MESSAGE_TYPES.includes(body?.messageType as MessageType)
      ? (body!.messageType as MessageType)
      : 'info';
    const targetRoles = Array.isArray(body?.targetRoles)
      ? Array.from(new Set(body!.targetRoles!.map((v) => String(v || '').trim()).filter(Boolean)))
      : [];
    const targetProfileIds = Array.isArray(body?.targetProfileIds)
      ? Array.from(new Set(body!.targetProfileIds!.map((v) => String(v || '').trim()).filter(Boolean)))
      : [];

    if (!title || !message) {
      return NextResponse.json({ error: 'Title and message are required.' }, { status: 400 });
    }

    if (imageUrl && !validHttpUrl(imageUrl)) {
      return NextResponse.json({ error: 'Image URL must be a valid http/https URL.' }, { status: 400 });
    }

    if (linkUrl && !validHttpUrl(linkUrl)) {
      return NextResponse.json({ error: 'Link URL must be a valid http/https URL.' }, { status: 400 });
    }

    if (targetMode === 'role' && targetRoles.length === 0) {
      return NextResponse.json({ error: 'Select at least one user type.' }, { status: 400 });
    }

    if (targetMode === 'individual' && targetProfileIds.length !== 1) {
      return NextResponse.json({ error: 'Select exactly one user for individual target mode.' }, { status: 400 });
    }

    if (targetMode === 'group' && targetProfileIds.length < 2) {
      return NextResponse.json({ error: 'Select at least two users for group target mode.' }, { status: 400 });
    }

    const admin = adminClient();

    let recipients: string[] = [];
    if (targetMode === 'all') {
      const { data: profiles, error } = await (admin as any)
        .from('profiles')
        .select('id')
        .not('id', 'is', null);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      recipients = (profiles || []).map((p: any) => String(p.id)).filter(Boolean);
    } else if (targetMode === 'role') {
      const { data: profiles, error } = await (admin as any)
        .from('profiles')
        .select('id, role')
        .in('role', targetRoles);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      recipients = (profiles || []).map((p: any) => String(p.id)).filter(Boolean);
    } else {
      recipients = targetProfileIds;
    }

    recipients = Array.from(new Set(recipients));
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for this announcement.' }, { status: 400 });
    }

    const { data: created, error: createError } = await (admin as any)
      .from('announcements')
      .insert({
        title,
        body: message,
        image_url: imageUrl || null,
        link_url: linkUrl || null,
        created_by: adminId,
        target_mode: targetMode,
        target_roles: targetRoles,
        target_profile_ids: targetProfileIds,
        message_type: messageType,
      })
      .select('id')
      .single();

    if (createError || !created?.id) {
      return NextResponse.json({ error: createError?.message || 'Failed to create announcement.' }, { status: 500 });
    }

    const recipientPayload = recipients.map((profileId) => ({
      announcement_id: created.id,
      profile_id: profileId
    }));

    const { error: recipientsError } = await (admin as any)
      .from('announcement_recipients')
      .insert(recipientPayload);

    if (recipientsError) {
      return NextResponse.json({ error: recipientsError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, announcementId: created.id, recipientCount: recipients.length }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to create announcement.' }, { status: 500 });
  }
}
