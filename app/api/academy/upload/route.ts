/**
 * POST /api/academy/upload?type=avatar|resume
 * Uploads a file to Supabase Storage and persists the URL.
 * avatar  → all authenticated academy users; updates profiles.avatar_url
 * resume  → trainer / guest_trainer only; updates trainer_profiles.resume_url
 */
import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const BUCKET = 'academy-uploads';
const TRAINER_ROLES = ['trainer', 'guest_trainer', 'partner_trainer'];
const ALLOWED_AVATAR = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_RESUME = ['application/pdf'];

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const type = new URL(req.url).searchParams.get('type') ?? '';
  if (!['avatar', 'resume'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type. Use ?type=avatar or ?type=resume' }, { status: 400 });
  }
  if (type === 'resume' && !['trainer', 'guest_trainer'].includes(actor.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  const allowed = type === 'avatar' ? ALLOWED_AVATAR : ALLOWED_RESUME;
  const maxBytes = type === 'avatar' ? 2 * 1024 * 1024 : 5 * 1024 * 1024;

  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: `Unsupported file type. Allowed: ${allowed.join(', ')}` },
      { status: 400 }
    );
  }
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large. Max ${maxBytes / 1024 / 1024}MB allowed` },
      { status: 400 }
    );
  }

  const ext = file.type === 'application/pdf' ? 'pdf'
    : file.type === 'image/webp' ? 'webp'
    : file.type === 'image/png' ? 'png'
    : 'jpg';
  const path = `${type}s/${actor.id}.${ext}`;

  const db = getServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadErr } = await db.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadErr) return NextResponse.json({ error: uploadErr.message }, { status: 500 });

  const { data: { publicUrl } } = db.storage.from(BUCKET).getPublicUrl(path);

  if (type === 'avatar') {
    await Promise.all([
      db.from('profiles').update({ avatar_url: publicUrl }).eq('id', actor.id),
      TRAINER_ROLES.includes(actor.role)
        ? db.from('trainer_profiles').upsert(
            { user_id: actor.id, profile_photo_url: publicUrl, updated_at: new Date().toISOString() },
            { onConflict: 'user_id' }
          )
        : Promise.resolve(),
    ]);
  } else {
    await db.from('trainer_profiles').upsert(
      { user_id: actor.id, resume_url: publicUrl, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  }

  return NextResponse.json({ url: publicUrl });
}
