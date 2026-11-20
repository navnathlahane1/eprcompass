import { NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

async function isAdminManager() {
  const supabase = await createServerComponentClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return false;

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return ['admin', 'manager'].includes(profile?.role || '');
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await isAdminManager())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServerComponentClient();
  const { data: job, error } = await (supabase as any)
    .from('bulk_filing_jobs')
    .select('id, created_by, service_type, waste_category, client_ids, status, results, started_at, completed_at')
    .eq('id', id)
    .maybeSingle();

  if (error || !job) {
    return NextResponse.json({ error: error?.message || 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}
