import { NextRequest, NextResponse } from 'next/server';
import {
  createEmailTemplate,
  listEmailTemplates,
} from '@/lib/telecalling/email-templates/serverActions';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active_only') !== 'false';
    const category = searchParams.get('category') || 'all';
    const callStage = searchParams.get('call_stage') || 'all';
    const search = searchParams.get('search') || '';

    const templates = await listEmailTemplates({
      activeOnly,
      category: category as any,
      callStage: callStage as any,
      search,
    });

    return NextResponse.json({ templates });
  } catch (err: any) {
    const message = String(err?.message || '');
    const missingSchema =
      message.includes('does not exist') ||
      message.includes('relation') ||
      message.includes('email_templates') ||
      message.includes('email_template_attachments') ||
      message.includes('email_template_links');

    if (missingSchema) {
      return NextResponse.json({ templates: [], warning: 'Email templates schema is not available yet' });
    }

    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: err?.message || 'Failed to fetch email templates' }, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = await createEmailTemplate(body);
    return NextResponse.json({ template }, { status: 201 });
  } catch (err: any) {
    const status = String(err?.message || '').includes('Unauthorized') ? 401 : String(err?.message || '').includes('Forbidden') ? 403 : 400;
    return NextResponse.json({ error: err?.message || 'Failed to create email template' }, { status });
  }
}
