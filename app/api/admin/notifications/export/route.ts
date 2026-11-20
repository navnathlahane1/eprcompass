/**
 * GET /api/admin/notifications/export
 * Exports all notifications as Excel (.xlsx) or CSV
 *
 * Query params:
 *   format=xlsx|csv (default: xlsx)
 *   status=active|draft|all (default: all)
 *   epr_type=Plastic|E-Waste|...
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient }             from '@supabase/supabase-js';
import { requireAdminSession } from '@/lib/api/requireActor';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { deny } = await requireAdminSession();
  if (deny) return deny;

  const { searchParams } = new URL(req.url);
  const format   = searchParams.get('format')   || 'xlsx';
  const status   = searchParams.get('status')   || 'all';
  const eprType  = searchParams.get('epr_type') || null;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // Fetch all matching notifications
  let qb = sb
    .from('scraped_notifications')
    .select(
      `id, slug, title, short_description, epr_type, document_type,
       notification_number, published_date, effective_date, compliance_deadline,
       source_url, tags, status, view_count, download_count, created_at,
       notification_authorities!authority_id(short_name, name),
       notification_files(cdn_url, mime_type, is_primary)`
    )
    .eq('is_deleted', false)
    .order('published_date', { ascending: false })
    .limit(5000);

  if (status !== 'all') qb = qb.eq('status', status);
  if (eprType)          qb = qb.eq('epr_type', eprType);

  const { data, error } = await qb;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = (data || []).map((n: any) => ({
    'ID':                    n.id,
    'Title':                 n.title,
    'Short Description':     n.short_description || '',
    'EPR Type':              n.epr_type || '',
    'Document Type':         n.document_type || '',
    'Notification Number':   n.notification_number || '',
    'Authority':             n.notification_authorities?.short_name || '',
    'Published Date':        n.published_date || '',
    'Effective Date':        n.effective_date || '',
    'Compliance Deadline':   n.compliance_deadline || '',
    'Status':                n.status,
    'Tags':                  (n.tags || []).join(', '),
    'Source URL':            n.source_url || '',
    'Primary File URL':      n.notification_files?.find((f: any) => f.is_primary)?.cdn_url || '',
    'View Count':            n.view_count || 0,
    'Download Count':        n.download_count || 0,
    'Scraped At':            n.created_at,
    'Detail Page URL':       `http://localhost:3000/notifications/${n.slug}`,
  }));

  if (format === 'csv') {
    // Build CSV
    if (rows.length === 0) {
      return new NextResponse('No data', {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="notifications.csv"',
        },
      });
    }

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(','),
      ...rows.map((row: any) =>
        headers.map((h) => `"${String(row[h] || '').replace(/"/g, '""')}"`).join(',')
      ),
    ];

    return new NextResponse(csvLines.join('\n'), {
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="epr-notifications-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // XLSX export using xlsx package
  try {
    const XLSX = await import('xlsx');

    const wb  = XLSX.utils.book_new();
    const ws  = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws['!cols'] = [
      { wch: 36 }, { wch: 60 }, { wch: 40 }, { wch: 12 }, { wch: 18 },
      { wch: 20 }, { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 10 }, { wch: 30 }, { wch: 60 }, { wch: 60 }, { wch: 8 },
      { wch: 8 },  { wch: 22 }, { wch: 60 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Notifications');

    // Summary sheet
    const summaryData = [
      { 'Metric': 'Total Notifications', 'Value': rows.length },
      { 'Metric': 'Active',              'Value': rows.filter((r: any) => r['Status'] === 'active').length },
      { 'Metric': 'Draft',               'Value': rows.filter((r: any) => r['Status'] === 'draft').length },
      { 'Metric': 'Export Date',         'Value': new Date().toISOString() },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Summary');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="epr-notifications-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err: any) {
    // Fallback to CSV if xlsx not available
    return NextResponse.json({ error: 'XLSX export failed: ' + err.message }, { status: 500 });
  }
}
