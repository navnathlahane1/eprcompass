import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveActor } from '@/lib/recyclerNetwork/networkAuth';

function makeServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const db = makeServiceClient();

  const [importRes, rowsRes] = await Promise.all([
    db.from('tc_lead_imports')
      .select('*, created_by_profile:profiles!tc_lead_imports_created_by_fkey(full_name)')
      .eq('id', id)
      .maybeSingle(),
    db.from('tc_lead_import_rows')
      .select('id, status, error_message, mapped_lead_id')
      .eq('import_id', id)
      .order('created_at', { ascending: true })
      .limit(100),
  ]);

  if (!importRes.data) return NextResponse.json({ error: 'Import not found' }, { status: 404 });

  return NextResponse.json({
    import: importRes.data,
    rows: rowsRes.data || [],
  });
}
