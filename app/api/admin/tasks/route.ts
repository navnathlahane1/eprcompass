import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

export const dynamic = 'force-dynamic';

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = db();
  const { data, error } = await supabase
    .from('tasks')
    .select('id, title, description, entity_type, entity_id, assigned_to, created_by, priority, status, due_date, completed_at, sla_hours, actual_hours, tags, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { title, description, entity_type, entity_id, assigned_to, priority, due_date, sla_hours, tags } = body as Record<string, any>;
  if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 });

  const supabase = db();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: title.trim(),
      description: description || null,
      entity_type: entity_type || 'general',
      entity_id: entity_id || null,
      assigned_to: assigned_to || null,
      created_by: actor.userId,
      priority: priority || 'Medium',
      status: 'Open',
      due_date: due_date || null,
      sla_hours: sla_hours ? Number(sla_hours) : null,
      tags: Array.isArray(tags) ? tags : [],
    })
    .select('id, title, description, entity_type, entity_id, assigned_to, created_by, priority, status, due_date, completed_at, sla_hours, actual_hours, tags, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ task: data }, { status: 201 });
}
