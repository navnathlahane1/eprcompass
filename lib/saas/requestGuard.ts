import { NextRequest, NextResponse } from 'next/server';

export function rejectUnsafeWorkspaceWrite(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (req.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== req.nextUrl.origin)) {
    return NextResponse.json({ error: 'Cross-site request rejected' }, { status: 403 });
  }
  if (req.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    return NextResponse.json({ error: 'JSON request required' }, { status: 415 });
  }
  return null;
}
