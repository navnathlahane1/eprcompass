import { NextRequest, NextResponse } from 'next/server';
import { requireIntelUser } from '@/lib/intel/server';
import { parseDocumentWithDocumentAi } from '@/lib/intel/googleSales';

export async function POST(req: NextRequest) {
  const auth = await requireIntelUser(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const url = String(body.source_url || '');
  if (!url) return NextResponse.json({ error: 'source_url required' }, { status: 400 });
  try {
    const parsed = await parseDocumentWithDocumentAi(url);
    return NextResponse.json({ ok: true, ...parsed });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Parse failed' }, { status: 502 });
  }
}
