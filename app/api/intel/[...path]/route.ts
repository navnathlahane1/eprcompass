import { NextRequest, NextResponse } from 'next/server';
import { intelExpressOrigin } from '@/lib/intel/server';

export const dynamic = 'force-dynamic';

async function proxy(req: NextRequest, path: string[]) {
  const origin = intelExpressOrigin();
  if (!origin) {
    return NextResponse.json(
      { error: 'Intel Express origin is not configured (INTEL_EXPRESS_URL / NEXT_PUBLIC_SCRAPER_URL)' },
      { status: 502 },
    );
  }
  const search = req.nextUrl.search || '';
  const url = `${origin}/api/intel/${path.join('/')}${search}`;
  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('connection');
  const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();
  try {
    const res = await fetch(url, { method: req.method, headers, body, cache: 'no-store' });
    const buf = await res.arrayBuffer();
    const out = new NextResponse(buf, { status: res.status });
    const ct = res.headers.get('content-type');
    if (ct) out.headers.set('content-type', ct);
    return out;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Intel proxy failed', origin },
      { status: 502 },
    );
  }
}

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function POST(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function PUT(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function PATCH(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
export async function DELETE(req: NextRequest, ctx: Ctx) {
  return proxy(req, (await ctx.params).path || []);
}
