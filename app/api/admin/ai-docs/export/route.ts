import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { readIndex, requireSuperAdmin, safeDocPath } from '@/lib/admin/aiDocs';

export const runtime = 'nodejs';

function esc(text: string) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

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
    const index = readIndex();
    const generatedAt = index.generatedAt || new Date().toISOString();
    const version = index.version || 'unknown';

    const toc = index.docs
      .map((doc) => `<li>${esc(doc.title)} <span class="muted">(${esc(doc.path)})</span></li>`)
      .join('');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>AI Documentation Export</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 28px; color: #0f172a; }
      h1 { font-size: 28px; margin: 0 0 10px; }
      h2 { font-size: 18px; margin-top: 24px; }
      .meta { color: #475569; font-size: 12px; margin-bottom: 16px; }
      .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
      pre { white-space: pre-wrap; word-break: break-word; font-size: 12px; line-height: 1.5; }
      ul { margin: 0; padding-left: 18px; }
      .muted { color: #64748b; }
      @page { margin: 20mm; }
      @media print {
        body { margin: 0; }
        .page-footer { position: fixed; bottom: 0; left: 0; right: 0; font-size: 11px; color: #64748b; }
      }
    </style>
  </head>
  <body>
    <h1>AI Documentation Center Export</h1>
    <div class="meta">Generated: ${esc(generatedAt)} | Version: ${esc(version)} | Source: ${esc(relativePath)}</div>
    <div class="card">
      <h2>Table of Contents</h2>
      <ul>${toc}</ul>
    </div>
    <div class="card">
      <h2>Document Content</h2>
      <pre>${esc(content)}</pre>
    </div>
    <div class="page-footer">AI Documentation Center • Generated ${esc(generatedAt)} • Version ${esc(version)}</div>
  </body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Export failed' }, { status: 500 });
  }
}
