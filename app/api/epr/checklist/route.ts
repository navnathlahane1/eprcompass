/**
 * GET /api/epr/checklist?category=Plastic&status=Documents+Submitted
 * Returns required document types for the given category + target filing status.
 * Used by the filing form to show which documents are still missing.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@/lib/supabase/createServerComponentClient';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerComponentClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sp = req.nextUrl.searchParams;
    const category = sp.get('category');
    const requiredFor = sp.get('status');

    if (!category || !requiredFor) {
      return NextResponse.json({ error: 'category and status query params are required' }, { status: 400 });
    }

    const { data, error } = await (supabase as any)
      .from('epr_document_checklist')
      .select('doc_types, description')
      .eq('category', category)
      .eq('required_for', requiredFor)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ docTypes: data?.doc_types ?? [], description: data?.description ?? '' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
