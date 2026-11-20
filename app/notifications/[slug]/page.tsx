/**
 * /notifications/[slug] — Full notification detail page
 * ISR: revalidate every 1 hour
 * Features: JSON-LD, OG, breadcrumbs, PDF preview, FAQ, related, download
 */

import type { Metadata } from 'next';
import { notFound }     from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link             from 'next/link';
import {
  Calendar, Building2, Download, ExternalLink, FileText,
  Tag, ChevronRight, Share2, AlertCircle, CheckCircle2,
  Users, ListChecks, HelpCircle, ArrowLeft
} from 'lucide-react';
import NotificationCard from '@/components/notifications/NotificationCard';

export const revalidate = 3600;

// ─── Supabase ─────────────────────────────────────────────────────────────────
function getSb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// ─── Static params (ISR pre-render top 200 slugs) ────────────────────────────
export async function generateStaticParams() {
  const sb = getSb();
  const { data } = await sb
    .from('scraped_notifications')
    .select('slug')
    .eq('status', 'active')
    .eq('is_deleted', false)
    .order('published_date', { ascending: false })
    .limit(200);
  return (data || []).map((r) => ({ slug: r.slug }));
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const sb = getSb();

  const { data } = await sb
    .from('scraped_notifications')
    .select('title, seo_title, seo_description, seo_keywords, canonical_url, og_image_url, published_date, epr_type')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (!data) return { title: 'Notification Not Found' };

  return {
    title:       data.seo_title || data.title,
    description: data.seo_description || '',
    keywords:    data.seo_keywords?.join(', ') || '',
    openGraph: {
      title:       data.seo_title || data.title,
      description: data.seo_description || '',
      type:        'article',
      url:         data.canonical_url || `http://localhost:3000/notifications/${slug}`,
      publishedTime: data.published_date || undefined,
      images:      data.og_image_url ? [{ url: data.og_image_url }] : undefined,
    },
    alternates: {
      canonical: data.canonical_url || `http://localhost:3000/notifications/${slug}`,
    },
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d?: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const EPR_COLORS: Record<string, string> = {
  'Plastic':   'bg-green-100 text-green-800 border-green-200',
  'E-Waste':   'bg-blue-100  text-blue-800  border-blue-200',
  'Battery':   'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Tyre':      'bg-gray-100  text-gray-800   border-gray-200',
  'Used-Oil':  'bg-orange-100 text-orange-800 border-orange-200',
  'C&D':       'bg-red-100   text-red-800    border-red-200',
  'Hazardous': 'bg-purple-100 text-purple-800 border-purple-200',
};

function FileDownloadButton({ file, index }: { file: any; index: number }) {
  const ext = file.file_extension || file.mime_type?.split('/').pop() || 'file';
  const extColors: Record<string, string> = {
    pdf:  'bg-red-600 hover:bg-red-700',
    doc:  'bg-blue-600 hover:bg-blue-700',
    docx: 'bg-blue-600 hover:bg-blue-700',
    xls:  'bg-green-600 hover:bg-green-700',
    xlsx: 'bg-green-600 hover:bg-green-700',
    zip:  'bg-yellow-600 hover:bg-yellow-700',
  };
  const color = extColors[ext.toLowerCase()] || 'bg-gray-600 hover:bg-gray-700';

  return (
    <a
      href={file.cdn_url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className={`flex items-center gap-2.5 px-4 py-3 ${color} text-white rounded-lg transition-colors group w-full sm:w-auto`}>
      <Download className="w-4 h-4 group-hover:animate-bounce" />
      <div className="text-left">
        <div className="text-sm font-medium leading-tight">
          {file.display_name || `Document ${index + 1}`}
        </div>
        <div className="text-xs opacity-75 uppercase">{ext} Download</div>
      </div>
    </a>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function NotificationDetailPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb       = getSb();

  // Main notification
  const { data: notif, error } = await sb
    .from('scraped_notifications')
    .select(`
      *,
      notification_authorities!authority_id(*),
      notification_categories!category_id(*),
      notification_files(*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .single();

  if (error || !notif) notFound();

  // Related notifications
  const { data: related } = await sb
    .from('scraped_notifications')
    .select(`id, slug, title, short_description, published_date, epr_type,
             notification_authorities!authority_id(id, slug, short_name, name),
             notification_files(id, cdn_url, mime_type, is_primary)`)
    .neq('id', notif.id)
    .eq('status', 'active')
    .eq('is_deleted', false)
    .or(`epr_type.eq.${notif.epr_type || 'NULL'},authority_id.eq.${notif.authority_id || 'NULL'}`)
    .order('published_date', { ascending: false, nullsFirst: false })
    .limit(4);

  const authority   = notif.notification_authorities;
  const category    = notif.notification_categories;
  const files       = (notif.notification_files || []).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const primaryFile = files.find((f: any) => f.is_primary) || files[0];
  const eprColor    = EPR_COLORS[notif.epr_type || ''] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <>
      {/* JSON-LD */}
      {notif.schema_markup && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(notif.schema_markup) }}
        />
      )}

      <div className="min-h-screen bg-gray-50">
        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-blue-200 text-sm mb-5 flex-wrap">
              <Link href="/" className="hover:text-white">Home</Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <Link href="/notifications" className="hover:text-white">Notifications</Link>
              {notif.epr_type && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
                  <Link href={`/notifications?epr_type=${notif.epr_type}`} className="hover:text-white">
                    {notif.epr_type}
                  </Link>
                </>
              )}
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-white truncate max-w-xs">{notif.title}</span>
            </nav>

            {/* Type badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {notif.epr_type && (
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${eprColor}`}>
                  {notif.epr_type} EPR
                </span>
              )}
              {notif.document_type && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-blue-100">
                  {notif.document_type}
                </span>
              )}
              {authority?.short_name && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-white/10 border border-white/20 text-blue-100">
                  <Building2 className="w-3 h-3" />
                  {authority.short_name}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl lg:text-3xl font-bold leading-tight mb-4">
              {notif.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-blue-200 text-sm">
              {notif.published_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Published: {formatDate(notif.published_date)}
                </span>
              )}
              {notif.notification_number && (
                <span className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  {notif.notification_number}
                </span>
              )}
              {notif.effective_date && (
                <span className="flex items-center gap-1.5 text-yellow-300">
                  <AlertCircle className="w-4 h-4" />
                  Effective: {formatDate(notif.effective_date)}
                </span>
              )}
            </div>

            {/* Download CTA row */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-6">
                {files.slice(0, 3).map((file: any, i: number) => (
                  <FileDownloadButton key={file.id} file={file} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column: main content */}
            <div className="lg:col-span-2 space-y-6">

              {/* AI Summary */}
              {notif.ai_summary && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <h2 className="text-sm font-semibold text-blue-900">Summary</h2>
                  </div>
                  <p className="text-sm text-blue-800 leading-relaxed">{notif.ai_summary}</p>
                </div>
              )}

              {/* Full notification body */}
              {notif.body_html ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Full Notification
                  </h2>
                  <div
                    className="prose prose-sm prose-blue max-w-none text-gray-700 leading-relaxed
                      [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-gray-200 [&_td]:p-2
                      [&_th]:bg-gray-50 [&_th]:border [&_th]:border-gray-200 [&_th]:p-2 [&_th]:font-semibold"
                    dangerouslySetInnerHTML={{ __html: notif.body_html }}
                  />
                </div>
              ) : notif.body_text ? (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Full Notification</h2>
                  <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                    {notif.body_text}
                  </div>
                </div>
              ) : null}

              {/* Key Compliance Points */}
              {notif.key_compliance_points?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-green-600" />
                    Key Compliance Points
                  </h2>
                  <ul className="space-y-2">
                    {notif.key_compliance_points.map((pt: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Points */}
              {notif.action_points?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <ListChecks className="w-5 h-5 text-blue-600" />
                    Action Points for Businesses
                  </h2>
                  <ol className="space-y-2 list-none">
                    {notif.action_points.map((pt: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        {pt}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* FAQ */}
              {Array.isArray(notif.faqs) && notif.faqs.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-purple-600" />
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {notif.faqs.map((faq: { q: string; a: string }, i: number) => (
                      <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{faq.q}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>

                  {/* FAQ JSON-LD */}
                  <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify({
                      '@context': 'https://schema.org',
                      '@type': 'FAQPage',
                      'mainEntity': notif.faqs.map((faq: any) => ({
                        '@type': 'Question',
                        'name': faq.q,
                        'acceptedAnswer': { '@type': 'Answer', 'text': faq.a },
                      })),
                    })}}
                  />
                </div>
              )}

              {/* Source link */}
              {notif.source_url && (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Original Source</p>
                    <p className="text-sm text-gray-700 truncate max-w-xs">{notif.source_portal}</p>
                  </div>
                  <a
                    href={notif.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700">
                    View Source <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Back link */}
              <div>
                <Link href="/notifications"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to all notifications
                </Link>
              </div>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Notification Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                <h3 className="text-sm font-semibold text-gray-700">Notification Details</h3>

                {authority && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Issued By</p>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-800">{authority.name || authority.short_name}</span>
                    </div>
                  </div>
                )}

                {notif.published_date && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Published Date</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-800">{formatDate(notif.published_date)}</span>
                    </div>
                  </div>
                )}

                {notif.compliance_deadline && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Compliance Deadline</p>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-semibold text-red-600">{formatDate(notif.compliance_deadline)}</span>
                    </div>
                  </div>
                )}

                {notif.epr_type && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">EPR Category</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${eprColor}`}>
                      {notif.epr_type}
                    </span>
                  </div>
                )}

                {category && (
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Document Type</p>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </div>
                )}
              </div>

              {/* Compliance Impact */}
              {notif.compliance_impact && (
                <div className="bg-orange-50 rounded-xl border border-orange-100 p-4">
                  <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" />
                    Compliance Impact
                  </h3>
                  <p className="text-xs text-orange-700 leading-relaxed">{notif.compliance_impact}</p>
                </div>
              )}

              {/* Affected Stakeholders */}
              {notif.affected_stakeholders?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    Who Is Affected
                  </h3>
                  <ul className="space-y-1.5">
                    {notif.affected_stakeholders.map((s: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {notif.tags?.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-600" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {notif.tags.map((tag: string) => (
                      <a
                        key={tag}
                        href={`/notifications?q=${encodeURIComponent(tag)}`}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 text-xs rounded transition-colors">
                        {tag}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Get Expert Help CTA */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-5 text-white">
                <h3 className="font-semibold mb-2 text-sm">Need Expert Guidance?</h3>
                <p className="text-blue-100 text-xs mb-4 leading-relaxed">
                  Our EPR compliance specialists can help you understand and implement this notification.
                </p>
                <a
                  href="/contact"
                  className="block text-center bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm py-2 rounded-lg transition-colors">
                  Get Free Consultation
                </a>
              </div>
            </div>
          </div>

          {/* Related Notifications */}
          {related && related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Related Notifications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {related.map((r: any) => (
                  <NotificationCard
                    key={r.id}
                    id={r.id}
                    slug={r.slug}
                    title={r.title}
                    shortDescription={r.short_description}
                    eprType={r.epr_type}
                    publishedDate={r.published_date}
                    authority={r.notification_authorities}
                    files={r.notification_files}
                    compact={true}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
