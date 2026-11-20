import { NextRequest, NextResponse } from 'next/server';
import {
  deleteEmailTemplate,
  getEmailTemplate,
  updateEmailTemplate,
} from '@/lib/telecalling/email-templates/serverActions';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const template = await getEmailTemplate(id);
    if (!template) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ template });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: err?.message || 'Failed to fetch email template' }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id } = await params;
    const template = await updateEmailTemplate(id, body);
    return NextResponse.json({ template });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to update email template' }, { status });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await deleteEmailTemplate(id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to delete email template' }, { status });
  }
}
