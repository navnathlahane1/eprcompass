import { NextRequest, NextResponse } from 'next/server';
import { resolveAcademyActor, getServiceClient } from '../_shared';

export const runtime = 'nodejs';

const TRAINER_ROLES = ['trainer', 'guest_trainer', 'partner_trainer'] as const;

function isTrainer(role: string) {
  return (TRAINER_ROLES as readonly string[]).includes(role);
}

export async function GET() {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getServiceClient();

  const [{ data: profile }, { data: clients }, { data: profileRow }] = await Promise.all([
    db.from('trainer_profiles').select('*').eq('user_id', actor.id).maybeSingle(),
    db.from('trainer_past_clients').select('*').eq('trainer_id', actor.id).order('sort_order'),
    db.from('profiles').select('full_name, avatar_url').eq('id', actor.id).maybeSingle(),
  ]);

  return NextResponse.json({
    profile:   profile ?? null,
    clients:   clients ?? [],
    role:      actor.role,
    fullName:  actor.fullName ?? profileRow?.full_name ?? null,
    avatarUrl: profileRow?.avatar_url ?? (profile as any)?.profile_photo_url ?? null,
  });
}

export async function PUT(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const db = getServiceClient();

  const profileFields = {
    user_id:           actor.id,
    headline:          body.headline ?? null,
    bio:               body.bio ?? null,
    location:          body.location ?? null,
    website_url:       body.website_url ?? null,
    profile_photo_url: body.profile_photo_url ?? null,
    resume_url:        body.resume_url ?? null,
    linkedin_url:      body.linkedin_url ?? null,
    twitter_url:       body.twitter_url ?? null,
    youtube_url:       body.youtube_url ?? null,
    instagram_url:     body.instagram_url ?? null,
    other_social:      body.other_social ?? [],
    education:         body.education ?? [],
    achievements:      body.achievements ?? [],
    certifications:    body.certifications ?? [],
    languages:         body.languages ?? [],
    updated_at:        new Date().toISOString(),
  };

  const { error } = await db
    .from('trainer_profiles')
    .upsert(profileFields, { onConflict: 'user_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function POST(req: NextRequest) {
  const actor = await resolveAcademyActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isTrainer(actor.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const section = searchParams.get('section');
  const body = await req.json();
  const db = getServiceClient();

  // Client list sync — delete all then bulk insert
  if (section === 'clients_sync') {
    await db.from('trainer_past_clients').delete().eq('trainer_id', actor.id);
    const clients = (body.clients ?? []) as Record<string, unknown>[];
    if (clients.length > 0) {
      await db.from('trainer_past_clients').insert(
        clients.map((c, i) => ({ ...c, trainer_id: actor.id, sort_order: i }))
      );
    }
    return NextResponse.json({ success: true });
  }

  if (body.action !== 'submit') return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  const { error } = await db
    .from('trainer_profiles')
    .update({ profile_status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('user_id', actor.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
