import { NextResponse } from 'next/server';
import { generateDocsSnapshot, readIndex, requireSuperAdmin } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    let index = readIndex();
    if (!index.generatedAt || index.docs.length === 0) {
      index = generateDocsSnapshot();
    }

    return NextResponse.json({ ok: true, index });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load docs index' }, { status: 500 });
  }
}
