'use client';

import Link from 'next/link';
import { FileText, Download, Calendar, Building2, Tag, ExternalLink } from 'lucide-react';

export interface NotificationCardProps {
  id:               string;
  slug:             string;
  title:            string;
  shortDescription?: string;
  eprType?:         string;
  documentType?:    string;
  publishedDate?:   string;
  tags?:            string[];
  authority?:       { slug: string; short_name: string; name: string } | null;
  category?:        { slug: string; name: string } | null;
  files?:           Array<{ cdn_url: string; mime_type: string; is_primary: boolean; display_name?: string }>;
  viewCount?:       number;
  isFeatured?:      boolean;
  compact?:         boolean;
}

const EPR_COLORS: Record<string, string> = {
  'Plastic':    'bg-green-100 text-green-800 border-green-200',
  'E-Waste':    'bg-blue-100  text-blue-800  border-blue-200',
  'Battery':    'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Tyre':       'bg-gray-100  text-gray-800   border-gray-200',
  'Used-Oil':   'bg-orange-100 text-orange-800 border-orange-200',
  'C&D':        'bg-red-100   text-red-800    border-red-200',
  'Hazardous':  'bg-purple-100 text-purple-800 border-purple-200',
  'Biomedical': 'bg-pink-100  text-pink-800   border-pink-200',
};

const DOC_TYPE_COLORS: Record<string, string> = {
  'Gazette':          'bg-amber-50  text-amber-700  border-amber-200',
  'Office Memorandum':'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Circular':         'bg-cyan-50   text-cyan-700   border-cyan-200',
  'Guideline':        'bg-teal-50   text-teal-700   border-teal-200',
  'Amendment':        'bg-rose-50   text-rose-700   border-rose-200',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function FileIcon({ mimeType }: { mimeType: string }) {
  const ext = mimeType?.includes('pdf') ? 'PDF'
    : mimeType?.includes('word') ? 'DOC'
    : mimeType?.includes('sheet') ? 'XLS'
    : mimeType?.includes('zip')   ? 'ZIP'
    : 'FILE';

  const colors: Record<string, string> = {
    PDF: 'bg-red-100 text-red-700',
    DOC: 'bg-blue-100 text-blue-700',
    XLS: 'bg-green-100 text-green-700',
    ZIP: 'bg-yellow-100 text-yellow-700',
    FILE: 'bg-gray-100 text-gray-700',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${colors[ext]}`}>
      {ext}
    </span>
  );
}

export default function NotificationCard({
  slug, title, shortDescription, eprType, documentType,
  publishedDate, tags, authority, files, viewCount, isFeatured, compact,
}: NotificationCardProps) {
  const primaryFile = files?.find((f) => f.is_primary) || files?.[0];
  const eprColor    = EPR_COLORS[eprType || ''] || 'bg-slate-100 text-slate-700 border-slate-200';
  const docColor    = DOC_TYPE_COLORS[documentType || ''] || 'bg-gray-50 text-gray-600 border-gray-200';

  if (compact) {
    return (
      <Link href={`/notifications/${slug}`}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200 group">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
            {title}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {eprType && (
              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${eprColor}`}>
                {eprType}
              </span>
            )}
            {publishedDate && (
              <span className="text-xs text-gray-400">{formatDate(publishedDate)}</span>
            )}
          </div>
        </div>
        {primaryFile && <FileIcon mimeType={primaryFile.mime_type} />}
      </Link>
    );
  }

  return (
    <article className={`bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group overflow-hidden ${isFeatured ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}>
      {/* Featured badge */}
      {isFeatured && (
        <div className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
          <span>⭐</span> Featured Notification
        </div>
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {eprType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${eprColor}`}>
                {eprType}
              </span>
            )}
            {documentType && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${docColor}`}>
                {documentType}
              </span>
            )}
          </div>
          {primaryFile && <FileIcon mimeType={primaryFile.mime_type} />}
        </div>

        {/* Title */}
        <Link href={`/notifications/${slug}`}>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors leading-snug mb-2">
            {title}
          </h3>
        </Link>

        {/* Short description */}
        {shortDescription && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
            {shortDescription}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400 mb-3">
          {authority?.short_name && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {authority.short_name}
            </span>
          )}
          {publishedDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(publishedDate)}
            </span>
          )}
          {viewCount ? (
            <span className="text-gray-300">{viewCount} views</span>
          ) : null}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 4).map((tag) => (
              <span key={tag}
                className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] bg-gray-100 text-gray-600">
                {tag}
              </span>
            ))}
            {tags.length > 4 && (
              <span className="text-[11px] text-gray-400">+{tags.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <Link
            href={`/notifications/${slug}`}
            className="flex-1 text-center text-sm font-medium text-blue-600 hover:text-blue-700 py-1.5 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5">
            <ExternalLink className="w-3.5 h-3.5" />
            View Details
          </Link>

          {primaryFile?.cdn_url && (
            <a
              href={primaryFile.cdn_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <Download className="w-3.5 h-3.5" />
              Download
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
