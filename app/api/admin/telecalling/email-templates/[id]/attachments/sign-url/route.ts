import { NextRequest, NextResponse } from 'next/server';
import { generateAttachmentSignedUrl } from '@/lib/telecalling/email-templates/serverActions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const storagePath = String(body?.storagePath || '');
    if (!storagePath) {
      return NextResponse.json({ error: 'storagePath is required' }, { status: 400 });
    }

    const signedUrl = await generateAttachmentSignedUrl(storagePath, 7 * 24 * 60 * 60);
    return NextResponse.json({ signedUrl });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to generate signed URL' }, { status });
  }
}
