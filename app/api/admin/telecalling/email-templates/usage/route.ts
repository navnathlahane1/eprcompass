import { NextRequest, NextResponse } from 'next/server';
import { logEmailTemplateUsage } from '@/lib/telecalling/email-templates/serverActions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const templateId = String(body?.templateId || '');
    const action = String(body?.action || '');
    if (!templateId || !action) {
      return NextResponse.json({ error: 'templateId and action are required' }, { status: 400 });
    }

    await logEmailTemplateUsage(templateId, action as any);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to log usage' }, { status });
  }
}
