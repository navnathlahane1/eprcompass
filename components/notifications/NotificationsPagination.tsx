'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  page:       number;
  totalPages: number;
  total:      number;
}

export default function NotificationsPagination({ page, totalPages, total }: Props) {
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(p));
    return `${pathname}?${params.toString()}`;
  }

  const pages: (number | '…')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      pages.push(i);
    }
    if (page < totalPages - 2) pages.push('…');
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages} ({total.toLocaleString()} total)
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={buildUrl(page - 1)}
          aria-disabled={page === 1}
          className={`p-2 rounded-lg border text-sm transition-colors
            ${page === 1
              ? 'border-gray-100 text-gray-300 pointer-events-none'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
          <ChevronLeft className="w-4 h-4" />
        </Link>

        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
          ) : (
            <Link
              key={p}
              href={buildUrl(p)}
              className={`w-9 h-9 flex items-center justify-center rounded-lg border text-sm font-medium transition-colors
                ${p === page
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}>
              {p}
            </Link>
          )
        )}

        <Link
          href={buildUrl(page + 1)}
          aria-disabled={page === totalPages}
          className={`p-2 rounded-lg border text-sm transition-colors
            ${page === totalPages
              ? 'border-gray-100 text-gray-300 pointer-events-none'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
