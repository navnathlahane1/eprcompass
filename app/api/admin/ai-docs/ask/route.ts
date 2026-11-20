import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { getDocsRoot, readIndex, requireSuperAdmin, safeDocPath } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

function summarize(content: string, maxLines = 8) {
  const lines = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith('```'));

  return lines.slice(0, maxLines).join(' ');
}

function normalize(input: string) {
  return String(input || '').toLowerCase().trim();
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const question = String(request.nextUrl.searchParams.get('q') || '').trim();
    if (!question) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const q = normalize(question);
    const index = readIndex();
    const ranked = index.docs
      .map((doc) => {
        const haystack = `${doc.title} ${doc.summary} ${doc.path} ${doc.category}`.toLowerCase();
        let score = 0;
        if (haystack.includes(q)) score += 10;
        const words = q.split(/\s+/).filter(Boolean);
        for (const word of words) {
          if (haystack.includes(word)) score += 2;
        }
        return { doc, score };
      })
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const answers = ranked.map((row) => {
      const absolute = safeDocPath(row.doc.path);
      const content = absolute ? fs.readFileSync(absolute, 'utf8') : '';
      return {
        path: row.doc.path,
        title: row.doc.title,
        category: row.doc.category,
        summary: summarize(content),
      };
    });

    const best = answers[0];
    const responseText = best
      ? `Simple answer: ${best.summary}`
      : 'I could not find a direct match yet. Please regenerate docs and try a more specific question.';

    const relatedTopics = answers.map((item) => ({
      title: item.title,
      path: item.path,
      category: item.category,
    }));

    return NextResponse.json({
      ok: true,
      question,
      answer: responseText,
      relatedTopics,
      docsRoot: getDocsRoot(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'AI answer failed' }, { status: 500 });
  }
}
