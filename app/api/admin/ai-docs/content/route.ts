import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin, safeDocPath } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const relativePath = String(request.nextUrl.searchParams.get('path') || '');
    const absolutePath = safeDocPath(relativePath);
    if (!absolutePath) {
      return NextResponse.json({ error: 'Invalid doc path' }, { status: 400 });
    }

    const content = fs.readFileSync(absolutePath, 'utf8');
    return NextResponse.json({ ok: true, path: relativePath, content });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to load doc content' }, { status: 500 });
  }
}
