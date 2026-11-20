import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { searchCompanyWebAndDocs } from '@/lib/intel/googleSales';

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const companyId = String(body.company_id || '');
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const { data: company, error } = await auth.db
    .from('intel_companies')
    .select('id, canonical_name, state, website')
    .eq('id', companyId)
    .maybeSingle();
  if (error || !company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

  try {
    const found = await searchCompanyWebAndDocs(company.canonical_name, company.state);
    const docs = [];
    for (const hit of found.docs.slice(0, 8)) {
      const { data } = await auth.db
        .from('intel_company_documents')
        .insert({
          company_id: companyId,
          doc_type: hit.kind === 'spcb_pdf' ? 'spcb_pdf' : 'cpcb_pdf',
          title: hit.title,
          source_url: hit.link,
        })
        .select('id')
        .maybeSingle();
      docs.push({ ...hit, id: data?.id });
    }
    const website = found.websites[0]?.link || null;
    if (website && !company.website) {
      await auth.db.from('intel_companies').update({ website }).eq('id', companyId);
    }
    return NextResponse.json({
      ok: true,
      website,
      websites: found.websites,
      documents: docs,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Search failed' }, { status: 502 });
  }
}
