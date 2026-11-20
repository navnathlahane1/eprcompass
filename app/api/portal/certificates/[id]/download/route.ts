import { NextRequest, NextResponse } from 'next/server';
import { resolveClientActor, adminClient } from '@/lib/portal/clientAuth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveClientActor();
  if (!actor) return NextResponse.json({ error: 'Active client membership required' }, { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: 'Invalid certificate ID' }, { status: 400 });
  const db = adminClient();
  const { data: doc, error } = await db.from('documents').select('file_path, doc_type')
    .eq('id', id).eq('client_id', actor.clientId).ilike('doc_type', '%certificate%').maybeSingle();
  if (error) return NextResponse.json({ error: 'Certificate unavailable' }, { status: 503 });
  if (!doc) return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  const path = doc.file_path;
  if (!path || !path.startsWith(`${actor.clientId}/`) || path.split('/').some(part => part === '..' || part === '.') || path.includes('\\')) {
    return NextResponse.json({ error: 'Legacy certificate storage needs staff review' }, { status: 409 });
  }
  const signed = await db.storage.from('client-docs').createSignedUrl(path, 60, { download: true });
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: 'Download unavailable; retry later' }, { status: 503 });
  return new NextResponse(null, { status: 303, headers: { Location: signed.data.signedUrl, 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' } });
}
