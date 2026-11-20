import { NextRequest, NextResponse } from 'next/server';
import { resolveActor, adminClient } from '@/lib/recyclerNetwork/networkAuth';

/** GET /api/admin/autofill/global-fields?category=COMPANY&search=gstin&active=true */
export async function GET(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const categoryCode = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';
  const activeOnly = searchParams.get('active') !== 'false';

  const db = adminClient();

  // Fetch categories
  const { data: categories } = await (db as any)
    .from('global_field_categories')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  let query = (db as any)
    .from('global_field_definitions')
    .select('*, global_field_categories(id,code,name,icon)')
    .order('sort_order');

  if (activeOnly) query = query.eq('is_active', true);
  if (search) query = query.ilike('display_name', `%${search}%`);
  if (categoryCode) {
    const cat = (categories || []).find((c: { code: string }) => c.code === categoryCode);
    if (cat) query = query.eq('category_id', cat.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ fields: data, categories });
}

/** POST /api/admin/autofill/global-fields — Create a new global field definition */
export async function POST(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const {
    field_key, display_name, category_id, data_type, description, placeholder,
    validation_regex, validation_function, is_required, is_sensitive, is_multi_value,
    applicable_countries, account_column, contact_column, profile_column,
    options, automation_enabled, help_text, sort_order,
  } = body;

  if (!field_key || !display_name || !category_id || !data_type) {
    return NextResponse.json({ error: 'field_key, display_name, category_id, data_type are required' }, { status: 400 });
  }

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('global_field_definitions')
    .insert({
      field_key: field_key.toUpperCase(),
      display_name,
      category_id,
      data_type,
      description: description || null,
      placeholder: placeholder || null,
      validation_regex: validation_regex || null,
      validation_function: validation_function || null,
      is_required: !!is_required,
      is_sensitive: !!is_sensitive,
      is_multi_value: !!is_multi_value,
      applicable_countries: applicable_countries || [],
      account_column: account_column || null,
      contact_column: contact_column || null,
      profile_column: profile_column || null,
      options: options || [],
      automation_enabled: automation_enabled !== false,
      help_text: help_text || null,
      sort_order: sort_order || 0,
    })
    .select('*, global_field_categories(id,code,name,icon)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ field: data }, { status: 201 });
}

/** PATCH /api/admin/autofill/global-fields — Update field (id in body) */
export async function PATCH(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  if (updates.field_key) updates.field_key = updates.field_key.toUpperCase();

  const db = adminClient();
  const { data, error } = await (db as any)
    .from('global_field_definitions')
    .update(updates)
    .eq('id', id)
    .select('*, global_field_categories(id,code,name,icon)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ field: data });
}

/** DELETE /api/admin/autofill/global-fields?id=... — Soft deactivate */
export async function DELETE(req: NextRequest) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!actor.isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = adminClient();
  const { error } = await (db as any)
    .from('global_field_definitions')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
