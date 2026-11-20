import { NextRequest, NextResponse } from 'next/server';
import {
  deleteAttachmentRecord,
  uploadAttachmentFile,
} from '@/lib/telecalling/email-templates/serverActions';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    const attachment = await uploadAttachmentFile(file, id);
    return NextResponse.json({ attachment }, { status: 201 });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to upload attachment' }, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachment_id') || '';
    if (!attachmentId) {
      return NextResponse.json({ error: 'attachment_id is required' }, { status: 400 });
    }

    await deleteAttachmentRecord(attachmentId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to delete attachment' }, { status });
  }
}
