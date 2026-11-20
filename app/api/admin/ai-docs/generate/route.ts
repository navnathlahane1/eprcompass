import { NextResponse } from 'next/server';
import { generateDocsSnapshot, requireSuperAdmin } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

export async function POST() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const index = generateDocsSnapshot();
    return NextResponse.json({ ok: true, index, generatedAt: index.generatedAt, totalDocs: index.docs.length });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to generate docs' }, { status: 500 });
  }
}
