import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { licenseForCompanies, provenanceForCompany } from '@/lib/intel/license';

export async function GET(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const companyId = req.nextUrl.searchParams.get('company_id') || '';
  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 });

  const [fields, licenses] = await Promise.all([
    provenanceForCompany(auth.db, companyId),
    licenseForCompanies(auth.db, [companyId]),
  ]);
  const license = licenses.get(companyId);

  return NextResponse.json({
    ok: true,
    company_id: companyId,
    shareable: license?.shareable ?? true,
    sources: license?.sources ?? [],
    flags: license?.flags ?? [],
    fields,
  });
}
