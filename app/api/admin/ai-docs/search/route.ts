import { NextRequest, NextResponse } from 'next/server';
import { readIndex, requireSuperAdmin } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

function normalize(text: string) {
  return String(text || '').toLowerCase().trim();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const query = normalize(String(request.nextUrl.searchParams.get('q') || ''));
    const category = normalize(String(request.nextUrl.searchParams.get('category') || ''));
    const index = readIndex();

    let docs = index.docs;
    if (category) {
      docs = docs.filter((item) => normalize(item.category) === category);
    }

    if (query) {
      docs = docs.filter((item) => {
        const haystack = `${item.title} ${item.summary} ${item.path} ${item.category}`.toLowerCase();
        return haystack.includes(query);
      });
    }

    return NextResponse.json({ ok: true, query, category, total: docs.length, results: docs.slice(0, 200) });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Search failed' }, { status: 500 });
  }
}
